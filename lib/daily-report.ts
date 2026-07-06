// Timezone used to decide which calendar day a Telegram report belongs to, and
// which day counts as "today" in the Dashboard's Daily Report view. Matches the
// bilingual VI | EN UI (Vietnam) used across the OKR/Dashboard module.
export const DASHBOARD_TIMEZONE = "Asia/Ho_Chi_Minh";

// Returns the calendar date (in DASHBOARD_TIMEZONE) that the given instant
// falls on, as a "YYYY-MM-DD" string.
export const reportDateString = (instant: Date = new Date()): string =>
  // en-CA formats as YYYY-MM-DD.
  new Intl.DateTimeFormat("en-CA", {
    timeZone: DASHBOARD_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);

// Returns the calendar date (in DASHBOARD_TIMEZONE) that the given instant falls
// on, as a UTC-midnight Date suitable for a Prisma `@db.Date` column. Using
// UTC-midnight keeps the stored value stable regardless of the server timezone.
export const reportDateFor = (instant: Date = new Date()): Date =>
  new Date(`${reportDateString(instant)}T00:00:00.000Z`);

// Today's report date (UTC-midnight of the current day in DASHBOARD_TIMEZONE).
export const todayReportDate = (): Date => reportDateFor(new Date());

// Today's report date as a "YYYY-MM-DD" string (client-safe: pure Intl, no
// server-only APIs, so this can be imported from client components too).
export const todayReportDateString = (): string => reportDateString(new Date());

// Steps a "YYYY-MM-DD" string forward/back by `deltaDays`. Operates purely on
// the Y/M/D components via Date.UTC so it's immune to the browser's local
// timezone shifting the calendar day.
export const shiftReportDateString = (dateStr: string, deltaDays: number): string => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return shifted.toISOString().slice(0, 10);
};
