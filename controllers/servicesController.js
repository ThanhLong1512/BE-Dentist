const Service = require("../models/ServicesModel");
const cloudinary = require('../providers/CloudinaryProvider');

exports.getServices = async (req, res) => {
  try {
    const Services = await Service.find();
    if (!Services || Services.length === 0)
      return res.status(404).json({ message: "No Services found" });

    res.json(Services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createService = async (req, res) => {
  try {
    const { nameService, Unit, priceService, description } = req.body;
    
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'dental-services',
      width: 600,
      crop: "scale"
    });

    // Create new service
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

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Update image if new image is uploaded
    if (req.file) {
      // Delete old image
      await cloudinary.uploader.destroy(service.photoService.public_id);
      
      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'dental-services',
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
        message: 'Service not found'
      });
    }

    // Delete image from cloudinary
    await cloudinary.uploader.destroy(service.photoService.public_id);
    
    // Delete service from database
    await service.remove();

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
