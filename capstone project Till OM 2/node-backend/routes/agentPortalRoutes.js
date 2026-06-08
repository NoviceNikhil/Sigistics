const express = require("express");
const authenticate = require("../middleware/authenticate_middlewere");
const roleVerifyMiddlewere = require("../middleware/roleVerifyMiddlewere");
const agentPortalController = require("../controllers/agentPortalController");
const {
  validateDeliveryId,
  validateAgentDeliveryStatus,
  validateAgentAvailability,
  validateAgentDeliveryLocation,
  validateAgentDeliveryQuery,
} = require("../middleware/agentPortalValidate");

const router = express.Router();

router.use(authenticate, roleVerifyMiddlewere("delivery"));

router.get(
  "/deliveries",
  validateAgentDeliveryQuery,
  agentPortalController.getDeliveries,
);

router.get(
  "/deliveries/:id",
  validateDeliveryId,
  agentPortalController.getDeliveryById,
);

router.put(
  "/deliveries/:id/status",
  validateDeliveryId,
  validateAgentDeliveryStatus,
  agentPortalController.updateDeliveryStatus,
);

router.put(
  "/deliveries/:id/location",
  validateDeliveryId,
  validateAgentDeliveryLocation,
  agentPortalController.updateDeliveryLocation,
);

router.put(
  "/availability",
  validateAgentAvailability,
  agentPortalController.updateAvailability,
);

module.exports = router;
