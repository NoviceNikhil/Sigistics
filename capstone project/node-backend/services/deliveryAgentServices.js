const DeliveryAgent = require("../models/agent.sql");
const bcrypt = require("bcryptjs");
const sendOtpEmail = require("../utils/sendotp");

//     Helper

const sanitizeAgent = (agent) => {
  const data = agent.toJSON();
  delete data.password_hash;
  return data;
};

const findAgentOrThrow = async (id) => {
  const agent = await DeliveryAgent.findByPk(id);
  if (!agent) {
    const error = new Error("Agent not found");
    error.statusCode = 404;
    throw error;
  }
  return agent;
};

//     GET

exports.getAllAgents = async () => {
  const agents = await DeliveryAgent.findAll();

  if (!agents || agents.length === 0) {
    const error = new Error("No agents found");
    error.statusCode = 404;
    throw error;
  }

  return agents.map(sanitizeAgent);
};

exports.getAgentProfile = async (agentId) => {
  const agent = await DeliveryAgent.findByPk(agentId);

  if (!agent) {
    const error = new Error("Agent not found");
    error.statusCode = 404;
    throw error;
  }

  return sanitizeAgent(agent);
};

exports.getAgentById = async (id) => {
  const agent = await findAgentOrThrow(id);
  return sanitizeAgent(agent);
};

//     CREATE (OTP BASED SIGNUP)

exports.createDeliveryAgent = async (body) => {
  const { name, email, password, phone, city, subregion } = body;

  if (!name || !email || !password || !phone || !city) {
    const error = new Error("All fields are required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase();

  const existing = await DeliveryAgent.findOne({
    where: { email: normalizedEmail },
  });

  if (existing) {
    const error = new Error("Delivery agent already exists");
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // 🔐 OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);

  const agent = await DeliveryAgent.create({
    name,
    email: normalizedEmail,
    phone,
    city,
    subregion,
    password_hash: hashedPassword,
    otp_hash: hashedOtp,
    otp_expiry: new Date(Date.now() + 5 * 60 * 1000),
    is_active: false, // verify first
  });

  await sendOtpEmail(normalizedEmail, otp);

  return {
    message: "OTP sent to registered email",
    email: normalizedEmail,
    name,
  };
};

//     UPDATE (PUT)

exports.updateAgent = async (id, body) => {
  const agent = await findAgentOrThrow(id);

  const requiredFields = ["name", "email", "password", "phone", "city"];
  const isValid = requiredFields.every((field) => body[field]);

  if (!isValid) {
    const error = new Error("All fields are required for PUT");
    error.statusCode = 400;
    throw error;
  }

  body.email = body.email.toLowerCase();

  const existing = await DeliveryAgent.findOne({
    where: { email: body.email },
  });

  if (existing && existing.id !== agent.id) {
    const error = new Error("Email already in use");
    error.statusCode = 400;
    throw error;
  }

  body.password_hash = await bcrypt.hash(body.password, 10);
  delete body.password;

  await agent.update(body);

  return sanitizeAgent(agent);
};

//     PATCH

exports.patchAgent = async (id, body) => {
  const agent = await findAgentOrThrow(id);

  if (!body || Object.keys(body).length === 0) {
    const error = new Error("No data provided");
    error.statusCode = 400;
    throw error;
  }

  const restrictedFields = ["email"];

  if (Object.keys(body).some((key) => restrictedFields.includes(key))) {
    const error = new Error("Cannot update email");
    error.statusCode = 403;
    throw error;
  }

  if (body.password) {
    body.password_hash = await bcrypt.hash(body.password, 10);
    delete body.password;
  }

  await agent.update(body);

  return sanitizeAgent(agent);
};

//     DELETE

exports.deleteAgent = async (id) => {
  const agent = await findAgentOrThrow(id);
  await agent.destroy();

  return {
    id,
    message: "Agent deleted successfully",
  };
};

//     CURRENT AGENT

exports.patchCurrentAgent = async (agentId, body) => {
  const agent = await findAgentOrThrow(agentId);

  if (!body || Object.keys(body).length === 0) {
    const error = new Error("No data provided for update");
    error.statusCode = 400;
    throw error;
  }

  const { name, phone, city, subregion, availability_status } = body;

  if (name && name.trim()) agent.name = name.trim();
  if (phone && phone.trim()) agent.phone = phone.trim();
  if (city && city.trim()) agent.city = city.trim();
  if (subregion && subregion.trim()) agent.subregion = subregion.trim();
  if (availability_status) agent.availability_status = availability_status;

  await agent.save();

  return sanitizeAgent(agent);
};

exports.deleteCurrentAgent = async (agentId) => {
  const agent = await findAgentOrThrow(agentId);
  await agent.destroy();

  return {
    id: agentId,
    message: "Account deleted successfully",
  };
};
