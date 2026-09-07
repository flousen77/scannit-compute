'use client';

import { useState } from 'react';

export default function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [isNlSubmitted, setIsNlSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleNlSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, list: 'newsletter' }),
      });

      if (!res.ok) throw new Error(String(res.status));

      setIsNlSubmitted(true);
      setEmail('');
    } catch (err) {
      console.error('Subscription error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="waitlist" className="py-24 relative z-10 px-5 scroll-mt-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-[#06b6d4] tracking-widest uppercase mb-4 block">Coming Later</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Network participation is coming.<br />
            <span className="text-[#06b6d4]">Sign up now to be the first.</span>
          </h2>
          <p className="text-[#94a3b8] max-w-2xl mx-auto text-lg leading-relaxed">
            We&apos;re building a way to take part in the Scannit compute network. Join the list and we&apos;ll tell you first when it&apos;s ready, no price attached yet.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
          {[
            {
              icon: 'fa-user-clock',
              title: 'Priority Access',
              body: 'You’ll be first in line when network participation opens.',
            },
            {
              icon: 'fa-satellite-dish',
              title: 'Fleet Updates',
              body: 'See new hardware as it’s deployed into the network.',
            },
            {
              icon: 'fa-file-lines',
              title: 'Clear Terms',
              body: 'Pricing and structure shared the moment they’re decided.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group bg-white/[0.02] border border-white/5 hover:border-[#06b6d4]/50 hover:bg-[#06b6d4]/[0.04] hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] rounded-2xl p-8 text-center flex flex-col items-center justify-start transition-all"
            >
              <div className="h-14 w-14 rounded-full flex items-center justify-center text-[#06b6d4] mb-5 border border-[#06b6d4]/30 bg-[#06b6d4]/10 group-hover:border-[#06b6d4]/60 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all">
                <i className={`fas ${item.icon} text-xl`}></i>
              </div>
              <h4 className="text-white font-bold text-lg mb-3">{item.title}</h4>
              <p className="text-[#94a3b8] text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        {/* Ecosystem Box */}
        <div className="mt-8 max-w-2xl mx-auto p-6 md:p-8 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm text-center">
          {!isNlSubmitted ? (
            <div>
              <h4 className="text-white font-bold text-lg mb-2">Track the Network Expansion</h4>
              <p className="text-[#94a3b8] text-sm mb-6">Join the ecosystem to receive updates on new hardware deployments and how the network is growing.</p>
              
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
              {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
              <p className="text-xs text-slate-500 mt-3">
                We&apos;ll only use this to email you about the network.{' '}
                <a href="/privacy" className="text-[#06b6d4] hover:underline">Privacy Policy</a>
              </p>
            </div>
          ) : (
            <div className="py-4">
              <i className="fas fa-check-circle text-3xl text-[#06b6d4] mb-3"></i>
              <h4 className="text-white font-bold text-lg mb-1">Welcome to the Ecosystem</h4>
              <p className="text-[#94a3b8] text-sm">You&apos;re subscribed. We&apos;ll email you about new hardware deployments.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}