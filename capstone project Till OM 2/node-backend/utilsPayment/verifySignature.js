const crypto = require("crypto");

const verifySignature = (data) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = data;

  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  return generated_signature === razorpay_signature;
};

module.exports = verifySignature;