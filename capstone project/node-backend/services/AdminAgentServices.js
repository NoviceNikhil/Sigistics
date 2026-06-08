const { Agent, Shipment, ShipmentHistory } = require("../models/index.sql");
const { sequelize } = require("../config/sql");
const { Op } = require("sequelize"); // Required for the conflict checks
const APIFeatures = require("../utils/APIfeatures");
const { evaluateShipmentRules } = require("../utils/ruleEngine");

/**
 * Enhanced Bulk Upload: Handles soft-deleted conflicts and optional overwriting
 */
exports.uploadAgents = async (parsedData, options = {}) => {
  const transaction = await sequelize.transaction();
  try {
    const results = { restored: 0, created: 0, updated: 0, conflicts: [] };
    const overwrite = options.overwrite === true || options.overwrite === 'true';

    for (const row of parsedData) {
      // Check if agent exists (including soft-deleted ones)
      const existingAgent = await Agent.findOne({
        where: {
          [Op.or]: [{ email: row.email }, { phone: row.phone.toString() }]
        },
        paranoid: false,
        transaction
      });

      if (existingAgent) {
        if (existingAgent.deletedAt) {
          // Found in trash: Always restore and update
          await existingAgent.restore({ transaction });
          await existingAgent.update({
            name: row.name,
            email: row.email,
            phone: row.phone,
            city: row.city,
            subregion: row.subregion,
            is_active: true,
            availability_status: "available"
          }, { transaction });
          results.restored++;
        } else {
          // Conflict found in active records
          if (overwrite) {
            // Update existing active record
            await existingAgent.update({
              name: row.name,
              city: row.city,
              subregion: row.subregion,
              // We don't reset status/load for active updates unless specified, but user wants "bulk updating data"
              is_active: true
            }, { transaction });
            results.updated++;
          } else {
            // Add to conflicts list
            results.conflicts.push({
              email: row.email,
              phone: row.phone,
              existingName: existingAgent.name,
              newName: row.name
            });
          }
        }
      } else {
        // No conflict: Create fresh
        await Agent.create({
          name: row.name,
          email: row.email,
          phone: row.phone,
          city: row.city,
          subregion: row.subregion,
          is_active: true,
          availability_status: "available",
          active_shipments_count: 0,
          rating: 5.0
        }, { transaction });
        results.created++;
      }
    }

    // If conflicts exist and overwrite is false, rollback and return conflicts
    if (results.conflicts.length > 0 && !overwrite) {
      await transaction.rollback();
      return { status: "CONFLICT", conflicts: results.conflicts };
    }

    await transaction.commit();
    return { status: "SUCCESS", ...results };
  } catch (error) {
    if (transaction) await transaction.rollback();
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error("DUPLICATE_AGENT_DATA");
    }
    throw error;
  }
};


/**
 * Enhanced Create: Automatically restores if found in trash
 */
exports.createAgent = async (agentData) => {
  const { email, phone } = agentData;

  // Look for a ghost record
  const existingAgent = await Agent.findOne({
    where: {
      [Op.or]: [{ email }, { phone }]
    },
    paranoid: false
  });

  if (existingAgent) {
    if (existingAgent.deletedAt) {
      // Bring them back to life and update their info
      await existingAgent.restore();
      return await existingAgent.update({ ...agentData, is_active: true });
    }
    throw new Error("AGENT_ALREADY_EXISTS");
  }

  return await Agent.create(agentData);
};

exports.getAllAgents = async (req) => {
  const features = new APIFeatures(Agent, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .search();

  const { results, data: agents } = await features.execute();
  return { results, agents };
};


exports.getAgentById = async (id) => {
  const agent = await Agent.findByPk(id, {
    include: [{
      model: Shipment,
      as: 'Shipments',
      required: false
    }]
  });

  if (!agent) throw new Error("AGENT_NOT_FOUND");
  return agent;
};

exports.updateAgent = async (id, updateData) => {
  const agent = await Agent.findByPk(id);
  if (!agent) throw new Error("AGENT_NOT_FOUND");

  try {
    const allowed = ['city', 'subregion', 'availability_status', 'is_active', 'rating'];
    const filtered = {};
    Object.keys(updateData).forEach(k => {
      if (allowed.includes(k)) filtered[k] = updateData[k];
    });

    return await agent.update(filtered);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error("UNIQUE_FIELD_CONFLICT");
    }
    throw error;
  }
};

exports.toggleAvailability = async (id, status) => {
  const agent = await Agent.findByPk(id);
  if (!agent) throw new Error("AGENT_NOT_FOUND");

  // 1. STATED VALIDATION: Ensure only our 3 specific strings are allowed
  const allowedStatuses = ["available", "busy", "offline"];
  if (!allowedStatuses.includes(status)) {
    throw new Error("INVALID_AVAILABILITY_STATUS");
  }

  // 2. WORKLOAD GUARD: 
  // An agent cannot go 'offline' if they have active shipments.
  // Note: They CAN be 'busy' while having shipments (that's actually expected).
  if (status === "offline" && agent.active_shipments_count > 0) {
    throw new Error("AGENT_HAS_ACTIVE_SHIPMENTS");
  }

  return await agent.update({ availability_status: status });
};

exports.deleteAgent = async (id) => {
  const agent = await Agent.findByPk(id);
  if (!agent) throw new Error("AGENT_NOT_FOUND");

  if (agent.active_shipments_count > 0) {
    throw new Error("CANNOT_DELETE_AGENT_WITH_WORKLOAD");
  }

  // paranoid: true makes this a soft delete
  await agent.destroy();
  return true;
};

