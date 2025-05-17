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
