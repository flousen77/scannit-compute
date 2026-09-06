'use client';

import { useState } from 'react';
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
            <span className="text-[#06b6d4] drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">Stop buying AI stocks.</span><br />
            <span className="text-white">Own the bare-metal hardware driving them.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#94a3b8] max-w-3xl mx-auto mb-10 leading-relaxed">
            We run bare-metal NVIDIA infrastructure for enterprise AI. We&apos;re opening a way for the community to be part of that network. Join the waitlist to hear when.
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
      <TelemetrySection openModal={openModal} />
      <RevenueArchitecture />
      <FlywheelSection />
      <WaitlistSection />

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