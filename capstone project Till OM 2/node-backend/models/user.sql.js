const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sql");
const validator = require("validator");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      validate: {
        isValidEmail(value) {
          if (!validator.isEmail(value)) {
            throw new Error("Invalid email format");
          }
        },
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isStrong(value) {
          if (!validator.isStrongPassword(value)) {
            throw new Error("Password must be strong");
          }
        },
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
      defaultValue: "user",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    otp_hash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otp_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true,
  },
);

module.exports = User;


