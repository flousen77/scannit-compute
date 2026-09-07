'use client';

import { useState } from 'react';

const CARD_ICONS = {
  'RTX PRO 6000': 'fa-microchip',
  B200: 'fa-server',
  B300: 'fa-network-wired',
  H100: 'fa-layer-group',
  H200: 'fa-cubes',
};

const usd = (value) => `$${value.toFixed(2)}`;

// Cards publish the top of each family, not a blend. A single reading has no
// "highest" to speak of, so it is labelled for what it is rather than dressed
// up as the winner of a comparison that never happened.
// Readings per provider rather than a bare total, because three Bittensor
// subnets reporting separately are three readings under one name, and a total
// that disagreed with the source list read as a contradiction.
function sourceSummary(sources) {
  return sources
    .map(({ name, readings }) => (readings > 1 ? `${name} (${readings})` : name))
    .join(', ');
}

function deltaVs7d(gpu, basis) {
  if (basis !== 'current') return null;
  const now = gpu.current?.high;
  const week = gpu.avg_7d?.high;
  if (!now || !week) return null;
  return ((now - week) / week) * 100;
}

export default function TelemetrySection({ openModal, rates, failed }) {
  const [basis, setBasis] = useState('current');

  const gpus = rates?.gpus ?? [];
  const isLoading = !rates && !failed;


  return (
    <section id="telemetry" className="py-12 relative z-10 px-5">
{/* Exakt getaktete Micro-Pause (2-3%) an der Gabelung für ein organisches Gefühl */}
      <style>{`
        @keyframes signalBeam {
          0% { transform: translateY(-100%); opacity: 0; }
          4% { opacity: 1; }
          25% { transform: translateY(100%); opacity: 1; }  /* Trifft im Router ein */
          28% { transform: translateY(100%); opacity: 0; }  /* Processing-Pause im Router */
          100% { transform: translateY(100%); opacity: 0; }
        }

        @keyframes bezierFlow {
          0%, 27% { stroke-dashoffset: 250; opacity: 0; }
          28% { stroke-dashoffset: 250; opacity: 1; }       /* Startet direkt nach der Pause im Router */
          82% { stroke-dashoffset: 0; opacity: 1; }         /* Trifft an der Scannit Engine ein */
          86%, 100% { stroke-dashoffset: 0; opacity: 0; }    /* Sanftes Ausfaden im Ziel */
        }

        .animate-signal-drip {
          animation: signalBeam 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-[#06b6d4] tracking-widest uppercase mb-4 inline-block px-4 py-1.5 rounded-full border border-[#06b6d4]/20 bg-[#06b6d4]/5 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            Network Telemetry
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Hardware built to stay busy.<br />
            <span className="text-[#06b6d4]">See what compute like ours rents for.</span>
          </h2>
          <p className="text-[#94a3b8] max-w-2xl mx-auto text-base leading-relaxed">
            Workloads route across Bittensor, Vast.ai and RunPod toward the best available rate
            at the time they run.
          </p>
        </div>

        {/* Time-basis Toggle */}
        <div className="text-center mb-10">
          <div className="inline-flex bg-white/5 border border-white/10 rounded-lg p-1">
            {[
              { key: 'current', label: 'Now' },
              { key: 'avg_7d', label: '7D Avg' },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setBasis(option.key)}
                className={`px-5 py-2 text-xs font-medium rounded transition-all ${
                  basis === option.key ? 'bg-white/10 text-white' : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Market rate comparison */}
        {failed ? (
          <div className="text-center text-sm text-slate-500 font-mono py-12">
            Live rates are temporarily unavailable.
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : (
          // Five independent readings, not a ranking: nothing useful follows
          // from one GPU's hourly rate being higher than another's, since the
          // hardware costs more to buy in roughly the same proportion. Tiles
          // present them as separate facts. Flex-wrap centres any partial row
          // rather than leaving a hole on the right.
          <div className="flex flex-wrap justify-center gap-4 text-left">
            {gpus.map((gpu) => {
              const value = gpu[basis]?.high;
              const delta = deltaVs7d(gpu, basis);

              return (
                <div
                  key={gpu.key}
                  className="basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.333%-0.667rem)] xl:basis-[calc(20%-0.8rem)] bg-white/[0.02] border border-white/5 hover:border-[#06b6d4]/50 hover:bg-[#06b6d4]/[0.04] rounded-xl p-5 transition-all"
                >
                  <div className="flex items-center gap-2 mb-5">
                    <i
                      className={`fas ${CARD_ICONS[gpu.key] ?? 'fa-microchip'} text-[#06b6d4]/70 text-sm shrink-0`}
                    ></i>
                    <h3 className="text-sm font-semibold text-white leading-tight">{gpu.label}</h3>
                  </div>

                  <div className="text-[0.6rem] text-slate-600 uppercase tracking-widest font-mono mb-1.5">
                    {gpu.observations === 1 ? 'Observed rate' : 'Highest observed'}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-white tracking-tight leading-none">
                      {usd(value)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">/hr</span>
                  </div>
                  <div className="text-[0.7rem] font-mono text-slate-400 mt-1.5 h-4">
                    {delta === null
                      ? '7-day average'
                      : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% vs 7d`}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] text-[0.65rem] font-mono text-slate-600 leading-relaxed">
                    {sourceSummary(gpu.sources)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-xs text-slate-500 leading-relaxed max-w-3xl mx-auto text-center">
          Each figure is the highest rate observed for that hardware on third-party GPU
          marketplaces, not a typical rate and not Scannit earnings. Rates across platforms vary
          widely, sample depth differs by platform, and not every platform lists every GPU.
          Updated twice daily. Not a projection of returns.
        </p>

          <div className="mt-16 text-center relative z-10">
            <a
              href="#waitlist"
             className="inline-block bg-white text-[#050508] border border-white hover:bg-transparent hover:text-[#06b6d4] hover:border-[#06b6d4] px-8 py-3 rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
           >
              Join the Waitlist
            </a>
          </div>

        {/* Transition Bridge */}
        <div className="mt-24 mb-8 text-center flex flex-col items-center relative z-10 px-5">
          <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">The Structural Flaw in Cloud Infrastructure</h3>
          <p className="text-[#94a3b8] text-sm md:text-base max-w-3xl mx-auto mb-2 leading-relaxed">
            Traditional cloud providers demand 1-to-3 year commitments with heavy upfront deposits, sacrificing high hourly margins for security and suffering weeks of unmonetized idle downtime between client handoffs. Scannit targets high-margin short-term leases and shortens the gap between them with automated spot-market buffering.
          </p>
          
          {/* Bezier Routing Schematic */}
          <div className="relative flex flex-col items-center justify-center pt-8 pb-16 w-full z-10 pointer-events-none mt-2">
            <div className="absolute w-[400px] h-[150px] bg-[#06b6d4]/5 rounded-full blur-[70px] -z-10"></div>
            
            <div className="w-[2px] h-10 bg-gradient-to-b from-transparent to-[#06b6d4]/50 relative overflow-hidden rounded-full mb-1">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-white to-transparent animate-signal-drip"></div>
            </div>

            <div className="w-10 h-10 rounded-full border border-[#06b6d4]/40 bg-[#050508] flex items-center justify-center z-20 shadow-[0_0_20px_rgba(6,182,212,0.2)] relative">
              <i className="fas fa-random text-[#06b6d4] text-sm"></i>
              <div className="absolute inset-0 rounded-full border border-[#06b6d4]/50 animate-ping opacity-20"></div>
            </div>

            {/* Desktop SVG */}
            <svg width="600" height="100" viewBox="0 0 600 100" className="absolute top-[80px] overflow-visible hidden md:block z-10">
              <path d="M 300 15 C 300 70, 100 40, 100 100" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" className="opacity-60" />
              <circle cx="100" cy="100" r="5" fill="#1e293b" stroke="#334155" strokeWidth="2" />
              <path d="M 96 96 L 104 104 M 96 104 L 104 96" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" className="opacity-80" />
              
              <path d="M 300 15 C 300 70, 500 40, 500 100" fill="none" stroke="#06b6d4" strokeWidth="2" className="opacity-30" />
              
              {/* Fließender Ausgangs-Strahl mit Beschleunigungskurve */}
              <path 
                d="M 300 15 C 300 70, 500 40, 500 100" 
                fill="none" 
                stroke="#ffffff" 
                strokeWidth="2" 
                strokeDasharray="18 250" 
                pathLength="250"
                style={{ animation: 'bezierFlow 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite' }} 
              />
              <circle cx="500" cy="100" r="5" fill="#06b6d4" className="shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
            </svg>

            {/* Mobile SVG */}
            <svg width="100" height="60" viewBox="0 0 100 60" className="absolute top-[80px] overflow-visible block md:hidden z-10">
              <path d="M 50 15 L 50 60" fill="none" stroke="#06b6d4" strokeWidth="2" className="opacity-30" />
              <path 
                d="M 50 15 L 50 60" 
                fill="none" 
                stroke="#ffffff" 
                strokeWidth="2" 
                strokeDasharray="10 250"
                pathLength="250" 
                style={{ animation: 'bezierFlow 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite' }} 
              />
              <circle cx="50" cy="60" r="5" fill="#06b6d4" className="shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
            </svg>
          </div>
        </div>

        {/* Arbitrage Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-10">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-6">Legacy Cloud Model</h3>
            <ul className="space-y-5 text-sm md:text-base text-[#888]">
              <li className="flex items-start gap-4"><span className="mt-1">—</span> Discounted 36-month lock-ins that leave heavy hourly margin on the table.</li>
              <li className="flex items-start gap-4"><span className="mt-1">—</span> Weeks of unmonetized idle downtime during client transitions.</li>
              <li className="flex items-start gap-4"><span className="mt-1">—</span> Slow, rigid sales and legal procurement cycles.</li>
              <li className="flex items-start gap-4"><span className="mt-1">—</span> Hypervisor virtualization tax cutting into raw GPU compute bandwidth.</li>
            </ul>
          </div>

          <div className="bg-[#06b6d4]/[0.03] border border-[#06b6d4]/20 rounded-2xl p-10 shadow-[inset_0_0_40px_rgba(6,182,212,0.02)]">
            <div className="w-12 h-12 rounded-xl bg-[#06b6d4]/10 border border-[#06b6d4]/30 shadow-[0_0_20px_rgba(6,182,212,0.2)] flex items-center justify-center text-[#06b6d4] mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-6">Scannit Neocloud Engine</h3>
            <ul className="space-y-5 text-sm md:text-base text-gray-300">
              {[
                'Short-duration B2B leases aimed at the strongest hourly rates.',
                'A GPU coming off a lease doesn’t wait for the next sales call.',
                'Dynamic execution routing across Vast.ai, RunPod, Bittensor and others.',
                'Bare-metal performance, with no virtualization layer in between.',
              ].map((text) => (
                <li key={text} className="flex items-start gap-4">
                  <svg width="18" height="18" className="mt-1 flex-shrink-0 text-[#06b6d4]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"></path></svg>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}