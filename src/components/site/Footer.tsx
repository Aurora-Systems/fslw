import Image from 'next/image';

export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <div className="footer-logo">
              <Image src="/assets/fastlinq-logo.png" alt="FastLinQ" width={120} height={28} />
            </div>
            <p className="footer-tagline">
              Connecting couriers and clients across the world. Anything, delivered.
            </p>
          </div>
          <div>
            <div className="footer-col-title">Product</div>
            <nav className="footer-links">
              <a href="#how-it-works">How it works</a>
              <a href="#features">Features</a>
              <a href="#for-business">For business</a>
              <a href="#faq">FAQ</a>
            </nav>
          </div>
          <div>
            <div className="footer-col-title">Audience</div>
            <nav className="footer-links">
              <a href="#for-clients">For clients</a>
              <a href="#for-couriers">For couriers</a>
              <a href="#for-business">For business</a>
            </nav>
          </div>
          <div>
            <div className="footer-col-title">Get the app</div>
            <nav className="footer-links">
              <a href="#download">Download</a>
              <a href="mailto:business@fastlinq.app">Business enquiries</a>
              <a href="mailto:support@fastlinq.app">Support</a>
              <a href="/admin">Admin portal</a>
            </nav>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© 2026 FastLinQ. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
