export default function HowItWorks() {
  return (
    <section className="section" id="how-it-works">
      <div className="container">
        <div className="text-center" style={{ maxWidth: '560px', margin: '0 auto 56px' }}>
          <div className="eyebrow">How it works</div>
          <h2>
            Three taps from request
            <br />
            to <span className="grad-text">delivered.</span>
          </h2>
        </div>
        <div className="grid-4" style={{ position: 'relative' }}>
          <div className="step-card card" style={{ textAlign: 'center', position: 'relative' }}>
            <div className="step-num" style={{ margin: '0 auto 20px' }}>01</div>
            <div className="step-connector" style={{ display: 'none' }}></div>
            <h3 style={{ marginBottom: '10px' }}>Request</h3>
            <p style={{ fontSize: '13.5px' }}>Tell us what to pick up and where to drop it. Photos optional.</p>
          </div>
          <div className="step-card card" style={{ textAlign: 'center' }}>
            <div className="step-num" style={{ margin: '0 auto 20px' }}>02</div>
            <h3 style={{ marginBottom: '10px' }}>Match</h3>
            <p style={{ fontSize: '13.5px' }}>A nearby courier accepts in seconds. See their photo, rating, and vehicle.</p>
          </div>
          <div className="step-card card" style={{ textAlign: 'center' }}>
            <div className="step-num" style={{ margin: '0 auto 20px' }}>03</div>
            <h3 style={{ marginBottom: '10px' }}>Track</h3>
            <p style={{ fontSize: '13.5px' }}>Watch the route live on the map. Chat in-app if you need to adjust.</p>
          </div>
          <div className="step-card card" style={{ textAlign: 'center' }}>
            <div className="step-num" style={{ margin: '0 auto 20px' }}>04</div>
            <h3 style={{ marginBottom: '10px' }}>Delivered</h3>
            <p style={{ fontSize: '13.5px' }}>Pay in-app with card, mobile wallet, or cash. Rate your courier. Done.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
