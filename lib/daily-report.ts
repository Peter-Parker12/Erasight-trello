// Timezone used to decide which calendar day a Telegram report belongs to, and
// which day counts as "today" in the Dashboard's Daily Report view. Matches the
// bilingual VI | EN UI (Vietnam) used across the OKR/Dashboard module.
export const DASHBOARD_TIMEZONE = "Asia/Ho_Chi_Minh";

// Returns the calendar date (in DASHBOARD_TIMEZONE) that the given instant falls
// on, as a UTC-midnight Date suitable for a Prisma `@db.Date` column. Using
// UTC-midnight keeps the stored value stable regardless of the server timezone.
export const reportDateFor = (instant: Date = new Date()): Date => {
  // en-CA formats as YYYY-MM-DD, which we can feed straight back as a UTC date.
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: DASHBOARD_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);

  return new Date(`${ymd}T00:00:00.000Z`);
};

// Today's report date (UTC-midnight of the current day in DASHBOARD_TIMEZONE).
export const todayReportDate = (): Date => reportDateFor(new Date());
