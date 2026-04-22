const sequelize = require('../config/database');
const User = require('./User');
const Student = require('./Student');
const Class = require('./Class');
const ClassEnrollment = require('./ClassEnrollment');
const AttendanceSession = require('./AttendanceSession');
const AttendanceRecord = require('./AttendanceRecord');

// User <-> Class (teacher assigned to class)
User.hasMany(Class, { foreignKey: 'teacher_id', as: 'teachingClasses' });
Class.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

// Student <-> Class (many-to-many via ClassEnrollment)
Student.belongsToMany(Class, { through: ClassEnrollment, foreignKey: 'student_id', as: 'classes' });
Class.belongsToMany(Student, { through: ClassEnrollment, foreignKey: 'class_id', as: 'students' });
ClassEnrollment.belongsTo(Student, { foreignKey: 'student_id' });
ClassEnrollment.belongsTo(Class, { foreignKey: 'class_id' });

// AttendanceSession belongs to Class + opened by User
Class.hasMany(AttendanceSession, { foreignKey: 'class_id', as: 'sessions' });
AttendanceSession.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });
User.hasMany(AttendanceSession, { foreignKey: 'opened_by', as: 'openedSessions' });
AttendanceSession.belongsTo(User, { foreignKey: 'opened_by', as: 'openedBy' });

// AttendanceRecord belongs to Session + Student
AttendanceSession.hasMany(AttendanceRecord, { foreignKey: 'session_id', as: 'records' });
AttendanceRecord.belongsTo(AttendanceSession, { foreignKey: 'session_id', as: 'session' });
Student.hasMany(AttendanceRecord, { foreignKey: 'student_id', as: 'attendanceRecords' });
AttendanceRecord.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
User.hasMany(AttendanceRecord, { foreignKey: 'marked_by', as: 'markedRecords' });
AttendanceRecord.belongsTo(User, { foreignKey: 'marked_by', as: 'markedBy' });

const syncDB = async (force = false) => {
  await sequelize.sync({ alter: !force, force });
  console.log('[DB] Models synced');
};

module.exports = { sequelize, User, Student, Class, ClassEnrollment, AttendanceSession, AttendanceRecord, syncDB };
