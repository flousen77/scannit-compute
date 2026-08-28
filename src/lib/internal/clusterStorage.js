import fs from 'fs/promises';
import path from 'path';

// Local JSON file storage for the internal team only. TODO: swap for a
// shared store (e.g. Vercel KV) once this needs to run multi-instance or
// survive ephemeral/serverless deploys. This file's two functions are the
// only thing that should need to change for that swap — keep the
// readClusters/writeClusters signatures the same.
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'internal-clusters.json');

export async function readClusters() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function writeClusters(clusters) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(clusters, null, 2));
}
