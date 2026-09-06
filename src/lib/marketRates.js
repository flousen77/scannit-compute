import { getMarketRates } from '@/lib/internal/vpsClient';

// Same family prefixes the internal comparison panel groups by; gpu_type
// strings are already canonicalized upstream, so this is a prefix match, not
// a fresh canonicalization pass. Labels are the public-facing wording.
const GPU_FAMILIES = [
  { prefix: 'RTX PRO 6000', label: 'NVIDIA RTX 6000 Pro' },
  { prefix: 'B200', label: 'NVIDIA HGX B200' },
  { prefix: 'B300', label: 'NVIDIA B300 Ultra' },
  { prefix: 'H100', label: 'NVIDIA H100' },
  { prefix: 'H200', label: 'NVIDIA H200' },
];

const SOURCE_LABELS = {
  chutes: 'Chutes',
  targon: 'Targon',
  lium: 'Lium',
  vast: 'Vast.ai',
  runpod: 'RunPod',
};

// RunPod reports two availability tiers as separate rows; collapsing them to
// one provider keeps a single provider from carrying double weight in the
// median below.
function providerOf(source) {
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

// A range rather than a single blended figure: sources disagree by up to ~2x
// on the same hardware (Chutes vs Targon on RTX 6000 Pro), and averaging that
// spread away would publish a precision the underlying data doesn't have.
function summarizeFamily(rows) {
  const providers = new Set(rows.map((r) => providerOf(r.source)));

  return {
    current: rangeOf(rows.map((r) => r.current_rate_per_hr)),
    avg_7d: rangeOf(rows.map((r) => r.avg_7d_rate_per_hr)),
    sources: [...providers].map((p) => SOURCE_LABELS[p] ?? p).sort(),
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
