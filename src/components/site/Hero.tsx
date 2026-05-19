import Image from 'next/image';

export default function Hero() {
  return (
    <section
      className="section"
      style={{ paddingTop: '80px', paddingBottom: '96px', position: 'relative', overflow: 'hidden' }}
    >
      <div className="hero-bg">
        <div
          className="hero-blob"
          style={{ width: '600px', height: '600px', top: '-200px', right: '-120px' }}
        ></div>
        <div
          className="hero-blob"
          style={{
            width: '400px',
            height: '400px',
            bottom: '-100px',
            left: '-100px',
            background: 'radial-gradient(circle,rgba(30,144,217,.07) 0%,transparent 70%)',
          }}
        ></div>
      </div>
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="grid-2">
          <div>
            <span className="tag" style={{ marginBottom: '24px', display: 'inline-flex' }}>
              <span className="dot"></span> Now live · Download for Android
            </span>
            <h1>
              <span className="grad-text">Connecting couriers</span>
              <br />
              and clients across
              <br />
              the world.
            </h1>
            <p className="lead" style={{ marginTop: '24px' }}>
              FastLinQ is the delivery network for everyone — from a single parcel across town
              to thousands of deliveries a day for your business, anywhere in the world.
            </p>
            <div className="flex flex-gap-12" style={{ marginTop: '32px', flexWrap: 'wrap' }}>
              <a
                href="https://cdn.clipond.com/fastlinq/app-debug.apk"
                className="btn btn-primary btn-lg"
                download
              >
                ↓ Download App
              </a>
              <a href="#for-couriers" className="btn btn-outline btn-lg">
                Become a courier
              </a>
            </div>
            <div className="flex flex-gap-32" style={{ marginTop: '40px', flexWrap: 'wrap' }}>
              <div className="stat-chip">
                <span className="value grad-text">4.8★</span>
                <span className="label">12k+ ratings</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-chip">
                <span className="value grad-text">~25 min</span>
                <span className="label">avg. pickup time</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-chip">
                <span className="value grad-text">2,400+</span>
                <span className="label">active couriers</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="phone-frame">
              <Image
                src="/assets/screen_user_home_primary.png"
                alt="FastLinQ App"
                width={244}
                height={528}
                style={{ width: '100%', display: 'block', borderRadius: '36px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
