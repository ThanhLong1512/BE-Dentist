const { Client } = require("@elastic/elasticsearch");

const ELASTIC_URL = process.env.ELASTIC_URL || "http://localhost:9200";
const INDEX_PREFIX = process.env.ELASTIC_INDEX_PREFIX || "";

const ELASTIC_USER = process.env.ELASTIC_USER || "";
const ELASTIC_PASSWORD = process.env.ELASTIC_PASSWORD || "";

const client = new Client({
  node: ELASTIC_URL,
  auth:
    ELASTIC_USER && ELASTIC_PASSWORD
      ? { username: ELASTIC_USER, password: ELASTIC_PASSWORD }
      : undefined,
});

const getIndexName = (baseIndex) => {
  const prefix = INDEX_PREFIX ? `${INDEX_PREFIX}_` : "";
  return `${prefix}${baseIndex}`;
};

module.exports = {
  client,
  getIndexName,
};

