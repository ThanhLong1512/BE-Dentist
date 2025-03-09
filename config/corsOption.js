//CORS (Cross-Origin Resource Sharing) là cơ chế giúp trình duyệt cho phép hoặc chặn yêu cầu từ một domain khác với domain của server.
module.exports = {
  origin: function(origin, callback) {
    return callback(null, true);
  },
  // Một số trình duyệt cũ như IE11 hoặc SmartTVs gặp vấn đề với mã trạng thái 204
  optionsSuccessStatus: 200
};
