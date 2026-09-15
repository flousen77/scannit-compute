'use client';

import { useEffect, useState } from 'react';
import EarningsStat from './EarningsStat';
import EarningsSparkline from './EarningsSparkline';
import TimeWindowToggle from './TimeWindowToggle';
import { getWindowConfig } from '@/lib/internal/windows';
import {
  netuidFor,
  shortNodeId,
  SUBNET_PLATFORM_LABEL,
  HOSTING_MODE_LABEL,
  HOSTING_MODE_BADGE_CLASS,
  DELAYED_PAYOUT_NOTE,
} from '@/lib/internal/clusterOptions';
import {
  deriveSubnetEarnings,
  deriveContractEarnings,
  computeProfitMetrics,
  HOURS_PER_MONTH,
} from '@/lib/internal/clusterEarnings';

const numberFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });
const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function buildRangeQuery(windowValue, onboardedAt, customRange) {
  if (windowValue === 'custom' && customRange) {
    const params = new URLSearchParams({ since: customRange.since, until: customRange.until });
    return params.toString();
  }
  return windowValue === 'all'
    ? `since=${encodeURIComponent(onboardedAt)}`
    : `window=${windowValue}`;
}

function ConvertToLiveControl({ onConvertTo }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-[#94a3b8] border border-white/10 rounded-full px-3 py-1.5 hover:text-white hover:border-white/30 transition-colors"
      >
        Convert to live ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-10 bg-brand-panel border border-white/10 rounded-lg shadow-xl overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onConvertTo('subnet');
            }}
            className="block w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            → Subnet
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onConvertTo('contract');
            }}
            className="block w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            → Enterprise
          </button>
        </div>
      )}
    </div>
  );
}

