const Joi = require("joi");

const updateSettingBody = Joi.object({
  clinicName: Joi.string().trim().min(2).optional(),
  slogan: Joi.string().trim().allow("", null).optional(),
  hotline: Joi.string().trim().min(4).optional(),
  supportEmail: Joi.string().email().allow("", null).optional(),
  headquarterAddress: Joi.string().trim().min(5).optional(),
  licenseNumber: Joi.string().trim().allow("", null).optional(),
  openHours: Joi.string().trim().allow("", null).optional(),

  holdSeatTtlSeconds: Joi.number().integer().min(60).max(3600).optional(),
  bufferMinutes: Joi.number().integer().min(0).max(120).optional(),
  maxAdvanceBookingDays: Joi.number().integer().min(1).max(365).optional(),
  minHoursBeforeCancel: Joi.number().integer().min(0).max(168).optional(),

  depositPercentage: Joi.number().min(0).max(100).optional(),
  vatPercentage: Joi.number().min(0).max(30).optional(),
  enableOnlinePayment: Joi.boolean().optional(),
  enableCashPayment: Joi.boolean().optional(),

  emailNotificationEnabled: Joi.boolean().optional(),
  appointmentReminderHours: Joi.number().integer().min(1).max(168).optional(),
  adminSoundAlerts: Joi.boolean().optional()
}).min(1);

module.exports = {
  updateSettingBody
};
