const { client, getIndexName } = require("./elasticsearchClient");
const { ensureIndices } = require("./ensureIndices");

const Patient = require("../models/PatientModel");
const Service = require("../models/ServicesModel");
const Appointment = require("../models/AppointmentModel");

const INDEX = {
  patients: getIndexName("patients"),
  services: getIndexName("services"),
  appointments: getIndexName("appointments"),
};

const buildSearchText = (parts) =>
  (parts || [])
    .filter(Boolean)
    .join(" ")
    .toString()
    .trim();

async function indexPatient(patientId) {
  await ensureIndices();
  const patient = await Patient.findById(patientId).lean();
  if (!patient) return deletePatient(patientId);

  const doc = {
    patientId: patient._id.toString(),
    accountId: patient.account?.toString(),
    name: patient.name || "",
    phoneNumber: patient.phoneNumber || "",
    address: patient.address || "",
    gender: patient.gender ?? null,
    yearOfBirth: patient.yearOfBirth ?? null,
    searchText: buildSearchText([patient.name, patient.phoneNumber, patient.address]),
  };

  await client.index({
    index: INDEX.patients,
    id: patient._id.toString(),
    document: doc,
    refresh: "wait_for",
  });
}

async function deletePatient(patientId) {
  await ensureIndices();
  await client
    .delete({
      index: INDEX.patients,
      id: patientId.toString(),
    })
    .catch(() => null);
}

async function indexService(serviceId) {
  await ensureIndices();
  const service = await Service.findById(serviceId).lean();
  if (!service) return deleteService(serviceId);

  const doc = {
    serviceId: service._id.toString(),
    nameService: service.nameService || "",
    summary: service.summary || "",
    description: service.description || "",
    priceService: typeof service.priceService === "number" ? service.priceService : 0,
    Unit: service.Unit || "",
    priceDiscount:
      typeof service.priceDiscount === "number" ? service.priceDiscount : undefined,
    photoService: service.photoService || undefined,
    searchText: buildSearchText([service.nameService, service.summary, service.description]),
  };

  await client.index({
    index: INDEX.services,
    id: service._id.toString(),
    document: doc,
    refresh: "wait_for",
  });
}

async function deleteService(serviceId) {
  await ensureIndices();
  await client
    .delete({
      index: INDEX.services,
      id: serviceId.toString(),
    })
    .catch(() => null);
}

async function indexAppointment(appointmentId) {
  await ensureIndices();

  // appointmentSchema pre(/^find/) sẽ populate patient/shift, nên lấy document đầy đủ cho denormalize.
  const appointment = await Appointment.findById(appointmentId)
    .populate("patient")
    .lean();
  if (!appointment) return deleteAppointment(appointmentId);

  const notes =
    appointment.statusHistory && Array.isArray(appointment.statusHistory)
      ? appointment.statusHistory
          .map((h) => h && h.note)
          .filter(Boolean)
          .join(" ")
      : "";

  const doctorName = appointment.shift?.employee?.name || "";
  const serviceName = appointment.shift?.employee?.service?.nameService || "";
  const priceService =
    appointment.shift?.employee?.service?.priceService ?? 0;
  const priceDiscount =
    appointment.shift?.employee?.service?.priceDiscount ?? undefined;
  const patientPhone = appointment.patient?.phoneNumber || "";

  const doc = {
    appointmentId: appointment._id.toString(),
    patientId: appointment.patient?._id
      ? appointment.patient._id.toString()
      : appointment.patient?.toString?.() || "",
    patientName: appointment.patient?.name || "",
    patientPhone,
    date: appointment.Date || null,
    status: appointment.status || "",
    slotStart: appointment.slotStart || null,
    slotEnd: appointment.slotEnd || null,
    notes,
    doctorName,
    serviceName,
    priceService,
    priceDiscount,
    searchText: buildSearchText([
      appointment.patient?.name,
      appointment.status,
      doctorName,
      serviceName,
      notes,
    ]),
  };

  await client.index({
    index: INDEX.appointments,
    id: appointment._id.toString(),
    document: doc,
    refresh: "wait_for",
  });
}

async function deleteAppointment(appointmentId) {
  await ensureIndices();
  await client
    .delete({
      index: INDEX.appointments,
      id: appointmentId.toString(),
    })
    .catch(() => null);
}

module.exports = {
  indexPatient,
  deletePatient,
  indexService,
  deleteService,
  indexAppointment,
  deleteAppointment,
};

