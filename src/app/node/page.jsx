'use client';

import { useEffect, useState } from 'react';
import TelemetrySection from '@/components/node/TelemetrySection';
import RevenueArchitecture from '@/components/node/RevenueArchitecture';
import FlywheelSection from '@/components/node/FlywheelSection';
import WaitlistSection from '@/components/node/WaitlistSection';
import WaitlistModal from '@/components/node/WaitlistModal';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NodePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rates, setRates] = useState(null);
  const [ratesFailed, setRatesFailed] = useState(false);

  // Fetched here rather than inside TelemetrySection so the hero figure and
  // the cards come from one request and can never disagree with each other.
  useEffect(() => {
    fetch('/api/market-rates')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then(setRates)
      .catch(() => setRatesFailed(true));
  }, []);

  const topGpu = rates?.gpus?.reduce(
    (best, gpu) => ((gpu.current?.high ?? 0) > (best?.current?.high ?? 0) ? gpu : best),
    null
  );

  const openModal = () => {
    setIsSubmitted(false);
    setIsModalOpen(true);
  };

  return (
    <> 

    <Navbar openModal={openModal} />

    <div className="bg-[#050508] text-white min-h-screen">
      <style jsx global>{`
        @keyframes seqGlow {
          0%, 100% { border-color: rgba(255, 255, 255, 0.08); box-shadow: none; background-color: rgba(255,255,255,0.02); }
          5%, 20% { border-color: rgba(6, 182, 212, 0.8); box-shadow: 0 0 30px rgba(6, 182, 212, 0.2); background-color: rgba(6, 182, 212, 0.05); }
          25% { border-color: rgba(255, 255, 255, 0.08); box-shadow: none; background-color: rgba(255,255,255,0.02); }
        }
        @keyframes signalBeam {
          0% { transform: translateY(-100%); opacity: 0; }
          30% { opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes flowAnim {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -200; }
        }
        @keyframes bezierFlow {
          0% { stroke-dashoffset: 250; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-glow-1 { animation: seqGlow 12s infinite -12s; }
        .animate-glow-2 { animation: seqGlow 12s infinite -9s; }
        .animate-glow-3 { animation: seqGlow 12s infinite -6s; }
        .animate-glow-4 { animation: seqGlow 12s infinite -3s; }
        .animate-signal-drip { animation: signalBeam 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .flow-cyan { stroke: #06b6d4; animation: flowAnim 5s linear infinite; filter: drop-shadow(0 0 3px rgba(6,182,212,0.5)); }
        .flow-cyan-alt { stroke: #06b6d4; animation: flowAnim 6.5s linear infinite; animation-delay: 2.5s; filter: drop-shadow(0 0 3px rgba(6,182,212,0.5)); }
        .flow-slate { stroke: #64748b; animation: flowAnim 5.5s linear infinite; animation-delay: 1.5s; }
        .flow-slate-alt { stroke: #64748b; animation: flowAnim 6s linear infinite; animation-delay: 4s; }
      `}</style>

      {/* Hero Header */}
      <section className="pt-24 md:pt-32 pb-4 relative text-center px-5">
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
            <span className="text-white">The AI boom has a</span><br />
            <span className="text-[#06b6d4] drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">price per hour.</span>
          </h1>
          {topGpu ? (
            <div className="mb-8">
            <div className="inline-flex items-center gap-5 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 text-left">
              <div>
                <div className="text-[0.65rem] font-mono uppercase tracking-widest text-slate-500 mb-1">
                  Top marketplace rate
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none">
                  ${topGpu.current.high.toFixed(2)}
                  <span className="text-base font-semibold text-slate-500 ml-1">/hr</span>
                </div>
              </div>
              <div className="border-l border-white/10 pl-5">
                <div className="text-[0.65rem] font-mono uppercase tracking-widest text-slate-500 mb-1">
                  Hardware
                </div>
                <div className="text-sm md:text-base font-semibold text-[#06b6d4]">
                  {topGpu.label}
                </div>
              </div>
              {rates?.generated_at ? (
                <div className="border-l border-white/10 pl-5 hidden sm:block">
                  <div className="text-[0.65rem] font-mono uppercase tracking-widest text-slate-500 mb-1">
                    Synced
                  </div>
                  <div className="text-sm md:text-base font-mono text-[#94a3b8]">
                    {rates.generated_at.slice(11, 16)} UTC
                  </div>
                </div>
              ) : null}
            </div>
            </div>
          ) : null}

          <p className="text-lg md:text-xl text-[#94a3b8] max-w-2xl mx-auto mb-10 leading-relaxed">
            Scannit buys bare-metal NVIDIA hardware and leases it to enterprise AI teams. Nothing
            here is on sale yet, and the waitlist is where we&apos;ll announce it when there is.
          </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
             <a 
                href="#waitlist" 
                 className="bg-white text-[#050508] border border-white hover:bg-transparent hover:text-[#06b6d4] hover:border-[#06b6d4] px-8 py-3 rounded-full font-semibold transition-all inline-flex items-center justify-center"
              >
                  Join Operator Waitlist
            </a>
                <a href="#telemetry" className="border border-white/10 text-[#94a3b8] px-8 py-3 rounded-full font-semibold hover:border-white hover:text-white transition-all inline-flex items-center justify-center">
               Explore Live Telemetry
              </a>
            </div>
        </div>

        <div className="relative flex flex-col items-center justify-center pt-8 pb-4 z-10 pointer-events-none mt-4">
          <div className="absolute w-[500px] h-[180px] bg-[#06b6d4]/10 rounded-full blur-[90px] -z-10"></div>
          <div className="w-8 h-8 rounded-full border border-[#06b6d4]/30 bg-[#06b6d4]/10 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <div className="w-2 h-2 rounded-full bg-[#06b6d4] animate-ping"></div>
          </div>
          <div className="w-[2px] h-20 bg-gradient-to-b from-[#06b6d4]/60 via-[#06b6d4]/20 to-transparent relative overflow-hidden rounded-full">
            <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-transparent via-white to-transparent animate-signal-drip"></div>
          </div>
        </div>
      </section>

      {/* Sections */}
      <TelemetrySection openModal={openModal} rates={rates} failed={ratesFailed} />
      <RevenueArchitecture />
      <FlywheelSection />
      <WaitlistSection />

      <div className="px-5 pb-16 relative z-10">
        <p className="max-w-3xl mx-auto text-xs text-slate-600 leading-relaxed text-center border-t border-white/5 pt-8">
          This page describes what Scannit does as a business. It is not an offer to sell anything,
          it is not an invitation to invest, and it is not financial advice.
        </p>
      </div>

      {/* Shared Waitlist Modal */}
      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isSubmitted={isSubmitted}
        setIsSubmitted={setIsSubmitted}
      />
    </div>

    <Footer openModal={openModal} />
    </>
  );
}