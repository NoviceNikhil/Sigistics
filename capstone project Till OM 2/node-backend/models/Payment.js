const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  orderId: {
    type: String,
    required: true,
  },
  paymentId: {
    type: String,
  },
  signature: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["created", "success", "failed"],
    default: "created",
  },
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);