const router = require('express').Router();
const ctrl = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/today', authorize('admin', 'teacher'), ctrl.getTodayStats);
router.get('/report', authorize('admin', 'teacher'), ctrl.getReport);
router.get('/sessions', authorize('admin', 'teacher'), ctrl.getSessions);
router.get('/sessions/:id', authorize('admin', 'teacher'), ctrl.getSessionDetail);
router.post('/sessions', authorize('admin', 'teacher'), ctrl.openSession);
router.patch('/sessions/:id/close', authorize('admin', 'teacher'), ctrl.closeSession);
router.post('/mark', authorize('admin', 'teacher'), ctrl.markAttendance);
router.post('/bulk', authorize('admin', 'teacher'), ctrl.bulkMark);

module.exports = router;
