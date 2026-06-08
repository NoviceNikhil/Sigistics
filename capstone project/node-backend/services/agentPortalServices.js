const { Op } = require("sequelize");
const {
  Shipment,
  ShipmentHistory,
  Agent,
  User,
  Location,
} = require("../models/index.sql");
const { sequelize } = require("../config/sql");
const { evaluateShipmentRules } = require("../utils/ruleEngine");

const DELIVERY_ALLOWED_TRANSITIONS = {
  assigned: ["picked"],
  picked: ["in_transit"],
  in_transit: ["delivered"],
  delivered: [],
  cancelled: [],
  created: [],
};

const DEFAULT_LIMIT = 10;

const parsePagination = (query = {}) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(Number.parseInt(query.limit, 10) || DEFAULT_LIMIT, 1),
    50,
  );
  return { page, limit, offset: (page - 1) * limit };
};

const buildSort = (sort = "-createdAt") => {
  const map = {
    createdAt: [["createdAt", "ASC"]],
    "-createdAt": [["createdAt", "DESC"]],
    expected_delivery_at: [["expected_delivery_at", "ASC"]],
    "-expected_delivery_at": [["expected_delivery_at", "DESC"]],
    status: [["status", "ASC"]],
    "-status": [["status", "DESC"]],
  };

  return map[sort] || map["-createdAt"];
};

const buildDeliverySummary = async (agentId) => {
  const [total, active, delivered, delayed] = await Promise.all([
    Shipment.count({ where: { agent_id: agentId } }),
    Shipment.count({
      where: {
        agent_id: agentId,
        status: { [Op.in]: ["assigned", "picked", "in_transit"] },
      },
    }),
    Shipment.count({ where: { agent_id: agentId, status: "delivered" } }),
    Shipment.count({ where: { agent_id: agentId, is_delayed: true } }),
  ]);

  return { total, active, delivered, delayed };
};

const listAgentDeliveries = async (agentId, query = {}) => {
  const { page, limit, offset } = parsePagination(query);
  const where = { agent_id: agentId };

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where[Op.or] = [
      { shipment_code: { [Op.like]: `%${query.search}%` } },
      { pickup_city: { [Op.like]: `%${query.search}%` } },
      { delivery_city: { [Op.like]: `%${query.search}%` } },
      { package_type: { [Op.like]: `%${query.search}%` } },
    ];
  }

  const { rows, count } = await Shipment.findAndCountAll({
    where,
    include: [
      {
        model: User,
        attributes: ["id", "full_name", "email", "phone"],
      },
    ],
    order: buildSort(query.sort),
    limit,
    offset,
  });

  const summary = await buildDeliverySummary(agentId);

  return {
    deliveries: rows,
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.max(Math.ceil(count / limit), 1),
    },
    summary,
  };
};

const getAgentDelivery = async (agentId, deliveryId) => {
  const shipment = await Shipment.findOne({
    where: { id: deliveryId, agent_id: agentId },
    include: [
      {
        model: User,
        attributes: ["id", "full_name", "email", "phone"],
      },
      {
        model: Agent,
        attributes: [
          "id",
          "name",
          "email",
          "phone",
          "city",
          "subregion",
          "availability_status",
          "active_shipments_count",
          "rating",
        ],
      },
      {
        model: Location,
        as: "CurrentLocation",
        attributes: ["id", "city", "subregion", "latitude", "longitude"],
      },
      {
        model: Location,
        as: "PickupLocation",
        attributes: ["id", "city", "subregion", "latitude", "longitude"],
      },
      {
        model: Location,
        as: "DeliveryLocation",
        attributes: ["id", "city", "subregion", "latitude", "longitude"],
      },
    ],
  });

  if (!shipment) {
    throw new Error("DELIVERY_NOT_FOUND");
  }

  const history = await ShipmentHistory.findAll({
    where: { shipment_id: deliveryId },
    order: [["createdAt", "ASC"]],
  });

  return {
    shipment,
    history,
    allowed_next_statuses: DELIVERY_ALLOWED_TRANSITIONS[shipment.status] || [],
  };
};

