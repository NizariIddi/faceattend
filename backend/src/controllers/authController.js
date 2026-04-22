const jwt = require('jsonwebtoken');
const { User } = require('../models');

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user || !user.is_active)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    user.last_login = new Date();
    await user.save();

    const token = signToken(user);
    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (err) { next(err); }
};

exports.me = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
};

exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const valid = await req.user.comparePassword(current_password);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    req.user.password = new_password;
    await req.user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err) { next(err); }
};
