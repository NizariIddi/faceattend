const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AttendanceSession = sequelize.define('AttendanceSession', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  start_time: { type: DataTypes.TIME, allowNull: false },
  end_time: { type: DataTypes.TIME, defaultValue: null },
  late_threshold: { type: DataTypes.TIME, defaultValue: '08:15:00', comment: 'Time after which marked late' },
  status: { type: DataTypes.ENUM('open', 'closed'), defaultValue: 'open' },
  notes: { type: DataTypes.TEXT, defaultValue: null },
}, {
  tableName: 'attendance_sessions',
});

module.exports = AttendanceSession;
