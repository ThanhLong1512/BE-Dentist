const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const slotsQuery = Joi.object({
  date: Joi.alternatives()
    .try(Joi.date().iso(), Joi.string().min(8))
    .required()
    .messages({
      "any.required": "Please provide query param: date"
    }),
  serviceId: objectId.required().messages({
    "any.required": "Please provide query param: serviceId"
  }),
  employeeId: objectId.optional()
});

module.exports = {
  slotsQuery
};
