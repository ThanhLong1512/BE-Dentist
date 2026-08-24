const { StatusCodes } = require("http-status-codes");
const CatchAsync = require("../utils/catchAsync");
const paymentService = require("../services/paymentService");

const paymentWithCOD = CatchAsync(async (req, res) => {
  const result = await paymentService.payWithCOD({
    accountId: req.user.id,
    reservationId: req.body.reservationId,
    totalPrice: req.body.totalPrice,
    service: req.body.service
  });

  if (result?.appointmentId) {
    return res.status(StatusCodes.OK).json({
      status: "Successfully Order",
      data: { appointmentId: result.appointmentId }
    });
  }

  return res.status(StatusCodes.OK).json({
    status: "Successfully Order"
  });
});

const paymentWithMoMo = CatchAsync(async (req, res) => {
  const data = await paymentService.payWithMoMo({
    accountId: req.user.id,
    reservationId: req.body.reservationId,
    totalPrice: req.body.totalPrice,
    service: req.body.service
  });

  res.status(StatusCodes.OK).json({
    status: "success",
    message: "Get Data MoMo successfully",
    data
  });
});

const paymentWithZaloPay = CatchAsync(async (req, res) => {
  const data = await paymentService.payWithZaloPay({
    accountId: req.user.id,
    reservationId: req.body.reservationId,
    totalPrice: req.body.totalPrice,
    service: req.body.service
  });

  return res.status(StatusCodes.OK).json({
    status: "success",
    message: "Get Data ZaloPay successfully",
    data
  });
});

const paymentWithVnPay = CatchAsync(async (req, res) => {
  const data = await paymentService.payWithVnPay({
    accountId: req.user.id,
    reservationId: req.body.reservationId,
    totalPrice: req.body.totalPrice,
    service: req.body.service
  });

  return res.status(StatusCodes.OK).json({
    status: "success",
    message: "Get Data VnPay successfully",
    data
  });
});

const callbackZaloPay = CatchAsync(async (req, res) => {
  try {
    const result = await paymentService.handleZaloPayCallback({
      dataStr: req.body.data,
      reqMac: req.body.mac
    });

    return res.status(StatusCodes.OK).json({
      message: "Successful",
      account: result.account,
      services: result.services,
      appointmentId: result.appointmentId
    });
  } catch (error) {
    if (error.zaloPayResult) {
      return res.status(400).json(error.zaloPayResult);
    }
    throw error;
  }
});

const callbackMoMo = CatchAsync(async (req, res) => {
  const data = await paymentService.handleMoMoCallback(req.body);

  return res.status(StatusCodes.OK).json({
    status: "success",
    data
  });
});

const callbackVnPay = CatchAsync(async (req, res) => {
  const data = await paymentService.handleVnPayCallback(req.query);

  return res.status(StatusCodes.OK).json({
    status: "success",
    data
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
