const Razorpay = require("razorpay");


if (!process.env.RAZORPAY_KEY_ID) {
  console.warn("Razorpay not configured");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpay;