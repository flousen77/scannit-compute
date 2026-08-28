import { getClusters } from '@/lib/internal/clusters';
import { getEarnings, getNodes, getUids } from '@/lib/internal/vpsClient';
import ClusterCard from '@/components/internal/earnings/ClusterCard';

const INITIAL_WINDOW = '24h';

async function loadClusterData(cluster, uidRecords) {
  if (cluster.hostingMode !== 'subnet' || !cluster.subnet?.uid) {
    return {
      earnings: null,
      nodes: null,
      onboardedAt: null,
      error: 'No subnet UID configured for this cluster.',
    };
  }

  const uidRecord = uidRecords.find(
    (u) => String(u.uid_number) === String(cluster.subnet.uid)
  );
  const onboardedAt = uidRecord?.onboarded_at ?? null;

  try {
    const [earnings, nodes] = await Promise.all([
      getEarnings(cluster.subnet.uid, { window: INITIAL_WINDOW }),
      getNodes(cluster.subnet.uid, { window: INITIAL_WINDOW }),
    ]);
    return { earnings, nodes, onboardedAt, error: null };
  } catch (error) {
    return { earnings: null, nodes: null, onboardedAt, error: error.message };
  }
}

export default async function InternalEarningsPage() {
  const clusters = getClusters();
  const uidRecords = await getUids().catch(() => []);
  const clustersWithData = await Promise.all(
    clusters.map(async (cluster) => ({
      cluster,
      ...(await loadClusterData(cluster, uidRecords)),
    }))
  );

  return (
    <div className="bg-[#050508] text-white min-h-screen">
      <div className="max-w-5xl mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Cluster Earnings</h1>
          <form method="POST" action="/api/internal/auth/logout">
            <button
              type="submit"
              className="text-xs text-[#94a3b8] border border-white/10 rounded-full px-3 py-1.5 hover:text-white hover:border-white/30 transition-colors"
            >
              Log out
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {clustersWithData.map(({ cluster, earnings, nodes, onboardedAt, error }) => (
            <ClusterCard
              key={cluster.id}
              cluster={cluster}
              onboardedAt={onboardedAt}
              initialWindow={INITIAL_WINDOW}
              initialEarnings={earnings}
              initialNodes={nodes}
              initialError={error}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
