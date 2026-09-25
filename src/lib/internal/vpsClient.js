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

// What the provider says a node EARNED on a day, as opposed to what we
// banked. Lium reports this per executor; Targon reports nothing of the kind,
// so this returns null there and every accrual figure downstream stays null.
//
// null and 0 are different answers: "no reporting exists" must fall back to
// cash, while "reported nothing" is a real zero that should drag a rate down.
function earnedForNode(entry, nodeKey) {
  const reported = entry?.node_reported_usd;
  if (!reported) return null;
  if (nodeKey) return reported[nodeKey] ?? 0;
  return Object.values(reported).reduce((sum, usd) => sum + usd, 0);
}

function sumEarned(entries, nodeKey) {
  let total = 0;
  let sawAny = false;
  for (const entry of entries) {
    const usd = earnedForNode(entry, nodeKey);
    if (usd == null) continue;
    sawAny = true;
    total += usd;
  }
  return sawAny ? total : null;
}

// Earned over the trailing 24 hours, which straddles two UTC calendar days.
// Today's row is taken whole (it only covers the hours elapsed so far) and
// yesterday's is taken pro rata for the rest, so this lines up with the 24h
// window rather than with "since midnight".
function earnedTrailing24h(dailySeries, nodeKey) {
  const today = todayUTCDateStr();
  const byDate = new Map((dailySeries || []).map((d) => [d.date, d]));

  const todayEarned = earnedForNode(byDate.get(today), nodeKey);
  if (todayEarned == null) return null;

  const elapsed = hoursForBucket(today, today);
  const yesterday = new Date(Date.parse(`${today}T00:00:00.000Z`) - 86400000)
    .toISOString()
    .slice(0, 10);
  const yesterdayEarned = earnedForNode(byDate.get(yesterday), nodeKey);
  const remainder =
    yesterdayEarned == null ? 0 : (yesterdayEarned * Math.max(24 - elapsed, 0)) / 24;

  return todayEarned + remainder;
}

// The first day this cluster ever realized revenue, across the whole series
// — not just the requested window.
//
// Hours before it must not count toward an earnings rate. Revenue cannot be
// realized before the first conversion, so charging those hours against the
// rate measures nothing: Lium earned $93.42 and $424.63 on 09-12 and 09-13
// by its own reporting, but its route was disabled, so the dashboard saw two
// zero days. Those 48 hours halved its apparent rate and produced a $9,245
// monthly loss that was an artefact of the switch being off.
//
// A zero day AFTER the first conversion is different — that is real downtime
// and must drag the rate down, which is why this looks for the first realized
// day in the full series rather than simply skipping leading zeros in range.
function firstRealizedDate(dailySeries) {
  for (const entry of dailySeries) {
    if (entry.usd_realized > 0) return entry.date;
  }
  return null;
}

// The first day a node reports anything is its onboarding day: it existed
// for part of that day and earned accordingly, and nothing in this payload
// says which part. Charging it a full 24h understates its rate exactly as
// the pre-conversion hours did — the third RTX joined at 22:32 on 09-18,
// earned $2.53 in its remaining 90 minutes, and read $0.10/GPU-hr against
// $1.52 actual, which the card rendered as -1320% margin.
//
// So the rate window starts at the node's first COMPLETE day. The lost
// crumb only leaves the rate; usd_realized sums the whole range and is
// untouched. While that onboarding day is all there is, it is kept — a
// diluted number beats no number on a node someone just added.
function nodeReportedEntries(dailySeries, nodeKey) {
  return dailySeries.filter((entry) => earnedForNode(entry, nodeKey));
}

function nodeRateStartDate(dailySeries, nodeKey) {
  if (!nodeKey) return null;
  const reported = nodeReportedEntries(dailySeries, nodeKey);
  if (reported.length <= 1) return reported[0]?.date ?? null;
  return reported[1].date;
}

// The first day a node reported anything, which is the earliest it can have
// contributed to any cash at all.
function firstNodeReportedDate(dailySeries, nodeKey) {
  if (!nodeKey) return null;
  return nodeReportedEntries(dailySeries, nodeKey)[0]?.date ?? null;
}

