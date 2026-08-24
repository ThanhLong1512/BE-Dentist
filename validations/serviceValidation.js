const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const createServiceBody = Joi.object({
  nameService: Joi.string().trim().min(1).required(),
  Unit: Joi.string().trim().min(1).required(),
  priceService: Joi.number().min(0).required(),
  description: Joi.string().allow("").optional(),
  summary: Joi.string().trim().min(1).required(),
  priceDiscount: Joi.number().min(0).optional().allow(null, ""),
  durationMinutes: Joi.number().integer().min(15).optional(),
  bufferMinutes: Joi.number().integer().min(0).optional()
});

// Allow empty body (e.g. photo-only update via multer).
const updateServiceBody = Joi.object({
  nameService: Joi.string().trim().min(1).optional(),
  Unit: Joi.string().trim().min(1).optional(),
  priceService: Joi.number().min(0).optional(),
  description: Joi.string().allow("").optional(),
  summary: Joi.string().trim().min(1).optional(),
  priceDiscount: Joi.number().min(0).optional().allow(null, ""),
  durationMinutes: Joi.number().integer().min(15).optional(),
  bufferMinutes: Joi.number().integer().min(0).optional()
});

const idParams = Joi.object({
  id: objectId.required()
});

module.exports = {
  createServiceBody,
  updateServiceBody,
  idParams
};
