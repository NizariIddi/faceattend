const { Class, User, Student, ClassEnrollment, AttendanceSession, AttendanceRecord } = require('../models');
const { Op } = require('sequelize');

exports.getAllClasses = async (req, res, next) => {
  try {
    const where = { is_active: true };
    // Teachers only see their own classes
    if (req.user.role === 'teacher') where.teacher_id = req.user.id;

    const classes = await Class.findAll({
      where,
      include: [{ model: User, as: 'teacher', attributes: ['id', 'name', 'email'] }],
      order: [['name', 'ASC']],
    });

    const enriched = await Promise.all(classes.map(async (c) => {
      const studentCount = await ClassEnrollment.count({ where: { class_id: c.id } });
      return { ...c.toJSON(), student_count: studentCount };
    }));

    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
};

exports.getClass = async (req, res, next) => {
  try {
    const cls = await Class.findByPk(req.params.id, {
      include: [
        { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] },
        { model: Student, as: 'students', through: { attributes: [] }, where: { is_active: true }, required: false },
      ],
    });
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, data: cls });
  } catch (err) { next(err); }
};

exports.createClass = async (req, res, next) => {
  try {
    const { name, subject, form, color, schedule, teacher_id } = req.body;
    if (!name || !subject || !form) return res.status(400).json({ success: false, message: 'name, subject, form required' });
    const tid = teacher_id || req.user.id;
    const cls = await Class.create({ name, subject, form, color, schedule, teacher_id: tid });
    res.status(201).json({ success: true, data: cls });
  } catch (err) { next(err); }
};

exports.updateClass = async (req, res, next) => {
  try {
    const cls = await Class.findByPk(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    if (req.user.role === 'teacher' && cls.teacher_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not your class' });
    await cls.update(req.body);
    res.json({ success: true, data: cls });
  } catch (err) { next(err); }
};

exports.deleteClass = async (req, res, next) => {
  try {
    const cls = await Class.findByPk(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    await cls.destroy();
    res.json({ success: true, message: 'Class deleted' });
  } catch (err) { next(err); }
};

exports.enrollStudents = async (req, res, next) => {
  try {
    const { student_ids } = req.body;
    if (!student_ids || !student_ids.length) return res.status(400).json({ success: false, message: 'student_ids required' });
    const cls = await Class.findByPk(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    let added = 0;
    for (const sid of student_ids) {
      const exists = await ClassEnrollment.findOne({ where: { class_id: cls.id, student_id: sid } });
      if (!exists) { await ClassEnrollment.create({ class_id: cls.id, student_id: sid }); added++; }
    }
    res.json({ success: true, message: `${added} students enrolled` });
  } catch (err) { next(err); }
};

exports.removeStudent = async (req, res, next) => {
  try {
    const deleted = await ClassEnrollment.destroy({ where: { class_id: req.params.id, student_id: req.params.studentId } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Enrollment not found' });
    res.json({ success: true, message: 'Student removed from class' });
  } catch (err) { next(err); }
};
