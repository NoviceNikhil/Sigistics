const adminShipmentService = require("../services/AdminShipmentServices");
const { successResponse } = require("../utils/apiResponse");
const AppError = require("../utils/AppError");

/**
 * GET all shipments with search, filter, and pagination
 */
exports.getAllShipments = async (req, res, next) => {
  try {
    // Renamed variable from products to result for clarity
    const result = await adminShipmentService.getAllShipments(req);
    return successResponse(res, "successfully fetched all the shipments", result, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

/**
 * GET single shipment details
 */
exports.getShipmentById = async (req, res, next) => {
  try {
    const shipment = await adminShipmentService.getShipmentById(req.params.id);
    if (!shipment) {
      return next(new AppError("Shipment not found", 404));
    }
    return successResponse(res, "successfully fetched shipment details", shipment, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

/**
 * UPDATE shipment status and log history
 */
exports.updateShipmentStatus = async (req, res, next) => {
  try {
    const updatedShipment = await adminShipmentService.updateShipmentStatus(req.params.id, req.body);
    if (!updatedShipment) {
      return next(new AppError("Shipment not found", 422));
    }
    return successResponse(res, "successfully updated shipment status", updatedShipment, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

/**
 * GET status history logs
 */
exports.getShipmentHistory = async (req, res, next) => {
  try {
    const history = await adminShipmentService.getShipmentHistory(req.params.id);
    return successResponse(res, "successfully fetched shipment history", history, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

/**
 * DELETE (Soft Delete) shipment
 */
exports.deleteShipment = async (req, res, next) => {
  try {
    const deleted = await adminShipmentService.deleteShipment(req.params.id);
    if (!deleted) {
      return next(new AppError("Shipment not found", 404));
    }
    // Note: 204 No Content usually doesn't return a body, 
    // but your successResponse will handle the JSON structure.
    return successResponse(res, "successfully deleted shipment", null, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

/**
 * POST Bulk upload Shipments via Excel
 */
exports.uploadShipments = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError("Please upload an Excel file", 400));
    }

    const { overwrite } = req.query;
    const result = await adminShipmentService.uploadShipments(req.parsedExcelData, { overwrite });
    return successResponse(res, result.status === "CONFLICT" ? "duplicate shipments found" : "successfully uploaded shipments from excel", result, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

/**
 * RESTORE (Undo Soft Delete) shipment
 */
exports.restoreShipment = async (req, res, next) => {
  try {
    const restoredShipment = await adminShipmentService.restoreShipment(req.params.id);

    if (!restoredShipment) {
      return next(new AppError("Shipment not found", 404));
    }

    return successResponse(res, "successfully restored shipment", restoredShipment, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};

// PATCH: /api/shipments/:id/details
exports.updateShipmentDetails = async (req, res, next) => {
  try {
    const updatedShipment = await adminShipmentService.updateShipmentDetails(req.params.id, req.body);
    return successResponse(res, "Shipment details updated successfully", updatedShipment, 200);
  } catch (error) {
    // If the error message is "not found", we send 404, otherwise 400
    const statusCode = error.message.includes("not found") ? 404 : 400;
    return next(new AppError(error.message, statusCode));
  }
};

/**
 * POST /api/shipments/sync-rules
 * Retroactively apply all active rules to existing (active) shipments.
 */
exports.syncRules = async (req, res, next) => {
  try {
    const result = await adminShipmentService.syncRulesWithExistingShipments();
    return successResponse(res, `Retroactive sync completed. ${result.updated} shipments updated.`, result, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};