function ClusterHeader({ cluster, children, onEdit, onDelete, onConvertTo, onToggleCollapsed }) {
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          {onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-expanded
              title="Collapse"
              className="text-[#94a3b8] hover:text-white transition-colors"
            >
              ▾
            </button>
          )}
          {cluster.name}
        </h2>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-[#94a3b8]">
            {cluster.computeType}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${HOSTING_MODE_BADGE_CLASS[cluster.hostingMode]}`}
          >
            {HOSTING_MODE_LABEL[cluster.hostingMode]}
          </span>
          {cluster.subnet?.platform && (
            <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-[#94a3b8] capitalize">
              {SUBNET_PLATFORM_LABEL[cluster.subnet.platform] ?? cluster.subnet.platform}
              {' · UID '}
              {cluster.subnet.uidNumber}
              <DelayedPayoutHint platform={cluster.subnet.platform} />
            </span>
          )}
          {/* Truncated because the full uuid is unreadable at this size, but
              the first and last groups are enough to match a row in the
              provider portal. Full id on hover for copy/paste. */}
          {cluster.subnet?.nodeId && (
            <span
              className="text-xs px-2 py-0.5 rounded-full border border-teal-400/30 bg-teal-400/10 text-teal-400 font-mono"
              title={cluster.subnet.nodeId}
            >
              {shortNodeId(cluster.subnet.nodeId)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {children}
        {cluster.hostingMode === 'forecast' && onConvertTo && (
          <ConvertToLiveControl onConvertTo={onConvertTo} />
        )}
        <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
          <button type="button" onClick={onEdit} className="hover:text-white transition-colors">
            Edit
          </button>
          <span className="text-white/10">|</span>
          <button type="button" onClick={onDelete} className="hover:text-red-400 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function formatBadgeDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function WindowBadge({ activeWindow, customRange, earnings, onboardedAt }) {
  const windowConfig = getWindowConfig(activeWindow);
  let label = windowConfig.badgeLabel;
  if (activeWindow === 'custom' && customRange?.since && customRange?.until) {
    label = `${formatBadgeDate(customRange.since)} – ${formatBadgeDate(customRange.until)}`;
  } else if (
    activeWindow === 'all' &&
    earnings?.since &&
    onboardedAt &&
    earnings.since !== onboardedAt
  ) {
    // The cache's earliest data for this uid starts later than the cluster's
    // true onboarding date — don't call a shorter span "ALL TIME".
    label = `SINCE ${formatBadgeDate(earnings.since)}`;
  }
  return (
    <span
      className={`text-xs font-mono uppercase tracking-wide rounded-full px-3 py-1 border ${
        activeWindow === '24h'
          ? 'text-[#06b6d4] border-[#06b6d4]/30 bg-[#06b6d4]/10'
          : 'text-[#94a3b8] border-white/10'
      }`}
    >
      {label}
    </span>
  );
}

// Shared by subnet and contract cards so cost/profit math can't drift between
// the two — both feed it an earnings-per-GPU-per-hour figure, however derived.
function EarningsRows({ taoEarned, usdRealized, earningsPerGpuPerHour, cardCount, cost, loading }) {
  const {
    revenuePerMonthProjectedTotal: earningsPerMonthProjected,
    costPerGpuPerHour,
    profitPerGpuPerHour,
    marginPercent,
    profitPerMonthProjected,
  } = computeProfitMetrics({ earningsPerGpuPerHour, cardCount, cost });

  return (
    <>
      <div
        className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-opacity ${
          loading ? 'opacity-50' : ''
        }`}
      >
        <EarningsStat
          label="TAO Earned"
          value={taoEarned != null ? numberFmt.format(taoEarned) : '—'}
          unit={taoEarned != null ? 'TAO' : undefined}
        />
        <EarningsStat
          label="Earnings / hr"
          value={earningsPerGpuPerHour != null ? usdFmt.format(earningsPerGpuPerHour) : '—'}
          unit="/hr"
        />
        <EarningsStat label="USD Realized" value={usdFmt.format(usdRealized)} accent />
        <EarningsStat
          label="MRR (Projected)"
          value={earningsPerMonthProjected != null ? usdFmt.format(earningsPerMonthProjected) : '—'}
          unit="/mo"
        />
      </div>

      {cost && (
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 transition-opacity ${
            loading ? 'opacity-50' : ''
          }`}
        >
          <EarningsStat
            label="Cost / hr"
            value={costPerGpuPerHour != null ? usdFmt.format(costPerGpuPerHour) : '—'}
            unit="/hr"
          />
          <EarningsStat
            label="Profit / hr"
            value={profitPerGpuPerHour != null ? usdFmt.format(profitPerGpuPerHour) : '—'}
            unit="/hr"
          />
          <EarningsStat
            label="Margin %"
            value={marginPercent != null ? `${marginPercent.toFixed(1)}%` : '—'}
          />
          <EarningsStat
            label="Profit / Mo (Projected)"
            value={profitPerMonthProjected != null ? usdFmt.format(profitPerMonthProjected) : '—'}
            unit="/mo"
            tone={profitPerMonthProjected != null ? (profitPerMonthProjected >= 0 ? 'positive' : 'negative') : undefined}
          />
        </div>
      )}
    </>
  );
}


// A small (i) beside the platform badge on clusters whose revenue lands later
// than it was earned. It matters most in the collapsed view: once cards are
// one row each you scan down comparing them, and a Lium row sitting under a
// Targon row invites reading them as the same kind of number when one trails
// reality by two days.
function DelayedPayoutHint({ platform }) {
  const note = DELAYED_PAYOUT_NOTE[platform];
  if (!note) return null;
  return (
    <span
      title={note}
      aria-label={note}
      className="inline-flex items-center justify-center w-3.5 h-3.5 ml-1 rounded-full border border-current text-[9px] font-semibold leading-none cursor-help align-middle"
    >
      i
    </span>
  );
}


// "14h" / "3d 2h" — a duration you read at a glance, not a timestamp you
// have to subtract in your head.
function formatDuration(sinceIso, nowMs) {
  if (!sinceIso) return null;
  // Lium returns naive UTC timestamps with no zone suffix; parsed as-is they
  // would be read as local time and come out hours wrong.
  const iso = /[Zz]|[+-]\d{2}:\d{2}$/.test(sinceIso) ? sinceIso : `${sinceIso}Z`;
  const ms = nowMs - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return null;
  const hours = Math.floor(ms / 3600000);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

// Rented/idle plus how long it has held. This is the operational fact the
// earnings figures can't show: a node idle for three days is about to drag a
// week's numbers down, and nothing else on the card says so yet.
function RentalStatus({ node, nowMs, compact = false }) {
  if (!node?.rental_state) return null;
  const rented = node.rental_state === 'rented';
  const held = formatDuration(node.rental_since, nowMs);

  // The listed price is not what an active rental pays — Lium locks the rate
  // at booking — so when they differ, show both rather than the one that
  // isn't being paid.
  const locked = rented ? node.rental_rate_per_gpu : null;
  const listed = node.price_per_gpu;
  const priceDiffers = locked != null && listed != null && Math.abs(locked - listed) > 0.005;

  const tone = rented
    ? 'text-teal-400 border-teal-400/30 bg-teal-400/10'
    : 'text-amber-400 border-amber-400/30 bg-amber-400/10';

  const title = priceDiffers
    ? `Listed at $${listed.toFixed(2)}/GPU-hr, but this rental is locked at $${locked.toFixed(2)} — Lium fixes the rate when a rental is booked, so a price change only applies to the next one.`
    : undefined;

  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wide rounded-full px-2 py-0.5 border ${tone}`} title={title}>
      <span>{rented ? 'Rented' : 'Idle'}</span>
      {held && <span className="opacity-70">{held}</span>}
      {!compact && locked != null && (
        <span className="opacity-70">${locked.toFixed(2)}</span>
      )}
      {!compact && priceDiffers && (
        <span className="opacity-70 line-through">${listed.toFixed(2)}</span>
      )}
    </span>
  );
}

