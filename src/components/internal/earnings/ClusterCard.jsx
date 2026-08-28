'use client';

import { useState } from 'react';
import EarningsStat from './EarningsStat';
import TimeWindowToggle from './TimeWindowToggle';
import { getWindowConfig } from '@/lib/internal/windows';

const numberFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });
const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const HOURS_PER_MONTH = 720;

function getCostPerGpuPerHour(cost) {
  if (!cost) return null;
  return cost.mode === 'per_hour' ? cost.value : cost.value / HOURS_PER_MONTH;
}

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

  const windowConfig = getWindowConfig(activeWindow);
  const cardCount = nodes?.combined?.avg_cards;
  const earningsPerGpuPerHour =
    earnings?.hours && cardCount ? earnings.usd_realized / (earnings.hours * cardCount) : null;
  const earningsPerMonthProjected =
    earningsPerGpuPerHour != null ? earningsPerGpuPerHour * HOURS_PER_MONTH : null;

  const costPerGpuPerHour = getCostPerGpuPerHour(cluster.cost);
  const profitPerGpuPerHour =
    costPerGpuPerHour != null && earningsPerGpuPerHour != null
      ? earningsPerGpuPerHour - costPerGpuPerHour
      : null;
  const marginPercent =
    profitPerGpuPerHour != null && earningsPerGpuPerHour
      ? (profitPerGpuPerHour / earningsPerGpuPerHour) * 100
      : null;
  const profitPerMonthProjected =
    profitPerGpuPerHour != null && cardCount
      ? profitPerGpuPerHour * cardCount * HOURS_PER_MONTH
      : null;

  return (
    <div className="bg-brand-panel border border-white/10 rounded-2xl p-6">
      <ClusterHeader cluster={cluster} onEdit={onEdit} onDelete={onDelete}>
        <span
          className={`text-xs font-mono uppercase tracking-wide rounded-full px-3 py-1 border ${
            activeWindow === '24h'
              ? 'text-[#06b6d4] border-[#06b6d4]/30 bg-[#06b6d4]/10'
              : 'text-[#94a3b8] border-white/10'
          }`}
        >
          {windowConfig.badgeLabel}
        </span>
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
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-opacity ${
            loading ? 'opacity-50' : ''
          }`}
        >
          <EarningsStat
            label="TAO Earned"
            value={numberFmt.format(earnings.tao_earned)}
            unit="TAO"
          />
          <EarningsStat
            label="USD Realized"
            value={usdFmt.format(earnings.usd_realized)}
            accent
          />
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
      )}

      {!error && earnings && cluster.cost && (
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 transition-opacity ${
            loading ? 'opacity-50' : ''
          }`}
        >
          <EarningsStat label="Cost / hr" value={usdFmt.format(costPerGpuPerHour)} unit="/hr" />
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
    </div>
  );
}

function ContractClusterCard({ cluster, onEdit, onDelete }) {
  return (
    <div className="bg-brand-panel border border-white/10 rounded-2xl p-6">
      <ClusterHeader cluster={cluster} onEdit={onEdit} onDelete={onDelete} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <EarningsStat
          label="Contracted Rate"
          value={usdFmt.format(cluster.contract?.pricePerHourUsd ?? 0)}
          unit="/hr"
          accent
        />
      </div>
      <p className="text-xs text-[#94a3b8] mt-4">
        Live earnings tracking isn&apos;t wired up for contract clusters yet.
      </p>
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
