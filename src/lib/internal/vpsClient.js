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

// A node's share of its uid's revenue ACROSS a set of days, weighted by what
// the provider reported it earned on each.
//
// Deliberately not a per-day ratio applied to that same day's revenue. Money
// appears in daily_series under the date of the Kraken SALE, while node
// shares are keyed by the date the provider says it was EARNED. Those are
// different date spaces. Targon hides the difference by selling every six
// hours; Lium's first sale covers ~2.5 days of accumulation, and splitting
// it by the settlement day's ratio alone would put roughly $13 of $507 on
// the wrong machine.
//
// Weighting across the whole range never has to line the two up: it asks
// "of everything this cluster earned in this window, how much was this
// machine" and applies that to everything realized in the window.
//
// Returns null when no day in range reports anything — "we cannot divide
// this" is not the same as "this machine earned nothing", and only the
// former should suppress a figure rather than show zero.
function nodeShareOverRange(entries, nodeKey) {
  if (!nodeKey) return 1;

  let nodeTotal = 0;
  let allTotal = 0;
  for (const entry of entries) {
    const reported = entry?.node_reported_usd;
    if (!reported) continue;
    for (const [key, usd] of Object.entries(reported)) {
      allTotal += usd;
      if (key === nodeKey) nodeTotal += usd;
    }
  }

  if (allTotal <= 0) return null;
  return nodeTotal / allTotal;
}

// The 24h window reads live_24h, which has no date range of its own. Two
// days of reported data are used rather than one so the weighting doesn't
// swing on a partial day that has only had a few validator cycles.
const LIVE_SHARE_LOOKBACK_DAYS = 2;

function liveNodeShare(dailySeries, nodeKey) {
  if (!nodeKey) return 1;
  const withReports = dailySeries.filter((d) => d?.node_reported_usd);
  return nodeShareOverRange(withReports.slice(-LIVE_SHARE_LOOKBACK_DAYS), nodeKey);
}

// Sums daily_series entries within [sinceDate, untilDate] (inclusive, UTC
// calendar days). No assumption about how far back daily_series goes —
// `since` in the result reflects whichever day the data actually starts
// from, so a badge/label can tell honestly if it's shorter than requested.
//
// `nodeKey` scopes the aggregate to one physical machine, using a single
// share computed across the whole range (see nodeShareOverRange). Because
// every node's share over a given range sums to 1, node-scoped clusters over
// the same uid sum to exactly that uid's realized revenue. No double
// counting, no invented money.
function aggregateRange(dailySeries, sinceDate, untilDate, nodeKey = null) {
  const today = todayUTCDateStr();
  const bucketsInRange = dailySeries.filter((d) => d.date >= sinceDate && d.date <= untilDate);

  // One share for the whole range, so it cannot matter which day inside it
  // a given sale settled on.
  const share = nodeShareOverRange(bucketsInRange, nodeKey);
  const scale = share ?? 0;

  const usd_realized = bucketsInRange.reduce((sum, d) => sum + d.usd_realized, 0) * scale;
  const tao_earned = bucketsInRange.reduce((sum, d) => sum + d.tao_earned, 0) * scale;
  const fill_count = bucketsInRange.reduce((sum, d) => sum + (d.fill_count ?? 0), 0);
  const hours = bucketsInRange.reduce((sum, d) => sum + hoursForBucket(d.date, today), 0);
  const actualSince = bucketsInRange.length > 0 ? bucketsInRange[0].date : sinceDate;

  return {
    usd_realized,
    tao_earned,
    fill_count,
    hours,
    earnings_per_hour_usd: hours ? usd_realized / hours : null,
    node_share: share,
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

export async function getEarnings(netuid, uid, range, nodeKey = null) {
  const payload = await readEarningsPayload(netuid, uid);

  if (!range?.since && (!range?.window || range.window === '24h')) {
    const share = liveNodeShare(payload.daily_series || [], nodeKey);
    const live = payload.live_24h;
    // A node-scoped cluster with no share yet reports null rather than the
    // whole uid's revenue — showing one machine the cluster total would be
    // the exact over-count this scoping exists to prevent.
    const scaled = share == null
      ? { ...live, usd_realized: null, tao_earned: null, earnings_per_hour_usd: null }
      : {
          ...live,
          usd_realized: live.usd_realized * share,
          tao_earned: live.tao_earned * share,
          earnings_per_hour_usd:
            live.earnings_per_hour_usd == null ? null : live.earnings_per_hour_usd * share,
        };
    return {
      netuid: Number(netuid), uid: Number(uid), node_key: nodeKey,
      node_share: share, window: '24h', hours: 24, source: 'cache', ...scaled,
    };
  }

  const { sinceDate, untilDate } = resolveRangeDates(range);
  const aggregate = aggregateRange(payload.daily_series, sinceDate, untilDate, nodeKey);
  return {
    netuid: Number(netuid), uid: Number(uid), node_key: nodeKey, source: 'cache', ...aggregate,
  };
}

// `nodeKey` narrows to one machine, so the cluster's per-GPU maths divides by
// that machine's cards (8) rather than the uid's total (16). Getting this
// wrong is how a per-GPU rate silently doubles.
export async function getNodes(netuid, uid, nodeKey = null) {
  const payload = await readEarningsPayload(netuid, uid);
  const list = payload.nodes_list ?? (payload.nodes ? [payload.nodes] : []);

  if (nodeKey) {
    const node = list.find((n) => n.node_key === nodeKey) ?? null;
    return {
      netuid: Number(netuid),
      uid: Number(uid),
      node_key: nodeKey,
      nodes: node ? [node] : [],
      combined: { avg_cards: node?.cards ?? null },
      source: 'cache',
    };
  }

  return {
    netuid: Number(netuid),
    uid: Number(uid),
    node_key: null,
    nodes: list,
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

// The machines currently reported under a uid, for the cluster form's node
// picker. Read straight from the cached payload, so it reflects whatever the
// provider last reported rather than anything typed by hand.
export async function getNodeOptions(netuid, uid) {
  const payload = await readEarningsPayload(netuid, uid);
  return (payload.nodes_list ?? []).map((n) => ({
    node_key: n.node_key,
    compute_type: n.compute_type,
    cards: n.cards,
    location_id: n.location_id,
  }));
}

// Consolidated market-rate comparison, pushed by a separate VPS job (not the
// per-uid earnings sync) twice daily. Same read-only, push-based pattern —
// this file never calls any of the five backend rate pipelines directly.
export async function getMarketRates() {
  const payload = await getClient().get('market_rates:latest');
  return payload ?? null;
}
