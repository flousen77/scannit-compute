'use client';

import { useState } from 'react';
import { formatRelativeTime } from '@/lib/internal/dateRanges';

// gpu_type strings arriving from Redis are already canonicalized upstream
// (e.g. Targon's raw "TDX-VM-NVIDIA-RTX6000B" already comes through as "RTX
// PRO 6000 (unspecified variant)") — grouping here is just "does this string
// start with this family's prefix", not a fresh canonicalization pass.
// Display label differs in word order from the real data's "RTX PRO 6000"
// prefix ("RTX 6000 Pro") deliberately — that's the requested tab label.
const GPU_TABS = [
  { prefix: 'B300', label: 'B300' },
  { prefix: 'B200', label: 'B200' },
  { prefix: 'RTX PRO 6000', label: 'RTX 6000 Pro' },
  { prefix: 'H200', label: 'H200' },
  { prefix: 'H100', label: 'H100' },
];

const SOURCE_LABELS = {
  chutes: 'Chutes',
  targon: 'Targon',
  lium: 'Lium',
  vast: 'Vast.ai',
  runpod_secure: 'RunPod (Secure)',
  runpod_community: 'RunPod (Community)',
};

// The upstream vocabulary as observed in the real payload includes two tiers
// beyond the four originally described (LOW_CONFIDENCE, INSUFFICIENT_DATA) -
// styled here too rather than left unstyled; DEFAULT_CONFIDENCE_CLASS covers
// any future tier this map doesn't yet know about.
const CONFIDENCE_BADGE_CLASS = {
  OK: 'text-white border-white/20 bg-white/5',
  LOW_SAMPLE: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  LOW_CONFIDENCE: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  DERIVED_ESTIMATE: 'text-brand-purple border-brand-purple/30 bg-brand-purple/10',
  MODEL_ESTIMATE: 'text-brand-purple border-brand-purple/30 bg-brand-purple/10',
  INSUFFICIENT_DATA: 'text-brand-muted border-white/10 bg-white/[0.03]',
};
const DEFAULT_CONFIDENCE_CLASS = 'text-brand-muted border-white/10 bg-white/[0.03]';

// PLACEHOLDER wording pending consolidate/LEARNINGS.md, which doesn't exist
// on this machine — these are the exact per-source rules given when this
// tooltip was requested, not verified against the actual consolidation-job
// source, and with the literal "N" dropped since no per-row basis field
// exists in the real payload to fill it with (checked: rows are only
// {gpu_type, source, current_rate_per_hr, avg_7d_rate_per_hr,
// confidence_tier, last_synced}). Targon has no example given and uses a
// different tier vocabulary (OK/DERIVED_ESTIMATE) than the others, so it's
// deliberately left unmapped rather than guessed.
const CONFIDENCE_BASIS_BY_SOURCE = {
  chutes: 'Chutes: based on qualifying miners observed for this GPU type.',
  lium: 'Lium: based on GPUs listed for this GPU type.',
  vast: 'Vast.ai: based on offers observed for this GPU type.',
  runpod_secure: 'RunPod: platform-reported availability tier.',
  runpod_community: 'RunPod: platform-reported availability tier.',
};
const DEFAULT_CONFIDENCE_BASIS =
  'Basis not yet documented for this source — check consolidate/LEARNINGS.md once available.';

function confidenceTooltip(row) {
  // Checked first in case the backend ever adds a per-row basis field —
  // none exists in the payload today, so this always falls through.
  if (row.confidence_basis) return row.confidence_basis;
  return CONFIDENCE_BASIS_BY_SOURCE[row.source] ?? DEFAULT_CONFIDENCE_BASIS;
}

const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});
const usdFmt0 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function variantSuffix(gpuType, prefix) {
  return gpuType.slice(prefix.length).trim() || null;
}

// Provisional — flagged for a later decision once discussed internally.
// Chutes/Targon's data can't distinguish RTX 6000 Pro sub-variants at all;
// this only makes that uncertainty visible, it doesn't change which rows
// are shown or how they're computed.
const RTX6000_UNSPECIFIED_LABEL =
  "(assumed Max-Q — Chutes/Targon's onboarding requirements suggest Max-Q, but their data can't actually distinguish sub-variants)";

function variantHeading(gpuType, prefix) {
  const suffix = variantSuffix(gpuType, prefix);
  if (prefix === 'RTX PRO 6000' && suffix === '(unspecified variant)') {
    return RTX6000_UNSPECIFIED_LABEL;
  }
  return suffix ?? gpuType;
}

// Shared by the scorecard (across every variant in a tab) and each expanded
// table (within one variant group) — same rule either way: highest
// current_rate_per_hr, skipping rows with no usable rate.
function findTopPayer(rows) {
  const rated = rows.filter((r) => r.current_rate_per_hr != null);
  if (rated.length === 0) return null;
  return rated.reduce((best, r) => (r.current_rate_per_hr > best.current_rate_per_hr ? r : best));
}