const updateAgentDeliveryStatus = async (agentId, deliveryId, payload) => {
  let transaction = await sequelize.transaction();

  try {
    const shipment = await Shipment.findOne({
      where: { id: deliveryId, agent_id: agentId },
      include: [{ model: Agent }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!shipment) {
      throw new Error("DELIVERY_NOT_FOUND");
    }

    const previousStatus = shipment.status;
    const nextStatus = payload.new_status;
    const allowedStatuses = DELIVERY_ALLOWED_TRANSITIONS[previousStatus] || [];

    if (previousStatus === "delivered" || previousStatus === "cancelled") {
      throw new Error("DELIVERY_LOCKED");
    }

    if (!allowedStatuses.includes(nextStatus)) {
      throw new Error("INVALID_DELIVERY_STATUS_TRANSITION");
    }

    const updateData = { status: nextStatus };

    if (nextStatus === "delivered") {
      updateData.actual_delivery_at = new Date();
      await Agent.decrement("active_shipments_count", {
        by: 1,
        where: { id: agentId },
        transaction,
      });
    }

    const agentSnapshot = shipment.Agent
      ? shipment.Agent.toJSON()
      : await Agent.findByPk(agentId, { transaction }).then((agent) =>
          agent ? agent.toJSON() : null,
        );

    if (agentSnapshot) {
      if (nextStatus === "delivered") {
        agentSnapshot.active_shipments_count = Math.max(
          (agentSnapshot.active_shipments_count || 0) - 1,
          0,
        );
      }
    }

    const snapshot = {
      ...shipment.toJSON(),
      ...updateData,
      agent: agentSnapshot,
    };
    const verdict = await evaluateShipmentRules(snapshot);
    const existingTags = Array.isArray(shipment.tags) ? [...shipment.tags] : [];

    updateData.tags = [...new Set([...existingTags, ...(verdict.tags || [])])];
    updateData.is_delayed = verdict.is_delayed ?? shipment.is_delayed;
    updateData.delay_reason =
      verdict.delay_reason ?? shipment.delay_reason ?? null;

    await shipment.update(updateData, { transaction });

    await ShipmentHistory.create(
      {
        shipment_id: shipment.id,
        previous_status: previousStatus,
        new_status: nextStatus,
        notes: payload.notes || `Status changed to ${nextStatus} by agent`,
      },
      { transaction },
    );

    await transaction.commit();
    transaction = null;

    return getAgentDelivery(agentId, deliveryId);
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

const updateAgentAvailability = async (agentId, availabilityStatus) => {
  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    throw new Error("AGENT_NOT_FOUND");
  }

  if (
    availabilityStatus === "offline" &&
    Number(agent.active_shipments_count || 0) > 0
  ) {
    throw new Error("AGENT_HAS_ACTIVE_DELIVERIES");
  }

  await agent.update({ availability_status: availabilityStatus });

  return {
    id: agent.id,
    availability_status: agent.availability_status,
    active_shipments_count: agent.active_shipments_count,
    is_active: agent.is_active,
  };
};

const updateAgentDeliveryLocation = async (agentId, deliveryId, payload) => {
  let transaction = await sequelize.transaction();

  try {
    const shipment = await Shipment.findOne({
      where: { id: deliveryId, agent_id: agentId },
      include: [{ model: Agent }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!shipment) {
      throw new Error("DELIVERY_NOT_FOUND");
    }

    if (shipment.status !== "in_transit") {
      throw new Error("LOCATION_UPDATE_NOT_ALLOWED");
    }

    const normalizedCity = payload.current_city.trim().toLowerCase();
    const normalizedSubregion = payload.current_subregion.trim().toLowerCase();

    const location = await Location.findOne({
      where: {
        city: normalizedCity,
        subregion: normalizedSubregion,
      },
      transaction,
    });

    if (!location) {
      throw new Error("LOCATION_NOT_FOUND");
    }

    const updateData = {
      current_location_id: location.id,
      current_city: location.city,
      current_subregion: location.subregion,
    };

    const snapshot = {
      ...shipment.toJSON(),
      ...updateData,
      agent: shipment.Agent ? shipment.Agent.toJSON() : null,
    };
    const verdict = await evaluateShipmentRules(snapshot);
    const existingTags = Array.isArray(shipment.tags) ? [...shipment.tags] : [];

    updateData.tags = [...new Set([...existingTags, ...(verdict.tags || [])])];
    updateData.is_delayed = verdict.is_delayed ?? shipment.is_delayed;
    updateData.delay_reason =
      verdict.delay_reason ?? shipment.delay_reason ?? null;

    await shipment.update(updateData, { transaction });

    await ShipmentHistory.create(
      {
        shipment_id: shipment.id,
        previous_status: shipment.status,
        new_status: shipment.status,
        notes: `Checkpoint updated to ${location.city}, ${location.subregion}`,
      },
      { transaction },
    );

    await transaction.commit();
    transaction = null;

    return getAgentDelivery(agentId, deliveryId);
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

module.exports = {
  listAgentDeliveries,
  getAgentDelivery,
  updateAgentDeliveryStatus,
  updateAgentAvailability,
  updateAgentDeliveryLocation,
};
