'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClusterCard from './ClusterCard';
import ClusterFormModal from './ClusterFormModal';
import PortfolioTotalsBar from './PortfolioTotalsBar';
import MarketRateComparisonPanel from './MarketRateComparisonPanel';
import {
  computePortfolioTotals,
  deriveSubnetEarnings,
  deriveContractEarnings,
  computeProfitMetrics,
} from '@/lib/internal/clusterEarnings';
import { netuidFor, HOSTING_MODES, shortNodeId } from '@/lib/internal/clusterOptions';
import { currentMonthRange, lastMonthRange } from '@/lib/internal/dateRanges';

// Expanded cards are remembered per browser. Everything starts collapsed:
// past three or four clusters the full cards are a screenful each, and the
// list stops being scannable long before it stops being complete.
const EXPANDED_STORAGE_KEY = 'internal-earnings-expanded-clusters';

const CARD_WINDOWS = [
  { value: '24h', label: 'Live' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
];

// Monthly profit, for ranking. Null when cost isn't tracked or the rate is
// unknown — those sort last rather than as zero, since "not measured" and
// "makes nothing" should not sit together.
function projectedMonthlyProfit({ cluster, earnings, nodes }) {
  const { cardCount, earningsPerGpuPerHour } =
    cluster.hostingMode === 'subnet'
      ? deriveSubnetEarnings({ earnings, nodes })
      : deriveContractEarnings({ contract: cluster.contract });
  return computeProfitMetrics({ earningsPerGpuPerHour, cardCount, cost: cluster.cost })
    .profitPerMonthProjected;
}

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

export default function EarningsDashboard({ clustersWithData, renderedAtMs, marketRates }) {
  const router = useRouter();

  // The node picker shows uuids, which say nothing about which machine is
  // which. Rather than a second place to name things, a node that already
  // belongs to a cluster borrows that cluster's name: one source of truth,
  // nothing to keep in sync, and renaming the cluster renames it everywhere.
  //
  // These names never leave /internal. Clusters are read only by this page and
  // by /api/internal/clusters, both behind the shared password, and no public
  // route touches node ids or cluster names.
  const nodeNames = useMemo(() => {
    const byNode = {};
    for (const { cluster } of clustersWithData) {
      const nodeId = cluster.subnet?.nodeId;
      if (nodeId && !byNode[nodeId]) byNode[nodeId] = cluster.name;
    }
    return byNode;
  }, [clustersWithData]);

  const [pendingDelete, setPendingDelete] = useState(null); // cluster awaiting confirmation
  const [deleteError, setDeleteError] = useState(null);
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

  // Read after mount, never in the initial state: localStorage doesn't exist
  // during SSR, and seeding from it there would hydrate to different markup
  // than the server sent.
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [cardWindow, setCardWindow] = useState('7d');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(EXPANDED_STORAGE_KEY);
      if (raw) setExpandedIds(new Set(JSON.parse(raw)));
    } catch {
      // Private window, blocked storage, corrupt value — collapsed is a fine
      // place to land, so there is nothing to recover from.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify([...expandedIds]));
    } catch {
      // Preference only; losing it costs a click.
    }
  }, [expandedIds]);

  function toggleExpanded(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
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
        const netuid = netuidFor(cluster.subnet.platform);
        const nodeParam = cluster.subnet.nodeId ? `&nodeKey=${cluster.subnet.nodeId}` : '';
        try {
          const [earningsRes, nodesRes] = await Promise.all([
            fetch(`/api/internal/uids/${uid}/earnings?${query}&netuid=${netuid}${nodeParam}`),
            fetch(`/api/internal/uids/${uid}/nodes?${query}&netuid=${netuid}${nodeParam}`),
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

  // Live clusters first, forecasts last. Creation order put a hypothetical
  // cluster above earning hardware, which buries the numbers that are
  // actually real. Ordering follows HOSTING_MODES (subnet, contract,
  // forecast) so it can't drift from the filter pills, and the sort is
  // stable, so clusters within a segment keep the order they were added in.
  const hostingModeRank = (mode) => {
    const index = HOSTING_MODES.findIndex((m) => m.value === mode);
    return index === -1 ? HOSTING_MODES.length : index;
  };

  // Within a segment, most profitable first. Creation order stops being
  // useful once the list is scannable — ranked, the worst performer surfaces
  // itself instead of sitting at position five. Clusters with no profit
  // figure sort last: not measured is not the same as makes nothing.
  const filteredClusters = (
    segmentFilter === 'all'
      ? clustersWithData
      : clustersWithData.filter(({ cluster }) => cluster.hostingMode === segmentFilter)
  )
    .slice()
    .sort((a, b) => {
      const byMode = hostingModeRank(a.cluster.hostingMode) - hostingModeRank(b.cluster.hostingMode);
      if (byMode !== 0) return byMode;
      const pa = projectedMonthlyProfit(a);
      const pb = projectedMonthlyProfit(b);
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return pb - pa;
    });

  const expandedCount = filteredClusters.filter(({ cluster }) => expandedIds.has(cluster.id)).length;
  const allExpanded = filteredClusters.length > 0 && expandedCount === filteredClusters.length;

  function toggleAll() {
    setExpandedIds(allExpanded ? new Set() : new Set(filteredClusters.map(({ cluster }) => cluster.id)));
  }

  function closeForm() {
    setFormTarget(null);
    setConvertTarget(null);
  }

  function handleSaved() {
    closeForm();
    router.refresh();
  }

  // Confirmation is rendered in the page, not through window.confirm.
  //
  // Chrome offers "prevent this page from creating additional dialogs" after a
  // few native dialogs, and once it is ticked confirm() returns false with no
  // dialog shown. The handler then returned before it ever fetched, so Delete
  // did nothing at all: no request, no error, no change. The alert() on the
  // failure path was suppressed by the same setting, so even a 401 would have
  // looked identical. A delete button whose failure mode is silence is worse
  // than no delete button.
  function handleDelete(cluster) {
    setDeleteError(null);
    setPendingDelete(cluster);
  }

  async function confirmDelete() {
    const cluster = pendingDelete;
    if (!cluster) return;
    setPendingDelete(null);

    const res = await fetch(`/api/internal/clusters/${cluster.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setDeleteError(`Could not delete "${cluster.name}": ${data.error || res.status}`);
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

      <MarketRateComparisonPanel marketRates={marketRates} />

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs text-[#94a3b8] border border-white/10 rounded-full px-3 py-1.5 hover:text-white hover:border-white/30 transition-colors"
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>

          {/* One window for every collapsed card. Per-card toggles are only
              visible when a card is expanded, so a stacked list could
              otherwise be comparing 24h against 30d with nothing on screen
              saying so. */}
          <div className="flex items-center gap-1 bg-black/30 border border-white/10 rounded-full p-0.5">
            {CARD_WINDOWS.map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => setCardWindow(w.value)}
                className={`text-xs rounded-full px-3 py-1 transition-colors ${
                  cardWindow === w.value
                    ? 'bg-white text-brand-dark font-semibold'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-[#94a3b8]">
            applies to collapsed cards
          </span>
        </div>

        <button
          type="button"
          onClick={() => setFormTarget('new')}
          className="text-sm bg-white text-brand-dark rounded-full px-4 py-2 font-semibold hover:bg-brand-cyan hover:text-white transition-colors"
        >
          + Add Cluster
        </button>
      </div>

      {/* Names are not unique -- two clusters were briefly both called
          "Chirag RTX" -- so the node id disambiguates which one is going. */}
      {pendingDelete && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <span className="text-sm text-white">
            Delete <span className="font-semibold">{pendingDelete.name}</span>
            {pendingDelete.subnet?.nodeId && (
              <span className="text-[#94a3b8] font-mono text-xs">
                {' '}({shortNodeId(pendingDelete.subnet.nodeId)})
              </span>
            )}
            ? This can&apos;t be undone.
          </span>
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              className="px-3 py-1.5 rounded-full border border-white/15 text-[#94a3b8] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="px-3 py-1.5 rounded-full bg-red-500 text-white font-semibold hover:bg-red-400 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {deleteError}
        </div>
      )}

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
            initialWindow="7d"
            initialEarnings={earnings}
            initialNodes={nodes}
            dailySeries={dailySeries}
            initialError={error}
            onEdit={() => setFormTarget(cluster)}
            onDelete={() => handleDelete(cluster)}
            onConvertTo={(targetMode) => handleConvertTo(cluster, targetMode)}
            collapsed={!expandedIds.has(cluster.id)}
            onToggleCollapsed={() => toggleExpanded(cluster.id)}
            globalWindow={cardWindow}
          />
        ))}
      </div>

      {modalOpen && (
        <ClusterFormModal
          cluster={activeModalCluster}
          initialHostingMode={convertTarget?.targetMode}
          nodeNames={nodeNames}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
