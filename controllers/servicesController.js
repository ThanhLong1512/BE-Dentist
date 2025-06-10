const Service = require("../models/ServicesModel");
const cloudinary = require("../providers/CloudinaryProvider");
const factory = require("./handlerFactory");
const fs = require("fs");

exports.getAllServices = factory.getAll(Service);
exports.getService = factory.getOne(Service);

exports.createService = async (req, res) => {
  try {
    const {
      nameService,
      Unit,
      priceService,
      description,
      summary,
      priceDiscount
    } = req.body;
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please provide a service photo"
      });
    }

    let result;

    if (req.file.buffer) {
      result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString(
          "base64"
        )}`,
        {
          folder: "dental-services",
          width: 600,
          height: 400,
          crop: "fill",
          quality: "auto",
          fetch_format: "auto"
        }
      );
    } else {
      throw new Error("Invalid file format");
    }
    const service = await Service.create({
      nameService,
      Unit,
      priceService: Number(priceService),
      priceDiscount: priceDiscount ? Number(priceDiscount) : undefined,
      description,
      summary,
      photoService: {
        public_id: result.public_id,
        url: result.secure_url
      }
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service
    });
  } catch (error) {
    console.error("Create service error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create service"
    });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nameService,
      Unit,
      priceService,
      priceDiscount,
      summary,
      description
    } = req.body;

    const existingService = await Service.findById(id);
    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    // Chỉ thêm các trường được cung cấp vào object update
    const updateData = {};

    if (nameService !== undefined) updateData.nameService = nameService;
    if (Unit !== undefined) updateData.Unit = Unit;
    if (summary !== undefined) updateData.summary = summary;
    if (description !== undefined) updateData.description = description;

    // Xử lý các trường giá cả riêng biệt
    if (priceService !== undefined) {
      updateData.priceService = Number(priceService);
    }
    if (priceDiscount !== undefined) {
      updateData.priceDiscount = Number(priceDiscount);
    }

    // Xử lý ảnh upload
    if (req.file) {
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

      let result;
      if (req.file.buffer) {
        result = await cloudinary.uploader.upload(
          `data:${req.file.mimetype};base64,${req.file.buffer.toString(
            "base64"
          )}`,
          {
            folder: "dental-services",
            width: 600,
            height: 400,
            crop: "fill",
            quality: "auto",
            fetch_format: "auto"
          }
        );
      } else if (req.file.path) {
        result = await cloudinary.uploader.upload(req.file.path, {
          folder: "dental-services",
          width: 600,
          height: 400,
          crop: "fill",
          quality: "auto",
          fetch_format: "auto"
        });
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } else {
        throw new Error("Invalid file format");
      }

      updateData.photoService = {
        public_id: result.public_id,
        url: result.secure_url
      };
    }

    // Chỉ update nếu có trường nào thay đổi
    if (Object.keys(updateData).length > 0) {
      const updatedService = await Service.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });

      return res.status(200).json({
        success: true,
        message: "Service updated successfully",
        data: updatedService
      });
    }

    // Nếu không có trường nào thay đổi
    return res.status(200).json({
      success: true,
      message: "No changes detected",
      data: existingService
    });
  } catch (error) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("Update service error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update service"
    });
  }
};
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    await cloudinary.uploader.destroy(service.photoService.public_id);

    await Service.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: "Service deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.duplicateService = async (req, res) => {
  try {
    const { id } = req.params;

    const originalService = await Service.findById(id);
    if (!originalService) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    const duplicatedService = await Service.create({
      nameService: `Copy of ${originalService.nameService}`,
      Unit: originalService.Unit,
      priceService: originalService.priceService,
      priceDiscount: originalService.priceDiscount,
      description: originalService.description,
      photoService: originalService.photoService
    });

    res.status(201).json({
      message: "success",
      data: {
        data: duplicatedService
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
