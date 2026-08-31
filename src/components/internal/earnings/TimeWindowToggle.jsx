'use client';

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { WINDOWS } from '@/lib/internal/windows';

// Deliberately not importing react-day-picker's default stylesheet — every
// part below is styled by hand via `classNames` to match this app's existing
// dark palette (same #06b6d4 accent used everywhere else: active toggle
// pills, the sparkline, the Apply button), rather than overriding a
// light-themed default.
const calendarClassNames = {
  months: 'relative',
  month_caption: 'flex items-center justify-center h-8 mb-1',
  caption_label: 'text-xs font-semibold text-white',
  month_grid: 'border-collapse',
  weekdays: '',
  weekday: 'text-[10px] font-medium text-[#94a3b8] w-8 h-6 uppercase',
  week: '',
  day: 'p-0 text-center',
  day_button:
    'w-8 h-8 text-xs text-white rounded-full hover:bg-white/10 transition-colors disabled:text-white/15 disabled:hover:bg-transparent disabled:cursor-not-allowed',
  today: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-[#06b6d4]',
  outside: 'text-white/20',
  selected: 'rounded-full [&>button]:bg-[#06b6d4] [&>button]:text-[#050508] [&>button]:font-semibold [&>button]:hover:bg-[#06b6d4]',
  range_start:
    'rounded-l-full [&>button]:bg-[#06b6d4] [&>button]:text-[#050508] [&>button]:font-semibold [&>button]:hover:bg-[#06b6d4]',
  range_end:
    'rounded-r-full [&>button]:bg-[#06b6d4] [&>button]:text-[#050508] [&>button]:font-semibold [&>button]:hover:bg-[#06b6d4]',
  range_middle: 'bg-[#06b6d4]/15 [&>button]:text-white [&>button]:hover:bg-white/10',
};

const navButtonClass =
  'pointer-events-auto p-1 rounded-md text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none';

// globals.css has an unscoped `nav { position: sticky; z-index: 100;
// background: rgba(5,5,8,0.8); backdrop-filter: blur(15px); ... }` rule
// written for the marketing site's navbar — with no class scoping, it
// applies to any <nav> anywhere in the app, including react-day-picker's
// default month-nav wrapper, and was blurring out the caption text behind
// it. Rendering a <div> here instead of the library's default <nav> avoids
// that collision entirely rather than fighting it with overrides.
function CalendarNav({ onPreviousClick, onNextClick, previousMonth, nextMonth }) {
  return (
    <div className="flex items-center justify-between absolute inset-x-0 top-0 h-8 pointer-events-none">
      <button
        type="button"
        disabled={!previousMonth}
        onClick={onPreviousClick}
        aria-label="Previous month"
        className={navButtonClass}
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <polygon points="16 18.112 9.811 12 16 5.877 14.089 4 6 12 14.089 20" />
        </svg>
      </button>
      <button
        type="button"
        disabled={!nextMonth}
        onClick={onNextClick}
        aria-label="Next month"
        className={navButtonClass}
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <polygon points="8 18.112 14.189 12 8 5.877 9.911 4 18 12 9.911 20" />
        </svg>
      </button>
    </div>
  );
}

function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

// Calendar day <-> 'YYYY-MM-DD' conversions stay in local-calendar-day space
// throughout (never via toISOString, which is UTC and can shift the date by
// one day depending on the viewer's timezone) — this must exactly match the
// calendar day the user clicked, not a UTC reinterpretation of it.
function dateStrToLocalDate(dateStr) {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function localDateToDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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
        <div className="absolute right-0 top-full mt-2 z-10 bg-[#050508] border border-white/10 rounded-xl p-3 shadow-xl">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            defaultMonth={range?.to ?? todayLocal}
            disabled={disabledMatchers}
            classNames={calendarClassNames}
            components={{ Nav: CalendarNav }}
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
