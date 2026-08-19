const { client, getIndexName } = require("./elasticsearchClient");

const VI_ANALYZER = "vi_analyzer";

const baseSettings = {
  analysis: {
    analyzer: {
      [VI_ANALYZER]: {
        type: "custom",
        tokenizer: "standard",
        filter: ["lowercase", "asciifolding"],
      },
    },
  },
};

const patientsIndex = getIndexName("patients");
const servicesIndex = getIndexName("services");
const appointmentsIndex = getIndexName("appointments");

async function ensureIndex({ index, body }) {
  const exists = await client.indices.exists({ index });
  if (exists) return;
  await client.indices.create({ index, body });
}

async function ensureIndices() {
  // Patients
  await ensureIndex({
    index: patientsIndex,
    body: {
      ...baseSettings,
      mappings: {
        properties: {
          patientId: { type: "keyword" },
          accountId: { type: "keyword" },
          name: { type: "text", analyzer: VI_ANALYZER },
          phoneNumber: { type: "keyword" },
          address: { type: "text", analyzer: VI_ANALYZER },
          searchText: { type: "text", analyzer: VI_ANALYZER },
          gender: { type: "boolean" },
          yearOfBirth: { type: "integer" },
        },
      },
    },
  });

  // Services
  await ensureIndex({
    index: servicesIndex,
    body: {
      ...baseSettings,
      mappings: {
        properties: {
          serviceId: { type: "keyword" },
          nameService: { type: "text", analyzer: VI_ANALYZER },
          summary: { type: "text", analyzer: VI_ANALYZER },
          description: { type: "text", analyzer: VI_ANALYZER },
          priceService: { type: "double" },
          Unit: { type: "keyword" },
          searchText: { type: "text", analyzer: VI_ANALYZER },
        },
      },
    },
  });

  // Appointments
  await ensureIndex({
    index: appointmentsIndex,
    body: {
      ...baseSettings,
      mappings: {
        properties: {
          appointmentId: { type: "keyword" },
          patientId: { type: "keyword" },
          patientName: { type: "text", analyzer: VI_ANALYZER },
          date: { type: "date" },
          status: { type: "keyword" },
          slotStart: { type: "keyword" },
          slotEnd: { type: "keyword" },
          notes: { type: "text", analyzer: VI_ANALYZER },
          searchText: { type: "text", analyzer: VI_ANALYZER },
        },
      },
    },
  });
}

module.exports = {
  ensureIndices,
  indices: {
    patientsIndex,
    servicesIndex,
    appointmentsIndex,
  },
};

