const mongoose = require("mongoose");
const validator = require("validator");

const patientSchema = mongoose.Schema({
  name: {
    type: String,
    require: [true, "Please tell us your name"]
  },
  gender: {
    type: Boolean,
    require: [true, "Please tell us your gender"]
  },
  yearOfBirth: {
    type: Number,
    require: [true, "Please provide a year of birth "],
    validate: {
      validator: function(value) {
        const currentYear = new Date().getFullYear();
        return value >= 1900 || value <= currentYear;
      },
      message: "Please provide a valid year of birth"
    }
  },
  phoneNumber: {
    type: String,
    require: [true, "Please provide a phone number"],
    validate: {
      validator: function(value) {
        return validator.isMobilePhone(value, "any");
      },
      message: "Please provide a valid phone number"
    }
  },
  address: {
    type: String,
    required: [true, "Please provide your address"]
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: [true, "Please provide an account"]
  }
});
const Patient = mongoose.model("Patient", patientSchema);
module.exports = Patient;
