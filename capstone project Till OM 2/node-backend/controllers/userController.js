const userService = require("../services/userServices");
const deliveryService = require("../services/deliveryAgentServices");
const { successResponse, errorResponse } = require("../utils/apiResponse");


exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let profile;
    if (role === "delivery") {
      profile = await deliveryService.getAgentProfile(userId);
      // Ensure role is present so frontend Redux state knows the role
      profile = { ...profile, role: "delivery" };
    } else {
      profile = await userService.getUserProfile(userId);
    }

    return successResponse(res, "Profile fetched", profile);
  } catch (err) {
    return errorResponse(
      res,
      err.message || "Failed to fetch profile",
      null,
      err.statusCode || 500,
    );
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const data = await userService.getAllUsers();
    return successResponse(res, "Users fetched successfully", data);
  } catch (err) {
    return errorResponse(
      res,
      err.message || "Failed to fetch users",
      null,
      err.statusCode || 500,
    );
  }
};

exports.getUserById = async (req, res) => {
  try {
    const data = await userService.getUserById(req.params.id);

    return successResponse(res, "User fetched successfully", data);
  } catch (err) {
    return errorResponse(
      res,
      err.message || "Failed to fetch user",
      null,
      err.statusCode || 500,
    );
  }
};

exports.createNewUser = async (req, res) => {
  try {
    const response = await userService.createUser(req.body);
    return successResponse(res, "User created successfully", response, 201);
  } catch (err) {
    return errorResponse(
      res,
      err.message || "Failed to create user",
      null,
      err.statusCode || 500,
    );
  }
};

exports.patchUser = async (req, res) => {
  try {
    const data = await userService.patchUser(req.params.id, req.body);

    return successResponse(res, "User updated successfully", data);
  } catch (err) {
    return errorResponse(
      res,
      err.message || "Failed to update user",
      null,
      err.statusCode || 500,
    );
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const data = await userService.deleteUser(req.params.id);

    return successResponse(res, "User deleted successfully", data);
  } catch (err) {
    return errorResponse(
      res,
      err.message || "Failed to delete user",
      null,
      err.statusCode || 500,
    );
  }
};

exports.patchCurrentUser = async (req, res) => {
  try {
    const data = await userService.patchCurrentUser(req.user.id, req.body);

    return successResponse(res, "Profile updated successfully", data);
  } catch (err) {
    return errorResponse(
      res,
      err.message || "Failed to update profile",
      null,
      err.statusCode || 500,
    );
  }
};

exports.deleteCurrentUser = async (req, res) => {
  try {
    const data = await userService.deleteCurrentUser(req.user.id);

    res.clearCookie("token");
    return successResponse(res, "Account deleted successfully", data);
  } catch (err) {
    return errorResponse(
      res,
      err.message || "Failed to delete account",
      null,
      err.statusCode || 500,
    );
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const data = await userService.deleteUser(req.params.id);

    return successResponse(res, "User deleted successfully", data);
  } catch (err) {
    return errorResponse(
      res,
      err.message || "Failed to delete user",
      null,
      err.statusCode || 500,
    );
  }
};

