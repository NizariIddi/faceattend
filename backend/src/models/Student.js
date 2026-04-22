const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: true },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  face_descriptors: { type: DataTypes.JSON, defaultValue: null, comment: 'Array of 128-dim Float32Array descriptors' },
  face_enrolled: { type: DataTypes.BOOLEAN, defaultValue: false },
  face_enrolled_at: { type: DataTypes.DATE, defaultValue: null },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  notes: { type: DataTypes.TEXT, defaultValue: null },
}, {
  tableName: 'students',
});

module.exports = Student;
