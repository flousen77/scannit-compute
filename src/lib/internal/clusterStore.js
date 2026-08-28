import crypto from 'crypto';
import { SUBNET_PLATFORMS, COST_MODES } from './clusterOptions';
import { readClusters, writeClusters } from './clusterStorage';

const COST_MODE_VALUES = COST_MODES.map((m) => m.value);

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
    const cardCount = Number(input.contract?.cardCount);
    if (!Number.isInteger(cardCount) || cardCount < 1) {
      throw new Error('contract.cardCount must be a positive integer');
    }
    const onboardedAt = String(input.contract?.onboardedAt || '').trim();
    if (!onboardedAt) {
      throw new Error('contract.onboardedAt is required');
    }

    return {
      name,
      computeType,
      hostingMode: 'contract',
      subnet: null,
      contract: { pricePerHourUsd, cardCount, onboardedAt },
      cost: normalizeCost(input.cost),
    };
  }

  throw new Error('hostingMode must be "subnet" or "contract"');
}

export async function listClusters() {
  return readClusters();
}

export async function createCluster(input) {
  const normalized = normalizeClusterInput(input);
  const clusters = await readClusters();
  const cluster = { id: crypto.randomUUID(), ...normalized };
  clusters.push(cluster);
  await writeClusters(clusters);
  return cluster;
}

export async function updateCluster(id, input) {
  const normalized = normalizeClusterInput(input);
  const clusters = await readClusters();
  const index = clusters.findIndex((c) => c.id === id);
  if (index === -1) return null;

  clusters[index] = { id, ...normalized };
  await writeClusters(clusters);
  return clusters[index];
}

export async function deleteCluster(id) {
  const clusters = await readClusters();
  const next = clusters.filter((c) => c.id !== id);
  if (next.length === clusters.length) return false;
  await writeClusters(next);
  return true;
}
