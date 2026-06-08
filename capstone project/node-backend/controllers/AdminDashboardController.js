const dashboardService = require("../services/AdminDashboardServices");
const { successResponse } = require("../utils/apiResponse");
const AppError = require("../utils/AppError");

const extractFilters = (query) => ({
  region: query.region,
  days: query.days,
  agent: query.agent,
  status: query.status,
  package_type: query.package_type,
});

exports.getFilterMetadata = async (req, res, next) => {
  try {
    const data = await dashboardService.getFilterMetadata();
    return successResponse(res, "Filter metadata fetched", data, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

exports.getSummary = async (req, res, next) => {
  try {
    const filters = extractFilters(req.query);
    const data = await dashboardService.getSummaryMetrics(filters);
    return successResponse(res, "Summary metrics fetched", data, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

exports.getShipmentsByStatus = async (req, res, next) => {
  try {
    const filters = extractFilters(req.query);
    const data = await dashboardService.getShipmentsByStatus(filters);
    return successResponse(res, "Status counts fetched", data, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

exports.getAgentPerformance = async (req, res, next) => {
  try {
    const filters = extractFilters(req.query);
    const data = await dashboardService.getAgentPerformance(filters);
    return successResponse(res, "Agent performance fetched", data, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

exports.getDelayedShipments = async (req, res, next) => {
  try {
    const filters = extractFilters(req.query);
    const data = await dashboardService.getDelayedShipments(filters);
    return successResponse(res, "Delayed shipments fetched", data, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

exports.getTimeline = async (req, res, next) => {
  try {
    const filters = extractFilters(req.query);
    const data = await dashboardService.getTimelineData(filters);
    return successResponse(res, "Timeline data fetched", data, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

// ─── NEW ANALYTICS ENDPOINTS ──────────────────────────────────────────────────

exports.getCityAnalytics = async (req, res, next) => {
  try {
    const filters = extractFilters(req.query);
    const data = await dashboardService.getCityAnalytics(filters);
    return successResponse(res, "City analytics fetched", data, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

exports.getAgentLeaderboard = async (req, res, next) => {
  try {
    const filters = extractFilters(req.query);
    const data = await dashboardService.getAgentLeaderboard(filters);
    return successResponse(res, "Agent leaderboard fetched", data, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

exports.getPackageAnalytics = async (req, res, next) => {
  try {
    const filters = extractFilters(req.query);
    const data = await dashboardService.getPackageAnalytics(filters);
    return successResponse(res, "Package analytics fetched", data, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

exports.getTagAnalytics = async (req, res, next) => {
  try {
    const filters = extractFilters(req.query);
    const data = await dashboardService.getTagAnalytics(filters);
    return successResponse(res, "Tag analytics fetched", data, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

exports.getOnTimeRateByCity = async (req, res, next) => {
  try {
    const filters = extractFilters(req.query);
    const data = await dashboardService.getOnTimeRateByCity(filters);
    return successResponse(res, "On-time rate by city fetched", data, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

// ─── UNCHANGED PROXY ──────────────────────────────────────────────────────────
const agentService = require("../services/AdminAgentServices");
exports.getAllAgentsProxy = async (req, res, next) => {
  try {
    const { results, agents } = await agentService.getAllAgents(req);
    return successResponse(res, "Agents fetched via proxy", { results, rows: agents }, 200);
  } catch (err) {
    return next(new AppError(String(err), 500));
  }
};