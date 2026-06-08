const razorpay = require("../config/razorpay");
const verifySignature = require("../utilsPayment/verifySignature");
const Payment = require("../models/Payment");

exports.createOrder = async (req, res) => {
  try {
    const { userId, amountrs } = req.body;
    console.log(`userId:${userId} , amount:${amountrs}`);
    const options = {
      amount: amountrs,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    console.log(order);
    //   Save order in DB
    await Payment.create({
      userId,
      orderId: order.id,
      amount: order.amount,
      status: "created",
    });

    res.json(order);
  } catch (error) {
    console.log("error Printed at the controller");
    res.status(500).json({ error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const isValid = verifySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (isValid) {
      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        {
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: "success",
        },
      );

      res.json({ status: "success" });
    } else {
      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        {
          paymentId: razorpay_payment_id,
          status: "failed",
        },
      );

      res.status(400).json({ status: "failed" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
