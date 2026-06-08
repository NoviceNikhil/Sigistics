const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const errorHandler = require("./middleware/errorHandler");
const adminShipmentRouter = require("./routes/ShipmentRoutes");
const adminaAgentRouter = require("./routes/AgentRoutes");
const adminLocationRouter = require("./routes/locationRoutes");
const adminDashboardRouter = require("./routes/adminDashboardRoutes");
const authRoute = require("./routes/authRoute");
const userroute = require("./routes/UserRoute");
const deliveryRoute = require("./routes/deliveryagent");
const agentPortalRoute = require("./routes/agentPortalRoutes");
const userShipmentRoutes = require("./routes/userShipmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");

const app = express();

// Trust proxy when behind a reverse proxy (Render, Heroku, etc.)
// Required for express-rate-limit to work on cloud platforms.
// Has no effect when running locally without a proxy — safe to keep.
app.set("trust proxy", 1);

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      // For local running: const allowedOrigins = ["http://localhost:5173"];
      const allowedOrigins = [
        "http://localhost:5173",
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      // allow server-to-server / curl requests (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// ================= PASSPORT =================
require("./config/passport");
app.use(passport.initialize());

// ================= DATABASE =================

// MongoDB
const connectDB = require("./config/db");
connectDB();

// MySQL
const { sequelize, connectSQL } = require("./config/sql");
connectSQL();

sequelize
  .sync()
  .then(() => console.log("  Tables synced"))
  .catch((err) => console.log(err));

app.use("/api/shipments", adminShipmentRouter);
app.use("/api/customer/shipments", userShipmentRoutes);
app.use("/api/agents", adminaAgentRouter);
app.use("/api/locations", adminLocationRouter);
app.use("/api/dashboard", adminDashboardRouter);
app.use("/api/agent", agentPortalRoute);
app.use("/api/payment", paymentRoutes);
app.use("/auth", authRoute);
app.use("/user", userroute);
app.use("/deliveryagent", deliveryRoute);
app.use("/api/chatbot", chatbotRoutes);
app.use(errorHandler);

// ================= SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}  `);
});
