const Service = require("../models/ServicesModel");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const fs = require("fs");
const catalogService = require("../services/catalogService");

exports.getAllServices = factory.getAll(Service);
exports.getService = factory.getOne(Service);

exports.createService = catchAsync(async (req, res) => {
  try {
    const service = await catalogService.createService({
      body: req.body,
      file: req.file
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service
    });
  } catch (error) {
    console.error("Create service error:", error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to create service"
    });
  }
});

exports.updateService = catchAsync(async (req, res) => {
  try {
    const { service, changed } = await catalogService.updateService({
      id: req.params.id,
      body: req.body,
      file: req.file
    });

    return res.status(200).json({
      success: true,
      message: changed ? "Service updated successfully" : "No changes detected",
      data: service
    });
  } catch (error) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("Update service error:", error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to update service"
    });
  }
});

exports.deleteService = catchAsync(async (req, res) => {
  try {
    await catalogService.deleteServiceById(req.params.id);

    res.status(200).json({
      success: true,
      message: "Service deleted successfully"
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
});

exports.duplicateService = catchAsync(async (req, res) => {
  try {
    const duplicatedService = await catalogService.duplicateServiceById(
      req.params.id
    );

    res.status(201).json({
      message: "success",
      data: {
        data: duplicatedService
      }
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
});
