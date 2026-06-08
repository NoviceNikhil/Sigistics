const User = require("../models/user.sql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendOtpEmail = require("../utils/sendotp");
const DeliveryAgent = require("../models/agent.sql");

const sanitizeUser = (user) => {
  const userData = user.toJSON();
  delete userData.password_hash;
  return userData;
};

exports.loginUser = async (email, password) => {
  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  email = email.toLowerCase();

  const user = await User.findOne({ where: { email } });

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (user.role === "admin") {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedOtp = await bcrypt.hash(otp, 10);

    await user.update({
      otp_hash: hashedOtp,
      otp_expiry: new Date(Date.now() + 5 * 60 * 1000),
    });

    await sendOtpEmail(email, otp);

    return {
      isAdmin: true,
      userId: user.id,
      email,
      message: "OTP sent to email",
    };
  }
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );

  return {
    token,
    user: sanitizeUser(user),
  };
};

exports.loginStaff = async (email, password, role) => {
  if (!email || !password || !role) {
    const error = new Error("Email, password and role are required");
    error.statusCode = 400;
    throw error;
  }

  email = email.toLowerCase();


  if (role === "admin") {
    const user = await User.findOne({
      where: { email, role: "admin" },
    });

    if (!user) {
      throw new Error("Admin not found");
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    // 🔐 OTP FLOW
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await user.update({
      otp_hash: hashedOtp,
      otp_expiry: new Date(Date.now() + 5 * 60 * 1000),
    });

    await sendOtpEmail(email, otp);

    return {
      isAdmin: true,
      userId: user.id,
      email,
      message: "OTP sent to admin email",
    };
  }


  else if (role === "delivery") {
    const agent = await DeliveryAgent.findOne({ where: { email } });

    if (!agent) {
      throw new Error("Delivery agent not found");
    }

    const isMatch = await bcrypt.compare(password, agent.password_hash);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    //   DIRECT LOGIN (NO OTP)
    const token = jwt.sign(
      {
        id: agent.id,
        role: "delivery",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return {
      token,
      role: "delivery",
      user: sanitizeUser(agent),
    };
  } else {
    throw new Error("Invalid role");
  }
};

exports.signUpDelivery = async ({
  name,
  email,
  password,
  phone,
  city,
  subregion,
}) => {
  email = email.toLowerCase();

  // ❌ check if already exists
  const existing = await DeliveryAgent.findOne({ where: { email } });

  if (existing) {
    throw new Error("Delivery agent already exists");
  }

  // 🔐 hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 🔐 generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);

  // ⏰ expiry
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  //   create agent
  const agent = await DeliveryAgent.create({
    name,
    email,
    phone,
    city,
    subregion,
    password_hash: hashedPassword,
    otp_hash: hashedOtp,
    otp_expiry: otpExpiry,
    is_active: false, //    important (verify first)
  });

  // 📧 send OTP
  await sendOtpEmail(email, otp);

  return {
    message: "OTP sent to email. Please verify.",
    email: agent.email,
  };
};

exports.resetPassword = async (email, newPassword, token) => {
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const error = new Error("Invalid or expired token");
    error.statusCode = 401;
    throw error;
  }

  //   normalize email
  email = email.toLowerCase();

  if (decoded.email !== email) {
    throw new Error("Invalid token");
  }

  let user;

      
  //   USER
      
  if (decoded.role === "user") {
    user = await User.findOne({ where: { email } });
  }

      
  //   DELIVERY
      
  else if (decoded.role === "delivery") {
    user = await DeliveryAgent.findOne({ where: { email } });
  }

  // ❌ safety check
  if (!user) {
    throw new Error("User not found");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  //   update password + clear OTP
  await user.update({
    password_hash: hashedPassword,
    otp_hash: null,
    otp_expiry: null,
  });

  return {
    message: "Password updated successfully",
  };
};

exports.forgotPassword = async (email) => {
  email = email.toLowerCase();

  let user;

      
  //   CHECK IN USER TABLE
      
  user = await User.findOne({ where: { email } });

  let role = "user";

      
  //   IF NOT FOUND → CHECK DELIVERY TABLE
      
  if (!user) {
    user = await DeliveryAgent.findOne({ where: { email } });
    role = "delivery";
  }

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (!user.is_active) {
    throw new Error("Please verify your email first");
  }

      
  // 🔐 GENERATE OTP
      
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const hashedOtp = await bcrypt.hash(otp, 10);

  await user.update({
    otp_hash: hashedOtp,
    otp_expiry: new Date(Date.now() + 5 * 60 * 1000),
  });

  await sendOtpEmail(email, otp);

  return {
    email,
    role,
  };
};

exports.resendOtp = async (email, role) => {
  email = email.toLowerCase();
  let user;

  if (role === "admin" || role === "user") {
    user = await User.findOne({ where: { email, role } });
  } else if (role === "delivery") {
    user = await DeliveryAgent.findOne({ where: { email } });
  }

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  await user.update({
    otp_hash: hashedOtp,
    otp_expiry: otpExpiry,
  });

  await sendOtpEmail(email, otp);

  return { message: "OTP resent successfully", email, role };
};
