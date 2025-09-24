const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conservationID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conservation",
      required: [true, "Conservation ID is required"]
    },
    senderID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Sender ID is required"]
    },
    content: {
      type: String,
      required: [true, "Message content is required"]
    }
  },
  { timestamps: true }
);
const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
