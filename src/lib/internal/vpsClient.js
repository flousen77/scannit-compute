import { Redis } from '@upstash/redis';

// Earnings/nodes data now comes from the shared Upstash Redis instance the
// VPS sync job pushes into every ~5 minutes (key `earnings:{uid}`), not from
// a live VPS API call — this uses the same "CLUSTER_KV" Vercel integration
// (and its Vercel-KV-shaped env var names) that clusterStorage.js already
// reads cluster config from; it's the same Redis instance, different key.
function getClient() {
  const url = process.env.CLUSTER_KV_KV_REST_API_URL;
  const token = process.env.CLUSTER_KV_KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error('CLUSTER_KV_KV_REST_API_URL / CLUSTER_KV_KV_REST_API_TOKEN are not set');
  }
  return new Redis({ url, token });
}

// Keyed on (netuid, uid), never uid alone: uid numbers are only unique within
// a subnet and ours collide — Targon is SN4 uid 162, Lium is SN51 uid 162.
// The VPS sync writes this format; it also still writes the old `earnings:162`
// for Targon so this migration could land without a blank dashboard, and that
// dual-write is removed once this is deployed.
function earningsKey(netuid, uid) {
  return `earnings:${netuid}:${uid}`;
}

async function readEarningsPayload(netuid, uid) {
  if (netuid == null) {
    throw new Error(`netuid is required to read earnings for uid ${uid}`);
  }
  const payload = await getClient().get(earningsKey(netuid, uid));
  if (!payload) {
    throw new Error(`No cached earnings for netuid ${netuid} uid ${uid}`);
  }
  return payload;
}

function todayUTCDateStr() {
  return new Date().toISOString().slice(0, 10);
}

// Hours a single daily_series bucket represents: a full 24h for a completed
// day, or actual elapsed hours since UTC midnight if the bucket is today —
// mirrors the sparkline's "still accumulating" treatment so a partial day's
// earnings don't get divided by a full 24h it hasn't had yet.
function hoursForBucket(dateStr, today) {
  if (dateStr !== today) return 24;
  const elapsedMs = Date.now() - Date.parse(`${dateStr}T00:00:00.000Z`);
  return Math.max(elapsedMs / (1000 * 60 * 60), 0);
}

// Sums daily_series entries within [sinceDate, untilDate] (inclusive, UTC
// calendar days). No assumption about how far back daily_series goes —
// `since` in the result reflects whichever day the data actually starts
// from, so a badge/label can tell honestly if it's shorter than requested.
function aggregateRange(dailySeries, sinceDate, untilDate) {
  const today = todayUTCDateStr();
  const bucketsInRange = dailySeries.filter((d) => d.date >= sinceDate && d.date <= untilDate);

  const usd_realized = bucketsInRange.reduce((sum, d) => sum + d.usd_realized, 0);
  const tao_earned = bucketsInRange.reduce((sum, d) => sum + d.tao_earned, 0);
  const fill_count = bucketsInRange.reduce((sum, d) => sum + (d.fill_count ?? 0), 0);
  const hours = bucketsInRange.reduce((sum, d) => sum + hoursForBucket(d.date, today), 0);
  const actualSince = bucketsInRange.length > 0 ? bucketsInRange[0].date : sinceDate;

  return {
    usd_realized,
    tao_earned,
    fill_count,
    hours,
    earnings_per_hour_usd: hours ? usd_realized / hours : null,
    since: actualSince,
    until: untilDate,
  };
}

// `range` is either { window: '24h' | '7d' | '30d' } or
// { since: '<date>', until?: '<date>' } — the "All" window is sent the same
// way it always has been (since=onboardedAt, no until), so it naturally
// resolves through the since/until path below with no separate case needed.
function resolveRangeDates(range) {
  if (range?.since) {
    return { sinceDate: range.since, untilDate: range.until || todayUTCDateStr() };
  }

  const today = todayUTCDateStr();
  if (range?.window === '7d' || range?.window === '30d') {
    const lookbackDays = range.window === '7d' ? 6 : 29;
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - lookbackDays);
    return { sinceDate: since.toISOString().slice(0, 10), untilDate: today };
  }

  return null; // 24h / Live — handled via live_24h directly, not daily_series.
}

// Only namespaced keys are listed. The legacy `earnings:{uid}` key the VPS
// still dual-writes is deliberately skipped, so Targon can't appear twice.
export async function getUids() {
  const client = getClient();
  const keys = (await client.keys('earnings:*')).filter(
    (key) => key.split(':').length === 3
  );
  const payloads = await Promise.all(keys.map((key) => client.get(key)));
  return keys.map((key, i) => {
    const [, netuid, uidNumber] = key.split(':');
    return {
      netuid: Number(netuid),
      uid_number: Number(uidNumber),
      subnet: payloads[i]?.subnet ?? null,
      onboarded_at: payloads[i]?.onboarded_at ?? null,
    };
  });
}

export async function getEarnings(netuid, uid, range) {
  const payload = await readEarningsPayload(netuid, uid);

  if (!range?.since && (!range?.window || range.window === '24h')) {
    return { netuid: Number(netuid), uid: Number(uid), window: '24h', hours: 24, source: 'cache', ...payload.live_24h };
  }

  const { sinceDate, untilDate } = resolveRangeDates(range);
  const aggregate = aggregateRange(payload.daily_series, sinceDate, untilDate);
  return { netuid: Number(netuid), uid: Number(uid), source: 'cache', ...aggregate };
}

export async function getNodes(netuid, uid) {
  const payload = await readEarningsPayload(netuid, uid);
  return {
    netuid: Number(netuid),
    uid: Number(uid),
    nodes: payload.nodes ? [payload.nodes] : [],
    combined: { avg_cards: payload.nodes?.avg_cards ?? null },
    source: 'cache',
  };
}

export async function getDailyEarnings(netuid, uid, days = 30) {
  const payload = await readEarningsPayload(netuid, uid);
  return { series: payload.daily_series.slice(-days) };
}

// Raw cached payload — used for onboarded_at / last_synced_at without a
// separate call, since the earnings dashboard's initial load needs both
// alongside the earnings/nodes/daily-series data it already fetches.
export async function getEarningsSnapshot(netuid, uid) {
  return readEarningsPayload(netuid, uid);
}

// Consolidated market-rate comparison, pushed by a separate VPS job (not the
// per-uid earnings sync) twice daily. Same read-only, push-based pattern —
// this file never calls any of the five backend rate pipelines directly.
export async function getMarketRates() {
  const payload = await getClient().get('market_rates:latest');
  return payload ?? null;
}
