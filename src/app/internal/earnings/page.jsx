import { listClusters } from '@/lib/internal/clusterStore';
import { getEarnings, getNodes, getEarningsSnapshot, getDailyEarnings } from '@/lib/internal/vpsClient';
import { computePortfolioTotals } from '@/lib/internal/clusterEarnings';
import EarningsDashboard from '@/components/internal/earnings/EarningsDashboard';

// Previously forced dynamic only as a side effect of the old VPS fetch's
// `cache: 'no-store'`. Now that data comes from Redis reads (no fetch to key
// off), that signal is gone, so this must be explicit — otherwise Next.js
// would prerender this page (live earnings + the "as of" sync timestamp)
// once at build time and serve that same stale snapshot to every visitor.
export const dynamic = 'force-dynamic';

const INITIAL_WINDOW = '24h';

function formatSyncedAgo(iso) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr${hours === 1 ? '' : 's'} ago`;
}

async function loadClusterData(cluster) {
  if (cluster.hostingMode !== 'subnet') {
    return { earnings: null, nodes: null, dailySeries: null, onboardedAt: null, lastSyncedAt: null, error: null };
  }

  const uid = cluster.subnet.uidNumber;
  const snapshot = await getEarningsSnapshot(uid).catch(() => null);
  const onboardedAt = snapshot?.onboarded_at ?? null;
  const lastSyncedAt = snapshot?.last_synced_at ?? null;

  // Independent of the earnings/nodes fetch below — a sparkline fetch failure
  // shouldn't take down the card's primary earnings display.
  const dailySeries = await getDailyEarnings(uid, 30)
    .then((data) => data.series)
    .catch(() => null);

  try {
    const [earnings, nodes] = await Promise.all([
      getEarnings(uid, { window: INITIAL_WINDOW }),
      getNodes(uid),
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
  const portfolioTotals = computePortfolioTotals(clustersWithData);

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
      <div className="max-w-5xl mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold">Cluster Earnings</h1>
            {lastSyncedAt && (
              <span
                className="text-xs text-[#94a3b8]"
                title={new Date(lastSyncedAt).toLocaleString()}
              >
                as of {formatSyncedAgo(lastSyncedAt)}
              </span>
            )}
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

        {clustersError && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6">
            Couldn&apos;t load clusters: {clustersError}
          </div>
        )}

        <EarningsDashboard
          clustersWithData={clustersWithData}
          renderedAtMs={renderedAtMs}
          portfolioTotals={portfolioTotals}
        />
      </div>
    </div>
  );
}
