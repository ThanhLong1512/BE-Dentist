const mongoose = require("mongoose");
const validator = require("validator");

const TwoFASchema = new mongoose.Schema(
  {
    secret: {
      type: String,
      required: [true, "Please provide a secret for 2FA"]
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "User ID is required"]
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

const TwoFA = mongoose.model("TwoFA", TwoFASchema);
module.exports = TwoFA;
