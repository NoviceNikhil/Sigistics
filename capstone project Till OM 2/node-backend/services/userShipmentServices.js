const { Op } = require("sequelize");
const APIFeatures = require("../utils/APIfeatures");
const { calculateHaversine } = require("../utils/distance");
const {
    Shipment,
    ShipmentHistory,
    Agent,
    Location,
} = require("../models/index.sql");
const { sequelize } = require("../config/sql");

const AGENT_ATTRIBUTES = ["id", "name", "phone", "city"];
const LOCATION_ATTRIBUTES = ["id", "city", "subregion", "latitude", "longitude"];

const CUSTOMER_SHIPMENT_INCLUDE = [
    { model: Agent, attributes: AGENT_ATTRIBUTES },
    { model: Location, as: "PickupLocation", attributes: LOCATION_ATTRIBUTES },
    { model: Location, as: "DeliveryLocation", attributes: LOCATION_ATTRIBUTES },
    { model: Location, as: "CurrentLocation", attributes: LOCATION_ATTRIBUTES },
];

const createHttpError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const normalizeLocationValue = (value) => {
    if (typeof value !== "string") return "";
    return value.trim().toLowerCase();
};

const findLocationByCityAndSubregion = async (city, subregion, transaction) => {
    const normalizedCity = normalizeLocationValue(city);
    const normalizedSubregion = normalizeLocationValue(subregion);

    if (!normalizedCity || !normalizedSubregion) {
        return null;
    }

    return Location.findOne({
        where: {
            city: normalizedCity,
            subregion: normalizedSubregion,
        },
        transaction,
    });
};

