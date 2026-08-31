'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ClusterCard from './ClusterCard';
import ClusterFormModal from './ClusterFormModal';
import PortfolioTotalsBar from './PortfolioTotalsBar';

export default function EarningsDashboard({ clustersWithData, renderedAtMs, portfolioTotals }) {
  const router = useRouter();
  const [formTarget, setFormTarget] = useState(null); // null | 'new' | cluster object
  const [segmentFilter, setSegmentFilter] = useState('all'); // 'all' | 'subnet' | 'contract'

  const filteredClusters =
    segmentFilter === 'all'
      ? clustersWithData
      : clustersWithData.filter(({ cluster }) => cluster.hostingMode === segmentFilter);

  function closeForm() {
    setFormTarget(null);
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

  return (
    <div>
      <PortfolioTotalsBar
        totals={portfolioTotals}
        activeFilter={segmentFilter}
        onFilterChange={setSegmentFilter}
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
          />
        ))}
      </div>

      {formTarget && (
        <ClusterFormModal
          cluster={formTarget === 'new' ? null : formTarget}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
