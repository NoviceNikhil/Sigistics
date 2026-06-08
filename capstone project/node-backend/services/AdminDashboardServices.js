const { Op } = require("sequelize");
const { sequelize } = require("../config/sql");
const { Shipment, Agent, User } = require("../models/index.sql");

// ─── SHARED FILTER BUILDER ──────────────────────────────────────────────────
const buildFilters = (filters = {}) => {
  const shipmentWhere = {};
  const agentWhere = {};

  if (filters.region) {
    shipmentWhere.current_city = filters.region;
    agentWhere.city = filters.region;
  }
  if (filters.agent) {
    shipmentWhere.agent_id = filters.agent;
    agentWhere.id = filters.agent;
  }
  if (filters.status) {
    shipmentWhere.status = filters.status;
  }
  if (filters.package_type) {
    shipmentWhere.package_type = filters.package_type;
  }
  if (filters.days) {
    const dateBound = new Date();
    dateBound.setDate(dateBound.getDate() - parseInt(filters.days, 10));
    shipmentWhere.createdAt = { [Op.gte]: dateBound };
  }

  return { shipmentWhere, agentWhere };
};

// ─── FILTER METADATA ─────────────────────────────────────────────────────────
exports.getFilterMetadata = async () => {
  const agents = await Agent.findAll({
    attributes: ["id", "name", "city"],
    where: { is_active: true },
    raw: true,
  });

  const regionsRaw = await Agent.findAll({
    attributes: ["city"],
    where: { city: { [Op.not]: null } },
    group: ["city"],
    raw: true,
  });

  const regions = regionsRaw.map((r) => r.city).filter(Boolean);
  return {
    agents: agents.map((a) => ({ id: a.id, name: a.name, city: a.city })),
    regions,
  };
};

// ─── SUMMARY METRICS ─────────────────────────────────────────────────────────
exports.getSummaryMetrics = async (filters = {}) => {
  const { shipmentWhere, agentWhere } = buildFilters(filters);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const baseShipmentWhere = { ...shipmentWhere };
  delete baseShipmentWhere.createdAt;

  const [
    totalShipments,
    todaysShipments,
    activeShipments,
    deliveredToday,
    totalAgents,
    availableAgents,
    activeDelayedShipments,
    overloadedAgents,
    totalDelivered,
    totalCancelled,
  ] = await Promise.all([
    Shipment.count({ where: shipmentWhere }),
    Shipment.count({
      where: { ...baseShipmentWhere, createdAt: { [Op.gte]: startOfToday } },
    }),
    Shipment.count({
      where: {
        ...shipmentWhere,
        status: ["assigned", "picked", "in_transit"],
      },
    }),
    Shipment.count({
      where: {
        ...baseShipmentWhere,
        status: "delivered",
        actual_delivery_at: { [Op.gte]: startOfToday },
      },
    }),
    Agent.count({ where: agentWhere }),
    Agent.count({
      where: { ...agentWhere, is_active: true, availability_status: "available" },
    }),
    Shipment.count({
      where: {
        ...shipmentWhere,
        is_delayed: true,
        status: { [Op.notIn]: ["delivered", "cancelled"] },
      },
    }),
    Agent.count({
      where: { ...agentWhere, active_shipments_count: { [Op.gt]: 5 } },
    }),
    Shipment.count({ where: { ...shipmentWhere, status: "delivered" } }),
    Shipment.count({ where: { ...shipmentWhere, status: "cancelled" } }),
  ]);

  const delayRate =
    totalShipments > 0
      ? ((activeDelayedShipments / totalShipments) * 100).toFixed(1)
      : 0;
  const onTimeRate =
    totalDelivered > 0
      ? (
          ((totalDelivered - activeDelayedShipments) / totalDelivered) *
          100
        ).toFixed(1)
      : 100;

  return {
    total_shipments: totalShipments,
    todays_shipments: todaysShipments,
    active_shipments: activeShipments,
    delivered_today: deliveredToday,
    total_agents: totalAgents,
    available_agents: availableAgents,
    active_delayed_shipments: activeDelayedShipments,
    overloaded_agents: overloadedAgents,
    total_delivered: totalDelivered,
    total_cancelled: totalCancelled,
    delay_rate: parseFloat(delayRate),
    on_time_rate: parseFloat(onTimeRate),
  };
};

