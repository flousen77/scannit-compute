export default function HeroCanvas({ openModal }) {
  return (
    /* Added paddingBottom: 0 to override your global CSS */
    <section className="hero" style={{ position: 'relative', overflow: 'hidden', minHeight: '85vh', display: 'flex', flexDirection: 'column', paddingBottom: 0 }}>
      
      {/* --- Minimalist Glow Background --- */}
      <div className="hero-bg" style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', backgroundColor: '#080b11', width: '100%' }}>
        <div className="glow-orb cyan-orb" />
        <div className="glow-orb purple-orb" />
      </div>

      {/* --- Main Hero Content --- */}
      <div className="container hero-content" style={{ position: 'relative', zIndex: 10, textAlign: 'center', width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '80px', paddingBottom: '80px' }}>
        <h1>
          Shattering AI's <br/>
          <span className="gradient-text-white-cyan">Biggest Bottleneck.</span>
        </h1>
        <p style={{ maxWidth: '700px', margin: '0 auto 32px auto' }}>
          High-density NVIDIA clusters engineered for enterprise AI workloads. Bypass hyperscaler lock-ins with flexible, short-term lease options.
        </p>
        <div className="hero-buttons">
          <button onClick={openModal} className="btn btn-primary" style={{ padding: '14px 36px', fontSize: '1.05rem' }}>
            Reserve GPU Cluster <i className="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

{/* --- Full-Width Trust Banner --- */}
      <div className="trust-banner-wrapper" style={{ 
        position: 'relative', 
        zIndex: 10, 
        width: '100%', 
        marginTop: 'auto', 
        /* Der magische Trick für den smoothen Übergang: */
        background: 'linear-gradient(to bottom, transparent 0%, #000000 100%)', 
        padding: '60px 20px 40px' /* Oben etwas mehr Platz, damit der Verlauf weicher wirkt */
      }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{ 
            color: '#64748b', 
            fontSize: '0.85rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em', 
            marginBottom: '24px',
            fontWeight: 600
          }}>
            Backed by & Partnered with
          </p>
<div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '80px', /* Etwas mehr Abstand für die größeren Logos */
            flexWrap: 'wrap',
            opacity: 0.75 
          }}>
            <img 
              src="https://imagedelivery.net/Ulul0QO-cXqPUi6uJcNN5g/976d16d7-3abf-461d-3079-c543115e0600/public" 
              alt="String Capital" 
              style={{ height: '48px', width: 'auto' }} 
            />
            <img 
              src="https://imagedelivery.net/Ulul0QO-cXqPUi6uJcNN5g/4cfb557f-ef34-476b-07b4-51b836c10c00/public" 
              alt="NVIDIA" 
              style={{ height: '48px', width: 'auto' }} 
            />
            <img 
              src="https://imagedelivery.net/Ulul0QO-cXqPUi6uJcNN5g/099875c3-91ec-43cb-9bff-33bc5460aa00/public" 
              alt="Google Cloud" 
              style={{ height: '48px', width: 'auto' }} 
            />
          </div>
        </div>
      </div>

    </section>
  );
}