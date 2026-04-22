const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'teacher', 'student'), allowNull: false, defaultValue: 'student' },
  avatar: { type: DataTypes.STRING(255), defaultValue: null },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  last_login: { type: DataTypes.DATE, defaultValue: null },
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) user.password = await bcrypt.hash(user.password, 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) user.password = await bcrypt.hash(user.password, 12);
    },
  },
});

User.prototype.comparePassword = async function(plain) {
  return bcrypt.compare(plain, this.password);
};

User.prototype.toSafeObject = function() {
  const { password, ...safe } = this.toJSON();
  return safe;
};

module.exports = User;