// ─── SHIPMENTS BY STATUS ──────────────────────────────────────────────────────
exports.getShipmentsByStatus = async (filters = {}) => {
  const { shipmentWhere } = buildFilters(filters);

  const statusCounts = await Shipment.findAll({
    where: shipmentWhere,
    attributes: [
      "status",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    group: ["status"],
    raw: true,
  });

  const defaultStatuses = {
    created: 0,
    assigned: 0,
    picked: 0,
    in_transit: 0,
    delivered: 0,
    cancelled: 0,
  };

  statusCounts.forEach((item) => {
    if (defaultStatuses[item.status] !== undefined) {
      defaultStatuses[item.status] = parseInt(item.count, 10);
    }
  });

  return Object.keys(defaultStatuses).map((status) => ({
    name: status,
    value: defaultStatuses[status],
  }));
};

// ─── AGENT PERFORMANCE (existing) ────────────────────────────────────────────
exports.getAgentPerformance = async (filters = {}) => {
  const { agentWhere } = buildFilters(filters);

  const agents = await Agent.findAll({
    where: { ...agentWhere, is_active: true },
    attributes: [
      "id",
      "name",
      "city",
      "rating",
      "active_shipments_count",
      "availability_status",
    ],
    order: [["active_shipments_count", "DESC"]],
    limit: 10,
    raw: true,
  });

  return agents.map((agent) => {
    const maxCapacity = Math.max(5, agent.active_shipments_count);
    return {
      ...agent,
      max_capacity: maxCapacity,
      load_percentage: Math.min(
        Math.round((agent.active_shipments_count / maxCapacity) * 100),
        100
      ),
    };
  });
};

// ─── DELAYED SHIPMENTS ────────────────────────────────────────────────────────
exports.getDelayedShipments = async (filters = {}) => {
  const { shipmentWhere } = buildFilters(filters);

  const delayed = await Shipment.findAll({
    where: {
      ...shipmentWhere,
      is_delayed: true,
      status:
        shipmentWhere.status || { [Op.notIn]: ["delivered", "cancelled"] },
    },
    include: [
      { model: Agent, attributes: ["name", "phone"] },
      { model: User, attributes: ["full_name"] },
    ],
    order: [["createdAt", "DESC"]],
    limit: 10,
  });

  return delayed;
};

// ─── TIMELINE DATA ────────────────────────────────────────────────────────────
exports.getTimelineData = async (filters = {}) => {
  const { shipmentWhere } = buildFilters(filters);
  const days = parseInt(filters.days, 10) || 30; // Default to 30 days of history for 'All Time' view trendline

  const timelineDays = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    timelineDays.push(d.toISOString().split("T")[0]);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const timelineData = await Shipment.findAll({
    attributes: [
      [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    where: {
      ...shipmentWhere,
      createdAt: { [Op.gte]: startDate },
    },
    group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
    raw: true,
  });

  const dataMap = {};
  timelineData.forEach((item) => {
    dataMap[item.date] = parseInt(item.count, 10);
  });

  return timelineDays.map((dateStr) => ({
    date: dateStr,
    count: dataMap[dateStr] || 0,
  }));
};

// ─── NEW: CITY ANALYTICS ──────────────────────────────────────────────────────
// Returns top cities by shipment volume with per-status breakdown
exports.getCityAnalytics = async (filters = {}) => {
  const { shipmentWhere } = buildFilters(filters);

  // Top pickup cities
  const pickupCities = await Shipment.findAll({
    where: shipmentWhere,
    attributes: [
      "pickup_city",
      [sequelize.fn("COUNT", sequelize.col("id")), "total"],
    ],
    group: ["pickup_city"],
    order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
    limit: 12,
    raw: true,
  });

  // Top delivery cities
  const deliveryCities = await Shipment.findAll({
    where: shipmentWhere,
    attributes: [
      "delivery_city",
      [sequelize.fn("COUNT", sequelize.col("id")), "total"],
    ],
    group: ["delivery_city"],
    order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
    limit: 12,
    raw: true,
  });

  // Status breakdown per pickup city (for top 8 cities)
  const topCities = pickupCities.slice(0, 8).map((c) => c.pickup_city);
  const cityStatusMatrix = [];
  if (topCities.length > 0) {
    const cityStatus = await Shipment.findAll({
      where: {
        ...shipmentWhere,
        pickup_city: { [Op.in]: topCities },
      },
      attributes: [
        "pickup_city",
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["pickup_city", "status"],
      raw: true,
    });

    // Build city → status map
    const cityMap = {};
    cityStatus.forEach((row) => {
      if (!cityMap[row.pickup_city])
        cityMap[row.pickup_city] = {
          city: row.pickup_city,
          delivered: 0,
          in_transit: 0,
          assigned: 0,
          picked: 0,
          created: 0,
          cancelled: 0,
          total: 0,
        };
      cityMap[row.pickup_city][row.status] = parseInt(row.count, 10);
      cityMap[row.pickup_city].total += parseInt(row.count, 10);
    });

    cityStatusMatrix.push(
      ...topCities.map((c) => cityMap[c]).filter(Boolean)
    );
  }

  return {
    pickup_cities: pickupCities.map((c) => ({
      name: c.pickup_city,
      value: parseInt(c.total, 10),
    })),
    delivery_cities: deliveryCities.map((c) => ({
      name: c.delivery_city,
      value: parseInt(c.total, 10),
    })),
    city_status_matrix: cityStatusMatrix,
  };
};

// ─── NEW: AGENT LEADERBOARD ───────────────────────────────────────────────────
// Ranks agents by delivered shipment count in the time window
exports.getAgentLeaderboard = async (filters = {}) => {
  const { shipmentWhere } = buildFilters(filters);

  // Count delivered shipments per agent in the filter window
  const deliveredCounts = await Shipment.findAll({
    where: { ...shipmentWhere, status: "delivered", agent_id: { [Op.not]: null } },
    attributes: [
      "agent_id",
      [sequelize.fn("COUNT", sequelize.col("Shipment.id")), "delivered_count"],
    ],
    include: [
      {
        model: Agent,
        attributes: ["name", "city", "subregion", "rating", "availability_status"],
        required: true,
      },
    ],
    group: [
      "agent_id",
      "Agent.id",
      "Agent.name",
      "Agent.city",
      "Agent.subregion",
      "Agent.rating",
      "Agent.availability_status",
    ],
    order: [[sequelize.fn("COUNT", sequelize.col("Shipment.id")), "DESC"]],
    limit: 10,
  });

  // Count delayed shipments per agent
  const delayedCounts = await Shipment.findAll({
    where: {
      ...shipmentWhere,
      is_delayed: true,
      agent_id: { [Op.not]: null },
    },
    attributes: [
      "agent_id",
      [sequelize.fn("COUNT", sequelize.col("id")), "delay_count"],
    ],
    group: ["agent_id"],
    raw: true,
  });

  const delayMap = {};
  delayedCounts.forEach((d) => {
    delayMap[d.agent_id] = parseInt(d.delay_count, 10);
  });

  return deliveredCounts.map((row, idx) => {
    const delivered = parseInt(row.dataValues.delivered_count, 10);
    const delayed = delayMap[row.dataValues.agent_id] || 0;
    const total = delivered + delayed;
    const onTimeRate =
      total > 0 ? Math.round(((total - delayed) / total) * 100) : 100;

    return {
      rank: idx + 1,
      agent_id: row.dataValues.agent_id,
      name: row.Agent.name,
      city: row.Agent.city,
      subregion: row.Agent.subregion,
      rating: parseFloat(row.Agent.rating) || 0,
      availability_status: row.Agent.availability_status,
      delivered_count: delivered,
      delayed_count: delayed,
      on_time_rate: onTimeRate,
    };
  });
};

// ─── NEW: PACKAGE ANALYTICS ───────────────────────────────────────────────────
exports.getPackageAnalytics = async (filters = {}) => {
  const { shipmentWhere } = buildFilters(filters);

  const typeCounts = await Shipment.findAll({
    where: shipmentWhere,
    attributes: [
      "package_type",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      [sequelize.fn("AVG", sequelize.col("weight_kg")), "avg_weight"],
    ],
    group: ["package_type"],
    raw: true,
  });

  // Delayed by package type
  const delayedByType = await Shipment.findAll({
    where: { ...shipmentWhere, is_delayed: true },
    attributes: [
      "package_type",
      [sequelize.fn("COUNT", sequelize.col("id")), "delayed_count"],
    ],
    group: ["package_type"],
    raw: true,
  });

  const delayByTypeMap = {};
  delayedByType.forEach((d) => {
    delayByTypeMap[d.package_type] = parseInt(d.delayed_count, 10);
  });

  return typeCounts.map((row) => ({
    name: row.package_type,
    value: parseInt(row.count, 10),
    avg_weight: parseFloat(row.avg_weight || 0).toFixed(2),
    delayed_count: delayByTypeMap[row.package_type] || 0,
  }));
};

// ─── NEW: TAG ANALYTICS ───────────────────────────────────────────────────────
// Tags are stored as JSON arrays. We pull all and count in JS.
exports.getTagAnalytics = async (filters = {}) => {
  const { shipmentWhere } = buildFilters(filters);

  const shipmentsWithTags = await Shipment.findAll({
    where: { ...shipmentWhere, tags: { [Op.not]: null } },
    attributes: ["tags", "status", "is_delayed"],
    raw: true,
  });

  const tagMap = {};
  shipmentsWithTags.forEach((s) => {
    let tags = s.tags;
    if (typeof tags === "string") {
      try { tags = JSON.parse(tags); } catch { tags = []; }
    }
    if (!Array.isArray(tags)) return;
    tags.forEach((tag) => {
      if (!tagMap[tag]) tagMap[tag] = { name: tag, count: 0, delayed: 0 };
      tagMap[tag].count++;
      if (s.is_delayed) tagMap[tag].delayed++;
    });
  });

  return Object.values(tagMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((t) => ({
      ...t,
      delay_rate:
        t.count > 0 ? Math.round((t.delayed / t.count) * 100) : 0,
    }));
};

// ─── NEW: ON-TIME RATE BY CITY ────────────────────────────────────────────────
exports.getOnTimeRateByCity = async (filters = {}) => {
  const { shipmentWhere } = buildFilters(filters);

  const delivered = await Shipment.findAll({
    where: { ...shipmentWhere, status: "delivered" },
    attributes: [
      "delivery_city",
      [sequelize.fn("COUNT", sequelize.col("id")), "total"],
      [
        sequelize.fn(
          "SUM",
          sequelize.literal("CASE WHEN is_delayed = 0 THEN 1 ELSE 0 END")
        ),
        "on_time",
      ],
    ],
    group: ["delivery_city"],
    order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
    limit: 10,
    raw: true,
  });

  return delivered.map((row) => {
    const total = parseInt(row.total, 10);
    const onTime = parseInt(row.on_time, 10) || 0;
    return {
      city: row.delivery_city,
      total,
      on_time: onTime,
      on_time_rate: total > 0 ? Math.round((onTime / total) * 100) : 0,
    };
  });
};