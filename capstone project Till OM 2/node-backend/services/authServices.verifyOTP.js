const User = require("../models/user.sql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const DeliveryAgent = require("../models/agent.sql");

const sanitizeUser = (user) => {
  const userData = user.toJSON();
  delete userData.password;
  return userData;
};

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined");
  }

  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

exports.verifyAdminOTP = async (email, otp) => {
  email = email.toLowerCase();

  const user = await User.findOne({ where: { email } });

  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  if (!user.otp_hash || !user.otp_expiry) {
    throw new Error("OTP not found or expired");
  }

  if (new Date() > user.otp_expiry) {
    await user.update({ otp_hash: null, otp_expiry: null });
    throw new Error("OTP expired");
  }
  const isMatch = await bcrypt.compare(String(otp), user.otp_hash);

  if (!isMatch) {
    throw new Error("Invalid OTP");
  }
  await user.update({ otp_hash: null, otp_expiry: null });

  const token = generateToken(user);

  return {
    token,
    user: sanitizeUser(user),
  };
};

// exports.verifyUserOTP = async (email, otp) => {
//   email = email.toLowerCase();
//   const user = await User.findOne({ where: { email } });
//   if (!user || !user.otp_hash) {
//     throw new Error("OTP not found or expired");
//   }

//   if (new Date() > user.otp_expiry) {
//     await user.update({ otp_hash: null, otp_expiry: null });
//     throw new Error("OTP expired");
//   }

//   const isMatch = await bcrypt.compare(String(otp), user.otp_hash);

//   if (!isMatch) {
//     throw new Error("Invalid OTP");
//   }
//   // ! SignUp Flow
//   if (!user.is_active) {
//     await user.update({
//       is_active: true,
//       otp_hash: null,
//       otp_expiry: null,
//     });

//     const token = generateToken(user);

//     return {
//       token,
//       user: sanitizeUser(user),
//     };
//   }

//   // ! ================= FORGOT PASSWORD FLOW =================
//   else {
//     await user.update({
//       otp_hash: null,
//       otp_expiry: null,
//     });

//     const resetToken = jwt.sign(
//       { email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "10m" }
//     );

//     return {
//       resetToken,
//       message: "OTP verified, proceed to reset password",
//     };
//   }
// };

exports.verifyUserOTP = async (email, otp, type) => {
  email = email.toLowerCase();

  const user = await User.findOne({ where: { email } });

  if (!user || !user.otp_hash) {
    throw new Error("OTP not found or expired");
  }

  if (new Date() > user.otp_expiry) {
    await user.update({ otp_hash: null, otp_expiry: null });
    throw new Error("OTP expired");
  }

  const isMatch = await bcrypt.compare(String(otp), user.otp_hash);

  if (!isMatch) {
    throw new Error("Invalid OTP");
  }

  //   SIGNUP FLOW

  if (type === "signup") {
    if (user.is_active) {
      throw new Error("User already verified");
    }

    await user.update({
      is_active: true,
      otp_hash: null,
      otp_expiry: null,
    });

    const token = generateToken(user);

    return {
      token,
      user: sanitizeUser(user),
    };
  }

  //   FORGOT PASSWORD FLOW

  if (type === "forgot") {
    await user.update({
      otp_hash: null,
      otp_expiry: null,
    });

    const resetToken = jwt.sign(
      { email: user.email, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    return {
      resetToken,
      message: "OTP verified, proceed to reset password",
    };
  }

  throw new Error("Invalid OTP type");
};

exports.verifyDeliveryOTP = async (email, otp, type) => {
  email = email.toLowerCase();

  const agent = await DeliveryAgent.findOne({ where: { email } });

  if (!agent || !agent.otp_hash) {
    throw new Error("OTP not found or expired");
  }

  // ⏰ Expiry check
  if (new Date() > agent.otp_expiry) {
    await agent.update({
      otp_hash: null,
      otp_expiry: null,
    });
    throw new Error("OTP expired");
  }

  // 🔐 Compare OTP
  const isMatch = await bcrypt.compare(String(otp), agent.otp_hash);

  if (!isMatch) {
    throw new Error("Invalid OTP");
  }

  //   SIGNUP FLOW

  if (type === "signup") {
    if (agent.is_active) {
      throw new Error("Delivery agent already verified");
    }

    await agent.update({
      is_active: true,
      otp_hash: null,
      otp_expiry: null,
    });

    return {
      message: "Delivery agent verified successfully",
      agentId: agent.id,
    };
  }

  //   FORGOT PASSWORD FLOW

  if (type === "forgot") {
    if (!agent.is_active) {
      throw new Error("Delivery agent not verified");
    }

    await agent.update({
      otp_hash: null,
      otp_expiry: null,
    });

    const resetToken = jwt.sign(
      { email: agent.email, role: "delivery" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    return {
      resetToken,
      message: "OTP verified, proceed to reset password",
    };
  }

  throw new Error("Invalid OTP type");
};
