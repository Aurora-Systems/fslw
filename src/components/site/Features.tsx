import { MapPin, ShieldCheck, DollarSign, Globe, CreditCard, Headphones } from 'lucide-react';

export default function Features() {
  return (
    <section className="section section-alt" id="features">
      <div className="container">
        <div className="text-center" style={{ maxWidth: '560px', margin: '0 auto 56px' }}>
          <div className="eyebrow">Why FastLinQ</div>
          <h2>
            A delivery network that <span className="grad-text">actually works.</span>
          </h2>
        </div>
        <div className="grid-3">
          <div className="card">
            <div className="feature-icon">
              <MapPin />
            </div>
            <h3 style={{ marginBottom: '10px' }}>Live tracking</h3>
            <p style={{ fontSize: '13.5px' }}>See your parcel move every second of the journey on a real-time map.</p>
          </div>
          <div className="card">
            <div className="feature-icon">
              <ShieldCheck />
            </div>
            <h3 style={{ marginBottom: '10px' }}>Verified couriers</h3>
            <p style={{ fontSize: '13.5px' }}>
              ID-checked and rated. Couriers with goods-in-transit insurance provide an extra layer of cover for your parcel.
            </p>
          </div>
          <div className="card">
            <div className="feature-icon">
              <DollarSign />
            </div>
            <h3 style={{ marginBottom: '10px' }}>Transparent fares</h3>
            <p style={{ fontSize: '13.5px' }}>See the price up-front before you confirm. No surprises at the door.</p>
          </div>
          <div className="card">
            <div className="feature-icon">
              <Globe />
            </div>
            <h3 style={{ marginBottom: '10px' }}>Global reach</h3>
            <p style={{ fontSize: '13.5px' }}>No borders, no limits. FastLinQ works wherever you and your courier are.</p>
          </div>
          <div className="card">
            <div className="feature-icon">
              <CreditCard />
            </div>
            <h3 style={{ marginBottom: '10px' }}>Multiple payments</h3>
            <p style={{ fontSize: '13.5px' }}>Card, mobile wallet, or cash — whatever works best for you.</p>
          </div>
          <div className="card">
            <div className="feature-icon">
              <Headphones />
            </div>
            <h3 style={{ marginBottom: '10px' }}>24/7 support</h3>
            <p style={{ fontSize: '13.5px' }}>Real humans on chat and phone, any hour of the day or night.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
