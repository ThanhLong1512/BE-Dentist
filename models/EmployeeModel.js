const mongoose = require("mongoose");
const validator = require("validator");

const employeeSchema = mongoose.Schema({
  name: {
    type: String,
    require: [true, "Please tell us your name"]
  },
  phoneNumber: {
    type: String,
    require: [true, "Please provide the phone number"],
    validate: {
      validator: function(value) {
        return /^\d{10}$/.test(value);
      },
      message: props => `${props.value} is not a valid phone number`
    }
  },
  gender: {
    type: Boolean,
    required: [true, "Please provide the gender"]
  },
  email: {
    type: String,
    require: [true, "Please provide your email"],
    unique: true,
    validate: [validator.isEmail, "Please provide a valid email"]
  },
  experience: {
    type: String,
    required: [true, "Please provide the experience"]
  },
  photo: {
    type: String,
    default: "default.jpg"
  },
  description: {
    type: String,
    required: [true, "Please provide the description"]
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: [true, "Please provide the service ID"]
  }
});
const Employee = mongoose.model("Employee", employeeSchema);
module.exports = Employee;
