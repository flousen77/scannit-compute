function pad2(n) {
  return String(n).padStart(2, '0');
}

function isoDate(y, m, d) {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

// UTC-based, matching the date-bucketing convention used throughout this
// codebase (vpsClient.js, EarningsSparkline, etc). These only ever run
// inside client-side effects, never during SSR render, so there's no
// hydration-mismatch risk from reading the live clock directly here.
export function currentMonthRange() {
  const now = new Date();
  return {
    since: isoDate(now.getUTCFullYear(), now.getUTCMonth(), 1),
    until: isoDate(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  };
}

export function lastMonthRange() {
  const now = new Date();
  const firstOfThisMonthMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const lastDayOfPrevMonth = new Date(firstOfThisMonthMs - 1);
  const y = lastDayOfPrevMonth.getUTCFullYear();
  const m = lastDayOfPrevMonth.getUTCMonth();
  return {
    since: isoDate(y, m, 1),
    until: isoDate(y, m, lastDayOfPrevMonth.getUTCDate()),
  };
}
