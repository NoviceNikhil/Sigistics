const User = require("./user.sql");
const Agent = require("./agent.sql");
const Shipment = require("./shipment.sql");
const ShipmentHistory = require("./shipment_history.sql"); // Add this import
const Location = require("./location.sql");
// --- Associations ---

// User <-> Shipment (One-to-Many)
// A user can create multiple shipments
User.hasMany(Shipment, { foreignKey: "user_id", onDelete: "CASCADE" });
Shipment.belongsTo(User, { foreignKey: "user_id" });

// Agent <-> Shipment (One-to-Many)
// An agent can be assigned multiple shipments
Agent.hasMany(Shipment, { foreignKey: "agent_id", onDelete: "SET NULL" });
Shipment.belongsTo(Agent, { foreignKey: "agent_id" });

// Shipment <-> ShipmentHistory (One-to-Many)
// A shipment has a timeline of multiple status changes
// We use CASCADE so if a shipment is hard-deleted, its history is also wiped to save space
Shipment.hasMany(ShipmentHistory, { foreignKey: "shipment_id", onDelete: "CASCADE" });
ShipmentHistory.belongsTo(Shipment, { foreignKey: "shipment_id" });

Shipment.belongsTo(Location, { foreignKey: "pickup_location_id", as: "PickupLocation" });
Shipment.belongsTo(Location, { foreignKey: "delivery_location_id", as: "DeliveryLocation" });
Shipment.belongsTo(Location, { foreignKey: "current_location_id", as: "CurrentLocation" });
module.exports = {
  User,
  Agent,
  Shipment,
  ShipmentHistory,
  Location
};
