import { getClusters } from '@/lib/internal/clusters';
import { getEarnings } from '@/lib/internal/vpsClient';
import ClusterCard from '@/components/internal/earnings/ClusterCard';

const WINDOW = '24h';

async function loadClusterEarnings(cluster) {
  if (cluster.hostingMode !== 'subnet' || !cluster.subnet?.uid) {
    return { earnings: null, error: 'No subnet UID configured for this cluster.' };
  }

  try {
    const earnings = await getEarnings(cluster.subnet.uid, WINDOW);
    return { earnings, error: null };
  } catch (error) {
    return { earnings: null, error: error.message };
  }
}

export default async function InternalEarningsPage() {
  const clusters = getClusters();
  const clustersWithEarnings = await Promise.all(
    clusters.map(async (cluster) => ({
      cluster,
      ...(await loadClusterEarnings(cluster)),
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
          {clustersWithEarnings.map(({ cluster, earnings, error }) => (
            <ClusterCard
              key={cluster.id}
              cluster={cluster}
              window={WINDOW}
              earnings={earnings}
              error={error}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
