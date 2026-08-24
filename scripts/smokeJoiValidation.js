/**
 * Smoke checks for Joi validation schemas + module wiring.
 * Run: node scripts/smokeJoiValidation.js
 */
const assert = require("assert");

const { holdAppointmentBody, updateStatusBody, rescheduleBody, periodParams } = require("../validations/appointmentValidation");
const { appointmentPaymentBody, codPaymentBody } = require("../validations/paymentValidation");
const { slotsQuery } = require("../validations/availabilityValidation");
const { createPatientBody } = require("../validations/patientValidation");
const { createServiceBody } = require("../validations/serviceValidation");

const validObjectId = "507f1f77bcf86cd799439011";

function expectFail(schema, value, label) {
  const { error } = schema.validate(value, { abortEarly: false, stripUnknown: true, convert: true });
  assert(error, `Expected validation failure for: ${label}`);
  console.log(`PASS fail-case: ${label}`);
}

function expectOk(schema, value, label) {
  const { error, value: out } = schema.validate(value, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  assert(!error, `Expected OK for ${label}: ${error && error.message}`);
  console.log(`PASS ok-case: ${label}`);
  return out;
}

// Hold: missing shift
expectFail(holdAppointmentBody, { Date: "2026-08-25" }, "hold missing shift");
expectOk(
  holdAppointmentBody,
  {
    shift: validObjectId,
    Date: "2026-08-25",
    serviceId: validObjectId,
    slotStart: "09:00",
    slotEnd: "10:00"
  },
  "hold complete"
);

// Status
expectFail(updateStatusBody, {}, "status missing");
expectOk(updateStatusBody, { status: "checked_in" }, "status ok");

// Reschedule must have Date or shift
expectFail(rescheduleBody, { reason: "test" }, "reschedule missing Date/shift");
expectOk(rescheduleBody, { Date: "2026-08-26" }, "reschedule with Date");

// Period
expectFail(periodParams, { period: "15" }, "invalid period");
expectOk(periodParams, { period: "7" }, "period 7");

// Payment
expectFail(appointmentPaymentBody, { totalPrice: 100, service: [validObjectId] }, "payment missing reservationId");
expectOk(
  appointmentPaymentBody,
  { reservationId: validObjectId, totalPrice: 100000, service: [validObjectId] },
  "payment ok"
);
expectOk(
  codPaymentBody,
  { totalPrice: 50000, service: validObjectId },
  "COD without reservation (shop)"
);

// Availability
expectFail(slotsQuery, { serviceId: validObjectId }, "slots missing date");
expectOk(
  slotsQuery,
  { date: "2026-08-25", serviceId: validObjectId },
  "slots query ok"
);

// Patient
expectFail(createPatientBody, { name: "A" }, "patient incomplete");
expectOk(
  createPatientBody,
  {
    name: "Nguyen Van A",
    gender: true,
    yearOfBirth: 1990,
    phoneNumber: "0901234567",
    address: "HCM"
  },
  "patient create ok"
);

// Service
expectOk(
  createServiceBody,
  {
    nameService: "Cao voi",
    Unit: "Lan",
    priceService: "300000",
    summary: "Mo ta ngan"
  },
  "service create coerces price string"
);

// Module require smoke
require("../middlewares/validate");
require("../services/paymentService");
require("../services/appointmentService");
require("../services/catalogService");
require("../controllers/paymentController");
require("../controllers/appointmentController");
require("../controllers/servicesController");
require("../controllers/availabilityController");
console.log("PASS module requires");

console.log("\nALL SMOKE CHECKS PASSED");
