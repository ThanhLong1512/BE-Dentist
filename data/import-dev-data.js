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
const Conservation = require("../models/ConservationModel");
const Message = require("../models/MessageModel");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD || ""
);

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
const Facility = require("./../models/FacilityModel");
let facilities = [];
try {
  facilities = JSON.parse(fs.readFileSync(`${__dirname}/facilities.json`, "utf-8"));
} catch (e) {}

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    if (accounts?.length) await Account.insertMany(accounts);
    if (patients?.length) await Patient.insertMany(patients);
    if (employees?.length) await Employee.insertMany(employees);
    if (services?.length) await Service.insertMany(services);
    if (shifts?.length) await Shift.insertMany(shifts);
    if (appointments?.length) await Appointment.insertMany(appointments);
    if (twoFa?.length) await TwoFA.insertMany(twoFa);
    if (facilities?.length) await Facility.insertMany(facilities);
    console.log("Data successfully loaded!");
  } catch (err) {
    console.log("Import error:", err.message || err);
  }
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
};

const main = async () => {
  try {
    await mongoose.connect(DB);
    console.log("DB connection successful!");

    if (process.argv[2] === "--import") {
      await importData();
    } else if (process.argv[2] === "--delete") {
      await deleteData();
    }
  } catch (err) {
    console.error("DB connection or runner error:", err);
  } finally {
    process.exit();
  }
};

main();
