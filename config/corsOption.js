//CORS (Cross-Origin Resource Sharing) là cơ chế giúp trình duyệt cho phép hoặc chặn yêu cầu từ một domain khác với domain của server.
// Có thể set FRONTEND_URL trong config.env (vd: http://localhost:5173 hoặc https://yourdomain.com)
// Nhiều origin: FRONTEND_URL="http://localhost:5173,http://localhost:3000"
const getOrigins = () => {
  const url = process.env.FRONTEND_URL || "http://localhost:5173";
  return url.split(",").map(o => o.trim());
};

module.exports = {
  origin: (origin, callback) => {
    const allowed = getOrigins();
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  // Một số trình duyệt cũ như IE11 hoặc SmartTVs gặp vấn đề với mã trạng thái 204
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  // CORS sẽ cho phép nhận cookie từ request

  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"]
};

