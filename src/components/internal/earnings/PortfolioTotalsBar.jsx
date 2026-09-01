import { HOSTING_MODES } from '@/lib/internal/clusterOptions';

const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

// grid-cols-3/4 need to exist as literal strings somewhere for Tailwind's
// content scan to pick them up — a template-interpolated `grid-cols-${n}`
// wouldn't be found.
const GRID_COLS = { 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' };

function SegmentCard({ label, mrr, profit, margin, accent }) {
  return (
    <div className="bg-brand-panel border border-white/10 rounded-2xl p-6">
      <div className="text-sm font-semibold text-white uppercase tracking-wide mb-4">{label}</div>

      <div className="text-xs uppercase tracking-wide text-brand-muted mb-1.5">
        MRR (Projected)
      </div>
      <div
        className={`font-mono tabular-nums text-3xl font-semibold ${
          accent ? 'text-brand-cyan' : 'text-white'
        }`}
      >
        {mrr != null ? usdFmt.format(mrr) : '—'}
      </div>

      <div className="text-sm text-brand-muted mt-3 pt-3 border-t border-white/10">
        Profit <span className="text-white font-mono">{profit != null ? usdFmt.format(profit) : '—'}</span>
        <span className="mx-1.5">·</span>
        <span className="text-white font-mono">{margin != null ? `${margin.toFixed(1)}%` : '—'}</span> margin
      </div>
    </div>
  );
}

export default function PortfolioTotalsBar({
  totals,
  activeFilter,
  onFilterChange,
  includeForecast,
  onIncludeForecastChange,
}) {
  const {
    totalClusters,
    subnetCount,
    contractCount,
    forecastCount,
    clustersWithCost,
    clustersWithRevenue,
    totalProfitPerMonth,
    subnetProfitPerMonth,
    contractProfitPerMonth,
    forecastProfitPerMonth,
    totalMarginPercent,
    subnetMarginPercent,
    contractMarginPercent,
    forecastMarginPercent,
    totalRevenuePerMonth,
    subnetRevenuePerMonth,
    contractRevenuePerMonth,
    forecastRevenuePerMonth,
  } = totals;

  if (totalClusters === 0) return null;

  const counts = { all: totalClusters, subnet: subnetCount, contract: contractCount, forecast: forecastCount };
  const filters = [
    { key: 'all', label: 'All clusters' },
    ...HOSTING_MODES.map((m) => ({ key: m.value, label: m.label })),
  ];

  const segments = {
    all: { label: 'Total', mrr: totalRevenuePerMonth, profit: totalProfitPerMonth, margin: totalMarginPercent },
    subnet: { label: 'Subnet', mrr: subnetRevenuePerMonth, profit: subnetProfitPerMonth, margin: subnetMarginPercent },
    contract: { label: 'Enterprise', mrr: contractRevenuePerMonth, profit: contractProfitPerMonth, margin: contractMarginPercent },
    forecast: { label: 'Forecast', mrr: forecastRevenuePerMonth, profit: forecastProfitPerMonth, margin: forecastMarginPercent },
  };

  // Forecast only joins the "all" breakdown when explicitly included; but a
  // direct Forecast filter shows it regardless — filtering to inspect a
  // segment's numbers is independent of whether it's opted into the blend.
  const showForecastCard = forecastCount > 0 && includeForecast;
  const forecastVisible = forecastCount > 0 && (includeForecast || activeFilter === 'forecast');
  const maxCols = forecastVisible ? 4 : 3;

  const visibleKeys =
    activeFilter === 'all'
      ? showForecastCard
        ? ['all', 'subnet', 'contract', 'forecast']
        : ['all', 'subnet', 'contract']
      : [activeFilter];

  // Total is always the accent card in the full view; when filtered down to
  // one segment, that segment becomes the sole headline, so it takes the
  // accent too rather than staying neutral just because it isn't "Total".
  const isAccent = (key) => key === 'all' || visibleKeys.length === 1;

  return (
    <div className="mb-6">
      <div className={`grid grid-cols-1 ${GRID_COLS[maxCols]} gap-4`}>
        {visibleKeys.map((key) => (
          <SegmentCard key={key} {...segments[key]} accent={isAccent(key)} />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <div className="inline-flex items-center gap-1 bg-black/30 border border-white/10 rounded-full p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onFilterChange(f.key)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                activeFilter === f.key
                  ? 'bg-white text-brand-dark'
                  : 'text-brand-muted hover:text-white'
              }`}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>

        {activeFilter === 'all' && forecastCount > 0 && (
          <label className="flex items-center gap-2 text-xs text-brand-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeForecast}
              onChange={(e) => onIncludeForecastChange(e.target.checked)}
              className="rounded border-white/20 bg-black/40"
            />
            Include forecast in totals
          </label>
        )}
      </div>

      {activeFilter === 'all' && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-brand-muted">
          {clustersWithRevenue < totalClusters && (
            <span>
              MRR reflects {clustersWithRevenue} of {totalClusters} clusters
            </span>
          )}
          {clustersWithCost < totalClusters && (
            <span>
              Profit reflects {clustersWithCost} of {totalClusters} clusters
            </span>
          )}
        </div>
      )}
    </div>
  );
}