// Clip a set of day buckets to the node's own lifetime.
//
// nodeShareOverRange is a ratio: this node's reported earnings over every
// node's, across the days given. Hand it days from before the node existed and
// the denominator carries a month of other machines' history while the
// numerator carries hours, so the node comes out with a small share of a large
// number instead of a fair share of a small one.
//
// Chirag RTX made this concrete. It went live at 01:34 on 2026-09-25, earned
// $94.71 of idle emission that day and nothing before, and over a 30-day window
// that computed as 1.308% of everything the uid had realized that month. The
// sparkline then drew a week of history for a machine thirteen hours old, and
// USD Realized credited it with cash produced before it was plugged in.
//
// Clipped, the same node is measured against the one day it existed: 14.8% of
// that day's earnings, applied to that day's cash.
function clipToNodeLifetime(buckets, dailySeries, nodeKey) {
  if (!nodeKey) return buckets;
  const first = firstNodeReportedDate(dailySeries, nodeKey);
  if (!first) return buckets;
  return buckets.filter((d) => d.date >= first);
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
  const rangeBuckets = dailySeries.filter((d) => d.date >= sinceDate && d.date <= untilDate);

  // Clipped to the node's lifetime first: a share computed against days the
  // node did not exist is a ratio with mismatched terms. See clipToNodeLifetime.
  const bucketsInRange = clipToNodeLifetime(rangeBuckets, dailySeries, nodeKey);

  // One share for the whole (clipped) range, so it cannot matter which day
  // inside it a given sale settled on.
  const share = nodeShareOverRange(bucketsInRange, nodeKey);
  const scale = share ?? 0;

  const usd_realized = bucketsInRange.reduce((sum, d) => sum + d.usd_realized, 0) * scale;
  const tao_earned = bucketsInRange.reduce((sum, d) => sum + d.tao_earned, 0) * scale;
  const fill_count = bucketsInRange.reduce((sum, d) => sum + (d.fill_count ?? 0), 0);

  // Only hours the cluster could actually have realized revenue in, and for
  // a node-scoped cluster, only hours it existed for.
  const firstRealized = firstRealizedDate(dailySeries);
  const nodeStart = nodeRateStartDate(dailySeries, nodeKey);
  const rateStart =
    nodeStart && firstRealized && nodeStart > firstRealized ? nodeStart : firstRealized;
  const earningBuckets = rateStart
    ? bucketsInRange.filter((d) => d.date >= rateStart)
    : [];
  const hours = earningBuckets.reduce((sum, d) => sum + hoursForBucket(d.date, today), 0);

  // `since` reports the window actually measured, so a badge can say "SINCE
  // SEP 14" rather than implying seven days of data that don't exist.
  const actualSince = earningBuckets.length > 0
    ? earningBuckets[0].date
    : (bucketsInRange.length > 0 ? bucketsInRange[0].date : sinceDate);

  // Summed over `earningBuckets`, NOT over the whole range: it has to share a
  // denominator with `hours` or the rate is earnings from six days divided by
  // four days of clock.
  const usd_earned = sumEarned(earningBuckets, nodeKey);

  return {
    usd_realized,
    usd_earned,
    tao_earned,
    fill_count,
    hours,
    earnings_per_hour_usd: hours ? usd_realized / hours : null,
    earnings_per_hour_usd_earned:
      hours && usd_earned != null ? usd_earned / hours : null,
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
    // Not scaled by `share`: node_reported_usd is already per machine, so it
    // is a direct read rather than a split of a cluster total.
    const usd_earned = earnedTrailing24h(payload.daily_series || [], nodeKey);

    return {
      netuid: Number(netuid), uid: Number(uid), node_key: nodeKey,
      node_share: share, window: '24h', hours: 24, source: 'cache', ...scaled,
      usd_earned,
      earnings_per_hour_usd_earned: usd_earned == null ? null : usd_earned / 24,
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

// `nodeKey` scales the series to one machine's share, so the chart and the
// figures beside it describe the same thing. Without it both Lium cards drew
// the whole UID's revenue — an identical $535.56 spike on each — while their
// stat cards showed $257.68 and $307.50. A chart that disagrees with the
// number under it is worse than no chart.
//
// One share across the window rather than per-day, matching aggregateRange:
// the shape stays the uid's and the total becomes the node's, so the series
// sums to the same figure the card reports.
export async function getDailyEarnings(netuid, uid, days = 30, nodeKey = null) {
  const payload = await readEarningsPayload(netuid, uid);
  const windowed = payload.daily_series.slice(-days);

  if (!nodeKey) return { series: windowed };

  // Days before the node existed are not zero-earning days for it, they are
  // days it has no claim on. Dropping them keeps the chart a timeline instead
  // of spreading one day's revenue backwards across a month.
  const series = clipToNodeLifetime(windowed, payload.daily_series, nodeKey);

  const share = nodeShareOverRange(series, nodeKey);
  if (share == null) {
    // No reported split for this window: show nothing rather than the uid's
    // revenue, which would overstate a single machine by the whole cluster.
    return { series: series.map((d) => ({ ...d, usd_realized: 0, tao_earned: 0 })), node_share: null };
  }

  return {
    series: series.map((d) => ({
      ...d,
      usd_realized: d.usd_realized * share,
      tao_earned: d.tao_earned * share,
    })),
    node_share: share,
  };
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
