'use client';

import { useState } from 'react';
import EarningsStat from './EarningsStat';
import EarningsSparkline from './EarningsSparkline';
import TimeWindowToggle from './TimeWindowToggle';
import { getWindowConfig } from '@/lib/internal/windows';
import { HOSTING_MODE_LABEL, HOSTING_MODE_BADGE_CLASS } from '@/lib/internal/clusterOptions';
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

function ClusterHeader({ cluster, children, onEdit, onDelete, onConvertTo }) {
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{cluster.name}</h2>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-[#94a3b8]">
            {cluster.computeType}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${HOSTING_MODE_BADGE_CLASS[cluster.hostingMode]}`}
          >
            {HOSTING_MODE_LABEL[cluster.hostingMode]}
          </span>
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

function SubnetClusterCard({ cluster, onboardedAt, initialWindow, initialEarnings, initialNodes, dailySeries, initialError, onEdit, onDelete }) {
  const [activeWindow, setActiveWindow] = useState(initialWindow);
  const [customRange, setCustomRange] = useState(null);
  const [earnings, setEarnings] = useState(initialEarnings);
  const [nodes, setNodes] = useState(initialNodes);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  const uid = cluster.subnet?.uidNumber;

  async function fetchRange(query) {
    setLoading(true);
    try {
      const [earningsRes, nodesRes] = await Promise.all([
        fetch(`/api/internal/uids/${uid}/earnings?${query}`),
        fetch(`/api/internal/uids/${uid}/nodes?${query}`),
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

  const { cardCount, earningsPerGpuPerHour } = deriveSubnetEarnings({ earnings, nodes });

  return (
    <div className="bg-brand-panel border border-white/10 rounded-2xl p-6">
      <ClusterHeader cluster={cluster} onEdit={onEdit} onDelete={onDelete}>
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

function ContractClusterCard({ cluster, renderedAtMs, onEdit, onDelete, onConvertTo }) {
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

  return (
    <div className="bg-brand-panel border border-white/10 rounded-2xl p-6">
      <ClusterHeader cluster={cluster} onEdit={onEdit} onDelete={onDelete} onConvertTo={onConvertTo}>
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
