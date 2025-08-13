const Employee = require("./../models/EmployeeModel");
const factory = require("./handlerFactory");

exports.setServiceID = (req, res, next) => {
  if (!req.body.service) req.body.service = req.params.serviceId;
  next();
};

exports.getAllEmployees = factory.getAll(Employee);
exports.getEmployee = factory.getOne(Employee);
exports.createEmployee = factory.createOne(Employee);
exports.updateEmployee = factory.updateOne(Employee);
exports.deleteEmployee = factory.deleteOne(Employee);

exports.duplicateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const originalEmployee = await Employee.findById(id);
    if (!originalEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const duplicatedEmployee = await Employee.create({
      name: `Copy of ${originalEmployee.name}`,
      phoneNumber: originalEmployee.phoneNumber,
      gender: originalEmployee.gender,
      experience: originalEmployee.experience,
      service: originalEmployee.service,
      description: originalEmployee.description,
      photo: originalEmployee.photo
    });

    res.status(201).json({
      message: "success",
      data: {
        data: duplicatedEmployee
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
