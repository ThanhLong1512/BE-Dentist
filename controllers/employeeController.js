const { StatusCodes } = require("http-status-codes");
const ms = require("ms");
const JwtProvider = require("./../providers/JwtProvider");
const CatchAsync = require("./../utils/catchAsync");
const AppError = require("../utils/appError");
const Account = require("../models/AccountModel");

const getEmployee = CatchAsync(async (req, res) => {
  res.status(StatusCodes.OK).json({ message: "Test middleware auth" });
});
const employeeController = { getEmployee };
module.exports = employeeController;
