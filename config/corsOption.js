module.exports = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
      process.env.FRONTEND_URL
    ].filter(Boolean);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      /^https:\/\/[a-zA-Z0-9-_]+\.vercel\.app$/.test(origin) ||
      /^https:\/\/[a-zA-Z0-9-_]+\.netlify\.app$/.test(origin) ||
      /^https:\/\/[a-zA-Z0-9-_]+\.onrender\.com$/.test(origin) ||
      process.env.NODE_ENV === "development";

    if (isAllowed) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"]
};


