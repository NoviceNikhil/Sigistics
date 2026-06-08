const locationService = require("../services/AdminLocationServices");
const { successResponse } = require("../utils/apiResponse");
const AppError = require("../utils/AppError");

exports.createLocation = async (req, res, next) => {
  try {
    const newLocation = await locationService.createLocation(req.body);
    return successResponse(res, "Location created successfully", newLocation, 201);
  } catch (error) {
    if (error.message === "LOCATION_ALREADY_EXISTS") {
      return next(new AppError("A location with this city and subregion already exists", 409));
    }
    return next(new AppError(String(error), 500));
  }
};

exports.getAllLocations = async (req, res, next) => {
  try {
    const result = await locationService.getAllLocations(req.query);
    return successResponse(res, "Locations fetched successfully", result, 200);
  } catch (error) {
    return next(new AppError(String(error), 500));
  }
};


exports.getLocationById = async (req, res, next) => {
  try {
    const location = await locationService.getLocationById(req.params.id);
    return successResponse(res, "Location fetched successfully", location, 200);
  } catch (error) {
    const statusCode = error.message === "LOCATION_NOT_FOUND" ? 404 : 500;
    return next(new AppError(error.message, statusCode));
  }
};

exports.deleteLocation = async (req, res, next) => {
  try {
    await locationService.deleteLocation(req.params.id);
    return successResponse(res, "Location disabled successfully", null, 200);
  } catch (error) {
    const statusCode = error.message === "LOCATION_NOT_FOUND" ? 404 : 500;
    return next(new AppError(error.message, statusCode));
  }
};
exports.restoreLocation = async (req, res, next) => {
  try {
    const restoredLocation = await locationService.restoreLocation(req.params.id);
    return successResponse(res, "Location restored successfully", restoredLocation, 200);
  } catch (error) {
    if (error.message === "LOCATION_NOT_FOUND") {
      return next(new AppError("Location not found", 404));
    }
    if (error.message === "LOCATION_NOT_DELETED") {
      return next(new AppError("Location is already active", 400));
    }
    return next(new AppError(String(error), 500));
  }
};