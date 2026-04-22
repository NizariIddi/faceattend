const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AttendanceRecord = sequelize.define('AttendanceRecord', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  status: { type: DataTypes.ENUM('present', 'late', 'absent', 'excused'), allowNull: false, defaultValue: 'absent' },
  confidence: { type: DataTypes.FLOAT, defaultValue: null, comment: 'Face recognition confidence 0-1' },
  method: { type: DataTypes.ENUM('face', 'manual'), defaultValue: 'face' },
  marked_at: { type: DataTypes.DATE, defaultValue: null },
  note: { type: DataTypes.STRING(255), defaultValue: null },
}, {
  tableName: 'attendance_records',
});

module.exports = AttendanceRecord;
