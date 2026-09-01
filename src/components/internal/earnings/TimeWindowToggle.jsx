'use client';

import { useState } from 'react';
import { WINDOWS } from '@/lib/internal/windows';
import DarkCalendar, { todayDateStr, dateStrToLocalDate, localDateToDateStr } from './DarkCalendar';

function formatRangeLabel(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function TimeWindowToggle({
  activeWindow,
  onChange,
  onCustomApply,
  disabled,
  allTimeDisabled,
  customRange,
  onboardedAt,
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [range, setRange] = useState(() => ({
    from: dateStrToLocalDate(customRange?.since),
    to: dateStrToLocalDate(customRange?.until),
  }));

  const canApply = Boolean(range?.from && range?.to);

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
    onCustomApply(localDateToDateStr(range.from), localDateToDateStr(range.to));
    setPanelOpen(false);
  }

  const todayLocal = dateStrToLocalDate(todayDateStr());
  const onboardedLocal = dateStrToLocalDate(onboardedAt);
  const disabledMatchers = onboardedLocal
    ? [{ before: onboardedLocal }, { after: todayLocal }]
    : [{ after: todayLocal }];

  const rangeLabel = range?.from
    ? range.to
      ? `${formatRangeLabel(localDateToDateStr(range.from))} – ${formatRangeLabel(localDateToDateStr(range.to))}`
      : `${formatRangeLabel(localDateToDateStr(range.from))} – …`
    : 'Select a range';

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
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
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
        <div className="absolute right-0 top-full mt-2 z-10 bg-[#050508] border border-white/10 rounded-xl p-3 shadow-xl">
          <DarkCalendar
            mode="range"
            selected={range}
            onSelect={setRange}
            defaultMonth={range?.to ?? todayLocal}
            disabled={disabledMatchers}
          />
          <div className="flex items-center justify-between gap-3 mt-1 pt-2 border-t border-white/10">
            <span className="text-xs font-mono text-[#94a3b8] whitespace-nowrap">
              {rangeLabel}
            </span>
            <button
              type="button"
              disabled={!canApply}
              onClick={handleApply}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#06b6d4] text-[#050508] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
