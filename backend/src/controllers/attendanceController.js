const { AttendanceSession, AttendanceRecord, Class, Student, User } = require("../models");
const { Op } = require("sequelize");

exports.openSession = async (req, res, next) => {
  try {
    const { class_id, late_threshold, notes } = req.body;
    if (!class_id) return res.status(400).json({ success: false, message: "class_id required" });

    const cls = await Class.findByPk(class_id);
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    if (req.user.role === "teacher" && cls.teacher_id !== req.user.id)
      return res.status(403).json({ success: false, message: "Not your class" });

    const open = await AttendanceSession.findOne({ where: { class_id, status: "open" } });
    if (open) return res.status(409).json({ success: false, message: "Session already open", data: open });

    const now = new Date();
    const session = await AttendanceSession.create({
      class_id,
      date: now.toISOString().slice(0, 10),
      start_time: now.toTimeString().slice(0, 8),
      late_threshold: late_threshold || "08:15:00",
      opened_by: req.user.id,
      notes,
    });

    res.status(201).json({ success: true, data: session });
  } catch (err) { next(err); }
};

exports.closeSession = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (session.status === "closed") return res.status(400).json({ success: false, message: "Session already closed" });
    const now = new Date();
    await session.update({ status: "closed", end_time: now.toTimeString().slice(0, 8) });
    res.json({ success: true, data: session });
  } catch (err) { next(err); }
};

exports.getSessions = async (req, res, next) => {
  try {
    const { class_id, date, status } = req.query;
    const where = {};
    if (class_id) where.class_id = class_id;
    if (date) where.date = date;
    if (status) where.status = status;

    const classWhere = { is_active: true };
    if (req.user.role === "teacher") classWhere.teacher_id = req.user.id;

    const sessions = await AttendanceSession.findAll({
      where,
      include: [
        { model: Class, as: "class", where: classWhere, attributes: ["id", "name", "subject", "form"] },
        { model: User, as: "openedBy", attributes: ["id", "name"] },
      ],
      order: [["date", "DESC"], ["start_time", "DESC"]],
    });
    res.json({ success: true, data: sessions });
  } catch (err) { next(err); }
};

exports.getSessionDetail = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id, {
      include: [
        { model: Class, as: "class" },
        {
          model: AttendanceRecord, as: "records",
          include: [{ model: Student, as: "student", attributes: ["id", "name", "student_id"] }],
          order: [["marked_at", "ASC"]],
        },
      ],
    });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    res.json({ success: true, data: session });
  } catch (err) { next(err); }
};

exports.markAttendance = async (req, res, next) => {
  try {
    const { session_id, student_id, status, confidence, method, note } = req.body;
    if (!session_id || !student_id || !status)
      return res.status(400).json({ success: false, message: "session_id, student_id, status required" });

    const session = await AttendanceSession.findByPk(session_id);
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (session.status === "closed") return res.status(400).json({ success: false, message: "Session is closed" });

    const existing = await AttendanceRecord.findOne({ where: { session_id, student_id } });
    const now = new Date();

    if (existing) {
      await existing.update({ status, confidence, method: method || "manual", note, marked_at: now, marked_by: req.user.id });
      return res.json({ success: true, data: existing, updated: true });
    }

    const record = await AttendanceRecord.create({
      session_id, student_id, status, confidence,
      method: method || "face",
      note, marked_at: now, marked_by: req.user.id,
    });
    res.status(201).json({ success: true, data: record });
  } catch (err) { next(err); }
};

exports.bulkMark = async (req, res, next) => {
  try {
    const { session_id, records } = req.body;
    if (!session_id || !records) return res.status(400).json({ success: false, message: "session_id and records required" });
    const session = await AttendanceSession.findByPk(session_id);
    if (!session || session.status === "closed") return res.status(400).json({ success: false, message: "Session not found or closed" });

    let created = 0, updated = 0;
    for (const r of records) {
      const [rec, wasCreated] = await AttendanceRecord.findOrCreate({
        where: { session_id, student_id: r.student_id },
        defaults: { status: r.status || "absent", confidence: r.confidence, method: "manual", marked_at: new Date(), marked_by: req.user.id },
      });
      if (!wasCreated) { await rec.update({ status: r.status, confidence: r.confidence, marked_by: req.user.id, marked_at: new Date() }); updated++; }
      else created++;
    }
    res.json({ success: true, message: `${created} created, ${updated} updated` });
  } catch (err) { next(err); }
};

exports.getReport = async (req, res, next) => {
  try {
    const { class_id, from, to, student_id } = req.query;
    const sessionWhere = {};
    if (class_id) sessionWhere.class_id = class_id;
    if (from || to) {
      sessionWhere.date = {};
      if (from) sessionWhere.date[Op.gte] = from;
      if (to) sessionWhere.date[Op.lte] = to;
    }
    const recordWhere = {};
    if (student_id) recordWhere.student_id = student_id;

    const sessions = await AttendanceSession.findAll({
      where: sessionWhere,
      include: [
        { model: Class, as: "class", attributes: ["id", "name", "subject", "form"] },
        {
          model: AttendanceRecord, as: "records", where: Object.keys(recordWhere).length ? recordWhere : undefined, required: false,
          include: [{ model: Student, as: "student", attributes: ["id", "name", "student_id"] }],
        },
      ],
      order: [["date", "DESC"]],
    });

    const stats = { total_sessions: sessions.length, present: 0, late: 0, absent: 0, excused: 0 };
    sessions.forEach(s => s.records.forEach(r => { stats[r.status] = (stats[r.status] || 0) + 1; }));

    res.json({ success: true, data: sessions, stats });
  } catch (err) { next(err); }
};

exports.getTodayStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const classWhere = { is_active: true };
    if (req.user.role === "teacher") classWhere.teacher_id = req.user.id;

    const sessions = await AttendanceSession.findAll({
      where: { date: today },
      include: [
        { model: Class, as: "class", where: classWhere, attributes: ["id", "name", "subject", "form", "color"] },
        {
          model: AttendanceRecord, as: "records",
          include: [{ model: Student, as: "student", attributes: ["id", "name", "student_id"] }],
        },
      ],
    });

    const stats = { total_sessions: sessions.length, present: 0, late: 0, absent: 0, records: [] };
    sessions.forEach(s => {
      s.records.forEach(r => {
        stats[r.status] = (stats[r.status] || 0) + 1;
        stats.records.push({ ...r.toJSON(), class: s.class });
      });
    });

    res.json({ success: true, data: sessions, stats });
  } catch (err) { next(err); }
};
