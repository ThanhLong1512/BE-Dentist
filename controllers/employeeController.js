const Employee = require("../models/EmployeeModel");
const service = require("../models/ServicesModel");

exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().populate("service");
    if (!employees || employees.length === 0)
      return res.status(404).json({ message: "No employees found" });

    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();

    const populatedEmployee = await Employee.findById(employee._id).populate(
      "service"
    );

    res.status(201).json(populatedEmployee); // Trả về employee đã có service
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate("service");
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });
    await employee.save();
    const populatedEmployee = await Employee.findById(req.params.id).populate(
      "service"
    );
    res.json(populatedEmployee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
