const { Student, ClassEnrollment, Class, AttendanceRecord, AttendanceSession } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

exports.getAllStudents = async (req, res, next) => {
  try {
    const { search, class_id, face_enrolled } = req.query;
    const where = { is_active: true };
    if (search) where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { student_id: { [Op.like]: `%${search}%` } },
    ];
    if (face_enrolled !== undefined) where.face_enrolled = face_enrolled === 'true';
    
    const include = [{ model: Class, as: 'classes', through: { attributes: [] }, attributes: ['id', 'name', 'subject', 'form'] }];
    if (class_id) include[0].where = { id: class_id };

    const students = await Student.findAll({ where, include, order: [['name', 'ASC']] });
    
    // Add attendance stats
    const enriched = await Promise.all(students.map(async (s) => {
      const total = await AttendanceRecord.count({ where: { student_id: s.id } });
      const present = await AttendanceRecord.count({ where: { student_id: s.id, status: ['present', 'late'] } });
      const rate = total > 0 ? Math.round((present / total) * 100) : null;
      const obj = s.toJSON();
      delete obj.face_descriptors; // never send raw descriptors
      return { ...obj, attendance_rate: rate, total_sessions: total };
    }));

    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
};

exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [{ model: Class, as: 'classes', through: { attributes: [] } }],
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const obj = student.toJSON();
    delete obj.face_descriptors;
    
    const records = await AttendanceRecord.findAll({
      where: { student_id: student.id },
      include: [{ model: AttendanceSession, as: 'session', include: [{ model: Class, as: 'class', attributes: ['name', 'subject', 'form'] }] }],
      order: [['marked_at', 'DESC']],
      limit: 50,
    });
    res.json({ success: true, data: { ...obj, recent_attendance: records } });
  } catch (err) { next(err); }
};

exports.createStudent = async (req, res, next) => {
  try {
    const { student_id, name, email, phone, notes, class_ids } = req.body;
    if (!student_id || !name) return res.status(400).json({ success: false, message: 'student_id and name required' });
    const exists = await Student.findOne({ where: { student_id } });
    if (exists) return res.status(409).json({ success: false, message: 'Student ID already exists' });
    const student = await Student.create({ student_id, name, email, phone, notes });
    if (class_ids && class_ids.length) {
      await Promise.all(class_ids.map(cid => ClassEnrollment.create({ student_id: student.id, class_id: cid })));
    }
    res.status(201).json({ success: true, data: student });
  } catch (err) { next(err); }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const { name, email, phone, notes, is_active } = req.body;
    await student.update({ name, email, phone, notes, is_active });
    res.json({ success: true, data: student });
  } catch (err) { next(err); }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    await student.destroy();
    res.json({ success: true, message: 'Student deleted' });
  } catch (err) { next(err); }
};

exports.enrollFace = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const { descriptors } = req.body;
    if (!descriptors || !Array.isArray(descriptors) || descriptors.length < 1)
      return res.status(400).json({ success: false, message: 'At least 1 face descriptor required' });
    await student.update({
      face_descriptors: descriptors,
      face_enrolled: true,
      face_enrolled_at: new Date(),
    });
    res.json({ success: true, message: `Face enrolled with ${descriptors.length} samples`, data: { face_enrolled: true } });
  } catch (err) { next(err); }
};

exports.removeFace = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    await student.update({ face_descriptors: null, face_enrolled: false, face_enrolled_at: null });
    res.json({ success: true, message: 'Face data removed' });
  } catch (err) { next(err); }
};

exports.getEnrolledDescriptors = async (req, res, next) => {
  try {
    const students = await Student.findAll({
      where: { face_enrolled: true, is_active: true },
      attributes: ['id', 'name', 'student_id', 'face_descriptors'],
    });
    const data = students.map(s => ({ label: s.name, student_id: s.student_id, descriptors: s.face_descriptors }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
