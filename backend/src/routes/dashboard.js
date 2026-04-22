const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/admin', authorize('admin'), ctrl.getAdminStats);
router.get('/teacher', authorize('teacher', 'admin'), ctrl.getTeacherStats);
router.get('/student', authorize('student'), ctrl.getStudentStats);

module.exports = router;
