import { WINDOWS } from '@/lib/internal/windows';

export default function TimeWindowToggle({ activeWindow, onChange, disabled, allTimeDisabled }) {
  return (
    <div className="inline-flex items-center gap-1 bg-black/30 border border-white/10 rounded-full p-1">
      {WINDOWS.map((w) => {
        const isDisabled = disabled || (w.value === 'all' && allTimeDisabled);
        return (
          <button
            key={w.value}
            type="button"
            disabled={isDisabled}
            onClick={() => onChange(w.value)}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              activeWindow === w.value
                ? 'bg-white text-[#050508]'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            {w.toggleLabel}
          </button>
        );
      })}
    </div>
  );
}
