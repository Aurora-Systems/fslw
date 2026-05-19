export default function TrustedBy() {
  return (
    <section
      style={{
        background: 'var(--paper-2)',
        padding: '28px 24px',
        borderTop: '1px solid #eaeaea',
        borderBottom: '1px solid #eaeaea',
      }}
    >
      <div className="container">
        <div
          className="flex"
          style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}
        >
          <span className="eyebrow" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            Trusted by businesses worldwide
          </span>
          <div className="flex flex-gap-32" style={{ flexWrap: 'wrap' }}>
            <div className="logo-pill"></div>
            <div className="logo-pill"></div>
            <div className="logo-pill"></div>
            <div className="logo-pill"></div>
            <div className="logo-pill"></div>
            <div className="logo-pill"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
