const authService = require("../services/authServices");
const userService = require("../services/userServices");
const deliveryService = require("../services/deliveryAgentServices");
const { successResponse, errorResponse } = require("../utils/apiResponse");

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const data = await authService.loginUser(email, password);

    if (data.token) {
      res.cookie("token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      });
    }

    return successResponse(res, "User login successful", data);
  } catch (err) {
    console.error("Login error:", err.message);
    return errorResponse(
      res,
      err.message || "Login failed",
      null,
      err.statusCode || 500,
    );
  }
};

exports.loginStaff = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const data = await authService.loginStaff(email, password, role);

    // Only set cookie if token exists (delivery case)
    if (data.token) {
      res.cookie("token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      });
    }

    return successResponse(res, "Staff login success", data);
  } catch (err) {
    console.error("Staff login error:", err.message);
    return errorResponse(
      res,
      err.message || "Login failed",
      null,
      err.statusCode || 500,
    );
  }
};

exports.signUpUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return errorResponse(res, "All fields are required", null, 400);
    }

    const data = await userService.createUser({ name, email, password, phone });
    return successResponse(res, "Signup successful", data, 201);
  } catch (err) {
    return errorResponse(
      res,
      err.message || "Signup failed",
      null,
      err.statusCode || 500,
    );
  }
};

exports.signUpDelivery = async (req, res) => {
  try {
    const { name, email, password, phone, city, subregion } = req.body;

    if (!name || !email || !password || !phone || !city) {
      return errorResponse(res, "All fields are required", null, 400);
    }

    //   call deliveryService (same like user)
    const data = await deliveryService.createDeliveryAgent({
      name,
      email,
      password,
      phone,
      city,
      subregion,
    });

    return successResponse(res, "Delivery signup successful", data, 201);
  } catch (err) {
    return errorResponse(
      res,
      err.message || "Signup failed",
      null,
      err.statusCode || 500,
    );
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, "Email is required", null, 400);
    }
    const data = await authService.forgotPassword(email);
    return successResponse(res, "OTP sent successfully", data);
  } catch (err) {
    return errorResponse(
      res,
      err.message || "Failed to send OTP",
      null,
      err.statusCode || 500,
    );
  }
};

exports.resetPassword = async (req, res) => {
  try {
    let { email, newPassword, token } = req.body;

    if (!email || !newPassword || !token) {
      return errorResponse(
        res,
        "email, newPassword and token required",
        null,
        400,
      );
    }

    email = email.trim().toLowerCase();

    const data = await authService.resetPassword(email, newPassword, token);

    return successResponse(res, "Password updated successfully", data);
  } catch (err) {
    return errorResponse(
      res,
      err.message || "Reset password failed",
      null,
      err.statusCode || 500,
    );
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return errorResponse(res, "Email and role are required", null, 400);
    }
    const data = await authService.resendOtp(email, role);
    return successResponse(res, "OTP resent successfully", data);
  } catch (err) {
    return errorResponse(
      res,
      err.message || "Failed to resend OTP",
      null,
      err.statusCode || 500,
    );
  }
};
