import { Download as DownloadIcon, Smartphone, PlayCircle } from 'lucide-react';
import Image from 'next/image';

export default function Download() {
  return (
    <section className="section section-alt" id="download">
      <div className="container">
        <div className="grid-2">
          <div>
            <span className="tag" style={{ marginBottom: '24px', display: 'inline-flex' }}>
              <span className="dot"></span> Available now
            </span>
            <h2 style={{ marginBottom: '16px' }}>
              Get <span className="grad-text">FastLinQ</span>
              <br />
              on your phone.
            </h2>
            <p className="lead" style={{ marginBottom: '36px' }}>
              Download directly from us — no app store needed. Install in under a minute and
              start sending or earning today.
            </p>
            <a
              href="https://cdn.clipond.com/fastlinq/app-debug.apk"
              className="apk-btn"
              download
            >
              <span className="icon">
                <DownloadIcon />
              </span>
              <div>
                <div className="text-top">Download for</div>
                <div className="text-main">Android (.apk)</div>
              </div>
            </a>
            <div style={{ fontSize: '12px', color: 'var(--ink-mute)', marginTop: '14px' }}>
              Android 8+ · Direct download
            </div>
            <div
              style={{
                marginTop: '32px',
                paddingTop: '28px',
                borderTop: '1px solid var(--ink-faint)',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-mute)',
                  marginBottom: '14px',
                }}
              >
                App stores — coming soon
              </div>
              <div className="flex flex-gap-12" style={{ flexWrap: 'wrap' }}>
                <div className="store-badge coming-soon">
                  <span className="icon">
                    <Smartphone />
                  </span>
                  <div>
                    <div className="text-top">Coming soon</div>
                    <div className="text-main" style={{ fontSize: '14px', color: 'var(--ink-mute)' }}>
                      App Store
                    </div>
                  </div>
                </div>
                <div className="store-badge coming-soon">
                  <span className="icon">
                    <PlayCircle />
                  </span>
                  <div>
                    <div className="text-top">Coming soon</div>
                    <div className="text-main" style={{ fontSize: '14px', color: 'var(--ink-mute)' }}>
                      Google Play
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            <a href="https://cdn.clipond.com/fastlinq/app-debug.apk" download style={{ display: 'block' }}>
              <Image
                src="/assets/qr_code.png"
                alt="Scan to download FastLinQ"
                width={160}
                height={160}
                style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '12px',
                  display: 'block',
                  boxShadow: '0 4px 20px rgba(0,0,0,.1)',
                }}
              />
            </a>
            <p style={{ fontSize: '12px', color: 'var(--ink-mute)', textAlign: 'center' }}>
              Scan to download · Android direct install
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
