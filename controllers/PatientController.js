const Patient = require("./../models/PatientModel");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const {
  indexPatient,
  deletePatient,
} = require("../search/indexer");

exports.setAccountId = (req, res, next) => {
  if (!req.body.account) req.body.account = req.user.id;
  next();
};

exports.getAllPatients = factory.getAll(Patient);
exports.getPatient = factory.getOne(Patient);
exports.createPatient = catchAsync(async (req, res) => {
  const doc = await Patient.create(req.body);
  await indexPatient(doc._id);
  res.status(201).json({
    status: "success",
    data: { data: doc },
  });
});

exports.updatePatient = catchAsync(async (req, res) => {
  const doc = await Patient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) {
    return res.status(404).json({
      status: "fail",
      message: "No document found with that ID",
    });
  }
  await indexPatient(doc._id);
  res.status(200).json({
    status: "success",
    data: { data: doc },
  });
});

exports.deletePatient = catchAsync(async (req, res, next) => {
  const doc = await Patient.findByIdAndDelete(req.params.id);
  if (!doc) {
    return next(new AppError("No document found with that ID", 404));
  }
  await deletePatient(doc._id);
  res.status(204).json({
    status: "success",
    data: null,
  });
});
exports.duplicatePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const originalPatient = await Patient.findById(id);
    if (!originalPatient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    const duplicatedPatient = await Patient.create({
      name: `Copy of ${originalPatient.name}`,
      gender: originalPatient.gender,
      yearOfBirth: originalPatient.yearOfBirth,
      phoneNumber: originalPatient.phoneNumber,
      address: originalPatient.address
    });

    await indexPatient(duplicatedPatient._id);

    res.status(201).json({
      message: "success",
      data: {
        data: duplicatedPatient
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
