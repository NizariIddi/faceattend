const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));
router.get('/', ctrl.getAllUsers);
router.post('/', ctrl.createUser);
router.put('/:id', ctrl.updateUser);
router.delete('/:id', ctrl.deleteUser);

module.exports = router;
