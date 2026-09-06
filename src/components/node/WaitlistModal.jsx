'use client';

import { useState } from 'react';

const MAKE_WAITLIST_WEBHOOK = 'https://hook.us2.make.com/78lh6v46ncg8qq790k5hg9fphyfjnz2v';

export default function WaitlistModal({ isOpen, onClose, isSubmitted, setIsSubmitted }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Hilfsfunktion: Ermittelt das Land des Nutzers anhand der IP
  const getUserCountry = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) return 'Unknown';
      const data = await res.json();
      return data.country_name || 'Unknown';
    } catch (err) {
      return 'Unknown';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Land im Hintergrund ermitteln
      const country = await getUserCountry();

      // Webhook Aufruf analog zum Footer mit no-cors
      await fetch(MAKE_WAITLIST_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          country,
          timestamp: new Date().toISOString(),
          source: 'Node Program Waitlist Modal'
        }),
        mode: 'no-cors'
      });

      setIsSubmitted(true);
      setEmail('');
    } catch (error) {
      console.error('Waitlist Submission Error:', error);
      // Fallback
      setIsSubmitted(true);
      setEmail('');
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
              </div>
              
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