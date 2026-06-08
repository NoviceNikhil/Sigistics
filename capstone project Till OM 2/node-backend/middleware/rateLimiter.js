const rateLimit = require("express-rate-limit");

// ─── General API Limiter ───────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // max 25 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later.",
    });
  },
});

// ─── Login Rate Limiter ────────────────────────────────────────────────────────
// 7 failed attempts → locked out for 5 minutes
const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes lockout window
  max: 7, // allow 7 attempts per window
  standardHeaders: true, // sends RateLimit-* headers
  legacyHeaders: false,
  skipSuccessfulRequests: true, //   only count FAILED (non-2xx) requests

  handler: (req, res) => {
    // retryAfter is seconds until the window resets
    const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);

    res.status(429).json({
      success: false,
      message: "Too many login attempts. Please wait before trying again.",
      retryAfter, // seconds remaining — used by frontend countdown
    });
  },
});

module.exports = { apiLimiter, loginRateLimiter };
