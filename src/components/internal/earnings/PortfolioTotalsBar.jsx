const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function ToneValue({ value, size = 'text-xl' }) {
  const tone = value == null ? 'text-white' : value >= 0 ? 'text-[#06b6d4]' : 'text-red-400';
  return (
    <div className={`font-mono tabular-nums ${size} font-semibold ${tone}`}>
      {value != null ? usdFmt.format(value) : '—'}
    </div>
  );
}

export default function PortfolioTotalsBar({ totals }) {
  const {
    totalClusters,
    subnetCount,
    contractCount,
    clustersWithCost,
    totalProfitPerMonth,
    subnetProfitPerMonth,
    contractProfitPerMonth,
    blendedMarginPercent,
  } = totals;

  if (totalClusters === 0) return null;

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl px-6 py-5 mb-6">
      <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-[#94a3b8] mb-1.5">
            Total Profit / Mo (Projected)
          </div>
          <ToneValue value={totalProfitPerMonth} size="text-3xl" />
        </div>

        <div className="hidden sm:block w-px self-stretch bg-white/10" />

        <div>
          <div className="text-xs uppercase tracking-wide text-[#94a3b8] mb-1.5">
            Subnet Profit / Mo
          </div>
          <div className="font-mono tabular-nums text-xl font-semibold text-white">
            {subnetProfitPerMonth != null ? usdFmt.format(subnetProfitPerMonth) : '—'}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-[#94a3b8] mb-1.5">
            Enterprise Profit / Mo
          </div>
          <div className="font-mono tabular-nums text-xl font-semibold text-white">
            {contractProfitPerMonth != null ? usdFmt.format(contractProfitPerMonth) : '—'}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-[#94a3b8] mb-1.5">
            Blended Margin %
          </div>
          <div className="font-mono tabular-nums text-xl font-semibold text-white">
            {blendedMarginPercent != null ? `${blendedMarginPercent.toFixed(1)}%` : '—'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-4 border-t border-white/10 text-xs text-[#94a3b8]">
        <span>
          {totalClusters} cluster{totalClusters === 1 ? '' : 's'} · {subnetCount} subnet ·{' '}
          {contractCount} contract
        </span>
        {clustersWithCost < totalClusters && (
          <span>
            Profit reflects {clustersWithCost} of {totalClusters} clusters
          </span>
        )}
      </div>
    </div>
  );
}
