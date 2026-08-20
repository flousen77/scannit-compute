'use client';

export default function FlywheelSection() {
  return (
    <section id="flywheel" className="py-24 relative z-10 border-t border-white/5 bg-[#050508]">
      <div className="container mx-auto px-5">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-[#06b6d4] tracking-widest uppercase mb-4 block">Scaling Dynamics</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">The Compounding Flywheel</h2>
          <p className="text-[#94a3b8] max-w-2xl mx-auto text-lg leading-relaxed">
            How community allocations and institutional equipment debt compound to rapidly expand the global Scannit hardware fleet.
          </p>
        </div>

        <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-8 md:p-12 relative overflow-hidden flex flex-col items-center shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
            <div className="absolute w-[450px] h-[450px] border-2 border-[#06b6d4]/20 border-t-[#06b6d4]/80 rounded-full animate-[spin_12s_linear_infinite] border-dashed shadow-[0_0_30px_rgba(6,182,212,0.1)]"></div>
            <div className="absolute w-[300px] h-[300px] border-2 border-[#06b6d4]/20 border-b-[#06b6d4]/60 rounded-full animate-[spin_18s_linear_infinite_reverse] border-dotted"></div>
            <div className="absolute w-[250px] h-[250px] bg-[#06b6d4]/5 rounded-full blur-[60px]"></div>
          </div>
          
          <h3 className="text-xl md:text-2xl font-extrabold text-white mb-16 text-center flex items-center justify-center gap-3 relative z-10">
            <i className="fas fa-sync-alt text-[#06b6d4] animate-[spin_4s_linear_infinite]"></i> 
            The Compounding Asset Engine
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative z-10 max-w-4xl w-full">
            <div className="animate-glow-1 backdrop-blur-md border border-white/10 rounded-xl p-8 text-center flex flex-col items-center justify-center bg-white/[0.02]">
              <div className="h-14 w-14 rounded-full flex items-center justify-center text-[#06b6d4] mb-5 border border-[#06b6d4]/40 bg-[#06b6d4]/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <i className="fas fa-tags text-xl"></i>
              </div>
              <h4 className="text-white font-bold text-lg mb-3">Acquire & Discount</h4>
              <p className="text-[#94a3b8] text-sm leading-relaxed">
                Secure servers via <strong className="text-white">initial capital/loan</strong>, utilizing our <strong className="text-[#06b6d4]">NVIDIA Inception 30% Discount</strong>.
              </p>
            </div>

            <div className="animate-glow-2 backdrop-blur-md border border-white/10 rounded-xl p-8 text-center flex flex-col items-center justify-center bg-white/[0.02]">
              <div className="h-14 w-14 rounded-full flex items-center justify-center text-[#06b6d4] mb-5 border border-[#06b6d4]/40 bg-[#06b6d4]/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <i className="fas fa-server text-xl"></i>
              </div>
              <h4 className="text-white font-bold text-lg mb-3">Dual-Engine Cash Yield</h4>
              <p className="text-[#94a3b8] text-sm leading-relaxed">
                Instant B2B leases + Subnet Router guarantee <strong className="text-white">100% GPU utilization & cash yield</strong>.
              </p>
            </div>
            
            <div className="animate-glow-4 backdrop-blur-md border border-white/10 rounded-xl p-8 text-center flex flex-col items-center justify-center bg-white/[0.02]">
              <div className="h-14 w-14 rounded-full flex items-center justify-center text-[#06b6d4] mb-5 border border-[#06b6d4]/40 bg-[#06b6d4]/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <i className="fas fa-chart-line text-xl"></i>
              </div>
              <h4 className="text-white font-bold text-lg mb-3">Compound Expansion</h4>
              <p className="text-[#94a3b8] text-sm leading-relaxed">
                <strong className="text-[#06b6d4]">Reinvest new capital</strong> into <strong className="text-white">massive fleet expansion</strong>, spinning the flywheel faster and increasing network value.
              </p>
            </div>

            <div className="animate-glow-3 backdrop-blur-md border border-white/10 rounded-xl p-8 text-center flex flex-col items-center justify-center bg-white/[0.02]">
              <div className="h-14 w-14 rounded-full flex items-center justify-center text-[#06b6d4] mb-5 border border-[#06b6d4]/40 bg-[#06b6d4]/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <i className="fas fa-file-contract text-xl"></i>
              </div>
              <h4 className="text-white font-bold text-lg mb-3">Institutional Debt Leverage</h4>
              <p className="text-[#94a3b8] text-sm leading-relaxed">
                Use <strong className="text-white">debt-free GPU collateral</strong> + proven revenue to lock 75%+ non-dilutive credit, unlocking up to a <strong className="text-[#06b6d4]">1:4 capital leverage ratio</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}