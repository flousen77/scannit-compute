export const COMPUTE_TYPE_SUGGESTIONS = ['RTX 6000 Pro', 'HGX B200', 'B300'];
export const SUBNET_PLATFORMS = ['targon', 'lium'];

// Which Bittensor subnet each platform is. Derived from the platform rather
// than stored on the cluster record, so the two can't drift apart and
// existing records need no migration.
//
// This mapping is why it exists at all: uid numbers are only unique *within*
// a subnet, and ours actually collide — the Targon cluster is SN4 uid 162
// and the Lium cluster is SN51 uid 162. Every read of cached earnings has to
// be keyed on the pair, never the uid alone.
export const SUBNET_NETUID = {
  targon: 4,
  lium: 51,
};

export const SUBNET_PLATFORM_LABEL = {
  targon: 'Targon',
  lium: 'Lium',
};

export function netuidFor(platform) {
  return SUBNET_NETUID[platform] ?? null;
}

// Platforms that publish a stable per-machine id, so one cluster can track
// one physical box rather than the whole uid.
//
// Targon isn't here and can't be: it reports one combined bucket per card
// type, so two identical machines under a uid are indistinguishable in its
// data. Splitting a Targon uid across clusters would mean inventing a ratio.
export const NODE_SCOPED_PLATFORMS = ['lium'];

export function supportsNodeScope(platform) {
  return NODE_SCOPED_PLATFORMS.includes(platform);
}

// Node ids are uuids — too long to display, but the first and last groups are
// enough to tell two machines apart at a glance and to match against the
// provider portal.
export function shortNodeId(nodeId) {
  if (!nodeId) return null;
  if (nodeId.length <= 17) return nodeId;
  return `${nodeId.slice(0, 8)}…${nodeId.slice(-4)}`;
}
export const COST_MODES = [
  { value: 'per_hour', label: 'Per Hour' },
  { value: 'per_month', label: 'Per Month' },
];

// Single source of truth for hosting-mode display: label, filter/toggle
// options, and badge color all derive from here so they can't drift apart.
export const HOSTING_MODES = [
  { value: 'subnet', label: 'Subnet' },
  { value: 'contract', label: 'Enterprise' },
  { value: 'forecast', label: 'Forecast' },
];

export const HOSTING_MODE_LABEL = Object.fromEntries(
  HOSTING_MODES.map((m) => [m.value, m.label])
);

// Forecast reuses brand.purple? No — Enterprise does (already defined, just
// unused until now). Subnet/Forecast use Tailwind's default teal/amber
// scales since there's no brand-palette equivalent for those.
export const HOSTING_MODE_BADGE_CLASS = {
  subnet: 'text-teal-400 border-teal-400/30 bg-teal-400/10',
  contract: 'text-brand-purple border-brand-purple/30 bg-brand-purple/10',
  forecast: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
};

// Forecast clusters store data in the same shape as Enterprise (contract)
// ones — same manual price/GPU-count/onboarded-date fields, no live data
// source. Both hosting modes use this fields-shape.
export const CONTRACT_SHAPED_MODES = ['contract', 'forecast'];
