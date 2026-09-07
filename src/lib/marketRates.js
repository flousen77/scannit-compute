import { getMarketRates } from '@/lib/internal/vpsClient';

// Same family prefixes the internal comparison panel groups by; gpu_type
// strings are already canonicalized upstream, so this is a prefix match, not
// a fresh canonicalization pass. Labels are the public-facing wording.
// Display order, newest and highest-density first. The API preserves it, so
// the cards render in this sequence without sorting client-side.
const GPU_FAMILIES = [
  { prefix: 'B300', label: 'NVIDIA B300 Ultra' },
  { prefix: 'B200', label: 'NVIDIA HGX B200' },
  { prefix: 'RTX PRO 6000', label: 'NVIDIA RTX 6000 Pro' },
  { prefix: 'H200', label: 'NVIDIA H200' },
  { prefix: 'H100', label: 'NVIDIA H100' },
];

const SOURCE_LABELS = {
  bittensor: 'Bittensor',
  vast: 'Vast.ai',
  runpod: 'RunPod',
};

// Chutes, Targon and Lium are all Bittensor subnets, surfaced publicly as the
// network rather than named individually. RunPod reports two availability
// tiers as separate rows and collapses to one name too.
const BITTENSOR_SUBNETS = new Set(['chutes', 'targon', 'lium']);

function providerOf(source) {
  if (BITTENSOR_SUBNETS.has(source)) return 'bittensor';
  return source.startsWith('runpod') ? 'runpod' : source;
}

// The line is observed-vs-computed, not confident-vs-thin. OK/LOW_SAMPLE/
// LOW_CONFIDENCE are all rates somebody actually listed — thin sampling is
// imprecision, which the published range already communicates. MODEL_ESTIMATE
// and DERIVED_ESTIMATE are numbers no marketplace ever quoted (Targon's B200
// figure is extrapolated from published max_price with no live miners behind
// it), so publishing them as observed market rates would misstate what they
// are.
const OBSERVED_TIERS = new Set(['OK', 'LOW_SAMPLE', 'LOW_CONFIDENCE']);

function isPublishable(row) {
  return OBSERVED_TIERS.has(row.confidence_tier) && Number.isFinite(row.current_rate_per_hr);
}

function rangeOf(values) {
  const usable = values.filter(Number.isFinite);
  if (usable.length === 0) return null;
  return { low: Math.min(...usable), high: Math.max(...usable) };
}

// The page publishes the top of each family rather than a blend, so it also
// publishes `observations`: the count of rows behind that figure. Picking the
// maximum out of a spread that runs up to 2x wide is only honest if the page
// says a selection happened, and how thin the set was. Note this counts rows,
// not provider labels, because three Bittensor subnets reporting separately
// are three independent readings under one name.
function summarizeFamily(rows) {
  const readingsByProvider = new Map();
  for (const row of rows) {
    const provider = providerOf(row.source);
    readingsByProvider.set(provider, (readingsByProvider.get(provider) ?? 0) + 1);
  }

  return {
    current: rangeOf(rows.map((r) => r.current_rate_per_hr)),
    avg_7d: rangeOf(rows.map((r) => r.avg_7d_rate_per_hr)),
    sources: [...readingsByProvider.entries()]
      .map(([provider, readings]) => ({ name: SOURCE_LABELS[provider] ?? provider, readings }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    observations: rows.length,
  };
}

// Public shape only — per-source rates, confidence tiers and every per-uid
// earnings key living in the same Redis instance stay server-side.
export async function getPublicMarketRates() {
  const payload = await getMarketRates();
  if (!payload?.rows) return { generated_at: null, gpus: [] };

  const publishable = payload.rows.filter(isPublishable);

  const gpus = GPU_FAMILIES.map(({ prefix, label }) => {
    const rows = publishable.filter((r) => r.gpu_type?.startsWith(prefix));
    if (rows.length === 0) return null;

    const summary = summarizeFamily(rows);
    if (!summary.current) return null;

    return { key: prefix, label, ...summary };
  }).filter(Boolean);

  return {
    generated_at: payload.generated_at ?? null,
    // Every marketplace the router integrates with, independent of which of
    // them happened to have observed rates for a given GPU today.
    platforms: Object.values(SOURCE_LABELS).sort(),
    gpus,
  };
}
