const express = require("express");
const dashboardController = require("../controllers/AdminDashboardController");
const authenticate = require("../middleware/authenticate_middlewere")
const roleVerifyMiddlewere = require("../middleware/roleVerifyMiddlewere")

const router = express.Router();

// ─── EXISTING ROUTES (unchanged) ─────────────────────────────────────────────
router.get("/filters-meta", authenticate, roleVerifyMiddlewere("admin"), dashboardController.getFilterMetadata);
router.get("/summary", authenticate, roleVerifyMiddlewere("admin"), dashboardController.getSummary);
router.get("/shipments-by-status", authenticate, roleVerifyMiddlewere("admin"), dashboardController.getShipmentsByStatus);
router.get("/agent-performance", authenticate, roleVerifyMiddlewere("admin"), dashboardController.getAgentPerformance);
router.get("/delayed-shipments", authenticate, roleVerifyMiddlewere("admin"), dashboardController.getDelayedShipments);
router.get("/timeline", authenticate, roleVerifyMiddlewere("admin"), dashboardController.getTimeline);
router.get("/all-agents", authenticate, roleVerifyMiddlewere("admin"), dashboardController.getAllAgentsProxy); // proxy

// ─── NEW ANALYTICS ROUTES ─────────────────────────────────────────────────────
router.get("/city-analytics", authenticate, roleVerifyMiddlewere("admin"), dashboardController.getCityAnalytics);
router.get("/agent-leaderboard", authenticate, roleVerifyMiddlewere("admin"), dashboardController.getAgentLeaderboard);
router.get("/package-analytics", authenticate, roleVerifyMiddlewere("admin"), dashboardController.getPackageAnalytics);
router.get("/tag-analytics", authenticate, roleVerifyMiddlewere("admin"), dashboardController.getTagAnalytics);
router.get("/ontime-by-city", authenticate, roleVerifyMiddlewere("admin"), dashboardController.getOnTimeRateByCity);

module.exports = router;