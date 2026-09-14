const Setting = require("../models/SettingModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getSettings = catchAsync(async (req, res, next) => {
  let settings = await Setting.findOne();

  if (!settings) {
    settings = await Setting.create({});
  }

  res.status(200).json({
    status: "success",
    data: {
      data: settings
    }
  });
});

exports.updateSettings = catchAsync(async (req, res, next) => {
  let settings = await Setting.findOne();

  if (!settings) {
    settings = await Setting.create(req.body);
  } else {
    settings = await Setting.findByIdAndUpdate(settings._id, req.body, {
      new: true,
      runValidators: true
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      data: settings
    }
  });
});

exports.resetSettings = catchAsync(async (req, res, next) => {
  await Setting.deleteMany({});
  const defaultSettings = await Setting.create({});

  res.status(200).json({
    status: "success",
    message: "Settings reset to default values",
    data: {
      data: defaultSettings
    }
  });
});
