'use client';

import { useState } from 'react';

export default function WaitlistModal({ isOpen, onClose, isSubmitted, setIsSubmitted }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, list: 'waitlist' }),
      });

      if (!res.ok) throw new Error(String(res.status));

      setIsSubmitted(true);
      setEmail('');
    } catch (err) {
      console.error('Waitlist Submission Error:', err);
      setError('Something went wrong. Please try again, or email us at hello@scannit.io.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-5" onClick={onClose}>
      <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl w-full max-w-[500px] p-10 relative" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-4 right-5 text-gray-400 hover:text-white text-2xl" onClick={onClose}>&times;</button>
        
        {!isSubmitted ? (
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Join the Waitlist</h3>
            <p className="text-[#94a3b8] text-sm mb-6">We&apos;ll let you know when network participation opens. Nothing is on sale yet.</p>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-xs font-semibold text-[#94a3b8] mb-2">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com" 
                  className="w-full p-3 bg-white/[0.03] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#06b6d4]"
                />
                <p className="text-xs text-slate-500 mt-2">
                  We&apos;ll only use this to email you about the network.{' '}
                  <a href="/privacy" className="text-[#06b6d4] hover:underline">Privacy Policy</a>
                </p>
              </div>

              <p className="text-sm text-[#94a3b8] mb-4">
                We&apos;ll email you when network participation opens. There&apos;s nothing to buy
                today and no price has been set.
              </p>

              {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-[#050508] border border-white hover:bg-transparent hover:text-[#06b6d4] hover:border-[#06b6d4] font-semibold py-3 rounded-lg transition-all mt-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Joining...' : 'Join the Waitlist'}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-10">
            <i className="fas fa-check-circle text-5xl text-[#06b6d4] mb-4"></i>
            <h3 className="text-2xl font-bold text-white mb-2">You&apos;re on the list</h3>
            <p className="text-[#94a3b8]">We&apos;ll be in touch when network participation opens.</p>
            <button onClick={onClose} className="mt-6 border border-white/10 text-white px-6 py-2 rounded-full hover:border-white">Close Window</button>
          </div>
        )}
      </div>
    </div>
  );
}