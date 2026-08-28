'use client';

import { useState } from 'react';
import EarningsStat from './EarningsStat';
import TimeWindowToggle from './TimeWindowToggle';
import { getWindowConfig } from '@/lib/internal/windows';
import {
  deriveSubnetEarnings,
  deriveContractEarnings,
  computeProfitMetrics,
} from '@/lib/internal/clusterEarnings';

const numberFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });
const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function buildRangeQuery(windowValue, onboardedAt) {
  return windowValue === 'all'
    ? `since=${encodeURIComponent(onboardedAt)}`
    : `window=${windowValue}`;
}

function ClusterHeader({ cluster, children, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{cluster.name}</h2>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-[#94a3b8]">
            {cluster.computeType}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-[#94a3b8] capitalize">
            {cluster.hostingMode}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {children}
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

function WindowBadge({ activeWindow }) {
  const windowConfig = getWindowConfig(activeWindow);
  return (
    <span
      className={`text-xs font-mono uppercase tracking-wide rounded-full px-3 py-1 border ${
        activeWindow === '24h'
          ? 'text-[#06b6d4] border-[#06b6d4]/30 bg-[#06b6d4]/10'
          : 'text-[#94a3b8] border-white/10'
      }`}
    >
      {windowConfig.badgeLabel}
    </span>
  );
}

// Shared by subnet and contract cards so cost/profit math can't drift between
// the two — both feed it an earnings-per-GPU-per-hour figure, however derived.
function EarningsRows({ taoEarned, usdRealized, earningsPerGpuPerHour, cardCount, cost, loading }) {
  const {
    earningsPerMonthProjectedPerGpu: earningsPerMonthProjected,
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
        <EarningsStat label="USD Realized" value={usdFmt.format(usdRealized)} accent />
        <EarningsStat
          label="Earnings / hr"
          value={earningsPerGpuPerHour != null ? usdFmt.format(earningsPerGpuPerHour) : '—'}
          unit="/hr"
        />
        <EarningsStat
          label="Earnings / Mo (Projected)"
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

function SubnetClusterCard({ cluster, onboardedAt, initialWindow, initialEarnings, initialNodes, initialError, onEdit, onDelete }) {
  const [activeWindow, setActiveWindow] = useState(initialWindow);
  const [earnings, setEarnings] = useState(initialEarnings);
  const [nodes, setNodes] = useState(initialNodes);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  const uid = cluster.subnet?.uidNumber;

  async function handleWindowChange(nextWindow) {
    if (nextWindow === activeWindow || loading || !uid) return;
    if (nextWindow === 'all' && !onboardedAt) return;

    setActiveWindow(nextWindow);
    setLoading(true);

    const query = buildRangeQuery(nextWindow, onboardedAt);

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

  const { cardCount, earningsPerGpuPerHour } = deriveSubnetEarnings({ earnings, nodes });

  return (
    <div className="bg-brand-panel border border-white/10 rounded-2xl p-6">
      <ClusterHeader cluster={cluster} onEdit={onEdit} onDelete={onDelete}>
        <WindowBadge activeWindow={activeWindow} />
        <TimeWindowToggle
          activeWindow={activeWindow}
          onChange={handleWindowChange}
          disabled={loading || !uid}
          allTimeDisabled={!onboardedAt}
        />
      </ClusterHeader>

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

function sinceLabel(onboardedAt) {
  if (!onboardedAt) return null;
  const formatted = new Date(onboardedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Since ${formatted}`;
}

function ContractClusterCard({ cluster, onEdit, onDelete }) {
  const { cardCount, onboardedAt } = cluster.contract || {};
  const { earningsPerGpuPerHour } = deriveContractEarnings({ contract: cluster.contract });

  const elapsedHours = onboardedAt
    ? (Date.now() - new Date(onboardedAt).getTime()) / (1000 * 60 * 60)
    : null;

  const revenueToDate =
    earningsPerGpuPerHour != null && cardCount && elapsedHours != null
      ? earningsPerGpuPerHour * cardCount * elapsedHours
      : null;

  const {
    earningsPerMonthProjectedPerGpu: revenuePerMonthProjected,
    profitPerGpuPerHour,
    marginPercent,
    profitPerMonthProjected,
  } = computeProfitMetrics({ earningsPerGpuPerHour, cardCount, cost: cluster.cost });

  return (
    <div className="bg-brand-panel border border-white/10 rounded-2xl p-6">
      <ClusterHeader cluster={cluster} onEdit={onEdit} onDelete={onDelete}>
        {sinceLabel(onboardedAt) && (
          <span className="text-xs font-mono uppercase tracking-wide rounded-full px-3 py-1 border text-[#94a3b8] border-white/10">
            {sinceLabel(onboardedAt)}
          </span>
        )}
      </ClusterHeader>

      {revenueToDate == null ? (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          This cluster is missing a card count or onboarding date — edit it to add them.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <EarningsStat
              label="Contracted Rate"
              value={usdFmt.format(earningsPerGpuPerHour)}
              unit="/hr"
            />
            <EarningsStat label="Revenue to Date" value={usdFmt.format(revenueToDate)} accent />
            <EarningsStat
              label="Revenue / Mo (Projected)"
              value={usdFmt.format(revenuePerMonthProjected)}
              unit="/mo"
            />
          </div>

          {cluster.cost && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
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
  return props.cluster.hostingMode === 'contract' ? (
    <ContractClusterCard {...props} />
  ) : (
    <SubnetClusterCard {...props} />
  );
}
