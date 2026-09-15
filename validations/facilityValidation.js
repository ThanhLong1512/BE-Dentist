const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const createFacilityBody = Joi.object({
  name: Joi.string().trim().min(2).required(),
  code: Joi.string().trim().min(2).max(20).uppercase().required(),
  address: Joi.string().trim().min(3).required(),
  city: Joi.string().trim().min(2).required(),
  phoneNumber: Joi.string().trim().min(8).max(20).required(),
  email: Joi.string().email().allow("", null).optional(),
  workingHours: Joi.string().trim().allow("", null).optional(),
  chairCount: Joi.number().integer().min(1).optional(),
  managerName: Joi.string().trim().allow("", null).optional(),
  status: Joi.string().valid("active", "maintenance", "inactive").optional(),
  image: Joi.string().allow("", null).optional(),
  description: Joi.string().allow("", null).optional(),
  latitude: Joi.number().allow(null).optional(),
  longitude: Joi.number().allow(null).optional()
});

const updateFacilityBody = Joi.object({
  name: Joi.string().trim().min(2).optional(),
  code: Joi.string().trim().min(2).max(20).uppercase().optional(),
  address: Joi.string().trim().min(3).optional(),
  city: Joi.string().trim().min(2).optional(),
  phoneNumber: Joi.string().trim().min(8).max(20).optional(),
  email: Joi.string().email().allow("", null).optional(),
  workingHours: Joi.string().trim().allow("", null).optional(),
  chairCount: Joi.number().integer().min(1).optional(),
  managerName: Joi.string().trim().allow("", null).optional(),
  status: Joi.string().valid("active", "maintenance", "inactive").optional(),
  image: Joi.string().allow("", null).optional(),
  description: Joi.string().allow("", null).optional(),
  latitude: Joi.number().allow(null).optional(),
  longitude: Joi.number().allow(null).optional()
}).min(1);

const idParams = Joi.object({
  id: objectId.required()
});

module.exports = {
  createFacilityBody,
  updateFacilityBody,
  idParams
};
