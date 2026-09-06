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

// Shared "as of X ago" formatting — used both server-side (page.jsx, safe
// since Server Components never re-run on the client) and inside client
// components whose relative-time text only ever renders after a user
// interaction (e.g. expanding a collapsed panel), never during the initial
// SSR/hydration pass, so there's no mismatch risk either way.
export function formatRelativeTime(ms) {
  const minutes = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr${hours === 1 ? '' : 's'} ago`;
}
