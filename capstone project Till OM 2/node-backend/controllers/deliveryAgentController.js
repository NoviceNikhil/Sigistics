const deliveryService = require("../services/deliveryAgentServices");
const { successResponse, errorResponse } = require("../utils/apiResponse");



// CRUD
exports.getAllAgents = async (req, res) => {
  const data = await deliveryService.getAllAgents();
  return successResponse(res, "Agents fetched", data);
};

exports.getAgentById = async (req, res) => {
  const data = await deliveryService.getAgentById(req.params.id);
  return successResponse(res, "Agent fetched", data);
};

exports.patchAgent = async (req, res) => {
  const data = await deliveryService.patchAgent(req.params.id, req.body);
  return successResponse(res, "Agent updated", data);
};

exports.deleteAgent = async (req, res) => {
  const data = await deliveryService.deleteAgent(req.params.id);
  return successResponse(res, "Agent deleted", data);
};

exports.patchCurrentAgent = async (req, res) => {
  const data = await deliveryService.patchCurrentAgent(req.user.id, req.body);
  return successResponse(res, "Profile updated", data);
};

exports.deleteCurrentAgent = async (req, res) => {
  const data = await deliveryService.deleteCurrentAgent(req.user.id);
  return successResponse(res, "Account deleted", data);
};