exports.assignAgentToShipment = async (shipmentId, agentId) => {
  const transaction = await sequelize.transaction();
  try {
    const shipment = await Shipment.findByPk(shipmentId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!shipment) throw new Error("SHIPMENT_NOT_FOUND");

    if (['delivered', 'cancelled'].includes(shipment.status)) {
      throw new Error("SHIPMENT_ALREADY_FINALIZED");
    }

    const agent = await Agent.findByPk(agentId, { transaction });
    if (!agent || !agent.is_active || agent.availability_status !== "available") {
      throw new Error("AGENT_BUSY_OR_OFFLINE");
    }

    if (shipment.agent_id === agentId) {
      await transaction.rollback();
      return shipment;
    }

    if (shipment.agent_id) {
      await Agent.decrement('active_shipments_count', { by: 1, where: { id: shipment.agent_id }, transaction });
    }
    await Agent.increment('active_shipments_count', { by: 1, where: { id: agentId }, transaction });

    const previousStatus = shipment.status;
    const newStatus = previousStatus === "created" ? "assigned" : previousStatus;

    const updateData = {
      agent_id: agentId,
      status: newStatus
    };

    // --- RULE ENGINE LOGIC ---
    // Simulate the agent's new workload by adding 1 to the current count for the snapshot
    const agentSnapshot = agent.toJSON();
    agentSnapshot.active_shipments_count += 1;

    const snapshot = {
      ...shipment.toJSON(),
      ...updateData,
      agent: agentSnapshot
    };

    const verdict = await evaluateShipmentRules(snapshot);

    const existingTags = Array.isArray(shipment.tags) ? [...shipment.tags] : [];
    updateData.tags = [...new Set([...existingTags, ...(verdict.tags || [])])];
    updateData.is_delayed = verdict.is_delayed;
    updateData.delay_reason = verdict.delay_reason || shipment.delay_reason;
    // --- RULE ENGINE LOGIC END ---

    await shipment.update(updateData, { transaction });

    await ShipmentHistory.create({
      shipment_id: shipment.id,
      previous_status: previousStatus,
      new_status: newStatus,
      notes: `Manual assignment update to Agent ${agentId}`
    }, { transaction });

    await transaction.commit();
    return await shipment.reload();
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

exports.findBestAgentForRegion = async (city, subregion, transaction = null) => {
  const MAX_WORKLOAD = 8; // Never assign to an agent juggling more than 8 active shipments

  // --- PASS 1: Exact city + subregion match, lowest load first ---
  const localAgent = await Agent.findOne({
    where: {
      city,
      subregion,
      availability_status: "available",
      is_active: true,
      active_shipments_count: { [Op.lt]: MAX_WORKLOAD }
    },
    order: [
      ["active_shipments_count", "ASC"],  // least loaded first
      ["rating", "DESC"],                 // tie-break: highest rated
      ["createdAt", "ASC"]               // tie-break: most experienced (oldest record)
    ],
    transaction
  });

  if (localAgent) return localAgent;

  // --- PASS 2: Widen to any available agent in the same city (any subregion) ---
  const cityAgent = await Agent.findOne({
    where: {
      city,
      availability_status: "available",
      is_active: true,
      active_shipments_count: { [Op.lt]: MAX_WORKLOAD }
    },
    order: [
      ["active_shipments_count", "ASC"],
      ["rating", "DESC"],
      ["createdAt", "ASC"]
    ],
    transaction
  });

  return cityAgent || null; // null = no available agent anywhere in this city
};

/**
 * Bulk auto-assign: assigns the best available agent to every unassigned "created" shipment.
 * Returns a summary { assigned, skipped, total }.
 */
exports.bulkAutoAssign = async () => {
  const unassigned = await Shipment.findAll({
    where: {
      agent_id: null,
      status: { [Op.in]: ["created"] }
    }
  });

  if (unassigned.length === 0) return { assigned: 0, skipped: 0, total: 0 };

  let assigned = 0;
  let skipped = 0;

  for (const shipment of unassigned) {
    const transaction = await sequelize.transaction();
    try {
      const agent = await exports.findBestAgentForRegion(
        shipment.pickup_city,
        shipment.pickup_subregion,
        transaction
      );

      if (!agent) {
        await transaction.rollback();
        skipped++;
        continue;
      }

      // Build rule engine snapshot with simulated post-assignment workload
      const agentSnapshot = agent.toJSON();
      agentSnapshot.active_shipments_count += 1;

      const snapshot = {
        ...shipment.toJSON(),
        agent_id: agent.id,
        status: "assigned",
        agent: agentSnapshot
      };

      const verdict = await evaluateShipmentRules(snapshot);
      const existingTags = Array.isArray(shipment.tags) ? [...shipment.tags] : [];

      await shipment.update({
        agent_id: agent.id,
        status: "assigned",
        tags: [...new Set([...existingTags, ...(verdict.tags || [])])],
        is_delayed: verdict.is_delayed ?? false,
        delay_reason: verdict.delay_reason || shipment.delay_reason
      }, { transaction });

      await Agent.increment("active_shipments_count", { by: 1, where: { id: agent.id }, transaction });

      await ShipmentHistory.create({
        shipment_id: shipment.id,
        previous_status: "created",
        new_status: "assigned",
        notes: `Auto-assigned to agent ${agent.name} (${agent.city} / ${agent.subregion}) via Bulk Assign`
      }, { transaction });

      await transaction.commit();
      assigned++;
    } catch (err) {
      await transaction.rollback();
      console.error(`[bulkAutoAssign] Failed for shipment ${shipment.shipment_code}:`, err.message);
      skipped++;
    }
  }

  return { assigned, skipped, total: unassigned.length };
};

exports.restoreAgent = async (id) => {
  const agent = await Agent.findByPk(id, { paranoid: false });
  if (!agent) throw new Error("AGENT_NOT_FOUND");

  await agent.restore();
  return agent;
};