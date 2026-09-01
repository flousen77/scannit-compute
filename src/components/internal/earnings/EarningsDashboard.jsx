'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClusterCard from './ClusterCard';
import ClusterFormModal from './ClusterFormModal';
import PortfolioTotalsBar from './PortfolioTotalsBar';
import { computePortfolioTotals } from '@/lib/internal/clusterEarnings';

export default function EarningsDashboard({ clustersWithData, renderedAtMs }) {
  const router = useRouter();
  const [formTarget, setFormTarget] = useState(null); // null | 'new' | cluster object
  const [convertTarget, setConvertTarget] = useState(null); // null | { cluster, targetMode }
  const [segmentFilter, setSegmentFilter] = useState('all'); // 'all' | 'subnet' | 'contract' | 'forecast'
  const [includeForecast, setIncludeForecast] = useState(false);

  // Recomputed client-side (not passed down from the server component) so
  // toggling "include forecast in totals" updates the bar instantly without
  // a round trip — computePortfolioTotals is pure/framework-agnostic exactly
  // so it can run in either place.
  const portfolioTotals = useMemo(
    () => computePortfolioTotals(clustersWithData, { includeForecast }),
    [clustersWithData, includeForecast]
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
      />

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
