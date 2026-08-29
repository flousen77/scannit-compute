import { Redis } from '@upstash/redis';

// Shared cluster storage via Upstash Redis (provisioned through Vercel's
// "CLUSTER_KV" integration). Its env vars use Vercel's KV naming, not the
// plain UPSTASH_REDIS_REST_URL/TOKEN names Redis.fromEnv() expects, so the
// client is built explicitly with those instead of via fromEnv().
function getClient() {
  const url = process.env.CLUSTER_KV_KV_REST_API_URL;
  const token = process.env.CLUSTER_KV_KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error('CLUSTER_KV_KV_REST_API_URL / CLUSTER_KV_KV_REST_API_TOKEN are not set');
  }
  return new Redis({ url, token });
}

const CLUSTERS_KEY = 'clusters';

export async function readClusters() {
  const clusters = await getClient().get(CLUSTERS_KEY);
  return clusters ?? [];
}

export async function writeClusters(clusters) {
  await getClient().set(CLUSTERS_KEY, clusters);
}
