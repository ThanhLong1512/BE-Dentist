const mongoose = require("mongoose");

const conservationSchema = new mongoose.Schema(
  {
    member: {
      type: Array
    }
  },
  { timestamps: true }
);

const Conservation = mongoose.model("Conservation", conservationSchema);
module.exports = Conservation;
