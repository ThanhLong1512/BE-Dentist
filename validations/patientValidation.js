const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const createPatientBody = Joi.object({
  name: Joi.string().trim().min(1).required(),
  gender: Joi.boolean().required(),
  yearOfBirth: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
  phoneNumber: Joi.string().trim().min(8).required(),
  address: Joi.string().trim().min(1).required(),
  account: objectId.optional()
});

const updatePatientBody = Joi.object({
  name: Joi.string().trim().min(1).optional(),
  gender: Joi.boolean().optional(),
  yearOfBirth: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),
  phoneNumber: Joi.string().trim().min(8).optional(),
  address: Joi.string().trim().min(1).optional(),
  account: objectId.optional()
}).min(1);

const idParams = Joi.object({
  id: objectId.required()
});

module.exports = {
  createPatientBody,
  updatePatientBody,
  idParams
};
