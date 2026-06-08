const express = require("express");
const router = express.Router();
const { chatWithBot } = require("../controllers/chatbotController");
const authenticate = require("../middleware/authenticate_middlewere");

// POST /api/chatbot/message
router.post("/message", authenticate, chatWithBot);

module.exports = router;