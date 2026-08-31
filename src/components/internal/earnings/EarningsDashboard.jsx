'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ClusterCard from './ClusterCard';
import ClusterFormModal from './ClusterFormModal';

export default function EarningsDashboard({ clustersWithData, renderedAtMs }) {
  const router = useRouter();
  const [formTarget, setFormTarget] = useState(null); // null | 'new' | cluster object

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
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setFormTarget('new')}
          className="text-sm bg-white text-[#050508] rounded-full px-4 py-2 font-semibold hover:bg-[#06b6d4] hover:text-white transition-colors"
        >
          + Add Cluster
        </button>
      </div>

      {clustersWithData.map(({ cluster, earnings, nodes, dailySeries, onboardedAt, error }) => (
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
