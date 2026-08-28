export const WINDOWS = [
  { value: '24h', toggleLabel: 'Live', badgeLabel: 'LIVE' },
  { value: '7d', toggleLabel: '7D', badgeLabel: '7 DAYS' },
  { value: '30d', toggleLabel: '30D', badgeLabel: '30 DAYS' },
  { value: 'all', toggleLabel: 'All', badgeLabel: 'ALL TIME' },
];

export function getWindowConfig(value) {
  return WINDOWS.find((w) => w.value === value) ?? WINDOWS[0];
}
