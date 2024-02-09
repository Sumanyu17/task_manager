const { Sequelize, Model, DataTypes } = require("sequelize");

const User = global.databaseConnection.define("users", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV1,
    primaryKey: true
  },
  phoneNumber: {
    type: DataTypes.STRING(255),
    required: true, unique: true
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  }
});

module.exports = User;