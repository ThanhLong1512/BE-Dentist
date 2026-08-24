const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const holdAppointmentBody = Joi.object({
  shift: objectId.required().messages({
    "any.required": "Please provide shift and Date"
  }),
  Date: Joi.alternatives()
    .try(Joi.date().iso(), Joi.string().isoDate(), Joi.string().min(8))
    .required()
    .messages({
      "any.required": "Please provide shift and Date"
    }),
  serviceId: objectId.optional().allow(null, ""),
  slotStart: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .optional()
    .allow(null, ""),
  slotEnd: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .optional()
    .allow(null, ""),
  account: objectId.optional()
});

const createAppointmentBody = Joi.object({
  shift: objectId.required(),
  Date: Joi.alternatives()
    .try(Joi.date().iso(), Joi.string().isoDate(), Joi.string().min(8))
    .required(),
  account: objectId.optional(),
  serviceId: objectId.optional(),
  slotStart: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .optional(),
  slotEnd: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .optional()
});

const updateStatusBody = Joi.object({
  status: Joi.string()
    .valid(
      "scheduled",
      "checked_in",
      "in_progress",
      "completed",
      "cancelled",
      "rescheduled"
    )
    .required()
    .messages({
      "any.required": "Please provide status"
    })
});

const rescheduleBody = Joi.object({
  Date: Joi.alternatives()
    .try(Joi.date().iso(), Joi.string().isoDate(), Joi.string().min(8))
    .optional(),
  shift: objectId.optional(),
  reason: Joi.string().allow("").optional()
}).or("Date", "shift")
  .messages({
    "object.missing": "Please provide Date and/or shift to reschedule"
  });

const periodParams = Joi.object({
  period: Joi.string()
    .valid("7", "30", "90")
    .required()
    .messages({
      "any.only": "Invalid period. Please use 7, 30, or 90 days"
    })
});

const reservationIdParams = Joi.object({
  reservationId: objectId.required()
});

const idParams = Joi.object({
  id: objectId.required()
});

module.exports = {
  holdAppointmentBody,
  createAppointmentBody,
  updateStatusBody,
  rescheduleBody,
  periodParams,
  reservationIdParams,
  idParams
};
