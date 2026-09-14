const { DentalRecord, ALL_FDI_TEETH } = require("../models/DentalRecordModel");
const Patient = require("../models/PatientModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Helper để tìm hoặc tự động khởi tạo DentalRecord mặc định cho bệnh nhân
const getOrCreateRecord = async (patientId) => {
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new AppError("No patient found with that ID", 404);
  }

  let record = await DentalRecord.findOne({ patient: patientId });
  if (!record) {
    record = await DentalRecord.create({
      patient: patientId,
      medicalHistory: {
        allergies: [],
        systemicConditions: [],
        notes: ""
      },
      dentalChart: ALL_FDI_TEETH.map(num => ({
        toothNumber: num,
        status: "healthy",
        surfaces: [],
        notes: ""
      })),
      treatmentSessions: []
    });
  }
  return record;
};

// GET /api/v1/dental-records/patient/:patientId
exports.getPatientRecord = catchAsync(async (req, res, next) => {
  const record = await getOrCreateRecord(req.params.patientId);

  res.status(200).json({
    status: "success",
    data: {
      data: record
    }
  });
});

// PATCH /api/v1/dental-records/patient/:patientId/medical-history
exports.updateMedicalHistory = catchAsync(async (req, res, next) => {
  const record = await getOrCreateRecord(req.params.patientId);

  const { allergies, systemicConditions, notes } = req.body;
  if (allergies !== undefined) record.medicalHistory.allergies = allergies;
  if (systemicConditions !== undefined)
    record.medicalHistory.systemicConditions = systemicConditions;
  if (notes !== undefined) record.medicalHistory.notes = notes;

  await record.save();

  res.status(200).json({
    status: "success",
    data: {
      data: record
    }
  });
});

// PATCH /api/v1/dental-records/patient/:patientId/tooth
exports.updateTooth = catchAsync(async (req, res, next) => {
  const record = await getOrCreateRecord(req.params.patientId);
  const { toothNumber, status, surfaces, notes } = req.body;

  const targetToothNum = Number(toothNumber);
  const toothIndex = record.dentalChart.findIndex(
    t => t.toothNumber === targetToothNum
  );

  if (toothIndex > -1) {
    record.dentalChart[toothIndex].status = status;
    if (surfaces !== undefined) record.dentalChart[toothIndex].surfaces = surfaces;
    if (notes !== undefined) record.dentalChart[toothIndex].notes = notes;
    record.dentalChart[toothIndex].updatedAt = Date.now();
  } else {
    record.dentalChart.push({
      toothNumber: targetToothNum,
      status,
      surfaces: surfaces || [],
      notes: notes || ""
    });
  }

  await record.save();

  res.status(200).json({
    status: "success",
    data: {
      data: record
    }
  });
});

// PATCH /api/v1/dental-records/patient/:patientId/teeth/batch
exports.batchUpdateTeeth = catchAsync(async (req, res, next) => {
  const record = await getOrCreateRecord(req.params.patientId);
  const { teeth } = req.body;

  teeth.forEach(item => {
    const targetToothNum = Number(item.toothNumber);
    const toothIndex = record.dentalChart.findIndex(
      t => t.toothNumber === targetToothNum
    );
    if (toothIndex > -1) {
      record.dentalChart[toothIndex].status = item.status;
      if (item.surfaces !== undefined)
        record.dentalChart[toothIndex].surfaces = item.surfaces;
      if (item.notes !== undefined)
        record.dentalChart[toothIndex].notes = item.notes;
      record.dentalChart[toothIndex].updatedAt = Date.now();
    } else {
      record.dentalChart.push({
        toothNumber: targetToothNum,
        status: item.status,
        surfaces: item.surfaces || [],
        notes: item.notes || ""
      });
    }
  });

  await record.save();

  res.status(200).json({
    status: "success",
    data: {
      data: record
    }
  });
});

// POST /api/v1/dental-records/patient/:patientId/sessions
exports.addTreatmentSession = catchAsync(async (req, res, next) => {
  const record = await getOrCreateRecord(req.params.patientId);

  const newSession = {
    sessionDate: req.body.sessionDate || Date.now(),
    doctor: req.body.doctor || null,
    appointment: req.body.appointment || null,
    diagnosis: req.body.diagnosis || "",
    clinicalNotes: req.body.clinicalNotes || "",
    procedures: req.body.procedures || [],
    prescription: req.body.prescription || []
  };

  record.treatmentSessions.unshift(newSession); // Đưa lên đầu danh sách để ca khám mới nhất hiện trước
  await record.save();

  // Re-populate để trả về thông tin đầy đủ của doctor và service
  await record.populate([
    {
      path: "treatmentSessions.doctor",
      select: "name phoneNumber experience service"
    },
    {
      path: "treatmentSessions.procedures.service",
      select: "nameService priceService priceDiscount"
    }
  ]);

  res.status(201).json({
    status: "success",
    data: {
      data: record
    }
  });
});

// DELETE /api/v1/dental-records/patient/:patientId/sessions/:sessionId
exports.deleteTreatmentSession = catchAsync(async (req, res, next) => {
  const record = await getOrCreateRecord(req.params.patientId);

  record.treatmentSessions = record.treatmentSessions.filter(
    s => s._id.toString() !== req.params.sessionId
  );
  await record.save();

  res.status(200).json({
    status: "success",
    data: {
      data: record
    }
  });
});
