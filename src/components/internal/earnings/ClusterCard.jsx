import EarningsStat from './EarningsStat';

const numberFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });
const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export default function ClusterCard({ cluster, window, earnings, error }) {
  return (
    <div className="bg-brand-panel border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">{cluster.name}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-[#94a3b8]">
              {cluster.computeType}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-[#94a3b8] capitalize">
              {cluster.hostingMode}
            </span>
          </div>
        </div>
        <span className="text-xs font-mono uppercase tracking-wide text-[#06b6d4] border border-[#06b6d4]/30 bg-[#06b6d4]/10 rounded-full px-3 py-1">
          {window === '24h' ? 'Live' : window}
        </span>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {!error && earnings && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <EarningsStat
            label="TAO Earned"
            value={numberFmt.format(earnings.tao_earned)}
            unit="TAO"
          />
          <EarningsStat
            label="USD Realized"
            value={usdFmt.format(earnings.usd_realized)}
            accent
          />
          <EarningsStat
            label="Earnings / hr"
            value={numberFmt.format(earnings.earnings_per_hour_tao)}
            unit="TAO/hr"
          />
          <EarningsStat
            label="Earnings / hr"
            value={usdFmt.format(earnings.earnings_per_hour_usd)}
            unit="/hr"
          />
        </div>
      )}
    </div>
  );
}
