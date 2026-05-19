import { Zap, BarChart2, Code2 } from 'lucide-react';

export default function ForBusiness() {
  return (
    <section className="section" id="for-business" style={{ paddingTop: '0' }}>
      <div className="container">
        <div className="biz-banner">
          <div className="grid-2" style={{ position: 'relative', zIndex: 1, gap: '48px' }}>
            <div>
              <div className="eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>For business</div>
              <h2 style={{ color: '#fff', marginBottom: '20px' }}>Built for bulk.</h2>
              <p style={{ color: 'rgba(255,255,255,.8)', maxWidth: '480px', fontSize: '15px', lineHeight: 1.65 }}>
                One dashboard. A fleet of couriers. CSV uploads, scheduled drops, branded tracking
                pages and an API when you&apos;re ready to scale.
              </p>
              <div className="flex flex-gap-12" style={{ marginTop: '32px', flexWrap: 'wrap' }}>
                <a href="mailto:business@fastlinq.app" className="btn btn-white">Book a demo</a>
                <a href="#" className="btn btn-ghost-white">API docs</a>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  background: 'rgba(255,255,255,.1)',
                  border: '1px solid rgba(255,255,255,.15)',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <Zap style={{ width: '24px', height: '24px', stroke: 'rgba(255,255,255,.9)', flexShrink: 0 }} />
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Bulk dispatch</div>
                  <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '13px', marginTop: '2px' }}>
                    Upload a CSV and send hundreds of jobs in one click
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,.1)',
                  border: '1px solid rgba(255,255,255,.15)',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <BarChart2 style={{ width: '24px', height: '24px', stroke: 'rgba(255,255,255,.9)', flexShrink: 0 }} />
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Live analytics</div>
                  <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '13px', marginTop: '2px' }}>
                    Track delivery rates, spend, and courier performance in real time
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,.1)',
                  border: '1px solid rgba(255,255,255,.15)',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <Code2 style={{ width: '24px', height: '24px', stroke: 'rgba(255,255,255,.9)', flexShrink: 0 }} />
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>API-first</div>
                  <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '13px', marginTop: '2px' }}>
                    Integrate dispatching directly into your own platform or checkout
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
