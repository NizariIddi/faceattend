const { User, Student, Class, AttendanceSession, AttendanceRecord, ClassEnrollment } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

exports.getAdminStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [totalStudents, totalTeachers, totalClasses, enrolledFaces, todayPresent, todayLate, openSessions] = await Promise.all([
      Student.count({ where: { is_active: true } }),
      User.count({ where: { role: 'teacher', is_active: true } }),
      Class.count({ where: { is_active: true } }),
      Student.count({ where: { face_enrolled: true } }),
      AttendanceRecord.count({ where: { status: 'present', marked_at: { [Op.gte]: new Date(today) } } }),
      AttendanceRecord.count({ where: { status: 'late', marked_at: { [Op.gte]: new Date(today) } } }),
      AttendanceSession.count({ where: { status: 'open' } }),
    ]);
    res.json({ success: true, data: { totalStudents, totalTeachers, totalClasses, enrolledFaces, todayPresent, todayLate, openSessions } });
  } catch (err) { next(err); }
};

exports.getTeacherStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const myClasses = await Class.findAll({ where: { teacher_id: req.user.id, is_active: true } });
    const classIds = myClasses.map(c => c.id);
    const [mySessions, openSessions, todayPresent, todayLate] = await Promise.all([
      AttendanceSession.count({ where: { class_id: classIds } }),
      AttendanceSession.count({ where: { class_id: classIds, status: 'open' } }),
      AttendanceRecord.count({
        where: { status: 'present', marked_at: { [Op.gte]: new Date(today) } },
        include: [{ model: AttendanceSession, as: 'session', where: { class_id: classIds }, required: true }],
      }),
      AttendanceRecord.count({
        where: { status: 'late', marked_at: { [Op.gte]: new Date(today) } },
        include: [{ model: AttendanceSession, as: 'session', where: { class_id: classIds }, required: true }],
      }),
    ]);
    res.json({ success: true, data: { myClasses: myClasses.length, mySessions, openSessions, todayPresent, todayLate } });
  } catch (err) { next(err); }
};

exports.getStudentStats = async (req, res, next) => {
  try {
    // For a student user — get their own linked student record
    res.json({ success: true, data: { message: 'Student portal coming soon' } });
  } catch (err) { next(err); }
};
