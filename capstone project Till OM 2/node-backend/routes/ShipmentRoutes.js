const express = require("express");
const upload = require("../utils/multer");
const adminShipmentController = require("../controllers/AdminShipmentController");
const authenticate = require("../middleware/authenticate_middlewere")
const roleVerifyMiddlewere = require("../middleware/roleVerifyMiddlewere")
// Import only the shipment-specific validators
const {
  validateShipmentIdParam,
  validateUpdateStatus,
  validateUpdateDetails,
  validateShipmentQuery,
  validateShipmentExcel
} = require("../middleware/adminValidateShipment");

const router = express.Router();

/**
 * 1. Static & Specific Routes
 * Hierarchy: Specific strings come before dynamic :id parameters.
 */

// List all shipments with search, filter, and pagination validation
router.get("/",
  authenticate, roleVerifyMiddlewere("admin"), validateShipmentQuery,
  adminShipmentController.getAllShipments
);

// Bulk upload shipments (Middleware parses and validates the buffer)
router.post("/upload",
  authenticate, roleVerifyMiddlewere("admin"),
  upload.single("file"),
  validateShipmentExcel,
  adminShipmentController.uploadShipments
);

// SYNC: Retroactively apply rules to existing shipments
router.post("/sync-rules",
  authenticate, roleVerifyMiddlewere("admin"),
  adminShipmentController.syncRules
);

/**
 * 2. Dynamic ID Routes
 * All routes below enforce UUID v4 validation on the :id parameter.
 */

router.get("/:id",
  authenticate, roleVerifyMiddlewere("admin"), validateShipmentIdParam,
  adminShipmentController.getShipmentById
);

router.get("/:id/history",
  authenticate, roleVerifyMiddlewere("admin"), validateShipmentIdParam,
  adminShipmentController.getShipmentHistory
);

// Partial updates for status change (Strict FSM logic applied in service)
router.patch("/:id/status",
  authenticate, roleVerifyMiddlewere("admin"), validateShipmentIdParam,
  validateUpdateStatus,
  adminShipmentController.updateShipmentStatus
);

// Partial updates for geographic/package data (Recalculates ETA in service)
router.patch("/:id/details",
  authenticate, roleVerifyMiddlewere("admin"), validateShipmentIdParam,
  validateUpdateDetails,
  adminShipmentController.updateShipmentDetails
);

// Administrative actions
router.post("/:id/restore",
  authenticate, roleVerifyMiddlewere("admin"), validateShipmentIdParam,
  adminShipmentController.restoreShipment
);

router.delete("/:id",
  authenticate, roleVerifyMiddlewere("admin"), validateShipmentIdParam,
  adminShipmentController.deleteShipment
);

module.exports = router;