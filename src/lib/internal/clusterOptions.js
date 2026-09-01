export const COMPUTE_TYPE_SUGGESTIONS = ['RTX 6000 Pro', 'HGX B200', 'B300'];
export const SUBNET_PLATFORMS = ['targon'];
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
