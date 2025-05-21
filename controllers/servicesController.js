const Service = require("../models/ServicesModel");
const cloudinary = require("../providers/CloudinaryProvider");
const factory = require("./handlerFactory");

exports.getAllServices = factory.getAll(Service);
exports.getService = factory.getOne(Service);

exports.createService = async (req, res) => {
  try {
    const { nameService, Unit, priceService, description } = req.body;

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "dental-services",
      width: 600,
      crop: "scale"
    });

    const service = await Service.create({
      nameService,
      Unit,
      priceService,
      description,
      photoService: {
        public_id: result.public_id,
        url: result.secure_url
      }
    });

    res.status(201).json({
      success: true,
      service
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    if (req.file) {
      await cloudinary.uploader.destroy(service.photoService.public_id);
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "dental-services",
        width: 600,
        crop: "scale"
      });

      req.body.photoService = {
        public_id: result.public_id,
        url: result.secure_url
      };
    }

    service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      service
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
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
