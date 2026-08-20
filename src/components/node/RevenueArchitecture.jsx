'use client';

export default function RevenueArchitecture() {
  return (
    <section className="py-24 bg-white border-t border-slate-200 relative z-10 px-5">
      
      {/* Lokales CSS: Perfekte mathematische Endlos-Schleife von 100 bis 0 */}
      <style>{`
        @keyframes topoFlow {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <span className="text-xs font-bold text-[#06b6d4] tracking-widest uppercase mb-4 block">Revenue Architecture</span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">The Continuous Revenue Stack</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
            Two synchronized revenue streams ensuring maximum baseline earnings without a single minute of unleased downtime.
          </p>
        </div>

        {/* SVG TOPOLOGY DIAGRAM */}
        <div className="hidden md:block relative w-full max-w-5xl mx-auto mb-20" style={{ aspectRatio: '2.2 / 1' }}>
          
          {/* SVG Canvas for Data Paths */}
          <svg viewBox="0 0 1000 450" className="absolute inset-0 w-full h-full z-0 pointer-events-none" preserveAspectRatio="xMidYMid meet">
            
            {/* --- GRAUE BASIS-SCHIENEN --- */}
            <path className="stroke-[#e2e8f0] stroke-2 fill-none" d="M120 225 L280 225" />
            
            {/* Top Route Base */}
            <path className="stroke-[#e2e8f0] stroke-2 fill-none" d="M320 225 C450 225, 450 100, 550 100" />
            <path className="stroke-[#e2e8f0] stroke-2 fill-none" d="M650 100 C780 100, 780 225, 850 225" />
            
            {/* Bottom Route Base */}
            <path className="stroke-[#e2e8f0] stroke-2 fill-none" d="M320 225 C450 225, 450 350, 550 350" />
            <path className="stroke-[#e2e8f0] stroke-2 fill-none" d="M650 350 C780 350, 780 225, 850 225" />


            {/* --- ANIMIERTE ZÜGE (PACKETS) --- */}
            {/* 4 Pakete, versetzt um 0.75s, teilen sich abwechselnd auf Top und Bottom auf */}
            
            {/* 1. Cyan fährt nach OBEN (0s) */}
            <path 
              d="M120 225 L320 225 C450 225, 450 100, 550 100 L650 100 C780 100, 780 225, 850 225" 
              className="fill-none stroke-[#06b6d4] stroke-[3px] stroke-linecap-round"
              pathLength="100"
              style={{ 
                strokeDasharray: '4 96', 
                animation: 'topoFlow 3s linear infinite',
                filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.6))'
              }} 
            />

            {/* 2. Grau fährt nach UNTEN (0.75s) */}
            <path 
              d="M120 225 L320 225 C450 225, 450 350, 550 350 L650 350 C780 350, 780 225, 850 225" 
              className="fill-none stroke-[#64748b] stroke-[3px] stroke-linecap-round"
              pathLength="100"
              style={{ 
                strokeDasharray: '4 96', 
                animation: 'topoFlow 3s linear infinite 0.75s'
              }} 
            />

            {/* 3. Cyan fährt nach UNTEN (1.5s) */}
            <path 
              d="M120 225 L320 225 C450 225, 450 350, 550 350 L650 350 C780 350, 780 225, 850 225" 
              className="fill-none stroke-[#06b6d4] stroke-[3px] stroke-linecap-round"
              pathLength="100"
              style={{ 
                strokeDasharray: '4 96', 
                animation: 'topoFlow 3s linear infinite 1.5s',
                filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.6))'
              }} 
            />

            {/* 4. Grau fährt nach OBEN (2.25s) */}
            <path 
              d="M120 225 L320 225 C450 225, 450 100, 550 100 L650 100 C780 100, 780 225, 850 225" 
              className="fill-none stroke-[#64748b] stroke-[3px] stroke-linecap-round"
              pathLength="100"
              style={{ 
                strokeDasharray: '4 96', 
                animation: 'topoFlow 3s linear infinite 2.25s'
              }} 
            />
          </svg>

          {/* Overlay HTML Nodes */}
          
          <div className="absolute bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col items-center justify-center p-4 -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: '12%', top: '50%', width: '140px' }}>
            <div className="text-[0.65rem] font-bold text-slate-500 uppercase mb-1">Compute Source</div>
            <i className="fas fa-microchip text-slate-400 text-xl my-2"></i>
            <div className="text-xs font-bold text-slate-900 mt-1">Bare-Metal GPU</div>
          </div>

          <div className="absolute bg-white border border-slate-200 rounded-full shadow-sm flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 w-[90px] h-[90px]" style={{ left: '30%', top: '50%' }}>
            <div className="text-[0.65rem] font-bold text-slate-500 uppercase mb-1">Router</div>
            <div className="w-8 h-8 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center text-[#06b6d4] text-sm shadow-inner">
              <i className="fas fa-random"></i>
            </div>
          </div>

          <div className="absolute bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col items-center justify-center p-4 -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: '60%', top: '22.2%', width: '220px' }}>
            <div className="text-[0.65rem] font-bold text-[#06b6d4] uppercase">Primary Route</div>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-8 h-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500"><i className="fas fa-building"></i></div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">Enterprise Leases</div>
                <div className="text-[0.7rem] text-slate-500 font-mono mt-0.5">B2B Contracts</div>
              </div>
            </div>
          </div>

          <div className="absolute bg-white border border-dashed border-slate-300 rounded-xl shadow-sm flex flex-col items-center justify-center p-4 -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: '60%', top: '77.7%', width: '220px' }}>
            <div className="text-[0.65rem] font-bold text-slate-500 uppercase">Fallback Route</div>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-8 h-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500"><i className="fas fa-network-wired"></i></div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">Spot Buffer</div>
                <div className="text-[0.7rem] text-slate-500 font-mono mt-0.5">Targon, Render, Vast</div>
              </div>
            </div>
          </div>

          <div className="absolute bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: '90%', top: '50%', width: '180px', boxShadow: '0 15px 35px rgba(0,0,0,0.15)' }}>
            <img src="https://imagedelivery.net/Ulul0QO-cXqPUi6uJcNN5g/a3924725-4e64-4885-0779-1aae85136500/public" alt="Scannit Logo" className="h-6 w-auto mb-3 opacity-90 mx-auto" style={{ maxWidth: '120px' }} />
            <div className="text-white font-bold text-sm tracking-wide leading-tight">Scannit Revenue<br />Engine</div>
            <div className="text-cyan-400 font-mono text-[0.65rem] mt-3 bg-[#06b6d4]/15 px-2 py-1 rounded">100% UTILIZATION</div>
          </div>
        </div>

        {/* Deep Dive Text Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left border-t border-slate-200 pt-12">
          <div className="relative pl-12">
            <div className="absolute top-0 left-0 h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-sm border border-slate-200 shadow-sm">1</div>
            <h3 className="font-bold text-slate-900 text-lg mb-3">High-Margin Leases</h3>
            <p className="text-slate-600 text-[0.95rem] leading-relaxed">Direct enterprise contracts designed for high-intensity model execution. Short duration leases command peak hourly rates, maximizing baseline cash flow.</p>
          </div>
          <div className="relative pl-12">
            <div className="absolute top-0 left-0 h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center font-bold text-[#06b6d4] text-sm border border-cyan-100 shadow-sm">2</div>
            <h3 className="font-bold text-slate-900 text-lg mb-3">Instant Routing Engine</h3>
            <p className="text-slate-600 text-[0.95rem] leading-relaxed">The exact millisecond an enterprise client finishes an execution job, our custom router detects idle status and redirects the hardware automatically.</p>
          </div>
          <div className="relative pl-12">
            <div className="absolute top-0 left-0 h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-sm border border-slate-200 shadow-sm">3</div>
            <h3 className="font-bold text-slate-900 text-lg mb-3">Multi-Network Buffer</h3>
            <p className="text-slate-600 text-[0.95rem] leading-relaxed">Unleased GPU cycles automatically stream to Vast.ai, RunPod, Render, Targon, and other leading spot networks, ensuring 0% idle downtime.</p>
          </div>
        </div>
      </div>
    </section>
  );
}