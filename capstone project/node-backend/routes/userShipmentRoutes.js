const express = require("express");
const router = express.Router();
const protect = require("../middleware/authenticate_middlewere");
const {
    getDashboard,
    getMyShipments,
    getShipmentDetail,
    createShipment,
} = require("../controllers/UserShipmentController");

// All routes are protected — JWT required
router.use(protect);

// GET /api/shipments/dashboard  ← must be BEFORE /:id or it gets caught as an id
router.get("/dashboard", getDashboard);

// GET /api/shipments
router.get("/", getMyShipments);

// POST /api/shipments
router.post("/", createShipment);

// GET /api/shipments/:id
router.get("/:id", getShipmentDetail);

module.exports = router;