'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClusterCard from './ClusterCard';
import ClusterFormModal from './ClusterFormModal';
import PortfolioTotalsBar from './PortfolioTotalsBar';
import { computePortfolioTotals } from '@/lib/internal/clusterEarnings';
import { currentMonthRange, lastMonthRange } from '@/lib/internal/dateRanges';

function buildTotalsRangeQuery(basis) {
  if (basis === 'this_month') {
    const { since, until } = currentMonthRange();
    return new URLSearchParams({ since, until }).toString();
  }
  if (basis === 'last_month') {
    const { since, until } = lastMonthRange();
    return new URLSearchParams({ since, until }).toString();
  }
  return new URLSearchParams({ window: basis === 'live' ? '24h' : '7d' }).toString();
}

export default function EarningsDashboard({ clustersWithData, renderedAtMs }) {
  const router = useRouter();
  const [formTarget, setFormTarget] = useState(null); // null | 'new' | cluster object
  const [convertTarget, setConvertTarget] = useState(null); // null | { cluster, targetMode }
  const [segmentFilter, setSegmentFilter] = useState('all'); // 'all' | 'subnet' | 'contract' | 'forecast'
  const [includeForecast, setIncludeForecast] = useState(false);

  // The totals section's own time basis, independent of each cluster card's
  // own window toggle below (that stays on whatever the card was loaded
  // with / the user picked for it) — this only re-derives the subnet rate
  // that feeds the totals cards, since a 24h window is too noisy day to day
  // for a stable KPI. Default 7D, not Live, for the same reason.
  const [totalsBasis, setTotalsBasis] = useState('7d');
  const [totalsSubnetData, setTotalsSubnetData] = useState({}); // cluster id -> { earnings, nodes }
  const [totalsLoading, setTotalsLoading] = useState(false);

  useEffect(() => {
    const subnetEntries = clustersWithData.filter(
      ({ cluster }) => cluster.hostingMode === 'subnet' && cluster.subnet?.uidNumber
    );
    if (subnetEntries.length === 0) return;

    let cancelled = false;
    setTotalsLoading(true);
    const query = buildTotalsRangeQuery(totalsBasis);

    Promise.all(
      subnetEntries.map(async ({ cluster }) => {
        const uid = cluster.subnet.uidNumber;
        try {
          const [earningsRes, nodesRes] = await Promise.all([
            fetch(`/api/internal/uids/${uid}/earnings?${query}`),
            fetch(`/api/internal/uids/${uid}/nodes?${query}`),
          ]);
          const [earnings, nodes] = await Promise.all([earningsRes.json(), nodesRes.json()]);
          return [
            cluster.id,
            { earnings: earningsRes.ok ? earnings : null, nodes: nodesRes.ok ? nodes : null },
          ];
        } catch {
          return [cluster.id, { earnings: null, nodes: null }];
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setTotalsSubnetData(Object.fromEntries(entries));
      setTotalsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [totalsBasis, clustersWithData]);

  // Only subnet entries get swapped for the totals-basis-specific fetch —
  // Enterprise/Forecast MRR is a fixed contracted rate, not derived from a
  // live earnings window, so the basis selector has no effect on them (Total
  // still shifts, since it includes subnet's contribution).
  const clustersForTotals = useMemo(
    () =>
      clustersWithData.map((entry) => {
        if (entry.cluster.hostingMode !== 'subnet') return entry;
        const override = totalsSubnetData[entry.cluster.id];
        return override ? { ...entry, earnings: override.earnings, nodes: override.nodes } : entry;
      }),
    [clustersWithData, totalsSubnetData]
  );

  const portfolioTotals = useMemo(
    () => computePortfolioTotals(clustersForTotals, { includeForecast }),
    [clustersForTotals, includeForecast]
  );

  const filteredClusters =
    segmentFilter === 'all'
      ? clustersWithData
      : clustersWithData.filter(({ cluster }) => cluster.hostingMode === segmentFilter);

  function closeForm() {
    setFormTarget(null);
    setConvertTarget(null);
  }

  function handleSaved() {
    closeForm();
    router.refresh();
  }

  async function handleDelete(cluster) {
    if (!window.confirm(`Delete "${cluster.name}"? This can't be undone.`)) return;

    const res = await fetch(`/api/internal/clusters/${cluster.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Failed to delete cluster');
    }
  }

  // Convert reuses the same modal/PUT flow as editing — the modal starts on
  // targetMode's fields instead of the cluster's current hostingMode, and
  // saving PUTs to the same id, so cost/creation history (the existing
  // record) is preserved rather than a new cluster being created.
  function handleConvertTo(cluster, targetMode) {
    setConvertTarget({ cluster, targetMode });
  }

  const activeModalCluster = convertTarget
    ? convertTarget.cluster
    : formTarget === 'new'
      ? null
      : formTarget;
  const modalOpen = Boolean(formTarget || convertTarget);

  return (
    <div>
      <PortfolioTotalsBar
        totals={portfolioTotals}
        activeFilter={segmentFilter}
        onFilterChange={setSegmentFilter}
        includeForecast={includeForecast}
        onIncludeForecastChange={setIncludeForecast}
        totalsBasis={totalsBasis}
        onTotalsBasisChange={setTotalsBasis}
        totalsLoading={totalsLoading}
      />

      {/* Reserved for the upcoming Market Rate Comparison panel — placed
          here (below totals, above the cluster list) so its layout won't
          need to shift once it's built. */}

      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setFormTarget('new')}
          className="text-sm bg-white text-brand-dark rounded-full px-4 py-2 font-semibold hover:bg-brand-cyan hover:text-white transition-colors"
        >
          + Add Cluster
        </button>
      </div>

      <div className="space-y-4">
        {filteredClusters.length === 0 && (
          <div className="text-sm text-brand-muted bg-brand-panel border border-white/10 rounded-2xl px-4 py-6 text-center">
            No clusters in this view.
          </div>
        )}
        {filteredClusters.map(({ cluster, earnings, nodes, dailySeries, onboardedAt, error }) => (
          <ClusterCard
            key={`${cluster.id}:${JSON.stringify(cluster)}`}
            cluster={cluster}
            onboardedAt={onboardedAt}
            renderedAtMs={renderedAtMs}
            initialWindow="24h"
            initialEarnings={earnings}
            initialNodes={nodes}
            dailySeries={dailySeries}
            initialError={error}
            onEdit={() => setFormTarget(cluster)}
            onDelete={() => handleDelete(cluster)}
            onConvertTo={(targetMode) => handleConvertTo(cluster, targetMode)}
          />
        ))}
      </div>

      {modalOpen && (
        <ClusterFormModal
          cluster={activeModalCluster}
          initialHostingMode={convertTarget?.targetMode}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
