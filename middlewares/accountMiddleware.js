const bcrypt = require("bcryptjs");

async function hashPassword(next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
}

function filterLockedAccounts(next) {
  this.find({ isLocked: { $ne: true } });
  next();
}

async function correctPassword(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
}

module.exports = {
  hashPassword,
  filterLockedAccounts,
  correctPassword
};