function CompactMetric({ label, value, tone }) {
  const toneClass =
    tone === 'positive' ? 'text-brand-cyan' : tone === 'negative' ? 'text-red-400' : 'text-white';
  return (
    <div className="text-right min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-[#94a3b8] whitespace-nowrap">
        {label}
      </div>
      <div className={`text-sm font-mono ${toneClass} whitespace-nowrap`}>{value}</div>
    </div>
  );
}

// One row per cluster: identity, shape, rate, profit, margin.
//
// Deliberately not MRR as well as rate — MRR is rate x cards x 720, so showing
// both spends a column restating one number. Margin cannot be derived from the
// others (it needs cost) and answers the question a compact list exists to ask:
// which of these is worth owning.
function CompactClusterRow({
  cluster, dailySeries, earningsPerGpuPerHour, cardCount, statusSlot, node, nowMs,
  onToggle, onEdit, onDelete,
}) {
  const { marginPercent, profitPerMonthProjected } = computeProfitMetrics({
    earningsPerGpuPerHour,
    cardCount,
    cost: cluster.cost,
  });
  const profitTone =
    profitPerMonthProjected == null ? undefined : profitPerMonthProjected >= 0 ? 'positive' : 'negative';

  return (
    <div className="bg-brand-panel border border-white/10 rounded-2xl px-4 py-3 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-3 sm:gap-5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={false}
          className="flex items-center gap-2 min-w-0 flex-1 text-left group"
        >
          <span className="text-[#94a3b8] group-hover:text-white transition-colors shrink-0">▸</span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white truncate">{cluster.name}</span>
            <span className="block text-[11px] text-[#94a3b8] truncate">
              {cluster.computeType}
              {cluster.subnet?.platform && (
                <>
                  {' · '}
                  {SUBNET_PLATFORM_LABEL[cluster.subnet.platform] ?? cluster.subnet.platform}
                  <DelayedPayoutHint platform={cluster.subnet.platform} />
                </>
              )}
              {cluster.subnet?.nodeId && (
                <span className="font-mono text-teal-400">
                  {' · '}
                  {shortNodeId(cluster.subnet.nodeId)}
                </span>
              )}
              {node && (
                <>
                  {' '}
                  <RentalStatus node={node} nowMs={nowMs} compact />
                </>
              )}
              {!cluster.subnet && ` · ${HOSTING_MODE_LABEL[cluster.hostingMode]}`}
            </span>
          </span>
        </button>

        {/* Fixed width rather than flexible: a trend line that stretches to
            whatever space is left changes shape with the viewport, which makes
            two rows look different when only the window did. Hidden below lg,
            where the numbers matter more than the squiggle — the name column
            grows to absorb the space so no gap is left behind. */}
        <div className="hidden lg:block w-48 xl:w-60 shrink-0">
          {dailySeries?.length > 1 && <EarningsSparkline series={dailySeries} compact />}
        </div>

        {statusSlot}

        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <CompactMetric
            label="/GPU-hr"
            value={earningsPerGpuPerHour != null ? usdFmt.format(earningsPerGpuPerHour) : '—'}
          />
          <CompactMetric
            label="Profit / Mo"
            value={profitPerMonthProjected != null ? usdFmt.format(profitPerMonthProjected) : '—'}
            tone={profitTone}
          />
          <CompactMetric
            label="Margin"
            value={marginPercent != null ? `${marginPercent.toFixed(1)}%` : '—'}
            tone={profitTone}
          />
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#94a3b8] shrink-0">
          <button type="button" onClick={onEdit} className="hover:text-white transition-colors">
            Edit
          </button>
          <span className="text-white/10">|</span>
          <button type="button" onClick={onDelete} className="hover:text-red-400 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function SubnetClusterCard({ cluster, onboardedAt, renderedAtMs, initialWindow, initialEarnings, initialNodes, dailySeries, initialError, onEdit, onDelete, collapsed, onToggleCollapsed, globalWindow }) {
  const [activeWindow, setActiveWindow] = useState(initialWindow);
  const [customRange, setCustomRange] = useState(null);
  const [earnings, setEarnings] = useState(initialEarnings);
  const [nodes, setNodes] = useState(initialNodes);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  const uid = cluster.subnet?.uidNumber;
  const netuid = netuidFor(cluster.subnet?.platform);
  const nodeParam = cluster.subnet?.nodeId ? `&nodeKey=${cluster.subnet?.nodeId}` : '';

  async function fetchRange(query) {
    setLoading(true);
    try {
      const [earningsRes, nodesRes] = await Promise.all([
        fetch(`/api/internal/uids/${uid}/earnings?${query}&netuid=${netuid}${nodeParam}`),
        fetch(`/api/internal/uids/${uid}/nodes?${query}&netuid=${netuid}${nodeParam}`),
      ]);
      const [earningsData, nodesData] = await Promise.all([
        earningsRes.json(),
        nodesRes.json(),
      ]);

      if (!earningsRes.ok) throw new Error(earningsData.error || 'Failed to load earnings');
      if (!nodesRes.ok) throw new Error(nodesData.error || 'Failed to load nodes');

      setEarnings(earningsData);
      setNodes(nodesData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleWindowChange(nextWindow) {
    if (nextWindow === activeWindow || loading || !uid) return;
    if (nextWindow === 'all' && !onboardedAt) return;

    setActiveWindow(nextWindow);
    await fetchRange(buildRangeQuery(nextWindow, onboardedAt));
  }

  async function handleCustomRangeApply(since, until) {
    if (loading || !uid) return;

    setCustomRange({ since, until });
    setActiveWindow('custom');
    await fetchRange(buildRangeQuery('custom', onboardedAt, { since, until }));
  }

  // Collapsed cards follow the dashboard's window so a stacked list is
  // actually comparable — otherwise one row could be showing 24h beside
  // another showing 30d, with no visible toggle to say so. Expanding a card
  // hands its window back to the local toggle for a closer look.
  useEffect(() => {
    if (!collapsed || !globalWindow || globalWindow === activeWindow || !uid) return;
    setActiveWindow(globalWindow);
    setCustomRange(null);
    fetchRange(buildRangeQuery(globalWindow, onboardedAt, null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalWindow, collapsed]);

  const { cardCount, earningsPerGpuPerHour } = deriveSubnetEarnings({ earnings, nodes });

  // For a node-scoped cluster the payload carries exactly one node; for a
  // whole-uid cluster there is no single rental state to show.
  const node =
    cluster.subnet?.nodeId && nodes?.nodes?.length === 1 ? nodes.nodes[0] : null;

  if (collapsed) {
    return (
      <CompactClusterRow
        cluster={cluster}
        dailySeries={dailySeries}
        earningsPerGpuPerHour={earningsPerGpuPerHour}
        cardCount={cardCount}
        node={node}
        nowMs={renderedAtMs}
        onToggle={onToggleCollapsed}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  return (
    <div className="bg-brand-panel border border-white/10 rounded-2xl p-6">
      <ClusterHeader cluster={cluster} onEdit={onEdit} onDelete={onDelete} onToggleCollapsed={onToggleCollapsed}>
        {node && <RentalStatus node={node} nowMs={renderedAtMs} />}
        <WindowBadge
          activeWindow={activeWindow}
          customRange={customRange}
          earnings={earnings}
          onboardedAt={onboardedAt}
        />
        <TimeWindowToggle
          activeWindow={activeWindow}
          onChange={handleWindowChange}
          onCustomApply={handleCustomRangeApply}
          disabled={loading || !uid}
          allTimeDisabled={!onboardedAt}
          customRange={customRange}
          onboardedAt={onboardedAt}
        />
      </ClusterHeader>

      <EarningsSparkline series={dailySeries} />

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {!error && earnings && (
        <EarningsRows
          taoEarned={earnings.tao_earned}
          usdRealized={earnings.usd_realized}
          earningsPerGpuPerHour={earningsPerGpuPerHour}
          cardCount={cardCount}
          cost={cluster.cost}
          loading={loading}
        />
      )}
    </div>
  );
}

// UTC-based deliberately: renderedAtMs is a single shared number, but this
// file is a Client Component, so this math runs once during SSR (server,
// typically UTC) and again during hydration (browser, viewer's local zone).
// Local-timezone Date methods (setHours, getDate, ...) could round the same
// instant to a different calendar day in each environment; UTC arithmetic on
// the same renderedAtMs value can't, so it stays hydration-safe.
function daysUntilStart(onboardedAt, renderedAtMs) {
  if (!onboardedAt) return null;
  const startMs = Date.parse(`${onboardedAt}T00:00:00.000Z`);
  const todayUtcMidnightMs = Math.floor(renderedAtMs / 86400000) * 86400000;
  return Math.round((startMs - todayUtcMidnightMs) / 86400000);
}

function statusBadgeLabel(cluster, onboardedAt, renderedAtMs) {
  if (!onboardedAt) return null;
  const formatted = new Date(onboardedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  // A forecast cluster with a future onboarding date hasn't started yet —
  // "Since" would misleadingly claim it's already live.
  if (cluster.hostingMode === 'forecast') {
    const daysUntil = daysUntilStart(onboardedAt, renderedAtMs);
    if (daysUntil != null && daysUntil > 0) return `Starting ${formatted}`;
  }
  return `Since ${formatted}`;
}

function ContractClusterCard({ cluster, renderedAtMs, onEdit, onDelete, onConvertTo, collapsed, onToggleCollapsed }) {
  const { cardCount, onboardedAt } = cluster.contract || {};
  const { earningsPerGpuPerHour } = deriveContractEarnings({ contract: cluster.contract });
  const isForecast = cluster.hostingMode === 'forecast';
  const hasRequiredFields = Boolean(earningsPerGpuPerHour != null && cardCount && onboardedAt);

  // Second top-row slot: Forecast hasn't launched yet, so it gets a
  // launches-in countdown instead of a date already in the past.
  const daysUntil = isForecast ? daysUntilStart(onboardedAt, renderedAtMs) : null;
  let launchesInValue = '—';
  let launchesInTone;
  if (daysUntil != null) {
    if (daysUntil > 0) {
      launchesInValue = `${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
    } else if (daysUntil === 0) {
      launchesInValue = 'Today';
      launchesInTone = 'positive';
    } else {
      launchesInValue = 'Overdue';
      launchesInTone = 'warning';
    }
  }

  const {
    revenuePerMonthProjectedTotal: revenuePerMonthProjected,
    costPerGpuPerHour,
    profitPerGpuPerHour,
    marginPercent,
    profitPerMonthProjected,
  } = computeProfitMetrics({ earningsPerGpuPerHour, cardCount, cost: cluster.cost });

  const monthlyCostTotal =
    costPerGpuPerHour != null && cardCount ? costPerGpuPerHour * cardCount * HOURS_PER_MONTH : null;

  if (collapsed) {
    const status = statusBadgeLabel(cluster, onboardedAt, renderedAtMs);
    return (
      <CompactClusterRow
        cluster={cluster}
        dailySeries={null}
        earningsPerGpuPerHour={hasRequiredFields ? earningsPerGpuPerHour : null}
        cardCount={cardCount}
        statusSlot={
          status ? (
            <span className="hidden md:inline text-[10px] font-mono uppercase tracking-wide rounded-full px-2 py-0.5 border text-[#94a3b8] border-white/10 shrink-0">
              {status}
            </span>
          ) : null
        }
        onToggle={onToggleCollapsed}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  return (
    <div className="bg-brand-panel border border-white/10 rounded-2xl p-6">
      <ClusterHeader cluster={cluster} onEdit={onEdit} onDelete={onDelete} onConvertTo={onConvertTo} onToggleCollapsed={onToggleCollapsed}>
        {statusBadgeLabel(cluster, onboardedAt, renderedAtMs) && (
          <span className="text-xs font-mono uppercase tracking-wide rounded-full px-3 py-1 border text-[#94a3b8] border-white/10">
            {statusBadgeLabel(cluster, onboardedAt, renderedAtMs)}
          </span>
        )}
      </ClusterHeader>

      {!hasRequiredFields ? (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          This cluster is missing a card count or onboarding date — edit it to add them.
        </div>
      ) : (
        <>
          {/* Same 4-up grid and bottom-row field order as Subnet's
              EarningsRows — position means the same thing on every card
              type, only the top row's content differs by type. */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <EarningsStat
              label="Monthly Cost"
              value={monthlyCostTotal != null ? usdFmt.format(monthlyCostTotal) : '—'}
              unit={monthlyCostTotal != null ? '/mo' : undefined}
            />
            <EarningsStat
              label="Contracted Rate"
              value={usdFmt.format(earningsPerGpuPerHour)}
              unit="/hr"
            />
            {isForecast ? (
              <EarningsStat label="Launches in" value={launchesInValue} tone={launchesInTone} />
            ) : (
              <EarningsStat label="Onboarded" value={formatBadgeDate(onboardedAt)} />
            )}
            <EarningsStat
              label="MRR (Projected)"
              value={usdFmt.format(revenuePerMonthProjected)}
              unit="/mo"
            />
          </div>

          {cluster.cost && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10">
              <EarningsStat
                label="Cost / hr"
                value={costPerGpuPerHour != null ? usdFmt.format(costPerGpuPerHour) : '—'}
                unit="/hr"
              />
              <EarningsStat
                label="Profit / hr"
                value={profitPerGpuPerHour != null ? usdFmt.format(profitPerGpuPerHour) : '—'}
                unit="/hr"
              />
              <EarningsStat
                label="Margin %"
                value={marginPercent != null ? `${marginPercent.toFixed(1)}%` : '—'}
              />
              <EarningsStat
                label="Profit / Mo (Projected)"
                value={profitPerMonthProjected != null ? usdFmt.format(profitPerMonthProjected) : '—'}
                unit="/mo"
                tone={
                  profitPerMonthProjected != null
                    ? profitPerMonthProjected >= 0
                      ? 'positive'
                      : 'negative'
                    : undefined
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ClusterCard(props) {
  // 'contract' (Enterprise) and 'forecast' share the same manual-entry
  // fields and math — ContractClusterCard handles both, deriving label/badge
  // color and the Convert-to-live control from cluster.hostingMode.
  return props.cluster.hostingMode === 'subnet' ? (
    <SubnetClusterCard {...props} />
  ) : (
    <ContractClusterCard {...props} />
  );
}
