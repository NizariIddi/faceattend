const router = require('express').Router();
const ctrl = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Face descriptors endpoint — teacher + admin
router.get('/descriptors', authorize('admin', 'teacher'), ctrl.getEnrolledDescriptors);

// CRUD — admin + teacher
router.get('/', authorize('admin', 'teacher'), ctrl.getAllStudents);
router.get('/:id', authorize('admin', 'teacher'), ctrl.getStudent);
router.post('/', authorize('admin', 'teacher'), ctrl.createStudent);
router.put('/:id', authorize('admin', 'teacher'), ctrl.updateStudent);
router.delete('/:id', authorize('admin'), ctrl.deleteStudent);

// Face enrollment — admin + teacher
router.post('/:id/face', authorize('admin', 'teacher'), ctrl.enrollFace);
router.delete('/:id/face', authorize('admin'), ctrl.removeFace);

module.exports = router;
