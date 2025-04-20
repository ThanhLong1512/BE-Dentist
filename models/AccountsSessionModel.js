const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AccountSessionSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "User ID is required"]
    },
    device_id: {
      type: String,
      required: true
    },
    is_2fa_verified: {
      type: Boolean,
      default: false
    },
    last_login: {
      type: String,
      default: "not-set"
    }
  },
  {
    toJSON: {
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model("AccountSession", AccountSessionSchema);
