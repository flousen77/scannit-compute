const TONE_TEXT = {
  positive: 'text-[#06b6d4]',
  negative: 'text-red-400',
  warning: 'text-amber-400',
};

// `note` is a small line under the value, for something that qualifies the
// number without competing with it — money earned but not yet received, say.
// It is deliberately not a tile of its own: a ninth tile would break the 4-up
// grid, and a figure that belongs to another figure should sit with it.
export default function EarningsStat({
  label, value, unit, accent = false, tone, note, noteTitle, noteTone,
}) {
  const valueColor = tone ? TONE_TEXT[tone] : accent ? 'text-[#06b6d4]' : 'text-white';

  return (
    <div className="bg-black/30 border border-white/10 rounded-xl px-5 py-4">
      <div className="text-xs uppercase tracking-wide text-[#94a3b8] mb-2">{label}</div>
      <div className={`font-mono tabular-nums text-2xl font-semibold ${valueColor}`}>
        {value}
        {unit && <span className="text-sm text-[#94a3b8] ml-1.5 font-sans">{unit}</span>}
      </div>
      {note && (
        <div
          className={`text-[11px] mt-1.5 font-sans leading-snug ${
            noteTone === 'warning' ? 'text-amber-400' : 'text-[#94a3b8]'
          }`}
          title={noteTitle}
        >
          {note}
        </div>
      )}
    </div>
  );
}
