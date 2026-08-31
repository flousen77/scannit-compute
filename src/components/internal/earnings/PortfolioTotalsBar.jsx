const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const FILTERS = [
  { key: 'all', label: 'All clusters' },
  { key: 'subnet', label: 'Subnet' },
  { key: 'contract', label: 'Enterprise' },
];

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

export default function PortfolioTotalsBar({ totals, activeFilter, onFilterChange }) {
  const {
    totalClusters,
    clustersWithCost,
    clustersWithRevenue,
    totalProfitPerMonth,
    subnetProfitPerMonth,
    contractProfitPerMonth,
    totalMarginPercent,
    subnetMarginPercent,
    contractMarginPercent,
    totalRevenuePerMonth,
    subnetRevenuePerMonth,
    contractRevenuePerMonth,
  } = totals;

  if (totalClusters === 0) return null;

  const segments = {
    all: { label: 'Total', mrr: totalRevenuePerMonth, profit: totalProfitPerMonth, margin: totalMarginPercent },
    subnet: { label: 'Subnet', mrr: subnetRevenuePerMonth, profit: subnetProfitPerMonth, margin: subnetMarginPercent },
    contract: { label: 'Enterprise', mrr: contractRevenuePerMonth, profit: contractProfitPerMonth, margin: contractMarginPercent },
  };

  const visibleKeys = activeFilter === 'all' ? ['all', 'subnet', 'contract'] : [activeFilter];
  // Total is always the accent card in the full view; when filtered down to
  // one segment, that segment becomes the sole headline, so it takes the
  // accent too rather than staying neutral just because it isn't "Total".
  const isAccent = (key) => key === 'all' || visibleKeys.length === 1;

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {visibleKeys.map((key) => (
          <SegmentCard key={key} {...segments[key]} accent={isAccent(key)} />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <div className="inline-flex items-center gap-1 bg-black/30 border border-white/10 rounded-full p-1">
          {FILTERS.map((f) => (
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
              {f.label}
            </button>
          ))}
        </div>

        {activeFilter === 'all' && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-muted">
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
    </div>
  );
}
