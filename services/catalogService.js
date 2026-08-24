const Service = require("../models/ServicesModel");
const cloudinary = require("../providers/CloudinaryProvider");
const fs = require("fs");
const AppError = require("../utils/appError");
const { indexService, deleteService } = require("../search/indexer");

const uploadServicePhoto = async file => {
  if (!file) {
    throw new AppError("Please provide a service photo", 400);
  }

  if (file.buffer) {
    return cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
      {
        folder: "dental-services",
        width: 600,
        height: 400,
        crop: "fill",
        quality: "auto",
        fetch_format: "auto"
      }
    );
  }

  if (file.path) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "dental-services",
      width: 600,
      height: 400,
      crop: "fill",
      quality: "auto",
      fetch_format: "auto"
    });
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return result;
  }

  throw new AppError("Invalid file format", 400);
};

const createService = async ({ body, file }) => {
  const {
    nameService,
    Unit,
    priceService,
    description,
    summary,
    priceDiscount,
    durationMinutes,
    bufferMinutes
  } = body;

  const result = await uploadServicePhoto(file);

  const service = await Service.create({
    nameService,
    Unit,
    priceService: Number(priceService),
    priceDiscount: priceDiscount ? Number(priceDiscount) : undefined,
    description,
    summary,
    durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
    bufferMinutes: bufferMinutes !== undefined && bufferMinutes !== ""
      ? Number(bufferMinutes)
      : undefined,
    photoService: {
      public_id: result.public_id,
      url: result.secure_url
    }
  });

  await indexService(service._id);
  return service;
};

const updateService = async ({ id, body, file }) => {
  const existingService = await Service.findById(id);
  if (!existingService) {
    throw new AppError("Service not found", 404);
  }

  const {
    nameService,
    Unit,
    priceService,
    priceDiscount,
    summary,
    description,
    durationMinutes,
    bufferMinutes
  } = body;

  const updateData = {};

  if (nameService !== undefined) updateData.nameService = nameService;
  if (Unit !== undefined) updateData.Unit = Unit;
  if (summary !== undefined) updateData.summary = summary;
  if (description !== undefined) updateData.description = description;
  if (priceService !== undefined) {
    updateData.priceService = Number(priceService);
  }
  if (priceDiscount !== undefined && priceDiscount !== "") {
    updateData.priceDiscount = Number(priceDiscount);
  }
  if (durationMinutes !== undefined) {
    updateData.durationMinutes = Number(durationMinutes);
  }
  if (bufferMinutes !== undefined && bufferMinutes !== "") {
    updateData.bufferMinutes = Number(bufferMinutes);
  }

  if (file) {
    if (existingService.photoService?.public_id) {
      try {
        await cloudinary.uploader.destroy(
          existingService.photoService.public_id
        );
      } catch (cloudinaryError) {
        console.warn(
          "Failed to delete old image from Cloudinary:",
          cloudinaryError
        );
      }
    }

    const result = await uploadServicePhoto(file);
    updateData.photoService = {
      public_id: result.public_id,
      url: result.secure_url
    };
  }

  if (Object.keys(updateData).length === 0) {
    return { service: existingService, changed: false };
  }

  const updatedService = await Service.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  await indexService(updatedService._id);
  return { service: updatedService, changed: true };
};

const deleteServiceById = async id => {
  const service = await Service.findById(id);
  if (!service) {
    throw new AppError("Service not found", 404);
  }

  if (service.photoService?.public_id) {
    await cloudinary.uploader.destroy(service.photoService.public_id);
  }

  await Service.deleteOne({ _id: id });
  await deleteService(service._id);
  return true;
};

const duplicateServiceById = async id => {
  const originalService = await Service.findById(id);
  if (!originalService) {
    throw new AppError("Service not found", 404);
  }

  const duplicatedService = await Service.create({
    nameService: `Copy of ${originalService.nameService}`,
    Unit: originalService.Unit,
    priceService: originalService.priceService,
    priceDiscount: originalService.priceDiscount,
    description: originalService.description,
    summary: originalService.summary,
    durationMinutes: originalService.durationMinutes,
    bufferMinutes: originalService.bufferMinutes,
    photoService: originalService.photoService
  });

  await indexService(duplicatedService._id);
  return duplicatedService;
};

module.exports = {
  createService,
  updateService,
  deleteServiceById,
  duplicateServiceById
};
