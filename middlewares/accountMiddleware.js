const bcrypt = require("bcryptjs");
const Account = require("../models/AccountModel");

// Middleware hash mật khẩu trước khi lưu
const hashPasswordMiddleware = async function(next) {
  // Chỉ chạy khi mật khẩu được thay đổi
  if (!this.isModified("password")) return next();

  // Hash mật khẩu với cost của 12
  this.password = await bcrypt.hash(this.password, 12);

  // Xóa trường passwordConfirm
  this.passwordConfirm = undefined;
  next();
};

// Middleware lọc các tài khoản không hoạt động
const filterActiveAccountsMiddleware = function(next) {
  // this trỏ đến truy vấn hiện tại
  this.find({ isLocked: { $ne: true } });
  next();
};

// Phương thức kiểm tra mật khẩu
const correctPasswordMethod = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Áp dụng middleware
Account.schema.pre("save", hashPasswordMiddleware);
Account.schema.pre(/^find/, filterActiveAccountsMiddleware);
Account.schema.methods.correctPassword = correctPasswordMethod;

module.exports = {
  hashPasswordMiddleware,
  filterActiveAccountsMiddleware,
  correctPasswordMethod
};
