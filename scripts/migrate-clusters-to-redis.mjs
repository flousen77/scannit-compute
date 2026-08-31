// One-time migration: copies data/internal-clusters.json into Upstash Redis.
// Run once by hand: node scripts/migrate-clusters-to-redis.mjs
// Not imported by the app — after this runs, the JSON file is never read again.
import fs from 'fs/promises';
import path from 'path';
import { Redis } from '@upstash/redis';

const DATA_FILE = path.join(process.cwd(), 'data', 'internal-clusters.json');
const CLUSTERS_KEY = 'clusters';

async function loadEnvFile(file) {
  try {
    const raw = await fs.readFile(file, 'utf-8');
    for (const line of raw.split('\n')) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (!(key in process.env)) process.env[key] = rawValue.replace(/^"(.*)"$/, '$1');
    }
  } catch {
    // file may not exist — fine
  }
}

async function main() {
  await loadEnvFile(path.join(process.cwd(), '.env.development.local'));

  const url = process.env.CLUSTER_KV_KV_REST_API_URL;
  const token = process.env.CLUSTER_KV_KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error('CLUSTER_KV_KV_REST_API_URL / CLUSTER_KV_KV_REST_API_TOKEN are not set');
  }

  const clusters = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));

  const redis = new Redis({ url, token });
  await redis.set(CLUSTERS_KEY, clusters);

  console.log(`Migrated ${clusters.length} cluster(s) to Redis key "${CLUSTERS_KEY}":`);
  for (const c of clusters) console.log(`  - ${c.name} (${c.id})`);
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
