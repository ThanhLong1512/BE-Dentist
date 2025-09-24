const Patient = require("./../models/PatientModel");
const factory = require("./handlerFactory");

exports.setAccountId = (req, res, next) => {
  if (!req.body.account) req.body.account = req.user.id;
  next();
};

exports.getAllPatients = factory.getAll(Patient);
exports.getPatient = factory.getOne(Patient);
exports.createPatient = factory.createOne(Patient);
exports.updatePatient = factory.updateOne(Patient);
exports.deletePatient = factory.deleteOne(Patient);
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
