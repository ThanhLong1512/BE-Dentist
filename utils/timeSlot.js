const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") {
    throw new Error("Invalid time string");
  }
  const [hh, mm] = timeStr.split(":").map((x) => Number(x));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }
  return hh * 60 + mm;
};

const formatMinutesToTime = (minutes) => {
  const m = Math.floor(minutes);
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hh)}:${pad(mm)}`;
};

const addMinutes = (minutes, delta) => minutes + delta;

const rangesOverlap = (aStart, aEnd, bStart, bEnd) => {
  // Overlap khi [aStart,aEnd] va [bStart,bEnd] khong tách rời.
  return aStart < bEnd && bStart < aEnd;
};

const getDayOfWeekString = (date) => {
  // JS: 0=Sunday ... 6=Saturday.
  const map = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return map[date.getDay()];
};

const subtractBreaks = (workStartMin, workEndMin, breaks = []) => {
  // breaks: [{ startTime: "12:00", endTime: "13:00" }, ...]
  const parsed = breaks
    .filter((b) => b?.startTime && b?.endTime)
    .map((b) => ({
      start: parseTimeToMinutes(b.startTime),
      end: parseTimeToMinutes(b.endTime),
    }))
    .filter((b) => b.end > b.start)
    .sort((x, y) => x.start - y.start);

  const segments = [];
  let cursor = workStartMin;

  for (const br of parsed) {
    if (br.start > cursor) {
      segments.push({ start: cursor, end: Math.min(br.start, workEndMin) });
    }
    cursor = Math.max(cursor, br.end);
    if (cursor >= workEndMin) break;
  }

  if (cursor < workEndMin) {
    segments.push({ start: cursor, end: workEndMin });
  }

  return segments;
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

module.exports = {
  parseTimeToMinutes,
  formatMinutesToTime,
  addMinutes,
  rangesOverlap,
  subtractBreaks,
  getDayOfWeekString,
  clamp,
};

