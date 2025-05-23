const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Account = require("./../models/AccountModel");
const Employee = require("./../models/EmployeeModel");
const Patient = require("./../models/PatientModel");
const Shift = require("./../models/ShiftModel");
const Appointment = require("./../models/AppointmentModel");
const Service = require("./../models/ServicesModel");
const TwoFA = require("./../models/TwoFAModel");
const AccountSession = require("./../models/AccountsSessionModel");
const Order = require("./../models/OrderModel");
const Review = require("../models/ReviewModel");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => console.log("DB connection successful!"));

// READ JSON FILE
const accounts = JSON.parse(
  fs.readFileSync(`${__dirname}/accounts.json`, "utf-8")
);
const employees = JSON.parse(
  fs.readFileSync(`${__dirname}/employees.json`, "utf-8")
);
const services = JSON.parse(
  fs.readFileSync(`${__dirname}/services.json`, "utf-8")
);
const patients = JSON.parse(
  fs.readFileSync(`${__dirname}/patients.json`, "utf-8")
);
const shifts = JSON.parse(fs.readFileSync(`${__dirname}/shifts.json`, "utf-8"));
const appointments = JSON.parse(
  fs.readFileSync(`${__dirname}/appointments.json`, "utf-8")
);
const twoFa = JSON.parse(fs.readFileSync(`${__dirname}/two-fa.json`, "utf-8"));

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Account.create();
    await Patient.create(patients);
    await Employee.create(employees);
    await Service.create(services);
    await Shift.create(shifts);
    await Appointment.create(appointments);
    await TwoFA.create();
    await AccountSession.create();
    await Order.create();
    await Review.create();
    console.log("Data successfully loaded!");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Account.deleteMany();
    await Employee.deleteMany();
    await Patient.deleteMany();
    await Appointment.deleteMany();
    await Service.deleteMany();
    await Shift.deleteMany();
    await TwoFA.deleteMany();
    await AccountSession.deleteMany();
    await Order.deleteMany();
    await Review.deleteMany();
    console.log("Data successfully deleted!");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
