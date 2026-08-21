'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import HeroCanvas from '@/components/HeroCanvas';
import Footer from '@/components/Footer';

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const openModal = (e) => {
    if (e) e.preventDefault();
    setModalOpen(true);
  };

  const closeModal = (e) => {
    if (e) e.preventDefault();
    setModalOpen(false);
    setFormSubmitted(false);
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Grab all the data from your form fields
    const formData = new FormData(e.target);
    
    // Append your real Web3Forms key
    formData.append("access_key", "87d97156-765d-46ee-9f3f-1ab2fe4b0822");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });
      
      const data = await response.json();

      if (data.success) {
        // Show the success checkmark screen!
        setFormSubmitted(true);
      } else {
        console.error("Submission failed", data);
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Network error. Please try again.");
    }
  };

  return (
    <>

      <Navbar openModal={openModal} />

      <HeroCanvas openModal={openModal} />


      {/* Hardware Fleet */}
      <section id="hardware" style={{ padding: '120px 0', position: 'relative', zIndex: 5 }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '70px' }}>
            <h2 className="gradient-headline-cyan" style={{ fontSize: '3rem' }}>Hyperscalers throttle your performance.<br />Our bare-metal fleet unleashes it.</h2>
            <p style={{ color: 'white', maxWidth: '800px', margin: '25px auto 0 auto', fontSize: '1.1rem', lineHeight: 1.7 }}>From agile RTX 6000 Pro arrays to massive Blackwell training clusters, the Scannit suite removes the constraints of legacy virtualization. Get 100% direct access to VRAM and PCIe lanes for today's AI workloads. And tomorrow's too.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* RTX 6000 Pro */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ height: '50px', width: '50px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem' }}>
                  <i className="fas fa-microchip"></i>
                </div>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '10px', lineHeight: 1.3 }}>NVIDIA RTX 6000<br />Pro</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '30px' }}>High-throughput architecture optimized for parallel execution and heavy rendering workloads.</p>
              <div style={{ marginTop: 'auto' }}>
                <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '12px', padding: '15px', marginBottom: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Array:</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: 'white' }}>8x GPUs / Node</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>VRAM:</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: 'white' }}>384 GB Total</span>
                  </div>
                </div>
                <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={openModal}>Get Access</button>
              </div>
            </div>

            {/* HGX B200 */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ height: '50px', width: '50px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem' }}>
                  <i className="fas fa-server"></i>
                </div>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '10px', lineHeight: 1.3 }}>NVIDIA HGX<br />B200</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '30px' }}>The frontier standard for massive LLM training. Blackwell architecture delivering unmatched inference speeds.</p>
              <div style={{ marginTop: 'auto' }}>
                <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '12px', padding: '15px', marginBottom: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Array:</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: 'white' }}>8x GPUs / Node</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>VRAM:</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: 'white' }}>1,536 GB Total</span>
                  </div>
                </div>
                <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={openModal}>Get Access</button>
              </div>
            </div>

            {/* B300 Ultra */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ height: '50px', width: '50px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem' }}>
                  <i className="fas fa-network-wired"></i>
                </div>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '10px', lineHeight: 1.3 }}>NVIDIA B300<br />Ultra</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '30px' }}>Next-generation high-memory infrastructure designed for hyperscale enterprise deployments.</p>
              <div style={{ marginTop: 'auto' }}>
                <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '12px', padding: '15px', marginBottom: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Array:</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: 'white' }}>8x GPUs / Node</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Interconnect:</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: 'white' }}>400GbE OSFP</span>
                  </div>
                </div>
                <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={openModal}>Get Access</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infrastructure Section */}
      <section className="bright-section" id="infrastructure">
        <div className="container">
          <div className="text-center flex flex-col items-center mb-16">
            <h2>Maximum throughput.<br />Zero hidden overhead.</h2>
            <p className="lead">Scannit delivers purpose-built enterprise AI compute with straightforward, all-inclusive terms and zero hypervisor lag. Focus entirely on training and execution without hidden egress fees or rigid multi-year contract traps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mb-12 max-w-6xl mx-auto">
            <div className="feature-light">
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '15px' }}>Crystal Clear Unit Economics</h3>
              <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.7 }}>Simple, upfront hourly and monthly rates with no hidden surprises. Unlike legacy providers that mask true costs with egress surcharges, storage penalties, or support upcharges, what you see is exactly what you pay.</p>
            </div>
            <div className="feature-light">
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '15px' }}>Agile Scaling Without Lock-ins</h3>
              <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.7 }}>Custom-tailored cluster allocations designed around your immediate model execution cycles. Rent high-density bare-metal arrays for 1 to 6+ months without tying up capital in rigid 36-month deposits.</p>
            </div>
            <div className="feature-light">
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '15px' }}>100% Direct Silicon Access</h3>
              <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.7 }}>By completely eliminating hypervisor virtualization, your workloads get full 1:1 access to GPU VRAM and PCIe bandwidth. Zero virtualization lag means maximum inference throughput and faster training loops.</p>
            </div>
          </div>

          <div className="flex justify-center">
            <button className="btn btn-outline btn-contact" onClick={openModal}>Contact For Pricing</button>
          </div>
        </div>
      </section>

      {/* Stack Section */}
      <section className="bright-section" id="stack" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '100px' }}>
        <div className="container">
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <h2 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-1.5px', color: '#020617', lineHeight: 1.1, marginBottom: '20px' }}>
              End-to-end control.<br />Pure silicon performance.
            </h2>
            <p className="lead" style={{ fontSize: '1.2rem', color: '#475569', lineHeight: 1.6 }}>
              End-to-end hardware ownership. By managing the physical layer directly, we deliver unthrottled inference speeds, complete data sovereignty, and transparent unit economics that third-party cloud wrappers simply cannot match.
            </p>
          </div>

          <div className="space-y-12 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center border-t border-slate-200 pt-10">
              <div className="md:col-span-5 pr-0 md:pr-6">
                <div style={{ marginBottom: '25px' }}>
                  <i className="fas fa-microchip" style={{ fontSize: '3.5rem', color: 'transparent', WebkitTextStroke: '2px #06b6d4' }}></i>
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 600, color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.5px' }}>GPU Cloud</h3>
                <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.6 }}>
                  Pure bare-metal access to the latest NVIDIA architectures. Zero virtualization layers. Engineered specifically for uninterrupted, data-intensive AI training and high-throughput inference.
                </p>
              </div>
              <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <ul className="space-y-4 text-slate-700 font-normal text-sm md:text-base">
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-slate-900 min-w-[210px] block">• Ultra-low latency networking:</span>
                    <span>Optimized ConnectX-6 & 400GbE OSFP PCIe 5.0 fabrics for high-speed workloads.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-slate-900 min-w-[210px] block">• High-bandwidth NVMe storage:</span>
                    <span>Up to 30.7 TB NVMe array per node for seamless dataset staging.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-slate-900 min-w-[210px] block">• Zero virtualization overhead:</span>
                    <span>Direct 1:1 hardware control ensuring peak mathematical efficiency.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center border-t border-slate-200 pt-10">
              <div className="md:col-span-5 pr-0 md:pr-6">
                <div style={{ marginBottom: '25px' }}>
                  <i className="fas fa-server" style={{ fontSize: '3.5rem', color: 'transparent', WebkitTextStroke: '2px #06b6d4' }}></i>
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 600, color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.5px' }}>Enterprise Facilities</h3>
                <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.6 }}>
                  Deployed in Tier-3/4 SOC-2 Type II compliant facilities engineered for extreme AI workloads, ensuring flawless connectivity and massive power headroom.
                </p>
              </div>
              <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <ul className="space-y-4 text-slate-700 font-normal text-sm md:text-base">
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-slate-900 min-w-[210px] block">• Guaranteed Sustained Uptime:</span>
                    <span>Fully redundant N+1 power and cooling systems ensuring 99.9% uptime for massive training runs.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-slate-900 min-w-[210px] block">• Advanced Thermal Management:</span>
                    <span>High-density air and liquid cooling deployments that completely eliminate thermal throttling under maximum load.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-slate-900 min-w-[210px] block">• Massive Connectivity Headroom:</span>
                    <span>Multi-homed dark fiber connectivity and over-provisioned power grids guarantee your cluster is never bottlenecked.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-16">
            <button className="btn btn-outline btn-contact" onClick={openModal}>Contact Sales</button>
          </div>
        </div>
      </section>

      {/* Specs Section */}
      <section id="specs" style={{ padding: '120px 0', background: 'var(--bg-dark)', borderTop: '1px solid var(--glass-border)', position: 'relative', zIndex: 5 }}>
        <div className="container">
          <h2 style={{ fontSize: '3rem', fontWeight: 800, textAlign: 'center', marginBottom: '20px', letterSpacing: '-1px', lineHeight: 1.1 }}>
            No hypervisors. No shared resources.<br />
            <span style={{ color: 'white', fontWeight: 400 }}>Just pure mathematical throughput.</span>
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 60px auto', fontSize: '1.1rem' }}>
            Deep technical specifications for our enterprise compute clusters.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="glass-card" style={{ padding: '30px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', color: 'white' }}>NVIDIA RTX 6000 Pro</h3>
              <table className="spec-table">
                <tbody>
                  <tr><th>GPU Config.</th><td>8x RTX PRO 6000 Server Edition</td></tr>
                  <tr><th>Total VRAM</th><td>768 GB GDDR6 ECC</td></tr>
                  <tr><th>CPU Arch.</th><td>Intel based 64 Core 6th Gen</td></tr>
                  <tr><th>Sys. Memory</th><td>768 GB DDR5 6400 MT/s ECC</td></tr>
                </tbody>
              </table>
            </div>

            <div className="glass-card" style={{ padding: '30px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', color: 'white' }}>NVIDIA HGX B200 Cluster</h3>
              <table className="spec-table">
                <tbody>
                  <tr><th>GPU Config.</th><td>8x HGX B200 SXM</td></tr>
                  <tr><th>Total VRAM</th><td>1,536 GB Total (192GB ea)</td></tr>
                  <tr><th>CPU Arch.</th><td>Dual Intel 8570 Processors</td></tr>
                  <tr><th>Sys. Memory</th><td>2048 GB DDR5-6400 RDIMM</td></tr>
                  <tr><th>Networking</th><td>400 Gb/s InfiniBand Interconnect</td></tr>
                </tbody>
              </table>
            </div>

            <div className="glass-card" style={{ padding: '30px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', color: 'white' }}>NVIDIA B300 Ultra</h3>
              <table className="spec-table">
                <tbody>
                  <tr><th>GPU Config.</th><td>8x NVIDIA B300 Blackwell</td></tr>
                  <tr><th>Total VRAM</th><td>2,304 GB Total</td></tr>
                  <tr><th>CPU Arch.</th><td>Dual Intel Xeon 6767P</td></tr>
                  <tr><th>Sys. Memory</th><td>3072 GB DDR5 @ 6400 MHz</td></tr>
                  <tr><th>Networking</th><td>800 Gb/s Quantum-X800 InfiniBand</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button className="btn btn-primary" onClick={openModal} style={{ padding: '14px 36px', fontSize: '1.05rem' }}>
              Configure Custom Cluster <i className="fas fa-arrow-right ml-2"></i>
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            * Note: Custom network topologies, Infiniband configurations, and storage expansions are available upon request for enterprise contracts.
          </p>
        </div>
      </section>

      {/* Quote Modal Overlay */}
      <div className={`modal-overlay ${modalOpen ? 'active' : ''}`} onClick={closeModal}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={closeModal}>&times;</button>
          
          {!formSubmitted ? (
            <div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '10px', color: 'white' }}>Reserve Compute Capacity</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '30px' }}>Specify your workload requirements below. Our engineering team will return a custom SLA and availability schedule within 24 hours.</p>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Hardware Selection</label>
                    <select name="hardware" required>
                      <option value="">Select Configuration...</option>
                      <option value="rtx">NVIDIA RTX 6000 Pro Server Edition</option>
                      <option value="b200">NVIDIA HGX B200 </option>
                      <option value="b300">NVIDIA B300 </option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Cluster Size</label>
                    <select name="size" required>
                      <option value="1">1x Node (8 GPUs)</option>
                      <option value="2">2x Nodes (16 GPUs)</option>
                      <option value="4">4x Nodes (32 GPUs)</option>
                      <option value="custom">Custom Scale (64+ GPUs)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Desired Lease Term</label>
                    <select name="term" required>
                      <option value="1mo">1 Month (Agile)</option>
                      <option value="3mo">3 Months</option>
                      <option value="6mo">6 Months</option>
                      <option value="12mo">12+ Months (Discounted)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Corporate Email</label>
                    <input type="email" name="email" placeholder="name@company.com" required />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Custom Configuration / Additional Details (Optional)</label>
                    <textarea name="details" rows={4} placeholder="Specify storage needs, networking topologies, or deployment timelines..." style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '1rem', transition: '0.3s', resize: 'vertical', outline: 'none' }}></textarea>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '15px', justifyContent: 'center', padding: '14px' }}>Request Quote & Availability</button>
              </form>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: 'var(--primary-cyan)', marginBottom: '20px' }}></i>
              <h3 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '10px' }}>Request Received</h3>
              <p style={{ color: 'var(--text-muted)' }}>Our engineering team will review your specifications and contact you shortly.</p>
              <button className="btn btn-outline" style={{ marginTop: '20px' }} onClick={closeModal}>Close Window</button>
            </div>
          )}
        </div>
      </div>

      <Footer openModal={openModal} />
    </>
  );
}