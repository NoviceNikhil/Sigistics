const agentService = require("../services/AdminAgentServices");
const AppError = require("../utils/AppError");
const { successResponse } = require("../utils/apiResponse");

exports.getAllAgents = async (req, res, next) => {
  try {
    const { results, agents } = await agentService.getAllAgents(req);
    // Standardizing the response using  utility
    return successResponse(res, "fetched agents", { agents, results }, 200);
  } catch (err) {
    next(err);
  }
};

exports.createAgent = async (req, res, next) => {
  try {
    const agent = await agentService.createAgent(req.body);
    return successResponse(res, "created agent", agent, 201);
  } catch (err) {
    if (err.message === "AGENT_ALREADY_EXISTS") return next(new AppError(err.message, 409));
    next(err);
  }
};

exports.getAgentById = async (req, res, next) => {
  try {
    const agent = await agentService.getAgentById(req.params.id);
    return successResponse(res, "fetched the single agent", agent, 200);
  } catch (err) {
    if (err.message === "AGENT_NOT_FOUND") return next(new AppError(err.message, 404));
    next(err);
  }
};

exports.updateAgent = async (req, res, next) => {
  try {
    const agent = await agentService.updateAgent(req.params.id, req.body);
    return successResponse(res, "updated the agent", agent, 200);
  } catch (err) {
    if (err.message === "AGENT_NOT_FOUND") return next(new AppError(err.message, 404));
    if (err.message === "UNIQUE_FIELD_CONFLICT") return next(new AppError(err.message, 409));
    next(err);
  }
};

exports.toggleAvailability = async (req, res, next) => {
  try {
    const agent = await agentService.toggleAvailability(req.params.id, req.body.availability_status);
    return successResponse(res, "toggled the availability", agent, 200);
  } catch (err) {
    if (err.message === "AGENT_NOT_FOUND") return next(new AppError(err.message, 404));
    if (err.message === "AGENT_HAS_ACTIVE_SHIPMENTS") return next(new AppError(err.message, 422));
    next(err);
  }
};

exports.deleteAgent = async (req, res, next) => {
  try {
    await agentService.deleteAgent(req.params.id);
    // Deletions usually don't return data, but we stick to standard 204
    return successResponse(res, "deleted the agent", null, 200);
  } catch (err) {
    if (err.message === "AGENT_NOT_FOUND") return next(new AppError(err.message, 404));
    if (err.message === "CANNOT_DELETE_AGENT_WITH_WORKLOAD") return next(new AppError(err.message, 422));
    next(err);
  }
};

exports.assignAgent = async (req, res, next) => {
  try {
    const shipment = await agentService.assignAgentToShipment(req.params.shipmentId, req.body.agent_id);
    return successResponse(res, "assigned the agent", shipment, 200);
  } catch (err) {
    if (err.message === "SHIPMENT_NOT_FOUND") return next(new AppError(err.message, 404));
    if (["SHIPMENT_ALREADY_FINALIZED", "AGENT_BUSY_OR_OFFLINE"].includes(err.message)) {
      return next(new AppError(err.message, 422));
    }
    next(err);
  }
};

exports.uploadAgents = async (req, res, next) => {
  try {
    const { overwrite } = req.query;
    const result = await agentService.uploadAgents(req.parsedAgentExcelData, { overwrite });
    return successResponse(res, result.status === "CONFLICT" ? "duplicate agents found" : "uploaded the agents", result, 200);
  } catch (err) {
    if (err.message === "DUPLICATE_AGENT_DATA") return next(new AppError(err.message, 409));
    next(err);
  }
};


exports.restoreAgent = async (req, res, next) => {
  try {
    const agent = await agentService.restoreAgent(req.params.id);
    return successResponse(res, "restored the agent", agent, 200);
  } catch (err) {
    if (err.message === "AGENT_NOT_FOUND") return next(new AppError(err.message, 404));
    next(err);
  }
};

exports.bulkAutoAssign = async (req, res, next) => {
  try {
    const summary = await agentService.bulkAutoAssign();
    return successResponse(
      res,
      `Bulk assign complete. ${summary.assigned} shipments assigned, ${summary.skipped} skipped (no capacity in city).`,
      summary,
      200
    );
  } catch (err) {
    next(err);
  }
};