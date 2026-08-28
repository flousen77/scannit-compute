import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { SUBNET_PLATFORMS, COST_MODES } from './clusterOptions';

// Local JSON file storage for the internal team only. TODO: swap for a
// shared store (e.g. Vercel KV) before this needs to run multi-instance
// or survive ephemeral/serverless deploys.
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'internal-clusters.json');

const COST_MODE_VALUES = COST_MODES.map((m) => m.value);

async function readAll() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeAll(clusters) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(clusters, null, 2));
}

function normalizeCost(cost) {
  if (!cost) return null;
  if (!COST_MODE_VALUES.includes(cost.mode)) {
    throw new Error(`cost.mode must be one of ${COST_MODE_VALUES.join(', ')}`);
  }
  const value = Number(cost.value);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('cost.value must be a non-negative number');
  }
  return { mode: cost.mode, value };
}

function normalizeClusterInput(input) {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('name is required');

  const computeType = String(input.computeType || '').trim();
  if (!computeType) throw new Error('computeType is required');

  if (input.hostingMode === 'subnet') {
    const platform = String(input.subnet?.platform || '').trim();
    if (!SUBNET_PLATFORMS.includes(platform)) {
      throw new Error(`subnet.platform must be one of ${SUBNET_PLATFORMS.join(', ')}`);
    }
    const uidNumber = Number(input.subnet?.uidNumber);
    if (!Number.isInteger(uidNumber)) {
      throw new Error('subnet.uidNumber must be an integer');
    }

    return {
      name,
      computeType,
      hostingMode: 'subnet',
      subnet: { platform, uidNumber },
      contract: null,
      cost: normalizeCost(input.cost),
    };
  }

  if (input.hostingMode === 'contract') {
    const pricePerHourUsd = Number(input.contract?.pricePerHourUsd);
    if (!Number.isFinite(pricePerHourUsd) || pricePerHourUsd < 0) {
      throw new Error('contract.pricePerHourUsd must be a non-negative number');
    }

    return {
      name,
      computeType,
      hostingMode: 'contract',
      subnet: null,
      contract: { pricePerHourUsd },
      cost: normalizeCost(input.cost),
    };
  }

  throw new Error('hostingMode must be "subnet" or "contract"');
}

export async function listClusters() {
  return readAll();
}

export async function createCluster(input) {
  const normalized = normalizeClusterInput(input);
  const clusters = await readAll();
  const cluster = { id: crypto.randomUUID(), ...normalized };
  clusters.push(cluster);
  await writeAll(clusters);
  return cluster;
}

export async function updateCluster(id, input) {
  const normalized = normalizeClusterInput(input);
  const clusters = await readAll();
  const index = clusters.findIndex((c) => c.id === id);
  if (index === -1) return null;

  clusters[index] = { id, ...normalized };
  await writeAll(clusters);
  return clusters[index];
}

export async function deleteCluster(id) {
  const clusters = await readAll();
  const next = clusters.filter((c) => c.id !== id);
  if (next.length === clusters.length) return false;
  await writeAll(next);
  return true;
}
