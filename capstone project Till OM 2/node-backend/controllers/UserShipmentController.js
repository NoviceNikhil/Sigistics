const {
    createCustomerShipment,
    getCustomerShipments,
    getCustomerShipmentById,
    getCustomerDashboardStats,
} = require("../services/userShipmentServices");

// @desc    Get customer dashboard stats + recent shipments
// @route   GET /api/shipments/dashboard
// @access  Private (Customer)
const getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await getCustomerDashboardStats(userId);

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("getDashboard error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load dashboard",
            error: error.message,
        });
    }
};

// @desc    Get all shipments for logged-in customer (with filters + pagination)
// @route   GET /api/shipments
// @access  Private (Customer)
const getMyShipments = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await getCustomerShipments(userId, req.query);

        res.status(200).json({
            success: true,
            ...data,
        });
    } catch (error) {
        console.error("getMyShipments error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch shipments",
            error: error.message,
        });
    }
};

// @desc    Get single shipment detail + history
// @route   GET /api/shipments/:id
// @access  Private (Customer)
const getShipmentDetail = async (req, res) => {
    try {
        const userId = req.user.id;
        const shipmentId = req.params.id;

        const shipment = await getCustomerShipmentById(shipmentId, userId);

        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: "Shipment not found",
            });
        }

        res.status(200).json({
            success: true,
            data: shipment,
        });
    } catch (error) {
        console.error("getShipmentDetail error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch shipment",
            error: error.message,
        });
    }
};

// @desc    Create new shipment
// @route   POST /api/shipments
// @access  Private (Customer)
const createShipment = async (req, res) => {
    try {
        const userId = req.user.id;

        // Basic validation
        const { pickup_city, pickup_subregion, delivery_city, delivery_subregion, package_type } = req.body;

        if (!pickup_city || !pickup_subregion || !delivery_city || !delivery_subregion || !package_type) {
            return res.status(400).json({
                success: false,
                message: "pickup_city, pickup_subregion, delivery_city, delivery_subregion and package_type are all required",
            });
        }

        const shipment = await createCustomerShipment(userId, req.body);

        res.status(201).json({
            success: true,
            message: "Shipment created successfully",
            data: shipment,
        });
    } catch (error) {
        console.error("createShipment error:", error);
        const statusCode = error.statusCode || 500;

        res.status(statusCode).json({
            success: false,
            message:
                statusCode >= 500 ? "Failed to create shipment" : error.message,
            error: error.message,
        });
    }
};

module.exports = {
    getDashboard,
    getMyShipments,
    getShipmentDetail,
    createShipment,
};
