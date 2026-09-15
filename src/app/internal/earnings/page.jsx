import { listClusters } from '@/lib/internal/clusterStore';
import {
  getEarnings,
  getNodes,
  getEarningsSnapshot,
  getDailyEarnings,
  getMarketRates,
} from '@/lib/internal/vpsClient';
import { netuidFor } from '@/lib/internal/clusterOptions';
import { formatRelativeTime } from '@/lib/internal/dateRanges';
import EarningsDashboard from '@/components/internal/earnings/EarningsDashboard';

// Previously forced dynamic only as a side effect of the old VPS fetch's
// `cache: 'no-store'`. Now that data comes from Redis reads (no fetch to key
// off), that signal is gone, so this must be explicit — otherwise Next.js
// would prerender this page (live earnings + the "as of" sync timestamp)
// once at build time and serve that same stale snapshot to every visitor.
export const dynamic = 'force-dynamic';

// 7D, not 24h. Lium settles rental two days after it is earned, so a 24h
// window catches either a settlement lump or none depending on the hour and
// swings wildly between the two. Seven days is long enough for the lag to
// average out, and it is what the collapsed cards default to — matching them
// means the page renders once instead of refetching every card on mount.
const INITIAL_WINDOW = '7d';

async function loadClusterData(cluster) {
  if (cluster.hostingMode !== 'subnet') {
    return { earnings: null, nodes: null, dailySeries: null, onboardedAt: null, lastSyncedAt: null, error: null };
  }

  const netuid = netuidFor(cluster.subnet.platform);
  const uid = cluster.subnet.uidNumber;
  const nodeKey = cluster.subnet.nodeId ?? null;
  const snapshot = await getEarningsSnapshot(netuid, uid).catch(() => null);
  const onboardedAt = snapshot?.onboarded_at ?? null;
  const lastSyncedAt = snapshot?.last_synced_at ?? null;

  // Independent of the earnings/nodes fetch below — a sparkline fetch failure
  // shouldn't take down the card's primary earnings display.
  const dailySeries = await getDailyEarnings(netuid, uid, 30, nodeKey)
    .then((data) => data.series)
    .catch(() => null);

  try {
    const [earnings, nodes] = await Promise.all([
      getEarnings(netuid, uid, { window: INITIAL_WINDOW }, nodeKey),
      getNodes(netuid, uid, nodeKey),
    ]);
    return { earnings, nodes, dailySeries, onboardedAt, lastSyncedAt, error: null };
  } catch (error) {
    return { earnings: null, nodes: null, dailySeries, onboardedAt, lastSyncedAt, error: error.message };
  }
}

export default async function InternalEarningsPage() {
  let clusters = [];
  let clustersError = null;
  try {
    clusters = await listClusters();
  } catch (error) {
    clustersError = error.message;
  }

  const clustersWithData = await Promise.all(
    clusters.map(async (cluster) => ({
      cluster,
      ...(await loadClusterData(cluster)),
    }))
  );

  // Separate VPS job/Redis key from per-uid earnings — a consolidated
  // rate comparison across all five backend pipelines, twice-daily push.
  const marketRates = await getMarketRates().catch(() => null);

  // Computed once, server-side only, and passed down as a prop rather than
  // read via Date.now() inside a Client Component's render — reading the
  // clock directly there hydration-mismatches, since SSR and the client's
  // hydration pass run at two different real moments (ContractClusterCard's
  // elapsed-hours revenue math used to do exactly that).
  const renderedAtMs = Date.now();

  // Oldest sync across clusters, not newest — a stale straggler should show
  // up here rather than being hidden behind a fresher cluster's timestamp.
  const lastSyncedAt = clustersWithData
    .map((c) => c.lastSyncedAt)
    .filter(Boolean)
    .sort()[0];

  return (
    <div className="bg-[#050508] text-white min-h-screen">
      {/* Sticky because of the "as of" timestamp. Every figure below is only
          as good as that timestamp, and if the VPS sync stops there is no
          other signal — a stale dashboard looks exactly like a fresh one once
          the header has scrolled away. The logo shares this row rather than
          getting a bar of its own: a second row would cost ~60px on every
          screen to convey nothing the page doesn't already say. Same hosted
          asset as the public navbar, at the same 32px, so the two match. */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050508]/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <img
              src="https://imagedelivery.net/Ulul0QO-cXqPUi6uJcNN5g/a3924725-4e64-4885-0779-1aae85136500/public"
              alt="Scannit"
              className="h-8 w-auto shrink-0"
            />
            <span className="h-8 w-px bg-white/10 shrink-0" aria-hidden="true" />
            <div className="flex items-baseline gap-3 min-w-0">
              <h1 className="text-2xl font-bold truncate">Cluster Earnings</h1>
              {lastSyncedAt && (
                <span
                  className="text-xs text-[#94a3b8] whitespace-nowrap"
                  title={new Date(lastSyncedAt).toLocaleString()}
                >
                  as of {formatRelativeTime(new Date(lastSyncedAt).getTime())}
                </span>
              )}
            </div>
          </div>
          <form method="POST" action="/api/internal/auth/logout">
            <button
              type="submit"
              className="text-xs text-[#94a3b8] border border-white/10 rounded-full px-3 py-1.5 hover:text-white hover:border-white/30 transition-colors"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 pt-6 pb-10">
        {clustersError && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6">
            Couldn&apos;t load clusters: {clustersError}
          </div>
        )}

        <EarningsDashboard
          clustersWithData={clustersWithData}
          renderedAtMs={renderedAtMs}
          marketRates={marketRates}
        />
      </div>
    </div>
  );
}
