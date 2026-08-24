const { StatusCodes } = require("http-status-codes");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { generateAvailableSlots } = require("../services/slotGenerationService");
const {
  getCachedSlots,
  setCachedSlots,
} = require("../services/slotCacheService");

exports.getAvailableSlots = catchAsync(async (req, res) => {
  const { date, serviceId, employeeId } = req.query;

  if (!date) {
    throw new AppError("Please provide query param: date", 400);
  }
  if (!serviceId) {
    throw new AppError("Please provide query param: serviceId", 400);
  }

  const dateObj = new Date(date);
  if (Number.isNaN(dateObj.getTime())) {
    throw new AppError("Invalid date format", 400);
  }

  const cacheEmployeeId = employeeId ? String(employeeId) : "all";

  const cached = await getCachedSlots({
    date: dateObj,
    serviceId,
    employeeId: cacheEmployeeId,
  });
  if (cached) {
    return res.status(StatusCodes.OK).json({
      status: "success",
      data: cached,
      meta: { cached: true },
    });
  }

  const slots = await generateAvailableSlots({
    date: dateObj,
    serviceId,
    employeeId: employeeId || undefined,
  });

  await setCachedSlots({
    date: dateObj,
    serviceId,
    employeeId: cacheEmployeeId,
    slots,
  });

  return res.status(StatusCodes.OK).json({
    status: "success",
    data: slots,
    meta: { cached: false, count: slots.length },
  });
});

