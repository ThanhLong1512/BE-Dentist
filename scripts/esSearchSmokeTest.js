const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });

const mongoose = require("mongoose");

const Service = require("../models/ServicesModel");
const Patient = require("../models/PatientModel");
const Appointment = require("../models/AppointmentModel");

const { client, getIndexName } = require("../search/elasticsearchClient");
const { ensureIndices } = require("../search/ensureIndices");
const {
  indexPatient,
  indexService,
  indexAppointment,
} = require("../search/indexer");

const DB_URI = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

const safe = (v) => (v == null ? "" : String(v));

const searchPatients = async ({ q, limit = 10 }) => {
  const index = getIndexName("patients");
  return client.search({
    index,
    size: limit,
    query: {
      bool: {
        should: [
          {
            match: {
              searchText: { query: q, fuzziness: "AUTO" },
            },
          },
          { match: { name: { query: q, fuzziness: "AUTO" } } },
        ],
        minimum_should_match: 1,
      },
    },
  });
};

const searchServices = async ({ q, limit = 10 }) => {
  const index = getIndexName("services");
  return client.search({
    index,
    size: limit,
    query: {
      bool: {
        should: [
          { match: { searchText: { query: q, fuzziness: "AUTO" } } },
          { match: { nameService: { query: q, fuzziness: "AUTO" } } },
        ],
        minimum_should_match: 1,
      },
    },
  });
};

const searchAppointments = async ({ q, limit = 10, patientId }) => {
  const index = getIndexName("appointments");
  const filter = [];
  if (patientId) filter.push({ term: { patientId } });

  return client.search({
    index,
    size: limit,
    query: {
      bool: {
        filter,
        must: q
          ? [
              {
                match: {
                  searchText: { query: q, fuzziness: "AUTO" },
                },
              },
            ]
          : [],
      },
    },
    sort: [{ date: { order: "desc" } }],
  });
};

function typoify(str) {
  // Tạo typo đơn giản: bỏ 1 ký tự giữa chuỗi (nếu đủ dài)
  if (!str) return str;
  const s = str.trim();
  if (s.length < 4) return s;
  const mid = Math.floor(s.length / 2);
  return s.slice(0, mid) + s.slice(mid + 1);
}

async function main() {
  console.log("[esSearchSmokeTest] Connecting to Mongo...");
  await mongoose.connect(DB_URI);

  console.log("[esSearchSmokeTest] Ensuring ES indices...");
  await ensureIndices();

  const patient = await Patient.findOne({});
  const service = await Service.findOne({});
  const appointment = await Appointment.findOne({});

  if (!patient || !service || !appointment) {
    throw new Error("Không đủ dữ liệu mẫu (Patient/Service/Appointment) trong DB để chạy smoke test.");
  }

  console.log("[esSearchSmokeTest] Indexing sample docs...");
  await indexPatient(patient._id);
  await indexService(service._id);
  await indexAppointment(appointment._id);

  // 1) Fuzzy patient search
  const qPatientBase = safe(patient.name);
  const qPatient = typoify(qPatientBase);
  const patientRes = await searchPatients({ q: qPatient, limit: 5 });
  const patientHits = patientRes.hits?.hits || [];
  console.log("[esSearchSmokeTest] patient fuzzy hits:", patientHits.length);
  if (patientHits.length === 0) {
    throw new Error("Fuzzy search patient không trả về kết quả.");
  }

  // 2) Service search
  const qServiceBase = safe(service.nameService);
  const qService = typoify(qServiceBase);
  const serviceRes = await searchServices({ q: qService, limit: 5 });
  const serviceHits = serviceRes.hits?.hits || [];
  console.log("[esSearchSmokeTest] service fuzzy hits:", serviceHits.length);
  if (serviceHits.length === 0) {
    throw new Error("Fuzzy search services không trả về kết quả.");
  }

  // 3) Appointment note search update
  const oldPatientName = patient.name;
  const oldAppointmentStatusHistory = appointment.statusHistory || [];

  const smokeNote = `ES_SMOKE_NOTE_${Date.now()}`;

  try {
    console.log("[esSearchSmokeTest] Updating patient.name + appointment.note, re-index...");

    patient.name = `${oldPatientName} ${Date.now().toString().slice(-4)}`;
    await patient.save();
    await indexPatient(patient._id);

    appointment.statusHistory = [
      ...oldAppointmentStatusHistory,
      {
        status: appointment.status || "scheduled",
        changedAt: new Date(),
        note: smokeNote,
      },
    ];
    await appointment.save();
    await indexAppointment(appointment._id);

    const appointmentRes = await searchAppointments({
      q: smokeNote,
      limit: 5,
      patientId: patient._id.toString(),
    });
    const appointmentHits = appointmentRes.hits?.hits || [];

    console.log("[esSearchSmokeTest] appointment note hits:", appointmentHits.length);
    if (appointmentHits.length === 0) {
      throw new Error("Search appointment theo note không trả về kết quả sau khi cập nhật.");
    }

    console.log("[esSearchSmokeTest] ALL PASS");
  } finally {
    // Revert DB để giảm ảnh hưởng.
    console.log("[esSearchSmokeTest] Reverting DB changes...");
    patient.name = oldPatientName;
    await patient.save();
    await indexPatient(patient._id);

    appointment.statusHistory = oldAppointmentStatusHistory;
    await appointment.save();
    await indexAppointment(appointment._id);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[esSearchSmokeTest] FAILED:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

