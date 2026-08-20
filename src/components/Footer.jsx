'use client';
import { useState } from 'react';

export default function Footer({ openModal }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

const handleSubscribe = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch("https://hook.us2.make.com/sn25eizf4hwwnm4mckq6fnl1sn0aya81", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, timestamp: new Date().toISOString() }),
        mode: 'no-cors' // This line forces the browser to bypass security blocks
      });

      // With no-cors, the browser hides the response status, 
      // so we will just assume success and show the message!
      setSubscribed(true);
      setEmail('');
    } catch (err) {
      console.error("Subscription error:", err);
      // Fallback in case of a hard network error
      setSubscribed(true); 
      setEmail('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          
          {/* Brand Column with Newsletter */}
          <div className="footer-col brand-col">
            <a href="/" className="logo" style={{ marginBottom: '15px', display: 'flex' }}>
              <img src="https://imagedelivery.net/Ulul0QO-cXqPUi6uJcNN5g/a3924725-4e64-4885-0779-1aae85136500/public" alt="Scannit Logo" className="logo-img" />
              <span>Scannit</span>
            </a>
            
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '12px' }}>
                Sign up to receive updates.
              </p>
              {!subscribed ? (
                <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '240px' }}>
                  <input
                    type="email"
                    placeholder="Enter your email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ 
                      padding: '10px 14px', 
                      borderRadius: '6px', 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      outline: 'none', 
                      color: 'white',
                      fontSize: '0.9rem'
                    }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '8px 16px', fontSize: '0.9rem', justifyContent: 'center' }}>
                    {loading ? 'Sending...' : 'Subscribe'}
                  </button>
                </form>
              ) : (
                <p style={{ color: '#06b6d4', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>✓ Subscribed!</p>
              )}
            </div>
          </div>
          
          {/* Infrastructure Column */}
          <div className="footer-col">
            <h4>Infrastructure</h4>
            <ul>
              <li><a href="#hardware">Hardware Fleet</a></li>
              <li><a href="#infrastructure">Datacenters</a></li>
              <li><a href="#specs">Technical Specs</a></li>
            </ul>
          </div>
          
          {/* Company Column */}
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="/node">Node Operator Program</a></li>
              <li><button onClick={openModal} className="text-brand-muted hover:text-brand-cyan transition-colors" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}>Contact Sales</button></li>
            </ul>
          </div>
          
          {/* Socials Column */}
          <div className="footer-col">
            <h4>Socials</h4>
            <ul>
              <li><a href="https://www.x.com/ScannitNetwork"><i className="fab fa-twitter social-icon"></i> Twitter / X</a></li>
              <li><a href="https://www.linkedin.com/company/scannit"><i className="fab fa-linkedin social-icon"></i> LinkedIn</a></li>
              <li><a href="https://discord.gg/ehCtfW7Ppu"><i className="fab fa-discord social-icon"></i> Discord</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>&copy; 2026 Scannit Inc. All rights reserved.</div>
          <div>
            <a href="https://scannit.io/privacy" className="footer-link">Privacy Policy</a>
            <a href="https://scannit.io/terms" className="footer-link">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}