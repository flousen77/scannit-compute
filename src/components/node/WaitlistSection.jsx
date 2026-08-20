'use client';

import { useState } from 'react';

export default function WaitlistSection({ openModal }) {
  const [email, setEmail] = useState('');
  const [isNlSubmitted, setIsNlSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNlSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Exakt dieselbe Webhook-URL und 'no-cors' Konfiguration wie in der Footer.jsx
      await fetch("https://hook.us2.make.com/sn25eizf4hwwnm4mckq6fnl1sn0aya81", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          timestamp: new Date().toISOString(),
          source: 'Node Page Newsletter'
        }),
        mode: 'no-cors'
      });

      setIsNlSubmitted(true);
      setEmail('');
    } catch (err) {
      console.error("Subscription error:", err);
      // Fallback wie im Footer: Bei Netzwerk-Triggern Erfolgsstatus anzeigen
      setIsNlSubmitted(true);
      setEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="waitlist" className="py-24 relative z-10 px-5 scroll-mt-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-[#06b6d4] tracking-widest uppercase mb-4 block">Waitlist Allocation</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Phase 1 Institutional Order Book</h2>
          <p className="text-[#94a3b8] max-w-2xl mx-auto text-lg leading-relaxed">
            Select your targeted capital allocation. Phase 1 waitlist members receive priority provisioning and discounted protocol fees at launch.
          </p>
        </div>

        {/* Tier Matrix */}
        <div className="bg-white/[0.01] border border-white/5 rounded-xl p-2 md:p-6 shadow-2xl">
          {[
            { name: 'Starter Share', basis: '$100 Basis', sub: '1 RWA Micro-Share', desc: 'Base dual-yield revenue sharing access.', val: '100' },
            { name: 'Pro Pod', basis: '$1,000 Basis', sub: 'Priority Queue Status', desc: 'Discounted platform management fees.', val: '1000' },
            { name: 'Node Runner', basis: '$5,000 Basis', sub: 'Early Batch Access', desc: 'Priority allocation on upcoming hardware drops.', val: '5000' },
            { name: 'Institutional', basis: '$25,000 Basis', sub: 'Priority Hardware Provisioning', desc: 'Dedicated account manager & early access to B300 arrays.', val: '25000' },
            { name: 'Dedicated Node', basis: '$100k+ Basis', sub: '100% Isolated Bare-Metal', desc: 'Custom enterprise SLA and isolated topology architecture.', val: '100000' },
          ].map((tier, idx) => (
            <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 p-5 md:p-6 border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors rounded-lg">
              <div className="w-full md:w-1/4">
                <h4 className="text-white font-bold text-lg">{tier.name}</h4>
                <div className="text-[#06b6d4] font-mono text-sm mt-1">{tier.basis}</div>
              </div>
              <div className="w-full md:w-1/2 md:border-l md:border-white/10 md:pl-6 text-sm text-[#94a3b8]">
                <span className="text-white block mb-1 font-semibold">{tier.sub}</span>
                {tier.desc}
              </div>
              <div className="w-full md:w-1/4 text-left md:text-right mt-2 md:mt-0">
                <button onClick={() => openModal(tier.val)} className="border border-white/10 hover:border-white text-white px-5 py-2 text-xs rounded-full transition-all w-full md:w-auto">
                  Select Tier
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Ecosystem Box */}
        <div className="mt-12 max-w-2xl mx-auto p-6 md:p-8 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm text-center">
          {!isNlSubmitted ? (
            <div>
              <h4 className="text-white font-bold text-lg mb-2">Track the Network Expansion</h4>
              <p className="text-[#94a3b8] text-sm mb-6">Join the ecosystem to receive priority alerts for new hardware deployments, network yield reports, and upcoming allocation phases.</p>
              
              <form onSubmit={handleNlSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com" 
                  className="flex-1 px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#06b6d4] text-sm font-mono" 
                />
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-white text-[#050508] border border-white hover:bg-transparent hover:text-[#06b6d4] hover:border-[#06b6d4] transition-all sm:w-auto w-full py-3 px-6 text-sm rounded-lg font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Joining...' : 'Join Ecosystem'}
                </button>
              </form>
            </div>
          ) : (
            <div className="py-4">
              <i className="fas fa-check-circle text-3xl text-[#06b6d4] mb-3"></i>
              <h4 className="text-white font-bold text-lg mb-1">Welcome to the Ecosystem</h4>
              <p className="text-[#94a3b8] text-sm">You are officially on the list. We'll notify you of upcoming deployments.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}