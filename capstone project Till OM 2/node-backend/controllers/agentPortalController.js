const agentPortalService = require("../services/agentPortalServices");
const { successResponse } = require("../utils/apiResponse");
const AppError = require("../utils/AppError");

exports.getDeliveries = async (req, res, next) => {
  try {
    const result = await agentPortalService.listAgentDeliveries(
      req.user.id,
      req.query,
    );

    return successResponse(res, "Fetched assigned deliveries", result, 200);
  } catch (error) {
    return next(new AppError(error.message || "Failed to fetch deliveries", 500));
  }
};

exports.getDeliveryById = async (req, res, next) => {
  try {
    const result = await agentPortalService.getAgentDelivery(
      req.user.id,
      req.params.id,
    );

    return successResponse(res, "Fetched delivery details", result, 200);
  } catch (error) {
    if (error.message === "DELIVERY_NOT_FOUND") {
      return next(new AppError("Delivery not found", 404));
    }

    return next(
      new AppError(error.message || "Failed to fetch delivery details", 500),
    );
  }
};

exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const result = await agentPortalService.updateAgentDeliveryStatus(
      req.user.id,
      req.params.id,
      req.body,
    );

    return successResponse(res, "Delivery status updated", result, 200);
  } catch (error) {
    if (error.message === "DELIVERY_NOT_FOUND") {
      return next(new AppError("Delivery not found", 404));
    }

    if (error.message === "DELIVERY_LOCKED") {
      return next(
        new AppError("Completed or cancelled deliveries cannot be updated", 422),
      );
    }

    if (error.message === "INVALID_DELIVERY_STATUS_TRANSITION") {
      return next(new AppError("Invalid status transition for agent", 422));
    }

    return next(
      new AppError(error.message || "Failed to update delivery status", 500),
    );
  }
};

exports.updateAvailability = async (req, res, next) => {
  try {
    const result = await agentPortalService.updateAgentAvailability(
      req.user.id,
      req.body.availability_status,
    );

    return successResponse(res, "Availability updated", result, 200);
  } catch (error) {
    if (error.message === "AGENT_NOT_FOUND") {
      return next(new AppError("Agent not found", 404));
    }

    if (error.message === "AGENT_HAS_ACTIVE_DELIVERIES") {
      return next(
        new AppError(
          "You cannot go offline while you still have active deliveries",
          422,
        ),
      );
    }

    return next(
      new AppError(error.message || "Failed to update availability", 500),
    );
  }
};

exports.updateDeliveryLocation = async (req, res, next) => {
  try {
    const result = await agentPortalService.updateAgentDeliveryLocation(
      req.user.id,
      req.params.id,
      req.body,
    );

    return successResponse(res, "Delivery checkpoint updated", result, 200);
  } catch (error) {
    if (error.message === "DELIVERY_NOT_FOUND") {
      return next(new AppError("Delivery not found", 404));
    }

    if (error.message === "LOCATION_NOT_FOUND") {
      return next(new AppError("Selected checkpoint location was not found", 404));
    }

    if (error.message === "LOCATION_UPDATE_NOT_ALLOWED") {
      return next(
        new AppError("Current location can only be updated while the parcel is in transit", 422),
      );
    }

    return next(
      new AppError(error.message || "Failed to update delivery checkpoint", 500),
    );
  }
};
