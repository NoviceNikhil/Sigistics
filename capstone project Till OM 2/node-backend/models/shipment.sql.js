const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sql");

const Shipment = sequelize.define(
  "Shipment",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    shipment_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    agent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    
    // --- NEW: Master Location Links ---
    // These link to your Location table for accurate lat/long
    pickup_location_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow true initially for easier seeding
      references: {
        model: 'locations',
        key: 'id'
      }
    },
    delivery_location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
        key: 'id'
      }
    },
    // --- Current Location Checkpoint (Updated Manually by Agent) ---
    current_location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
        key: 'id'
      }
    },
    current_city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    current_subregion: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // --- Pickup Location Details (Snapshot) ---
    pickup_city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    pickup_subregion: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // --- Delivery Location Details (Snapshot) ---
    delivery_city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    delivery_subregion: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    
    package_type: {
      type: DataTypes.ENUM("small", "medium", "large"),
      allowNull: false,
    },
    weight_kg: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "created", "assigned", "picked", "in_transit", "delivered", "cancelled"
      ),
      allowNull: false,
      defaultValue: "created",
    },
    estimated_distance_km: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
    eta_hours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    expected_delivery_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actual_delivery_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_delayed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    delay_reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tags: {
      type: DataTypes.JSON, 
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  },
  {
    tableName: "shipments",
    timestamps: true,
    paranoid: true 
  }
);

module.exports = Shipment;