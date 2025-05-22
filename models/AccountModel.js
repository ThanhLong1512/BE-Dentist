const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const accountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please tell us your name"]
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
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
        validator: function(el) {
          return el === this.password;
        },
        message: "Passwords are not the same!"
      },
      select: false
    },
    photo: {
      type: String,
      default:
        "https://res.cloudinary.com/dzjc0p4hx/image/upload/v1747498070/user_tqd94a.jpg"
    },
    photoPublicId: {
      type: String,
      select: false,
      default: "user_tqd94a"
    },
    isLocked: {
      type: Boolean,
      default: false
    },
    require_2FA: {
      type: Boolean,
      default: false
    },
    googleID: {
      type: String,
      unique: true,
      sparse: true
    },
    facebookID: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  {
    toJSON: {
      transform: function(doc, ret) {
        delete ret.__v;
        delete ret.password;
        delete ret.passwordConfirm;
        return ret;
      }
    }
  }
);

// QUAN TRỌNG: Định nghĩa middleware trực tiếp trong schema
accountSchema.pre("save", async function(next) {
  // Chỉ hash nếu password field được modified
  if (!this.isModified("password")) return next();

  try {
    // Hash password với bcrypt salt rounds = 12
    this.password = await bcrypt.hash(this.password, 12);

    // Xóa passwordConfirm field trước khi lưu
    this.passwordConfirm = undefined;

    console.log("Password hashed successfully"); // Debug log
    next();
  } catch (error) {
    console.error("Error hashing password:", error);
    next(error);
  }
});

// Middleware lọc các tài khoản không hoạt động
accountSchema.pre(/^find/, function(next) {
  this.find({ isLocked: { $ne: true } });
  next();
});

// Instance method để kiểm tra mật khẩu
accountSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Method để kiểm tra mật khẩu hiện tại (sử dụng password của chính document này)
accountSchema.methods.checkCurrentPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
