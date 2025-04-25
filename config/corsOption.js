//CORS (Cross-Origin Resource Sharing) là cơ chế giúp trình duyệt cho phép hoặc chặn yêu cầu từ một domain khác với domain của server.
module.exports = {
  origin: "http://localhost:5173",
  // Một số trình duyệt cũ như IE11 hoặc SmartTVs gặp vấn đề với mã trạng thái 204
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  // CORS sẽ cho phép nhận cookie từ request

  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"]
};
