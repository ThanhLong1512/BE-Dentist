const { StatusCodes } = require("http-status-codes");
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
} = require("./reservationService");

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

const payWithCOD = async ({ accountId, reservationId, totalPrice, service }) => {
  if (reservationId) {
    const confirmResult = await finalizeSuccessfulPayment({
      reservationId,
      paymentMethod: "COD",
      paymentRef: `COD-${Date.now()}`,
      totalPrice,
      accountId,
      serviceIds: service
    });

    return {
      appointmentId: confirmResult.appointment?._id || confirmResult.appointment
    };
  }

  await Order.create({
    account: accountId,
    service,
    paymentMethod: "COD",
    totalPrice
  });

  return null;
};

const payWithMoMo = async ({ accountId, reservationId, totalPrice, service }) => {
  const user = await Account.findById(accountId);
  if (!user) {
    throw new AppError("Please Login to order", StatusCodes.UNAUTHORIZED);
  }

  await getReservationForPayment(reservationId, accountId);

  const extraDataObj = {
    account: user.id,
    service,
    reservationId
  };

  const partnerCode = momoConfig.partnerCode;
  const accessKey = momoConfig.accessKey;
  const secretkey = momoConfig.secretKey;
  const requestId = partnerCode + new Date().getTime();
  const orderId = requestId;
  const orderInfo = momoConfig.orderInfo;
  const redirectUrl = momoConfig.redirectUrl;
  const ipnUrl = momoConfig.ipnUrl;
  const amount = totalPrice;
  const requestType = momoConfig.requestType;
  const extraData = Buffer.from(JSON.stringify(extraDataObj)).toString("base64");

  const rawSignature =
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
  const signature = crypto
    .createHmac("sha256", secretkey)
    .update(rawSignature)
    .digest("hex");
  const requestBody = JSON.stringify({
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
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

  return { payUrl: response.data.payUrl };
};

const payWithZaloPay = async ({
  accountId,
  reservationId,
  totalPrice,
  service
}) => {
  const user = await Account.findById(accountId);
  if (!user) {
    throw new AppError("Please Login to order", StatusCodes.UNAUTHORIZED);
  }

  await getReservationForPayment(reservationId, accountId);

  const config = zaloPayConfig;
  const embed_data = {
    redirectUrl: "http://localhost:5173/home",
    customData: {
      account: user.id,
      service,
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

  return { payUrl: result.data.order_url };
};

const payWithVnPay = async ({
  accountId,
  reservationId,
  totalPrice,
  service
}) => {
  const user = await Account.findById(accountId);
  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  await getReservationForPayment(reservationId, accountId);

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
      service
    }),
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl:
      "https://1643-14-186-89-251.ngrok-free.app/api/v1/payments/callbackwithVNPay",
    vnp_Locale: VnpLocale.VN,
    vnp_CreateDate: dateFormat(new Date()),
    vnp_ExpireDate: dateFormat(tomorrow)
  });

  return { paymentUrl };
};

const handleZaloPayCallback = async ({ dataStr, reqMac }) => {
  const mac = CryptoJS.HmacSHA256(dataStr, zaloPayConfig.key2).toString();

  if (reqMac !== mac) {
    const err = new AppError("mac not equal", 400);
    err.zaloPayResult = {
      return_code: -1,
      return_message: "mac not equal"
    };
    throw err;
  }

  const dataJson = JSON.parse(dataStr);
  const embedData = JSON.parse(dataJson.embed_data);
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

  return {
    account,
    services,
    appointmentId: confirmResult.appointment?._id || confirmResult.appointment
  };
};

const handleMoMoCallback = async body => {
  let extraDataObj = {};
  if (body.extraData) {
    const decodedExtraData = Buffer.from(body.extraData, "base64").toString();
    extraDataObj = JSON.parse(decodedExtraData);
  }

  if (!extraDataObj.reservationId) {
    throw new AppError("Missing reservationId in payment callback", 400);
  }

  const confirmResult = await finalizeSuccessfulPayment({
    reservationId: extraDataObj.reservationId,
    paymentMethod: body.payType + "-" + body.partnerCode,
    paymentRef: body.orderId,
    totalPrice: body.amount,
    accountId: extraDataObj.account,
    serviceIds: extraDataObj.service
  });

  return {
    appointmentId: confirmResult.appointment?._id || confirmResult.appointment
  };
};

const handleVnPayCallback = async query => {
  const orderInfoRaw = query.vnp_OrderInfo;
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
    paymentRef: query.vnp_TxnRef,
    totalPrice: query.vnp_Amount,
    accountId: orderInfo.account,
    serviceIds: orderInfo.service
  });

  return {
    appointmentId: confirmResult.appointment?._id || confirmResult.appointment
  };
};

module.exports = {
  finalizeSuccessfulPayment,
  payWithCOD,
  payWithMoMo,
  payWithZaloPay,
  payWithVnPay,
  handleZaloPayCallback,
  handleMoMoCallback,
  handleVnPayCallback
};
