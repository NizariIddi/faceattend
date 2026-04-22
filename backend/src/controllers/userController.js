const { User } = require('../models');
const { Op } = require('sequelize');

// Admin only
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
    const users = await User.findAll({ where, attributes: { exclude: ['password'] }, order: [['name', 'ASC']] });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ success: false, message: 'name, email, password, role required' });
    const exists = await User.findOne({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(409).json({ success: false, message: 'Email already in use' });
    const user = await User.create({ name, email: email.toLowerCase(), password, role });
    res.status(201).json({ success: true, data: user.toSafeObject() });
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { name, email, role, is_active } = req.body;
    await user.update({ name, email, role, is_active });
    res.json({ success: true, data: user.toSafeObject() });
  } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.id === req.user.id) return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    await user.destroy();
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { next(err); }
};
