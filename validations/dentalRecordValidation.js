const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const patientIdParams = Joi.object({
  patientId: objectId.required()
});

const sessionIdParams = Joi.object({
  patientId: objectId.required(),
  sessionId: objectId.required()
});

const updateMedicalHistoryBody = Joi.object({
  allergies: Joi.array().items(Joi.string().trim()).optional(),
  systemicConditions: Joi.array().items(Joi.string().trim()).optional(),
  notes: Joi.string().allow("").optional()
});

const updateToothBody = Joi.object({
  toothNumber: Joi.number().integer().required(),
  status: Joi.string()
    .valid(
      "healthy",
      "cavity",
      "filled",
      "root_canal",
      "crown",
      "missing",
      "implant",
      "impacted",
      "bridge",
      "orthodontic"
    )
    .required(),
  surfaces: Joi.array().items(Joi.string().valid("M", "D", "O", "B", "L")).optional(),
  notes: Joi.string().allow("").optional()
});

const batchUpdateTeethBody = Joi.object({
  teeth: Joi.array()
    .items(
      Joi.object({
        toothNumber: Joi.number().integer().required(),
        status: Joi.string()
          .valid(
            "healthy",
            "cavity",
            "filled",
            "root_canal",
            "crown",
            "missing",
            "implant",
            "impacted",
            "bridge",
            "orthodontic"
          )
          .required(),
        surfaces: Joi.array().items(Joi.string().valid("M", "D", "O", "B", "L")).optional(),
        notes: Joi.string().allow("").optional()
      })
    )
    .min(1)
    .required()
});

const addTreatmentSessionBody = Joi.object({
  sessionDate: Joi.date().optional(),
  doctor: objectId.optional().allow(null, ""),
  appointment: objectId.optional().allow(null, ""),
  diagnosis: Joi.string().allow("").optional(),
  clinicalNotes: Joi.string().allow("").optional(),
  procedures: Joi.array()
    .items(
      Joi.object({
        service: objectId.optional().allow(null, ""),
        serviceName: Joi.string().allow("").optional(),
        teeth: Joi.array().items(Joi.number().integer()).optional(),
        price: Joi.number().min(0).optional(),
        notes: Joi.string().allow("").optional()
      })
    )
    .optional(),
  prescription: Joi.array()
    .items(
      Joi.object({
        drugName: Joi.string().trim().required(),
        dosage: Joi.string().allow("").optional(),
        frequency: Joi.string().allow("").optional(),
        duration: Joi.string().allow("").optional(),
        instructions: Joi.string().allow("").optional()
      })
    )
    .optional()
});

module.exports = {
  patientIdParams,
  sessionIdParams,
  updateMedicalHistoryBody,
  updateToothBody,
  batchUpdateTeethBody,
  addTreatmentSessionBody
};
