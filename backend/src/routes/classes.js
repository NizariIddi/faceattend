const router = require('express').Router();
const ctrl = require('../controllers/classController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', authorize('admin', 'teacher'), ctrl.getAllClasses);
router.get('/:id', authorize('admin', 'teacher'), ctrl.getClass);
router.post('/', authorize('admin', 'teacher'), ctrl.createClass);
router.put('/:id', authorize('admin', 'teacher'), ctrl.updateClass);
router.delete('/:id', authorize('admin'), ctrl.deleteClass);
router.post('/:id/students', authorize('admin', 'teacher'), ctrl.enrollStudents);
router.delete('/:id/students/:studentId', authorize('admin', 'teacher'), ctrl.removeStudent);

module.exports = router;
