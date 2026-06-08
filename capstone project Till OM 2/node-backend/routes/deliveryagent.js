const express = require("express");
const router = express.Router();

const deliveryController = require("../controllers/deliveryAgentController");

const authenticate = require("../middleware/authenticate_middlewere");
const roleVerifyMiddlewere = require("../middleware/roleVerifyMiddlewere");

// ------------------------------------------------------------------------------

router.patch("/profile", authenticate, deliveryController.patchCurrentAgent);
router.delete("/profile", authenticate, deliveryController.deleteCurrentAgent);

router.get(
  "/",
  authenticate,
  roleVerifyMiddlewere("admin"), // only admin can see all agents
  deliveryController.getAllAgents
);

router.get("/:id", authenticate, deliveryController.getAgentById);

router.patch("/:id", deliveryController.patchAgent);
router.delete("/:id", deliveryController.deleteAgent);

// ------------------------------------------------------------------------------

module.exports = router;