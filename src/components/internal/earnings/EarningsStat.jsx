const TONE_TEXT = {
  positive: 'text-[#06b6d4]',
  negative: 'text-red-400',
};

export default function EarningsStat({ label, value, unit, accent = false, tone }) {
  const valueColor = tone ? TONE_TEXT[tone] : accent ? 'text-[#06b6d4]' : 'text-white';

  return (
    <div className="bg-black/30 border border-white/10 rounded-xl px-5 py-4">
      <div className="text-xs uppercase tracking-wide text-[#94a3b8] mb-2">{label}</div>
      <div className={`font-mono tabular-nums text-2xl font-semibold ${valueColor}`}>
        {value}
        {unit && <span className="text-sm text-[#94a3b8] ml-1.5 font-sans">{unit}</span>}
      </div>
    </div>
  );
}
