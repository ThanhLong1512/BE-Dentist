const normalizeSlotDate = dateInput => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid appointment date");
  }
  date.setHours(0, 0, 0, 0);
  return date;
};

const getSlotDateKey = dateInput => {
  const date = normalizeSlotDate(dateInput);
  return date.toISOString().slice(0, 10);
};

const getDayRange = dateInput => {
  const start = normalizeSlotDate(dateInput);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

module.exports = {
  normalizeSlotDate,
  getSlotDateKey,
  getDayRange
};
