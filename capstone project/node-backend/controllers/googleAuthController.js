const jwt = require("jsonwebtoken");
const passport = require("passport");

const { successResponse, errorResponse } = require("../utils/apiResponse");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const isProduction = process.env.NODE_ENV === "production";

exports.redirectToGoogle = (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
};

exports.googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${FRONTEND_URL}/login`);
    }
    const token = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role || "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(`${FRONTEND_URL}/oauth-success`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    res.redirect(`${FRONTEND_URL}/login`);
  }
};
