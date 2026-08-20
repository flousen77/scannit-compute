'use client';

export default function Navbar({ openModal }) {
  return (
    <>
      <nav>
        <div className="container">
          <a href="/" className="logo">
            <img src="https://imagedelivery.net/Ulul0QO-cXqPUi6uJcNN5g/a3924725-4e64-4885-0779-1aae85136500/public" alt="Scannit Logo" className="logo-img" />
            <span>Scannit <span className="sub-brand"></span></span>
          </a>
          <div className="nav-actions">
            <a href="/node" className="investor-link">
              <i className="fas fa-network-wired"></i> Network & Yield
            </a>
            <button onClick={openModal} className="btn btn-primary btn-nav">
              Reserve Compute
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}