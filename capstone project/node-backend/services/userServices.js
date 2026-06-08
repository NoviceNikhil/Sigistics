const User = require("../models/user.sql");
const bcrypt = require("bcryptjs");
const sendOtpEmail = require("../utils/sendotp");


const sanitizeUser = (user) => {
  const userData = user.toJSON();
  delete userData.password_hash;
  return userData;
};

const findUserOrThrow = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};


exports.getAllUsers = async () => {
  const users = await User.findAll();
  if (!users || users.length === 0) {
    const error = new Error("No users found");
    error.statusCode = 404;
    throw error;
  }
  return users.map((user) => sanitizeUser(user));
};

exports.getUserProfile = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return sanitizeUser(user);
};

exports.getUserById = async (id) => {
  const user = await findUserOrThrow(id);
  return sanitizeUser(user);
};



exports.createUser = async (body) => {
  const { name, email, password, phone } = body;

  if (!name || !email || !password || !phone) {
    const error = new Error("All fields are required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase();

  const existingUser = await User.findOne({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    const error = new Error("User already exists");
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);

  const user = await User.create({
    full_name: name,
    email: normalizedEmail,
    password_hash: hashedPassword,
    phone: phone,
    otp_hash: hashedOtp,
    otp_expiry: new Date(Date.now() + 5 * 60 * 1000),
    is_active: false,
  });


  await sendOtpEmail(normalizedEmail, otp);

  return {
    message: "OTP sent to registered email",
    email: normalizedEmail,
    name: name
  };
};


exports.updateUser = async (id, body) => {
  const user = await findUserOrThrow(id);

  const requiredFields = ["name", "email", "password"];
  const isValid = requiredFields.every((field) => body[field]);

  if (!isValid) {
    const error = new Error("All fields are required for PUT");
    error.statusCode = 400;
    throw error;
  }

  body.email = body.email.toLowerCase();

  const existingUser = await User.findOne({
    where: { email: body.email },
  });

  if (existingUser && existingUser.id !== user.id) {
    const error = new Error("Email already in use");
    error.statusCode = 400;
    throw error;
  }

  body.password = await bcrypt.hash(body.password, 10);

  await user.update(body);

  return sanitizeUser(user);
};


exports.patchUser = async (id, body) => {
  const user = await findUserOrThrow(id);

  if (!body || Object.keys(body).length === 0) {
    const error = new Error("No data provided for update");
    error.statusCode = 400;
    throw error;
  }

  const restrictedFields = ["email", "role"];

  const isRestrictedUpdate = Object.keys(body).some((key) =>
    restrictedFields.includes(key),
  );

  if (isRestrictedUpdate) {
    const error = new Error("Access denied: Cannot update email or role");
    error.statusCode = 403;
    throw error;
  }

  const allowedFields = ["name", "password"];
  const filteredBody = {};

  for (let key of Object.keys(body)) {
    if (allowedFields.includes(key)) {
      filteredBody[key] = body[key];
    }
  }

  if (Object.keys(filteredBody).length === 0) {
    const error = new Error("No valid fields to update");
    error.statusCode = 400;
    throw error;
  }

  if (filteredBody.password) {
    filteredBody.password = await bcrypt.hash(filteredBody.password, 10);
  }

  await user.update(filteredBody);

  return sanitizeUser(user);
};


exports.deleteUser = async (id) => {
  const user = await findUserOrThrow(id);
  await user.destroy();
  return {
    id,
    message: "User deleted successfully",
  };
};


exports.patchCurrentUser = async (userId, body) => {
  const user = await findUserOrThrow(userId);

  if (!body || Object.keys(body).length === 0) {
    const error = new Error("No data provided for update");
    error.statusCode = 400;
    throw error;
  }

  const { name, phone } = body;

  if (name && name.trim()) {
    user.full_name = name.trim();
  }

  if (phone) {
    user.phone = phone.trim();
  }

  await user.save();

  return sanitizeUser(user);
};


exports.deleteCurrentUser = async (userId) => {
  const user = await findUserOrThrow(userId);
  await user.destroy();
  return {
    id: userId,
    message: "Account deleted successfully",
  };
};