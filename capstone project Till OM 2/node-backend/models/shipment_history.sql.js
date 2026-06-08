const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sql");

const ShipmentHistory = sequelize.define(
  "ShipmentHistory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    shipment_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    previous_status: {
      // Synchronized with Shipment model ENUM
      type: DataTypes.ENUM(
        "created", "assigned", "picked", "in_transit", "delivered", "cancelled"
      ),
      allowNull: false,
    },
    new_status: {
      // Synchronized with Shipment model ENUM
      type: DataTypes.ENUM(
        "created", "assigned", "picked", "in_transit", "delivered", "cancelled"
      ),
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "shipment_histories",
    timestamps: true, 
  }
);

module.exports = ShipmentHistory;