const { StatusCodes } = require("http-status-codes");
const CatchAsync = require("../utils/catchAsync");
const Order = require("../models/OrderModel");
const AppError = require("../utils/appError");
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
const {
  getReservationForPayment,
  confirmReservationFromPayment
} = require("../services/reservationService");

const finalizeSuccessfulPayment = async ({
  reservationId,
  paymentMethod,
  paymentRef,
  totalPrice,
  accountId,
  serviceIds
}) => {
  const confirmResult = await confirmReservationFromPayment({
    reservationId,
    paymentMethod,
    paymentRef,
    totalPrice,
    accountId,
    serviceIds
  });

  if (!confirmResult.alreadyConfirmed) {
    await Order.create({
      account: accountId,
      service: serviceIds,
      status: "Successful",
      totalPrice,
      paymentMethod
    });
  }

  return confirmResult;
};

const requireReservation = async (req) => {
  const { reservationId, totalPrice, service } = req.body;

  if (!reservationId) {
    throw new AppError("reservationId is required to complete appointment booking", 400);
  }

  const reservation = await getReservationForPayment(reservationId, req.user.id);
  return { reservation, totalPrice, serviceIds: service };
};

const paymentWithCOD = CatchAsync(async (req, res) => {
  const { reservationId, totalPrice, service } = req.body;

  if (reservationId) {
    const confirmResult = await finalizeSuccessfulPayment({
      reservationId,
      paymentMethod: "COD",
      paymentRef: `COD-${Date.now()}`,
      totalPrice,
      accountId: req.user.id,
      serviceIds: service
    });

    return res.status(StatusCodes.OK).json({
      status: "Successfully Order",
      data: {
        appointmentId: confirmResult.appointment?._id || confirmResult.appointment
      }
    });
  }

  await Order.create({
    account: req.user.id,
    service: service,
    paymentMethod: "COD",
    totalPrice: totalPrice
  });
  return res.status(StatusCodes.OK).json({
    status: "Successfully Order"
  });
});

const paymentWithMoMo = CatchAsync(async (req, res) => {
  const { totalPrice, service, reservationId } = req.body;
  const user = await Account.findById(req.user.id);
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: "fail",
      message: "Please Login to order"
    });
  }

  await getReservationForPayment(reservationId, req.user.id);

  const extraDataObj = {
    account: user.id,
    service: service,
    reservationId
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
  const totalPrice = req.body.totalPrice;
  const { reservationId } = req.body;
  const user = await Account.findById(req.user.id);
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: "fail",
      message: "Please Login to order"
    });
  }

  await getReservationForPayment(reservationId, req.user.id);

  const config = zaloPayConfig;
  const embed_data = {
    redirectUrl: "http://localhost:5173/home",
    customData: {
      account: user.id,
      service: req.body.service,
      reservationId
    }
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
    amount: totalPrice,
    description: `Lazada - Payment for the order #${transID}`,
    bank_code: "",
    callback_url:
      "https://9353-14-169-70-31.ngrok-free.app/api/v1/payments/callbackwithZaloPay"
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
  const totalPrice = req.body.totalPrice;
  const { reservationId } = req.body;
  const user = await Account.findById(req.user.id);
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      status: "fail",
      message: "User not found"
    });
  }

  await getReservationForPayment(reservationId, req.user.id);

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
    vnp_Amount: totalPrice,
    vnp_IpAddr: "13.160.92.202",
    vnp_TxnRef: `${reservationId}-${Date.now()}`,
    vnp_OrderInfo: JSON.stringify({
      reservationId,
      account: user.id,
      service: req.body.service
    }),
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

  if (reqMac !== mac) {
    result.return_code = -1;
    result.return_message = "mac not equal";
    return res.status(400).json(result);
  }

  let dataJson = JSON.parse(dataStr);
  let embedData = JSON.parse(dataJson.embed_data);
  const customData = embedData.customData;
  const account = customData.account;
  const services = customData.service;
  const reservationId = customData.reservationId;

  if (!reservationId) {
    throw new AppError("Missing reservationId in payment callback", 400);
  }

  const confirmResult = await finalizeSuccessfulPayment({
    reservationId,
    paymentMethod: "ZaloPay",
    paymentRef: dataJson.app_trans_id,
    totalPrice: dataJson.amount,
    accountId: account,
    serviceIds: services
  });

  return res.status(StatusCodes.OK).json({
    message: "Successful",
    account: account,
    services: services,
    appointmentId: confirmResult.appointment?._id || confirmResult.appointment
  });
});

const callbackMoMo = CatchAsync(async (req, res) => {
  let extraDataObj = {};
  if (req.body.extraData) {
    const decodedExtraData = Buffer.from(
      req.body.extraData,
      "base64"
    ).toString();
    extraDataObj = JSON.parse(decodedExtraData);
  }

  if (!extraDataObj.reservationId) {
    throw new AppError("Missing reservationId in payment callback", 400);
  }

  const confirmResult = await finalizeSuccessfulPayment({
    reservationId: extraDataObj.reservationId,
    paymentMethod: req.body.payType + "-" + req.body.partnerCode,
    paymentRef: req.body.orderId,
    totalPrice: req.body.amount,
    accountId: extraDataObj.account,
    serviceIds: extraDataObj.service
  });

  return res.status(StatusCodes.OK).json({
    status: "success",
    data: {
      appointmentId: confirmResult.appointment?._id || confirmResult.appointment
    }
  });
});

const callbackVnPay = CatchAsync(async (req, res) => {
  const orderInfoRaw = req.query.vnp_OrderInfo;
  if (!orderInfoRaw) {
    throw new AppError("Missing order info in VNPay callback", 400);
  }

  const orderInfo = JSON.parse(orderInfoRaw);
  if (!orderInfo.reservationId) {
    throw new AppError("Missing reservationId in VNPay callback", 400);
  }

  const confirmResult = await finalizeSuccessfulPayment({
    reservationId: orderInfo.reservationId,
    paymentMethod: "VNPay",
    paymentRef: req.query.vnp_TxnRef,
    totalPrice: req.query.vnp_Amount,
    accountId: orderInfo.account,
    serviceIds: orderInfo.service
  });

  return res.status(StatusCodes.OK).json({
    status: "success",
    data: {
      appointmentId: confirmResult.appointment?._id || confirmResult.appointment
    }
  });
});

module.exports = {
  paymentWithMoMo,
  paymentWithCOD,
  paymentWithZaloPay,
  paymentWithVnPay,
  callbackZaloPay,
  callbackMoMo,
  callbackVnPay
};
