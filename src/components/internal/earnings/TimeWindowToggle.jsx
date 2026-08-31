'use client';

import { useState } from 'react';
import { WINDOWS } from '@/lib/internal/windows';

const inputClass =
  'bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#06b6d4]/50';

function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function TimeWindowToggle({
  activeWindow,
  onChange,
  onCustomApply,
  disabled,
  allTimeDisabled,
  customRange,
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [since, setSince] = useState(customRange?.since ?? '');
  const [until, setUntil] = useState(customRange?.until ?? '');

  const canApply = since && until && since <= until;

  function handlePillClick(value) {
    if (value === 'custom') {
      setPanelOpen((open) => !open);
      return;
    }
    setPanelOpen(false);
    onChange(value);
  }

  function handleApply() {
    if (!canApply) return;
    onCustomApply(since, until);
    setPanelOpen(false);
  }

  return (
    <div className="relative">
      <div className="inline-flex items-center gap-1 bg-black/30 border border-white/10 rounded-full p-1">
        {WINDOWS.map((w) => {
          const isDisabled = disabled || (w.value === 'all' && allTimeDisabled);
          return (
            <button
              key={w.value}
              type="button"
              disabled={isDisabled}
              onClick={() => handlePillClick(w.value)}
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

      {panelOpen && (
        <div className="absolute right-0 top-full mt-2 z-10 bg-black/90 border border-white/10 rounded-xl p-3 flex items-end gap-2 shadow-xl">
          <div>
            <label className="block text-[10px] text-[#94a3b8] mb-1">From</label>
            <input
              type="date"
              value={since}
              max={until || todayDateStr()}
              onChange={(e) => setSince(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[10px] text-[#94a3b8] mb-1">To</label>
            <input
              type="date"
              value={until}
              min={since || undefined}
              max={todayDateStr()}
              onChange={(e) => setUntil(e.target.value)}
              className={inputClass}
            />
          </div>
          <button
            type="button"
            disabled={!canApply}
            onClick={handleApply}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#06b6d4] text-[#050508] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