const getAllShipments = async (req) => {
    const features = new APIFeatures(Shipment, req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()
        .search();

    const { results, data: shipments } = await features.execute();

    return {
        results,
        shipments,
    };
};

const getShipmentById = async (id) => {
    const shipment = await Shipment.findByPk(id);
    return shipment;
};

const updateShipmentStatus = async (id, requestBody) => {
    // 1. Start a database transaction
    const transaction = await sequelize.transaction();

    try {
        // Pass the transaction to every query so Sequelize groups them together
        const shipment = await Shipment.findByPk(id, { transaction });
        if (!shipment) {
            await transaction.rollback();
            return null;
        }

        const previousStatus = shipment.status;
        const newStatus = requestBody.status;

        // Only proceed if the status is actually changing
        if (previousStatus !== newStatus) {

            // 2. Prepare safe data for the Shipment update
            const safeData = { status: newStatus };

            if (newStatus === "delivered") {
                safeData.actual_delivery_at = new Date();
            }
            if (requestBody.is_delayed) {
                safeData.is_delayed = true;
                safeData.delay_reason = requestBody.delay_reason;

                const currentTags = shipment.tags || [];
                if (!currentTags.includes("delayed_delivery")) {
                    safeData.tags = [...currentTags, "delayed_delivery"];
                }
            }

            // 3. Update the Shipment
            await shipment.update(safeData, { transaction });

            // 4. Create the History Record
            await ShipmentHistory.create({
                shipment_id: shipment.id,
                previous_status: previousStatus,
                new_status: newStatus,
                notes: requestBody.delay_reason || `Status updated to ${newStatus}`
            }, { transaction });
        }

        // 5. Commit the transaction (Saves BOTH to the database permanently)
        await transaction.commit();
        return shipment;

    } catch (error) {
        // If ANYTHING fails above, undo everything
        await transaction.rollback();
        throw error; // Throwing it allows your Controller's catch block to send the 500 error
    }
};

const getShipmentHistory = async (id) => {
    // Logic to fetch status history for a shipment
    // This might involve querying a separate ShipmentHistory table if you have one
    const history = await Shipment.findByPk(id); // Placeholder
    return history;
};

const deleteShipment = async (id) => {
    const shipment = await Shipment.findByPk(id);
    if (!shipment) return null;

    // Assuming soft-delete if paranoia is enabled in Sequelize, or manual status update
    await shipment.destroy();
    return true;
};

const uploadShipments = async (fileData) => {
    // Logic to parse Excel file and bulkCreate shipments
    // e.g., using xlsx library and Shipment.bulkCreate()
    return { message: "Bulk upload successful" };
};

const exportShipments = async (req) => {
    // Logic to fetch shipments and convert to Excel format
    const shipments = await Shipment.findAll();
    return shipments; // Placeholder for actual excel buffer/file generation
};

// Simulated city-to-city distance map (in km)
const CITY_DISTANCE_MAP = {
    "bengaluru-chennai": 350,
    "bengaluru-hyderabad": 570,
    "bengaluru-mumbai": 980,
    "bengaluru-pune": 840,
    "bengaluru-delhi": 2150,
    "chennai-hyderabad": 630,
    "chennai-mumbai": 1330,
    "hyderabad-mumbai": 710,
    "mumbai-pune": 150,
    "mumbai-delhi": 1400,
};

const getEstimatedDistance = (pickupCity, deliveryCity) => {
    if (!pickupCity || !deliveryCity) return 10;

    const key1 = `${pickupCity.toLowerCase()}-${deliveryCity.toLowerCase()}`;
    const key2 = `${deliveryCity.toLowerCase()}-${pickupCity.toLowerCase()}`;

    if (pickupCity.toLowerCase() === deliveryCity.toLowerCase()) return 10;
    return CITY_DISTANCE_MAP[key1] || CITY_DISTANCE_MAP[key2] || 50;
};

const calculateETA = (distanceKm) => {
    // Average speed: 40km/h for intracity, 60km/h for intercity
    const speed = distanceKm > 30 ? 60 : 40;
    return parseFloat((distanceKm / speed).toFixed(2));
};

const resolveShipmentRoute = async ({
    pickup_city,
    pickup_subregion,
    delivery_city,
    delivery_subregion,
    transaction,
}) => {
    const pickupLocation = await findLocationByCityAndSubregion(
        pickup_city,
        pickup_subregion,
        transaction,
    );
    const deliveryLocation = await findLocationByCityAndSubregion(
        delivery_city,
        delivery_subregion,
        transaction,
    );

    if (pickup_subregion && !pickupLocation) {
        throw createHttpError(
            `Pickup location "${pickup_city} / ${pickup_subregion}" was not found in the seeded locations table.`,
        );
    }

    if (delivery_subregion && !deliveryLocation) {
        throw createHttpError(
            `Delivery location "${delivery_city} / ${delivery_subregion}" was not found in the seeded locations table.`,
        );
    }

    const distanceKm =
        pickupLocation && deliveryLocation
            ? calculateHaversine(
                Number(pickupLocation.latitude),
                Number(pickupLocation.longitude),
                Number(deliveryLocation.latitude),
                Number(deliveryLocation.longitude),
            )
            : getEstimatedDistance(pickup_city, delivery_city);

    return {
        pickupLocation,
        deliveryLocation,
        distanceKm,
        etaHours: calculateETA(distanceKm),
    };
};

// const assignAgent = async (pickupCity) => {
//     // Priority 1: available agent in same city
//     let agent = await Agent.findOne({
//         where: {
//             city: { [Op.like]: `%${pickupCity}%` },
//             availability_status: "available",
//             is_active: true,
//         },
//         order: [["active_shipments_count", "ASC"]],
//     });

//     // Priority 2: any available agent with least load
//     if (!agent) {
//         agent = await Agent.findOne({
//             where: {
//                 availability_status: "available",
//                 is_active: true,
//             },
//             order: [["active_shipments_count", "ASC"]],
//         });
//     }

//     return agent || null;
// };

const assignAgent=async (city, subregion, transaction = null) => {
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


// Om's part
const createCustomerShipment = async (userId, body) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            pickup_city,
            pickup_subregion,
            delivery_city,
            delivery_subregion,
            package_type,
            weight_kg,
            expected_delivery_at,
            notes,
        } = body;

        const { pickupLocation, deliveryLocation, distanceKm, etaHours } =
            await resolveShipmentRoute({
                pickup_city,
                pickup_subregion,
                delivery_city,
                delivery_subregion,
                transaction,
            });

        // Auto-compute expected delivery: ETA travel time + 2hr handling buffer
        // User-provided value takes priority; otherwise we calculate it
        const computedExpectedDelivery = new Date();
        computedExpectedDelivery.setTime(
            computedExpectedDelivery.getTime() +
            etaHours * 60 * 60 * 1000 +   // travel time in ms
            2 * 60 * 60 * 1000             // 2hr handling buffer
        );

        // Auto-assign agent
        const agent = await assignAgent(pickup_city,pickup_subregion);

        // Generate shipment code: SHP-XXXXXX
        const shipmentCode =
            "SHP-" + Math.random().toString(36).substring(2, 8).toUpperCase();

        const shipment = await Shipment.create(
            {
                shipment_code: shipmentCode,
                user_id: userId,
                agent_id: agent ? agent.id : null,
                pickup_city,
                pickup_subregion: pickup_subregion || null,
                pickup_location_id: pickupLocation ? pickupLocation.id : null,
                delivery_city,
                delivery_subregion: delivery_subregion || null,
                delivery_location_id: deliveryLocation ? deliveryLocation.id : null,
                current_location_id: pickupLocation ? pickupLocation.id : null,
                package_type,
                weight_kg: weight_kg || null,
                status: agent ? "assigned" : "created",
                estimated_distance_km: distanceKm,
                eta_hours: etaHours,
                expected_delivery_at: expected_delivery_at || computedExpectedDelivery,
                is_delayed: false,
                tags: [],
            },
            { transaction }
        );

        // Record initial history
        await ShipmentHistory.create(
            {
                shipment_id: shipment.id,
                previous_status: "created",
                new_status: agent ? "assigned" : "created",
                notes: agent
                    ? `Auto-assigned to agent ${agent.name}`
                    : notes || "Awaiting agent assignment",
            },
            { transaction }
        );

        // Update agent load if assigned
        if (agent) {
            await agent.update(
                {
                    active_shipments_count: agent.active_shipments_count + 1,
                    availability_status:
                        agent.active_shipments_count + 1 >= 10 ? "busy" : "available",
                },
                { transaction }
            );
        }

        await transaction.commit();

        return await Shipment.findByPk(shipment.id, {
            include: CUSTOMER_SHIPMENT_INCLUDE,
        });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const getCustomerShipments = async (userId, query) => {
    const where = { user_id: userId };

    // Filters
    if (query.status) where.status = query.status;
    if (query.package_type) where.package_type = query.package_type;
    if (query.search) {
        where[Op.or] = [
            { shipment_code: { [Op.like]: `%${query.search}%` } },
            { pickup_city: { [Op.like]: `%${query.search}%` } },
            { delivery_city: { [Op.like]: `%${query.search}%` } },
        ];
    }
    if (query.from && query.to) {
        where.createdAt = {
            [Op.between]: [new Date(query.from), new Date(query.to)],
        };
    }

    // Pagination
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;

    // Sort
    const order = query.sort
        ? [[query.sort.replace("-", ""), query.sort.startsWith("-") ? "DESC" : "ASC"]]
        : [["createdAt", "DESC"]];

    const { count, rows } = await Shipment.findAndCountAll({
        where,
        include: CUSTOMER_SHIPMENT_INCLUDE,
        order,
        limit,
        offset,
        distinct: true,
    });

    return {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        shipments: rows,
    };
};

const getCustomerShipmentById = async (shipmentId, userId) => {
    const shipment = await Shipment.findOne({
        where: { id: shipmentId, user_id: userId },
        include: [
            ...CUSTOMER_SHIPMENT_INCLUDE,
            {
                model: ShipmentHistory,
                order: [["createdAt", "ASC"]],
                separate: true,
            },
        ],
    });

    return shipment;
};

const getCustomerDashboardStats = async (userId) => {
    const [total, inTransit, delivered, pendingAssignment] = await Promise.all([
        Shipment.count({ where: { user_id: userId } }),
        Shipment.count({ where: { user_id: userId, status: "in_transit" } }),
        Shipment.count({ where: { user_id: userId, status: "delivered" } }),
        Shipment.count({ where: { user_id: userId, status: "created" } }),
    ]);

    const recentShipments = await Shipment.findAll({
        where: { user_id: userId },
        include: CUSTOMER_SHIPMENT_INCLUDE,
        order: [["createdAt", "DESC"]],
        limit: 5,
    });

    return { total, inTransit, delivered, pendingAssignment, recentShipments };
};

module.exports = {
    //admin-specific
    getAllShipments,
    getShipmentById,
    updateShipmentStatus,
    getShipmentHistory,
    deleteShipment,
    uploadShipments,
    exportShipments,

    //customer-specific
    createCustomerShipment,
    getCustomerShipments,
    getCustomerShipmentById,
    getCustomerDashboardStats,
};
