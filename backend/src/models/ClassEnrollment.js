const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClassEnrollment = sequelize.define('ClassEnrollment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
}, {
  tableName: 'class_enrollments',
});

module.exports = ClassEnrollment;