function ScoreCard({ rows }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
      {GPU_TABS.map((tab) => {
        const tabRows = rows.filter((r) => r.gpu_type.startsWith(tab.prefix));
        const top = findTopPayer(tabRows);
        return (
          <div key={tab.prefix} className="bg-black/30 border border-white/10 rounded-xl px-4 py-3">
            <div className="text-[10px] uppercase tracking-wide text-brand-muted mb-1">{tab.label}</div>
            {top ? (
              <>
                <div className="text-xs text-white truncate">{SOURCE_LABELS[top.source] ?? top.source}</div>
                <div className="font-mono text-lg text-brand-cyan">
                  {usdFmt.format(top.current_rate_per_hr)}
                  <span className="text-xs text-brand-muted">/hr</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-brand-muted">—</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VariantTable({ rows }) {
  // A null current_rate_per_hr shows as "—" the same as a source/GPU-type
  // combo that has no row at all — the payload isn't fully consistent about
  // which of those two it uses for "no usable data", so both render
  // identically rather than one looking more "real" than the other.
  const topPayer = findTopPayer(rows);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-brand-muted border-b border-white/10">
            <th className="py-2 pr-4 font-medium">Source</th>
            <th className="py-2 pr-4 font-medium">Current $/hr</th>
            <th className="py-2 pr-4 font-medium">7D Avg $/hr</th>
            <th className="py-2 pr-4 font-medium">Confidence</th>
            <th className="py-2 font-medium">Est. MRR (8-GPU cluster)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isTopPayer = topPayer != null && row === topPayer;
            const mrr = row.current_rate_per_hr != null ? row.current_rate_per_hr * 24 * 30 * 8 : null;
            const rateClass = isTopPayer ? 'text-brand-cyan font-semibold' : 'text-white';
            return (
              <tr key={row.source} className="border-b border-white/5 last:border-0">
                <td className={`py-2 pr-4 font-mono ${rateClass}`}>
                  {SOURCE_LABELS[row.source] ?? row.source}
                </td>
                <td className={`py-2 pr-4 font-mono ${rateClass}`}>
                  {row.current_rate_per_hr != null ? usdFmt.format(row.current_rate_per_hr) : '—'}
                </td>
                <td className="py-2 pr-4 font-mono text-white">
                  {row.avg_7d_rate_per_hr != null ? usdFmt.format(row.avg_7d_rate_per_hr) : '—'}
                </td>
                <td className="py-2 pr-4">
                  <span
                    title={confidenceTooltip(row)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap cursor-help ${
                      CONFIDENCE_BADGE_CLASS[row.confidence_tier] ?? DEFAULT_CONFIDENCE_CLASS
                    }`}
                  >
                    {row.confidence_tier}
                  </span>
                </td>
                <td className="py-2 font-mono text-white">{mrr != null ? usdFmt0.format(mrr) : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function MarketRateComparisonPanel({ marketRates }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTabPrefix, setActiveTabPrefix] = useState(null);

  const rows = marketRates?.rows ?? [];

  const tabsWithData = GPU_TABS.map((tab) => ({
    ...tab,
    rows: rows.filter((r) => r.gpu_type.startsWith(tab.prefix)),
  })).filter((tab) => tab.rows.length > 0);

  const activeTab = tabsWithData.find((t) => t.prefix === activeTabPrefix) ?? tabsWithData[0];

  const variantGroups = [];
  if (activeTab) {
    const byGpuType = new Map();
    activeTab.rows.forEach((row) => {
      if (!byGpuType.has(row.gpu_type)) byGpuType.set(row.gpu_type, []);
      byGpuType.get(row.gpu_type).push(row);
    });
    variantGroups.push(...byGpuType.entries());
  }

  return (
    <div className="mb-6">
      <ScoreCard rows={rows} />

      <div className="bg-brand-panel border border-white/10 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center justify-between px-6 py-4 text-left"
        >
          <span className="text-sm font-semibold text-white">
            Market Rate Comparison {expanded ? '▾' : '▸'}
          </span>
        </button>

        {expanded && (
          <div className="px-6 pb-6 border-t border-white/10 pt-4">
            {marketRates?.generated_at && (
              <div className="text-xs text-brand-muted mb-4">
                Rates as of {formatRelativeTime(new Date(`${marketRates.generated_at.replace(' ', 'T')}Z`).getTime())}
              </div>
            )}

            {tabsWithData.length === 0 ? (
              <div className="text-sm text-brand-muted">No market rate data available.</div>
            ) : (
              <>
                <div className="inline-flex items-center gap-1 bg-black/30 border border-white/10 rounded-full p-1 mb-4">
                  {tabsWithData.map((tab) => (
                    <button
                      key={tab.prefix}
                      type="button"
                      onClick={() => setActiveTabPrefix(tab.prefix)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                        activeTab?.prefix === tab.prefix
                          ? 'bg-white text-brand-dark'
                          : 'text-brand-muted hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {variantGroups.map(([gpuType, groupRows]) => (
                  <div key={gpuType} className="mb-6 last:mb-0">
                    {variantGroups.length > 1 && (
                      <div className="text-xs uppercase tracking-wide text-brand-muted mb-2">
                        {variantHeading(gpuType, activeTab.prefix)}
                      </div>
                    )}
                    <VariantTable rows={groupRows} />
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
