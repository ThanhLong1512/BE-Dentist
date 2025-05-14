// File chứa các thông tin cấu hình thanh toán
// Lưu ý: Trong môi trường thực tế, nên lưu thông tin nhạy cảm trong biến môi trường (.env)

const momoConfig = {
  partnerCode: "MOMO",
  accessKey: "F8BBA842ECF85",
  secretKey: "K951B6PE1waDMi640xX08PD3vg6EkVlz",
  redirectUrl: "http://localhost:5173/home",
  ipnUrl:
    "https://9353-14-169-70-31.ngrok-free.app/api/v1/payments/callbackwithMoMo",
  requestType: "captureWallet",
  orderInfo: "pay with MoMo",
  extraData: ""
};

const zaloPayConfig = {
  app_id: "2553",
  key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
  key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
  endpoint: "https://sb-openapi.zalopay.vn/v2/create"
};

const vnPayConfig = {
  tmnCode: "2QXUI4B4",
  secureSecret: "secret",
  vnpayHost: "https://sandbox.vnpayment.vn",
  testMode: true,
  hashAlgorithm: "SHA512",
  enableLog: true
};

module.exports = {
  momoConfig,
  zaloPayConfig,
  vnPayConfig
};
