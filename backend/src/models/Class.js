const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Class = sequelize.define('Class', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  subject: { type: DataTypes.STRING(80), allowNull: false },
  form: { type: DataTypes.STRING(20), allowNull: false },
  color: { type: DataTypes.STRING(20), defaultValue: '#00d4ff' },
  schedule: { type: DataTypes.JSON, defaultValue: null, comment: 'Array of {day, start_time, end_time}' },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'classes',
});

module.exports = Class;
