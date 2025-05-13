const { StatusCodes } = require("http-status-codes");
const CatchAsync = require("../utils/catchAsync");
const Order = require("../models/OrderModel");
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
const Account = require("../models/AccountModel");
const {
  momoConfig,
  zaloPayConfig,
  vnPayConfig
} = require("../config/paymentConfig");

const paymentWithMoMo = CatchAsync(async (req, res) => {
  const totalPrice = req.body.totalPrice;
  const service = req.body.service;
  const user = await Account.findById(req.user.id);
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: "fail",
      message: "Please Login to order"
    });
  }
  const extraDataObj = {
    account: user.id,
    service: service
  };

  var partnerCode = momoConfig.partnerCode;
  var accessKey = momoConfig.accessKey;
  var secretkey = momoConfig.secretKey;
  var requestId = partnerCode + new Date().getTime();
  var orderId = requestId;
  var orderInfo = momoConfig.orderInfo;
  var redirectUrl = momoConfig.redirectUrl;
  var ipnUrl = momoConfig.ipnUrl;
  var amount = totalPrice;
  var requestType = momoConfig.requestType;
  var extraData = Buffer.from(JSON.stringify(extraDataObj)).toString("base64");

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
  const user = Account.findOne({ where: { id: req.user.id } });
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      status: "fail",
      message: "User not found"
    });
  }
  const config = zaloPayConfig;
  const embed_data = {
    redirectUrl: "http://localhost:5173/home"
  };
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
    bank_code: "",
    callback_url:
      "https://1643-14-186-89-251.ngrok-free.app/api/v1/payments/callbackwithZaloPay"
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
  const user = Account.findOne({ where: { id: req.user.id } });
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      status: "fail",
      message: "User not found"
    });
  }
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
    vnp_ReturnUrl:
      "https://1643-14-186-89-251.ngrok-free.app/api/v1/payments/callbackwithVNPay",
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
const callbackZaloPay = CatchAsync(async (req, res) => {
  let result = {};
  let dataStr = req.body.data;
  let reqMac = req.body.mac;

  let mac = CryptoJS.HmacSHA256(dataStr, zaloPayConfig.key2).toString();

  // kiểm tra callback hợp lệ (đến từ ZaloPay server)
  if (reqMac !== mac) {
    // callback không hợp lệ
    result.return_code = -1;
    result.return_message = "mac not equal";
  } else {
    // thanh toán thành công
    // merchant cập nhật trạng thái cho đơn hàng
    let dataJson = JSON.parse(dataStr, config.key2);

    result.return_code = 1;
    result.return_message = "success";
  }

  // thông báo kết quả cho ZaloPay server
  res.status(200).json(result);
});
const callbackMoMo = CatchAsync(async (req, res) => {
  console.log("callbackMoMo", req.body);
  let extraDataObj = {};
  try {
    if (req.body.extraData) {
      const decodedExtraData = Buffer.from(
        req.body.extraData,
        "base64"
      ).toString();
      extraDataObj = JSON.parse(decodedExtraData);
    }
  } catch (error) {
    console.error("Error parsing extraData:", error);
  }
  console.log("extraDataObj", extraDataObj);
  await Order.create({
    account: extraDataObj.account,
    service: extraDataObj.service,
    status: req.body.message,
    paymentMethod: req.body.paymentType + req.body.partnerCode,
    totalPrice: req.body.amount
  });
  return res.status(StatusCodes.OK).json({
    status: "success",
    data: {
      payUrl: req.body
    }
  });
});
const callbackVnPay = CatchAsync(async (req, res) => {
  const { orderInfo, resultCode } = req.query;
  return res.status(StatusCodes.OK).json({
    status: "success",
    data: {
      payUrl: req.query
    }
  });
});
const paymentController = {
  paymentWithMoMo,
  paymentWithZaloPay,
  paymentWithVnPay,
  callbackZaloPay,
  callbackMoMo,
  callbackVnPay
};
module.exports = paymentController;
