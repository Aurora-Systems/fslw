import Image from 'next/image';

export default function ForCouriers() {
  return (
    <section className="section" id="for-couriers">
      <div className="container">
        <div className="grid-2">
          <div>
            <div className="eyebrow">For couriers</div>
            <h2 style={{ marginBottom: '20px' }}>
              Drive, ride, walk.
              <br />
              <span className="grad-text">Earn on your terms.</span>
            </h2>
            <p className="lead" style={{ marginBottom: '32px' }}>
              Be your own boss. Pick the jobs that fit your schedule, see fares up-front,
              and get paid every week — straight to mobile money or bank.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="check-item"><div className="check-icon">✓</div> Set your own hours</div>
              <div className="check-item"><div className="check-icon">✓</div> Fares shown up-front</div>
              <div className="check-item"><div className="check-icon">✓</div> Weekly payouts</div>
              <div className="check-item"><div className="check-icon">✓</div> In-app support 24/7</div>
              <div className="check-item"><div className="check-icon">✓</div> Any vehicle type</div>
              <div className="check-item"><div className="check-icon">✓</div> Simple onboarding</div>
            </div>
            <a href="#download" className="btn btn-primary" style={{ marginTop: '32px' }}>
              Sign up to earn →
            </a>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="phone-frame" style={{ width: '240px' }}>
              <Image
                src="/assets/screen_carrier_home.png"
                alt="FastLinQ Courier App"
                width={224}
                height={484}
                style={{ width: '100%', display: 'block', borderRadius: '36px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
