const { StatusCodes } = require("http-status-codes");
const CatchAsync = require("../utils/catchAsync");
const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat
} = require("vnpay");
const crypto = require("crypto");
const CryptoJS = require("crypto-js");
const moment = require("moment");
const axios = require("axios");
const {
  momoConfig,
  zaloPayConfig,
  vnPayConfig
} = require("../config/paymentConfig");

const paymentWithMoMo = CatchAsync(async (req, res) => {
  var partnerCode = momoConfig.partnerCode;
  var accessKey = momoConfig.accessKey;
  var secretkey = momoConfig.secretKey;
  var requestId = partnerCode + new Date().getTime();
  var orderId = requestId;
  var orderInfo = momoConfig.orderInfo;
  var redirectUrl = momoConfig.redirectUrl;
  var ipnUrl = momoConfig.ipnUrl;
  var amount = "50000";
  var requestType = momoConfig.requestType;
  var extraData = momoConfig.extraData;

  var rawSignature =
    "accessKey=" +
    accessKey +
    "&amount=" +
    amount +
    "&extraData=" +
    extraData +
    "&ipnUrl=" +
    ipnUrl +
    "&orderId=" +
    orderId +
    "&orderInfo=" +
    orderInfo +
    "&partnerCode=" +
    partnerCode +
    "&redirectUrl=" +
    redirectUrl +
    "&requestId=" +
    requestId +
    "&requestType=" +
    requestType;
  var signature = crypto
    .createHmac("sha256", secretkey)
    .update(rawSignature)
    .digest("hex");
  const requestBody = JSON.stringify({
    partnerCode: partnerCode,
    accessKey: accessKey,
    requestId: requestId,
    amount: amount,
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: redirectUrl,
    ipnUrl: ipnUrl,
    extraData: extraData,
    requestType: requestType,
    signature: signature,
    lang: "en"
  });
  const response = await axios.post(
    "https://test-payment.momo.vn/v2/gateway/api/create",
    requestBody,
    {
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody)
      }
    }
  );
  res.status(StatusCodes.OK).json({
    status: "success",
    message: "Get Data MoMo successfully",
    data: {
      payUrl: response.data.payUrl
    }
  });
});

const paymentWithZaloPay = CatchAsync(async (req, res) => {
  const config = zaloPayConfig;
  const embed_data = {};
  const items = [{}];
  const transID = Math.floor(Math.random() * 1000000);
  const order = {
    app_id: config.app_id,
    app_trans_id: `${moment().format("YYMMDD")}_${transID}`,
    app_user: "user123",
    app_time: Date.now(),
    item: JSON.stringify(items),
    embed_data: JSON.stringify(embed_data),
    amount: 50000,
    description: `Lazada - Payment for the order #${transID}`,
    bank_code: ""
  };
  const data =
    config.app_id +
    "|" +
    order.app_trans_id +
    "|" +
    order.app_user +
    "|" +
    order.amount +
    "|" +
    order.app_time +
    "|" +
    order.embed_data +
    "|" +
    order.item;
  order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();
  const result = await axios.post(config.endpoint, null, { params: order });
  return res.status(StatusCodes.OK).json({
    status: "success",
    message: "Get Data ZaloPay successfully",
    data: {
      payUrl: result.data.order_url
    }
  });
});

const paymentWithVnPay = CatchAsync(async (req, res) => {
  const vnpay = new VNPay({
    tmnCode: vnPayConfig.tmnCode,
    secureSecret: vnPayConfig.secureSecret,
    vnpayHost: vnPayConfig.vnpayHost,
    testMode: vnPayConfig.testMode,
    hashAlgorithm: vnPayConfig.hashAlgorithm,
    enableLog: vnPayConfig.enableLog,
    loggerFn: ignoreLogger
  });
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const paymentUrl = vnpay.buildPaymentUrl({
    vnp_Amount: 10000,
    vnp_IpAddr: "13.160.92.202",
    vnp_TxnRef: "123456",
    vnp_OrderInfo: "Thanh toan don hang 123456",
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: "http://localhost:3000/vnpay-return",
    vnp_Locale: VnpLocale.VN,
    vnp_CreateDate: dateFormat(new Date()),
    vnp_ExpireDate: dateFormat(tomorrow)
  });
  return res.status(StatusCodes.OK).json({
    status: "success",
    message: "Get Data VnPay successfully",
    data: {
      paymentUrl
    }
  });
});

const paymentController = {
  paymentWithMoMo,
  paymentWithZaloPay,
  paymentWithVnPay
};
module.exports = paymentController;
