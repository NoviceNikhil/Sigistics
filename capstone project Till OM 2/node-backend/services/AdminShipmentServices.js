const {
  Shipment,
  ShipmentHistory,
  Agent,
  User,
  Location,
} = require("../models/index.sql");
const { sequelize } = require("../config/sql");
const agentService = require("./AdminAgentServices");
const APIFeatures = require("../utils/APIfeatures");
const { calculateHaversine } = require("../utils/distance");
const { Op } = require("sequelize");
const { evaluateShipmentRules } = require("../utils/ruleEngine")
/**
 * List shipments with advanced features
 */
const getAllShipments = async (req) => {
  const features = new APIFeatures(Shipment, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .search();

  const { results, data: shipments } = await features.execute({
    include: [
      { model: Agent, attributes: ["name", "city", "subregion"] },
      { model: User, attributes: ["full_name"] },
    ],
  });

  return { results, shipments };
};

/**
 * Get single shipment
 */
const getShipmentById = async (id) => {
  const shipment = await Shipment.findByPk(id, {
    include: [Agent, User],
  });
  if (!shipment) throw new Error("SHIPMENT_NOT_FOUND");
  return shipment;
};

/**
 * Update shipment status and handle agent capacity accounting
 */
const updateShipmentStatus = async (id, requestBody) => {
  const transaction = await sequelize.transaction();
  try {
    const shipment = await Shipment.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!shipment) throw new Error("SHIPMENT_NOT_FOUND");

    const previousStatus = shipment.status;
    const newStatus = requestBody.status;
    const updateData = {};

    const allowedTransitions = {
      created: ["assigned", "cancelled"],
      assigned: ["picked", "cancelled", "created"],
      picked: ["in_transit"],
      in_transit: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    if (newStatus && previousStatus !== newStatus) {
      if (!allowedTransitions[previousStatus].includes(newStatus)) {
        throw new Error(
          `INVALID_STATUS_TRANSITION: ${previousStatus} to ${newStatus}`
        );
      }

      if (newStatus === "assigned" && !shipment.agent_id) {
        const bestAgent = await agentService.findBestAgentForRegion(
          shipment.pickup_city,
          shipment.pickup_subregion,
          transaction
        );

        if (!bestAgent) {
          throw new Error(
            "AUTO_ASSIGN_FAILED: No available agents found in this region."
          );
        }

        updateData.agent_id = bestAgent.id;
        await Agent.increment("active_shipments_count", {
          by: 1,
          where: { id: bestAgent.id },
          transaction,
        });
      }

      updateData.status = newStatus;
      if (newStatus === "delivered") updateData.actual_delivery_at = new Date();

      const decrementTriggers = ["delivered", "cancelled", "created"];
      if (
        decrementTriggers.includes(newStatus) &&
        !decrementTriggers.includes(previousStatus)
      ) {
        if (shipment.agent_id) {
          await Agent.decrement("active_shipments_count", {
            by: 1,
            where: { id: shipment.agent_id },
            transaction,
          });
          if (newStatus === "created") updateData.agent_id = null;
        }
      }
    }

    // --- RULE ENGINE EVALUATION (WITH AGENT SNAPSHOT) ---
    const currentAgentId = updateData.agent_id || shipment.agent_id;
    const agentData = currentAgentId ? await Agent.findByPk(currentAgentId, { transaction }) : null;

    const snapshot = {
      ...shipment.toJSON(),
      ...updateData,
      agent: agentData ? agentData.toJSON() : null
    };

    const verdict = await evaluateShipmentRules(snapshot);

    const existingTags = Array.isArray(shipment.tags) ? [...shipment.tags] : [];
    updateData.tags = [...new Set([...existingTags, ...(verdict.tags || [])])];

    updateData.is_delayed = verdict.is_delayed;
    updateData.delay_reason = verdict.delay_reason || updateData.delay_reason;
    // --------------------------------------------------

    if (requestBody.is_delayed !== undefined) {
      updateData.is_delayed = requestBody.is_delayed;
      updateData.delay_reason =
        requestBody.delay_reason || shipment.delay_reason;
      if (requestBody.is_delayed === true) {
        const currentTags = Array.isArray(updateData.tags)
          ? [...updateData.tags]
          : [];
        if (!currentTags.includes("delayed_delivery"))
          updateData.tags = [...currentTags, "delayed_delivery"];
      }
    }

    if (Object.keys(updateData).length > 0) {
      await shipment.update(updateData, { transaction });
    }

    if (newStatus && previousStatus !== newStatus) {
      await ShipmentHistory.create(
        {
          shipment_id: shipment.id,
          previous_status: previousStatus,
          new_status: newStatus,
          notes: requestBody.notes || `Status changed to ${newStatus}`,
        },
        { transaction }
      );
    }

    await transaction.commit();
    return await shipment.reload();
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

/**
 * Bulk upload shipments using pre-parsed JSON from middleware
 */
const uploadShipments = async (parsedData, options = {}) => {
  const transaction = await sequelize.transaction();
  try {
    const results = { created: 0, updated: 0, conflicts: [] };
    const overwrite = options.overwrite === true || options.overwrite === "true";

    const locations = await Location.findAll({ transaction });
    const locMap = new Map(
      locations.map((l) => [
        `${l.city.toLowerCase()}-${l.subregion.toLowerCase()}`,
        l,
      ])
    );

    const maxResult = await Shipment.findOne({
      attributes: [
        [
          sequelize.fn(
            "MAX",
            sequelize.cast(
              sequelize.fn(
                "REPLACE",
                sequelize.col("shipment_code"),
                "SHP-",
                ""
              ),
              "UNSIGNED"
            )
          ),
          "maxCode",
        ],
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const lastMax = maxResult.get("maxCode");
    let nextShipmentNumber = lastMax && lastMax >= 10000 ? lastMax + 1 : 10000;

    const shipmentEntries = [];
    const agentAssignments = {};

    for (const row of parsedData) {
      const user = await User.findOne({
        where: { email: row.customer_email },
        transaction,
      });
      if (!user) throw new Error(`CUSTOMER_NOT_FOUND: ${row.customer_email}`);

      // --- DUPLICATE CHECK (Physical Signature) ---
      // We match by customer, route, and weight to identify the "same" physical package
      const existingShipment = await Shipment.findOne({
        where: {
          user_id: user.id,
          pickup_city: row.pickup_city,
          delivery_city: row.delivery_city,
          weight_kg: row.weight_kg,
          package_type: row.package_type,
          // Removed: status filter (Allows matching delivered/cancelled shipments for manifest consistency)
          // Added: 24-hour time window to distinguish between same-day re-uploads and future repeat orders
          createdAt: {
            [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        transaction,
        paranoid: false, // Include soft-deleted shipments for potential restoration
      });

      if (existingShipment) {
        if (overwrite) {
          // Update existing shipments logic can be complex, but user wants it as a bulk update mechanism.
          // For now, we update the status and agent if provided.
          let agentId = existingShipment.agent_id;
          if (row.agent_phone) {
            const agent = await Agent.findOne({
              where: { phone: row.agent_phone.toString() },
              transaction,
            });
            if (agent) {
              if (agentId && agentId !== agent.id) {
                await Agent.decrement("active_shipments_count", { by: 1, where: { id: agentId }, transaction });
              }
              if (agentId !== agent.id) {
                await Agent.increment("active_shipments_count", { by: 1, where: { id: agent.id }, transaction });
              }
              agentId = agent.id;
            }
          }

          await existingShipment.update({
            agent_id: agentId,
            status: row.status || existingShipment.status
          }, { transaction });
          results.updated++;
          continue; // Move to next row
        } else {
          results.conflicts.push({
            customer: row.customer_email,
            pickup: row.pickup_city,
            delivery: row.delivery_city,
            code: existingShipment.shipment_code
          });
          continue;
        }
      }

      const pKey = `${row.pickup_city.toLowerCase()}-${row.pickup_subregion.toLowerCase()}`;
      const dKey = `${row.delivery_city.toLowerCase()}-${row.delivery_subregion.toLowerCase()}`;

      const startLoc = locMap.get(pKey);
      const endLoc = locMap.get(dKey);

      if (!startLoc || !endLoc) throw new Error("LOCATION_MAPPING_MISSING");

      const distance = calculateHaversine(
        startLoc.latitude,
        startLoc.longitude,
        endLoc.latitude,
        endLoc.longitude
      );
      const etaHours = parseFloat((distance / 40.0).toFixed(2));
      const expectedDate = new Date();
      expectedDate.setTime(
        expectedDate.getTime() + etaHours * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
      );

      let agentId = null;

      if (row.agent_phone) {
        const agent = await Agent.findOne({
          where: { phone: row.agent_phone.toString() },
          transaction,
        });
        if (agent) agentId = agent.id;
      }

      if (!agentId) {
        const autoAgent = await agentService.findBestAgentForRegion(
          row.pickup_city,
          row.pickup_subregion,
          transaction
        );
        if (autoAgent) agentId = autoAgent.id;
      }

      if (agentId) {
        agentAssignments[agentId] = (agentAssignments[agentId] || 0) + 1;
      }

      const entry = {
        shipment_code: `SHP-${nextShipmentNumber++}`,
        user_id: user.id,
        agent_id: agentId,
        pickup_location_id: startLoc.id,
        delivery_location_id: endLoc.id,
        pickup_city: row.pickup_city,
        pickup_subregion: row.pickup_subregion,
        delivery_city: row.delivery_city,
        delivery_subregion: row.delivery_subregion,
        package_type: row.package_type,
        weight_kg: row.weight_kg,
        estimated_distance_km: distance,
        eta_hours: etaHours,
        expected_delivery_at: expectedDate,
        status: row.status ? row.status : (agentId ? "assigned" : "created"),
      };

      const agentData = agentId ? await Agent.findByPk(agentId, { transaction }) : null;
      const snapshot = {
        ...entry,
        agent: agentData ? agentData.toJSON() : null
      };
      const verdict = await evaluateShipmentRules(snapshot);

      entry.tags = verdict.tags || [];
      entry.is_delayed = verdict.is_delayed || false;
      entry.delay_reason = verdict.delay_reason || null;

      shipmentEntries.push(entry);
    }

    if (results.conflicts.length > 0 && !overwrite) {
      await transaction.rollback();
      return { status: "CONFLICT", conflicts: results.conflicts };
    }

    if (shipmentEntries.length > 0) {
      await Shipment.bulkCreate(shipmentEntries, { transaction });
      results.created = shipmentEntries.length;

      // Ensure we have real MySQL Auto-Increment IDs 
      const newCodes = shipmentEntries.map(e => e.shipment_code);
      const createdShipments = await Shipment.findAll({
        where: { shipment_code: newCodes },
        transaction
      });

      // ─── SYNTHESIZE FSM HISTORY FOR MIGRATED SHIPMENTS ───
      // If we import an "in_transit" shipment, we need to artificially inject the chronological path
      const FSM_ORDER = ["created", "assigned", "picked", "in_transit", "delivered"];
      const historyEntries = [];

      for (const entry of createdShipments) {
        if (!entry.status || entry.status === "created") continue;
        
        const currentIndex = FSM_ORDER.indexOf(entry.status);
        if (currentIndex > 0) {
           for (let i = 0; i < currentIndex; i++) {
             historyEntries.push({
               shipment_id: entry.id,
               previous_status: FSM_ORDER[i],
               new_status: FSM_ORDER[i + 1],
               notes: 'Synthesized Legacy Migration'
             });
           }
        } else if (entry.status === "cancelled") {
           // Special short path
           historyEntries.push({ shipment_id: entry.id, previous_status: "created", new_status: "assigned", notes: "Synthesized Legacy Migration" });
           historyEntries.push({ shipment_id: entry.id, previous_status: "assigned", new_status: "cancelled", notes: "Synthesized Legacy Migration" });
        }
      }

      if (historyEntries.length > 0) {
        await ShipmentHistory.bulkCreate(historyEntries, { transaction });
      }
    }

    for (const [id, count] of Object.entries(agentAssignments)) {
      await Agent.increment("active_shipments_count", {
        by: count,
        where: { id },
        transaction,
      });
    }

    await transaction.commit();
    return { status: "SUCCESS", ...results };
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};


/**
 * Update shipment details
 */
const updateShipmentDetails = async (id, updateData) => {
  const transaction = await sequelize.transaction();
  try {
    const shipment = await Shipment.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!shipment) throw new Error("SHIPMENT_NOT_FOUND");

    if (["delivered", "cancelled"].includes(shipment.status)) {
      throw new Error("EDIT_RESTRICTED_FOR_FINALIZED_SHIPMENT");
    }

    const physicalFields = [
      "pickup_city",
      "pickup_subregion",
      "delivery_city",
      "delivery_subregion",
      "package_type",
      "weight_kg",
    ];
    const isAttemptingPhysicalUpdate = Object.keys(updateData).some((key) =>
      physicalFields.includes(key)
    );

    if (
      ["picked", "in_transit"].includes(shipment.status) &&
      isAttemptingPhysicalUpdate
    ) {
      throw new Error(
        `CANNOT_EDIT_PHYSICAL_SPECS_WHILE_IN_${shipment.status.toUpperCase()}`
      );
    }

    const filtered = {};
    const allowed = [
      ...physicalFields,
      "agent_id",
      "is_delayed",
      "delay_reason",
    ];
    Object.keys(updateData).forEach((k) => {
      if (allowed.includes(k)) filtered[k] = updateData[k];
    });

    const locationChanged =
      filtered.pickup_city ||
      filtered.pickup_subregion ||
      filtered.delivery_city ||
      filtered.delivery_subregion;

    if (locationChanged) {
      const pCity = (filtered.pickup_city || shipment.pickup_city)
        .toLowerCase()
        .trim();
      const pSub = (filtered.pickup_subregion || shipment.pickup_subregion)
        .toLowerCase()
        .trim();
      const dCity = (filtered.delivery_city || shipment.delivery_city)
        .toLowerCase()
        .trim();
      const dSub = (filtered.delivery_subregion || shipment.delivery_subregion)
        .toLowerCase()
        .trim();

      const pLoc = await Location.findOne({
        where: { city: pCity, subregion: pSub },
        transaction,
      });
      const dLoc = await Location.findOne({
        where: { city: dCity, subregion: dSub },
        transaction,
      });

      if (!pLoc || !dLoc) throw new Error("LOCATION_NOT_FOUND_IN_MASTER_TABLE");

      if (shipment.agent_id) {
        await Agent.decrement("active_shipments_count", {
          by: 1,
          where: { id: shipment.agent_id },
          transaction,
        });
        filtered.agent_id = null;
        filtered.status = "created";
      }

      filtered.pickup_location_id = pLoc.id;
      filtered.delivery_location_id = dLoc.id;
      filtered.estimated_distance_km = calculateHaversine(
        pLoc.latitude,
        pLoc.longitude,
        dLoc.latitude,
        dLoc.longitude
      );
      filtered.eta_hours = parseFloat(
        (filtered.estimated_distance_km / 40.0).toFixed(2)
      );

      const expectedDate = new Date(shipment.createdAt);
      expectedDate.setTime(
        expectedDate.getTime() +
        filtered.eta_hours * 60 * 60 * 1000 +
        2 * 60 * 60 * 1000
      );
      filtered.expected_delivery_at = expectedDate;
    }

    if (
      filtered.agent_id !== undefined &&
      filtered.agent_id !== shipment.agent_id &&
      !locationChanged
    ) {
      if (shipment.agent_id)
        await Agent.decrement("active_shipments_count", {
          by: 1,
          where: { id: shipment.agent_id },
          transaction,
        });
      if (filtered.agent_id)
        await Agent.increment("active_shipments_count", {
          by: 1,
          where: { id: filtered.agent_id },
          transaction,
        });
      filtered.status = filtered.agent_id ? "assigned" : "created";
    }

    if (
      filtered.weight_kg &&
      parseFloat(filtered.weight_kg) !== parseFloat(shipment.weight_kg)
    ) {
      const currentTags = Array.isArray(shipment.tags)
        ? [...shipment.tags]
        : [];
      if (!currentTags.includes("weight_adjusted"))
        filtered.tags = [...currentTags, "weight_adjusted"];
    }

    // --- RULE ENGINE EVALUATION (WITH AGENT SNAPSHOT) ---
    const currentAgentId = filtered.agent_id || shipment.agent_id;
    const agentData = currentAgentId ? await Agent.findByPk(currentAgentId, { transaction }) : null;

    const snapshot = {
      ...shipment.toJSON(),
      ...filtered,
      agent: agentData ? agentData.toJSON() : null
    };

    const verdict = await evaluateShipmentRules(snapshot);

    const baseTags = filtered.tags || (Array.isArray(shipment.tags) ? [...shipment.tags] : []);
    filtered.tags = [...new Set([...baseTags, ...(verdict.tags || [])])];

    filtered.is_delayed = verdict.is_delayed;
    filtered.delay_reason = verdict.delay_reason || filtered.delay_reason;
    // --------------------------------------------------

    await shipment.update(filtered, { transaction });

    const finalStatus = filtered.status || shipment.status;
    if (finalStatus !== shipment.status) {
      await ShipmentHistory.create(
        {
          shipment_id: shipment.id,
          previous_status: shipment.status,
          new_status: finalStatus,
          notes: locationChanged
            ? "Location update reset assignment status."
            : "Admin manual update.",
        },
        { transaction }
      );
    }

    await transaction.commit();
    return await shipment.reload();
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

const restoreShipment = async (id) => {
  const transaction = await sequelize.transaction();
  try {
    const shipment = await Shipment.findByPk(id, {
      transaction,
      paranoid: false,
    });
    if (!shipment?.deletedAt) {
      await transaction.rollback();
      throw new Error("SHIPMENT_NOT_DELETED");
    }

    let currentAgent = null;
    let willBeAssigned = false;

    if (shipment.agent_id) {
      currentAgent = await Agent.findByPk(shipment.agent_id, { transaction });
      if (!currentAgent || !currentAgent.is_active) {
        await shipment.update(
          { agent_id: null, status: "created" },
          { transaction }
        );
      } else {
        await Agent.increment("active_shipments_count", {
          by: 1,
          where: { id: currentAgent.id },
          transaction,
        });
        willBeAssigned = true;
      }
    }

    // --- RULE ENGINE EVALUATION (WITH RESTORED SNAPSHOT) ---
    const snapshot = shipment.toJSON();
    snapshot.deletedAt = null;

    if (willBeAssigned && currentAgent) {
      const agentSnapshot = currentAgent.toJSON();
      agentSnapshot.active_shipments_count += 1;
      snapshot.agent = agentSnapshot;
    } else if (!willBeAssigned && shipment.agent_id) {
      snapshot.agent = null;
      snapshot.agent_id = null;
      snapshot.status = "created";
    }

    const verdict = await evaluateShipmentRules(snapshot);

    const existingTags = Array.isArray(shipment.tags) ? [...shipment.tags] : [];
    const ruleEngineUpdates = {
      tags: [...new Set([...existingTags, ...(verdict.tags || [])])],
      is_delayed: verdict.is_delayed,
      delay_reason: verdict.delay_reason || shipment.delay_reason
    };

    await shipment.update(ruleEngineUpdates, { transaction });
    // --------------------------------------------------------

    await shipment.restore({ transaction });
    await transaction.commit();

    // Return a fresh instance so the controller gets the fully updated data
    return await Shipment.findByPk(id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getShipmentHistory = async (id) => {
  return await ShipmentHistory.findAll({
    where: { shipment_id: id },
    order: [["createdAt", "ASC"]],
  });
};

const deleteShipment = async (id) => {
  const shipment = await Shipment.findByPk(id);
  if (!shipment) throw new Error("SHIPMENT_NOT_FOUND");

  if (
    shipment.agent_id &&
    !["delivered", "cancelled"].includes(shipment.status)
  ) {
    await Agent.decrement("active_shipments_count", {
      by: 1,
      where: { id: shipment.agent_id },
    });
  }

  await shipment.destroy();
  return true;
};

const syncRulesWithExistingShipments = async () => {
  const transaction = await sequelize.transaction();
  try {
    // 1. Fetch ALL shipments for global consistency
    const shipments = await Shipment.findAll({
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (shipments.length === 0) {
      await transaction.rollback();
      return { status: "SUCCESS", updated: 0 };
    }

    // 2. Prepare snapshots for the Rule Engine
    // CRITICAL: We strip existing tags and delay info from the snapshot 
    // so the Rule Engine only returns tags from rules that are currently ACTIVE.
    const snapshots = shipments.map(s => {
      const json = s.toJSON();
      delete json.tags;
      delete json.is_delayed;
      delete json.delay_reason;
      return json;
    });

    // 3. Call Rule Engine in Batch mode
    const { batchEvaluateRules, getAllRules } = require("../utils/ruleEngine");
    const [allRules, results] = await Promise.all([
      getAllRules(false),
      batchEvaluateRules(snapshots)
    ]);

    // All possible tags that the Rule Engine "owns"
    const systemTags = new Set(allRules.map(r => r.tag_to_add).filter(Boolean));

    // 4. Update each shipment in MySQL with the new findings
    let updatedCount = 0;
    for (const res of results) {
      const shipment = shipments.find(s => s.id === res.id);
      if (shipment) {
        // Strip out any existing rule tags, then apply the current ones
        const existingTags = Array.isArray(shipment.tags) ? shipment.tags : [];
        const manualTags = existingTags.filter(t => !systemTags.has(t));
        const finalTags = [...new Set([...manualTags, ...(res.tags || [])])];
        
        await shipment.update({
          tags: finalTags,
          is_delayed: res.is_delayed,
          delay_reason: res.delay_reason || shipment.delay_reason
        }, { transaction });
        updatedCount++;
      }
    }

    await transaction.commit();
    return { status: "SUCCESS", updated: updatedCount };
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

module.exports = {
  uploadShipments,
  getAllShipments,
  getShipmentById,
  updateShipmentStatus,
  getShipmentHistory,
  deleteShipment,
  restoreShipment,
  updateShipmentDetails,
  syncRulesWithExistingShipments
};
