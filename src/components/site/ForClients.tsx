import Image from 'next/image';

export default function ForClients() {
  return (
    <section className="section section-alt" id="for-clients">
      <div className="container">
        <div className="grid-2">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="phone-frame" style={{ width: '240px' }}>
              <Image
                src="/assets/screen_user_home_primary.png"
                alt="FastLinQ App"
                width={224}
                height={484}
                style={{ width: '100%', display: 'block', borderRadius: '36px' }}
              />
            </div>
          </div>
          <div>
            <div className="eyebrow">For clients</div>
            <h2 style={{ marginBottom: '20px' }}>
              Send anything,
              <br />
              <span className="grad-text">anywhere in the world.</span>
            </h2>
            <p className="lead" style={{ marginBottom: '32px' }}>
              Documents, parcels, a forgotten laptop, a birthday gift — FastLinQ moves it
              for you with a verified courier and live tracking, wherever you are.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="check-item"><div className="check-icon">✓</div> Live tracking</div>
              <div className="check-item"><div className="check-icon">✓</div> Verified couriers</div>
              <div className="check-item"><div className="check-icon">✓</div> In-app chat</div>
              <div className="check-item"><div className="check-icon">✓</div> Proof of delivery</div>
              <div className="check-item"><div className="check-icon">✓</div> 24/7 support</div>
            </div>
            <a href="#download" className="btn btn-primary" style={{ marginTop: '32px' }}>
              Get started →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
