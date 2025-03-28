const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const accountSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, "Please tell us your name"]
  },
  email: {
    type: String,
    require: [true, "Please provide your email"],
    unique: true,
    validate: [validator.isEmail, "Please provide a valid email"]
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user"
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function(el) {
        return el === this.password;
      },
      message: "Passwords are not the same!"
    }
  },
  isLocked: {
    type: Boolean,
    default: true,
    select: false
  }
});

// // Middleware hash mật khẩu trước khi lưu
// accountSchema.pre("save", async function(next) {
//   // Chỉ chạy khi mật khẩu được thay đổi
//   if (!this.isModified("password")) return next();

//   // Hash mật khẩu với cost của 12
//   this.password = await bcrypt.hash(this.password, 12);

//   // Xóa trường passwordConfirm
//   this.passwordConfirm = undefined;
//   next();
// });

// // Middleware lọc các tài khoản không hoạt động
// accountSchema.pre(/^find/, function(next) {
//   // this trỏ đến truy vấn hiện tại
//   this.find({ isLocked: { $ne: true } });
//   next();
// });

// // Phương thức kiểm tra mật khẩu
// accountSchema.methods.correctPassword = async function(
//   candidatePassword,
//   userPassword
// ) {
//   return await bcrypt.compare(candidatePassword, userPassword);
// };

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
