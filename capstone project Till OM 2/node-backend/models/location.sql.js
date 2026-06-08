const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sql");

const Location = sequelize.define("Location", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
    set(val) { this.setDataValue('city', val.toLowerCase().trim()); }
  },
  subregion: {
    type: DataTypes.STRING,
    allowNull: false,
    set(val) { this.setDataValue('subregion', val.toLowerCase().trim()); }
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    }
}, {
  tableName: "locations",
  timestamps: true,
  indexes: [{ unique: true, fields: ['city', 'subregion'] }],
  paranoid:true
});

module.exports = Location;