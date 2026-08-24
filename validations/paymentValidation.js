const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const appointmentPaymentBody = Joi.object({
  reservationId: objectId.required().messages({
    "any.required":
      "reservationId is required to complete appointment booking"
  }),
  totalPrice: Joi.number().min(0).required(),
  service: Joi.alternatives()
    .try(Joi.array().items(objectId).min(1), objectId)
    .required()
});

/** COD supports appointment hold OR legacy shop cart order. */
const codPaymentBody = Joi.object({
  reservationId: objectId.optional(),
  totalPrice: Joi.number().min(0).required(),
  service: Joi.alternatives()
    .try(Joi.array().items(objectId).min(1), objectId)
    .required()
});

module.exports = {
  appointmentPaymentBody,
  codPaymentBody
};
