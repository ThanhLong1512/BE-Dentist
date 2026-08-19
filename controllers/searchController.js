const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { client, getIndexName } = require("../search/elasticsearchClient");
const { ensureIndices } = require("../search/ensureIndices");

const parseLimit = (v) => {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n <= 0) return 10;
  return Math.min(n, 50);
};

const normalizeQueryString = (q) => (q ? String(q).trim() : "");

exports.searchPatients = catchAsync(async (req, res) => {
  const q = normalizeQueryString(req.query.q);
  const limit = parseLimit(req.query.limit);

  if (!q) throw new AppError("Missing query param: q", 400);

  await ensureIndices();

  const index = getIndexName("patients");

  const result = await client.search({
    index,
    size: limit,
    query: {
      bool: {
        should: [
          {
            match: {
              searchText: {
                query: q,
                fuzziness: "AUTO",
              },
            },
          },
          {
            match: {
              name: {
                query: q,
                fuzziness: "AUTO",
              },
            },
          },
        ],
        minimum_should_match: 1,
      },
    },
  });

  const hits = result.hits?.hits || [];
  return res.status(200).json({
    status: "success",
    data: hits.map((h) => ({
      id: h._id,
      score: h._score,
      ...h._source,
    })),
  });
});

exports.searchServices = catchAsync(async (req, res) => {
  const q = normalizeQueryString(req.query.q);
  const limit = parseLimit(req.query.limit);

  if (!q) throw new AppError("Missing query param: q", 400);

  await ensureIndices();

  const index = getIndexName("services");

  const result = await client.search({
    index,
    size: limit,
    query: {
      bool: {
        should: [
          {
            match: {
              searchText: {
                query: q,
                fuzziness: "AUTO",
              },
            },
          },
          {
            match: {
              nameService: {
                query: q,
                fuzziness: "AUTO",
              },
            },
          },
        ],
        minimum_should_match: 1,
      },
    },
  });

  const hits = result.hits?.hits || [];
  return res.status(200).json({
    status: "success",
    data: hits.map((h) => ({
      id: h._id,
      score: h._score,
      ...h._source,
    })),
  });
});

exports.searchAppointments = catchAsync(async (req, res) => {
  const q = normalizeQueryString(req.query.q);
  const limit = parseLimit(req.query.limit);
  const patientId = req.query.patientId ? String(req.query.patientId) : null;

  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;

  if (!patientId && !q) {
    throw new AppError("Provide query param: patientId or q", 400);
  }

  await ensureIndices();

  const index = getIndexName("appointments");

  const filter = [];
  if (patientId) {
    filter.push({ term: { patientId } });
  }

  if (from && !Number.isNaN(from.getTime())) {
    filter.push({ range: { date: { gte: from.toISOString() } } });
  }
  if (to && !Number.isNaN(to.getTime())) {
    filter.push({ range: { date: { lte: to.toISOString() } } });
  }

  const must = [];
  if (q) {
    must.push({
      match: {
        searchText: {
          query: q,
          fuzziness: "AUTO",
        },
      },
    });
  }

  const result = await client.search({
    index,
    size: limit,
    query: {
      bool: {
        filter,
        must,
      },
    },
    sort: [{ date: { order: "desc" } }],
  });

  const hits = result.hits?.hits || [];

  return res.status(200).json({
    status: "success",
    data: hits.map((h) => ({
      id: h._id,
      score: h._score,
      ...h._source,
    })),
  });
});

