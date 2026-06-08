const express = require("express");
const router = express.Router();
const agentController = require("../controllers/AdminAgentController");
const agentValidator = require("../middleware/adminValidateAgent");
const upload = require("../utils/multer");
const authenticate = require("../middleware/authenticate_middlewere")
const roleVerifyMiddlewere = require("../middleware/roleVerifyMiddlewere")
// Group: /api/agents
router.route("/")
  .get(authenticate, roleVerifyMiddlewere("admin"), agentController.getAllAgents)
  .post(authenticate, roleVerifyMiddlewere("admin"), agentValidator.validateCreateAgent, agentController.createAgent);

// Group: Bulk Upload
router.post("/upload",
  authenticate, roleVerifyMiddlewere("admin"),
  upload.single("file"),
  agentValidator.validateAgentExcel,
  agentController.uploadAgents
);

// Group: /api/agents/:id
router.route("/:id")
  .get(authenticate, roleVerifyMiddlewere("admin"), agentValidator.validateAgentId, agentController.getAgentById)
  .put(authenticate, roleVerifyMiddlewere("admin"), agentValidator.validateAgentId, agentValidator.validateUpdateAgent, agentController.updateAgent)
  .delete(authenticate, roleVerifyMiddlewere("admin"), agentValidator.validateAgentId, agentController.deleteAgent);

// Group: Specific Actions
router.put("/:id/availability",
  authenticate, roleVerifyMiddlewere("admin"), agentValidator.validateAgentId,
  agentValidator.validateAvailabilityToggle,
  agentController.toggleAvailability
);

// --- NEW RESTORE ROUTE ---
router.post("/:id/restore",
  authenticate, roleVerifyMiddlewere("admin"), agentValidator.validateAgentId,
  agentController.restoreAgent
);

router.post("/assign/:shipmentId",
  authenticate, roleVerifyMiddlewere("admin"), agentValidator.validateManualAssignment,
  agentController.assignAgent
);

// Bulk auto-assign all unassigned shipments to the best available agents
router.post("/bulk-assign", authenticate, roleVerifyMiddlewere("admin"), agentController.bulkAutoAssign);

module.exports = router;