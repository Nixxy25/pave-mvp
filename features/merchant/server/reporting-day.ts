const LAGOS_OFFSET_MS = 60 * 60 * 1000; // Africa/Lagos is UTC+1 with no daylight saving.
const DAY_MS = 24 * LAGOS_OFFSET_MS;

// Returns the UTC instants for the start of the reporting day containing `now`, and of the day before.
export function reportingDayBounds(now: Date = new Date()) {
  const shifted = now.getTime() + LAGOS_OFFSET_MS;
  const startOfToday = Math.floor(shifted / DAY_MS) * DAY_MS - LAGOS_OFFSET_MS;
  return {
    startOfToday: new Date(startOfToday),
    startOfYesterday: new Date(startOfToday - DAY_MS),
  };
}
