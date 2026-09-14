const mongoose = require("mongoose");

const conservationSchema = new mongoose.Schema(
  {
    member: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account"
      }
    ]
  },
  { timestamps: true }
);

const Conservation = mongoose.model("Conservation", conservationSchema);
module.exports = Conservation;
