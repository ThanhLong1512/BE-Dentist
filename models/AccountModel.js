const mongoose = require("mongoose");
const validator = require("validator");

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
const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
