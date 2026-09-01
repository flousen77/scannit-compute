'use client';

import { useState } from 'react';
import { COMPUTE_TYPE_SUGGESTIONS, SUBNET_PLATFORMS, COST_MODES, HOSTING_MODES } from '@/lib/internal/clusterOptions';
import DarkCalendar, { dateStrToLocalDate, localDateToDateStr } from './DarkCalendar';

function today() {
  return new Date().toISOString().slice(0, 10);
}

// hostingModeOverride is used by the "Convert to live" flow — it opens this
// same modal pre-filled with the forecast cluster's data, but starting on
// the target mode's fields instead of "forecast", so the missing fields
// (e.g. a subnet UID) are the only thing left to fill in.
function initialFormState(cluster, hostingModeOverride) {
  return {
    name: cluster?.name || '',
    computeType: cluster?.computeType || '',
    hostingMode: hostingModeOverride || cluster?.hostingMode || 'subnet',
    subnetPlatform: cluster?.subnet?.platform || SUBNET_PLATFORMS[0],
    subnetUidNumber: cluster?.subnet?.uidNumber ?? '',
    contractPricePerHourUsd: cluster?.contract?.pricePerHourUsd ?? '',
    contractCardCount: cluster?.contract?.cardCount ?? '',
    contractOnboardedAt: cluster?.contract?.onboardedAt || today(),
    hasCost: Boolean(cluster?.cost),
    costMode: cluster?.cost?.mode || COST_MODES[0].value,
    costValue: cluster?.cost?.value ?? '',
  };
}

function buildPayload(form) {
  const payload = {
    name: form.name,
    computeType: form.computeType,
    hostingMode: form.hostingMode,
    cost: form.hasCost ? { mode: form.costMode, value: Number(form.costValue) } : null,
  };

  if (form.hostingMode === 'subnet') {
    payload.subnet = {
      platform: form.subnetPlatform,
      uidNumber: Number(form.subnetUidNumber),
    };
  } else {
    payload.contract = {
      pricePerHourUsd: Number(form.contractPricePerHourUsd),
      cardCount: Number(form.contractCardCount),
      onboardedAt: form.contractOnboardedAt,
    };
  }

  return payload;
}

const inputClass =
  'w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#94a3b8]/60 focus:outline-none focus:border-[#06b6d4] transition-colors';
const labelClass = 'text-xs uppercase tracking-wide text-[#94a3b8] mb-1.5 block';

// Onboarding dates can legitimately be in the future (a Forecast cluster
// that hasn't started yet), so this deliberately has no max-date constraint
// — unlike the time-window range pickers, which cap at "today".
function DateField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const selectedDate = dateStrToLocalDate(value);
  const displayLabel = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Select a date';

  return (
    <div className="relative">
      <label className={labelClass}>{label}</label>
      <button type="button" onClick={() => setOpen((o) => !o)} className={`${inputClass} text-left`}>
        {displayLabel}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 z-20 bg-[#050508] border border-white/10 rounded-xl p-3 shadow-xl">
          <DarkCalendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              onChange(localDateToDateStr(date));
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function ClusterFormModal({ cluster, initialHostingMode, onClose, onSaved }) {
  const [form, setForm] = useState(() => initialFormState(cluster, initialHostingMode));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(cluster);
  const isConverting = Boolean(cluster && initialHostingMode && initialHostingMode !== cluster.hostingMode);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        isEditing ? `/api/internal/clusters/${cluster.id}` : '/api/internal/clusters',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload(form)),
        }
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to save cluster');

      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-5 z-50">
      <div className="w-full max-w-md bg-brand-panel border border-white/10 rounded-2xl p-6 backdrop-blur max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-white mb-5">
          {isConverting ? 'Convert to Live' : isEditing ? 'Edit Cluster' : 'Add Cluster'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className={inputClass}
              placeholder="e.g. Demo Cluster"
            />
          </div>

          <div>
            <label className={labelClass}>Compute Type</label>
            <input
              type="text"
              required
              list="compute-type-suggestions"
              value={form.computeType}
              onChange={(e) => update('computeType', e.target.value)}
              className={inputClass}
              placeholder="e.g. RTX 6000 Pro"
            />
            <datalist id="compute-type-suggestions">
              {COMPUTE_TYPE_SUGGESTIONS.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>

          <div>
            <label className={labelClass}>Hosting Mode</label>
            <div className="inline-flex items-center gap-1 bg-black/30 border border-white/10 rounded-full p-1">
              {/* Converting from Forecast can only target a live mode — Forecast itself isn't a valid conversion target. */}
              {(isConverting ? HOSTING_MODES.filter((m) => m.value !== 'forecast') : HOSTING_MODES).map(
                (mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => update('hostingMode', mode.value)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                      form.hostingMode === mode.value
                        ? 'bg-white text-[#050508]'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                )
              )}
            </div>
          </div>

          {form.hostingMode === 'subnet' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Subnet</label>
                <select
                  value={form.subnetPlatform}
                  onChange={(e) => update('subnetPlatform', e.target.value)}
                  className={inputClass}
                >
                  {SUBNET_PLATFORMS.map((platform) => (
                    <option key={platform} value={platform} className="capitalize">
                      {platform}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>UID Number</label>
                <input
                  type="number"
                  required
                  value={form.subnetUidNumber}
                  onChange={(e) => update('subnetUidNumber', e.target.value)}
                  className={inputClass}
                  placeholder="162"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Contracted Rate (USD/hr per GPU)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={form.contractPricePerHourUsd}
                    onChange={(e) => update('contractPricePerHourUsd', e.target.value)}
                    className={inputClass}
                    placeholder="12.50"
                  />
                </div>
                <div>
                  <label className={labelClass}>Card Count</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={form.contractCardCount}
                    onChange={(e) => update('contractCardCount', e.target.value)}
                    className={inputClass}
                    placeholder="8"
                  />
                </div>
              </div>
              <DateField
                label="Onboarded At"
                value={form.contractOnboardedAt}
                onChange={(v) => update('contractOnboardedAt', v)}
              />
            </div>
          )}

          <div className="border-t border-white/10 pt-4">
            <label className="flex items-center gap-2 text-sm text-white mb-3">
              <input
                type="checkbox"
                checked={form.hasCost}
                onChange={(e) => update('hasCost', e.target.checked)}
                className="rounded border-white/20 bg-black/40"
              />
              Track cost for this cluster
            </label>

            {form.hasCost && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Cost Mode</label>
                  <select
                    value={form.costMode}
                    onChange={(e) => update('costMode', e.target.value)}
                    className={inputClass}
                  >
                    {COST_MODES.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    {form.costMode === 'per_month' ? 'Total Cost (USD/mo)' : 'Cost per GPU (USD/hr)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.costValue}
                    onChange={(e) => update('costValue', e.target.value)}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-[#94a3b8] border border-white/10 rounded-full px-4 py-2 hover:text-white hover:border-white/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-sm bg-white text-[#050508] rounded-full px-4 py-2 font-semibold hover:bg-[#06b6d4] hover:text-white transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
