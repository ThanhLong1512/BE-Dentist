const Patient = require("./../models/PatientModel");
const factory = require("./handlerFactory");
// const catchAsync = require('./../utils/catchAsync');

exports.setAccountId = (req, res, next) => {
  if (!req.body.account) req.body.account = req.user.id;
  next();
};

exports.getAllPatients = factory.getAll(Patient);
exports.getPatient = factory.getOne(Patient);
exports.createPatient = factory.createOne(Patient);
exports.updatePatient = factory.updateOne(Patient);
exports.deletePatient = factory.deleteOne(Patient);
