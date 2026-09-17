'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { X, CheckCircle, Clock, XCircle, Truck, Phone, Mail, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import { Row, CheckPill, Photo } from './VerificationDrawer';

const API = process.env.NEXT_PUBLIC_API_BASE;

type Stage = 'open' | 'in_transit' | 'completed' | 'cancelled';

interface Person {
  user_id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  contact_number: string | null;
  email: string | null;
  country: string | null;
  joined: string | null;
  photo_url: string | null;
}

interface Place { lat?: number; lng?: number; formatted_address?: string }

interface JobDetail {
  job: {
    id: number;
    status: string | null;
    created_at: string;
    content_description: string | null;
    pickup_date: number | null;
    delivery_date: number | null;
    delivered_on: number | null;
    pickup_location: Place | null;
    dropoff_location: Place | null;
    estimated_mass: number | null;
    dangerous_contents: boolean | null;
    payment_terms: string | null;
    distance: number | null;
    delivery_code: string | null;
    cancellation_reason: string | null;
    source: string | null;
    external_ref: string | null;
    recipient: { name?: string; phone?: string } | null;
    [key: string]: unknown;
  };
  stage: Stage;
  requested_vehicle: { vehicle_id: string; vehicle_type: string | null; description: string | null } | null;
  client: (Person & { jobs_posted: number }) | null;
  carrier: (Person & {
    deliveries_completed: number;
    verification: { status: string; session_id: string; session_number: number | null } | null;
  }) | null;
  vehicle: {
    vehicle_type: string | null;
    brand: string | null;
    model: string | null;
    color: string | null;
    year: string | null;
    vrn: string | null;
    vin: string | null;
    insured: boolean | null;
    images: { front: string | null; side: string | null; back: string | null } | null;
  } | null;
  api_client: { id: string; name: string } | null;
  money: {
    delivery_fee: number;
    platform_fee: number;
    platform_fee_estimated: boolean;
    carrier_earnings: number | null; // null when the job was cancelled
    settled?: boolean;
  };
  live_location: { lat: number; lng: number; updated_at?: number } | null;
  offers: {
    transporter_user_id: string | null;
    name: string | null;
    contact_number: string | null;
    offer_amount: number;
    vehicle_type: string | null;
    created_at: number | null;
  }[];
}

interface JobDrawerProps {
  open: boolean;
  jobId: number | string | null;
  token: string;
  onClose: () => void;
  /** Open the carrier's identity verification in the verification drawer. */
  onOpenVerification?: (userId: string, name: string, sessionId?: string) => void;
  /** Another drawer is stacked on top — leave Escape to it. */
  suspended?: boolean;
}

export const STAGE_META: Record<Stage, { label: string; badge: string; banner: string }> = {
  open: { label: 'Open', badge: 'badge-pending', banner: 'pending' },
  in_transit: { label: 'In transit', badge: 'badge-active', banner: 'transit' },
  completed: { label: 'Completed', badge: 'badge-completed', banner: 'approved' },
  cancelled: { label: 'Cancelled', badge: 'badge-cancelled', banner: 'declined' },
};

const money = (n: number | null | undefined) => `$${Number(n ?? 0).toFixed(2)}`;

function fmtDateTime(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(value: number | string | null | undefined): string {
  if (value == null) return '';
  const mins = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs} h ago`;
  return `${Math.round(hrs / 24)} days ago`;
}

function fullName(p: Pick<Person, 'first_name' | 'middle_name' | 'last_name'> | null): string {
  if (!p) return '';
  return [p.first_name, p.middle_name, p.last_name].map((s) => (s || '').trim()).filter(Boolean).join(' ');
}

function mapsLink(p: Place | null | undefined): string | null {
  if (!p) return null;
  if (p.lat != null && p.lng != null) return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
  return p.formatted_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.formatted_address)}` : null;
}

function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="drawer-section">
      <div className="drawer-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{title}</span>
        {right && <span style={{ marginLeft: 'auto', textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>{right}</span>}
      </div>
      {children}
    </div>
  );
}

function PersonCard({ p, tone, extra }: { p: Person; tone: 'carrier' | 'client'; extra?: ReactNode }) {
  const name = fullName(p) || 'Unnamed user';
  const bg = tone === 'carrier' ? 'linear-gradient(135deg,#dbeafe,#bfdbfe)' : 'linear-gradient(135deg,#ede9fe,#ddd6fe)';
  const fg = tone === 'carrier' ? '#1d4ed8' : '#6d28d9';
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {p.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.photo_url}
            alt=""
            referrerPolicy="no-referrer"
            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', background: bg, flexShrink: 0 }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
          />
        ) : (
          <div className="user-avatar" style={{ width: 44, height: 44, fontSize: 16, background: bg, color: fg }}>
            {(name[0] || '?').toUpperCase()}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>{name}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>
            {p.contact_number && (
              <a href={`tel:${p.contact_number}`} style={{ color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Phone size={12} /> {p.contact_number}
              </a>
            )}
            {p.email && (
              <a href={`mailto:${p.email}`} style={{ color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4, wordBreak: 'break-all' }}>
                <Mail size={12} /> {p.email}
              </a>
            )}
          </div>
        </div>
      </div>
      {extra && <div style={{ marginTop: 10 }}>{extra}</div>}
    </div>
  );
}

export default function JobDrawer({ open, jobId, token, onClose, onOpenVerification, suspended }: JobDrawerProps) {
  const [data, setData] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || jobId == null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    (async () => {
      try {
        const res = await fetch(`${API}/admin/jobs/${jobId}`, { headers: { Authorization: `Bearer ${token}` } });
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(
            res.status === 401
              ? 'Your admin session expired — reload the page to sign in again.'
              : body?.error || 'Could not load this job'
          );
          return;
        }
        setData(body.data);
      } catch {
        if (!cancelled) setError('Network error — check your connection and try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // Refetch only when a different job is opened, not on a background token refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, jobId]);

  useEffect(() => {
    if (!open || suspended) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, suspended, onClose]);

  const j = data?.job;
  const stage = data ? STAGE_META[data.stage] : null;

  const bannerSub = (() => {
    if (!data || !j) return '';
    switch (data.stage) {
      case 'completed':
        return j.delivered_on ? `Delivered ${fmtDateTime(j.delivered_on)}` : 'Delivered';
      case 'cancelled':
        return data.carrier ? 'Cancelled after a carrier accepted it' : 'Cancelled before any carrier took it';
      case 'in_transit':
        return 'A carrier has accepted this job and it is not finished yet';
      default:
        return `Waiting for a carrier · posted ${timeAgo(j.created_at)}`;
    }
  })();

  const BannerIcon = () => {
    if (!data) return null;
    const s = { width: 28, height: 28 };
    if (data.stage === 'completed') return <CheckCircle style={{ ...s, stroke: '#22c55e' }} />;
    if (data.stage === 'cancelled') return <XCircle style={{ ...s, stroke: '#ef4444' }} />;
    if (data.stage === 'in_transit') return <Truck style={{ ...s, stroke: '#1e90d9' }} />;
    return <Clock style={{ ...s, stroke: '#f59e0b' }} />;
  };

  const routeLink =
    j?.pickup_location?.lat != null && j?.dropoff_location?.lat != null
      ? `https://www.google.com/maps/dir/?api=1&origin=${j.pickup_location.lat},${j.pickup_location.lng}&destination=${j.dropoff_location.lat},${j.dropoff_location.lng}`
      : null;

  const vehicleImages = data?.vehicle?.images
    ? ([['front', 'Front'], ['side', 'Side'], ['back', 'Back']] as const).filter(([k]) => data.vehicle!.images![k])
    : [];

  return (
    <>
      <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={onClose}></div>
      <div className={`drawer${open ? ' open' : ''}`} role="dialog" aria-label="Job details">
        <div className="drawer-header">
          <div className="drawer-title">
            {jobId != null ? `Job #${jobId}` : 'Job'}
            {stage && <span className={`badge ${stage.badge}`} style={{ marginLeft: 10, verticalAlign: 'middle' }}>{stage.label}</span>}
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close"><X /></button>
        </div>

        <div className="drawer-body">
          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-mute)' }}>
              <span className="spinner"></span>
            </div>
          )}
          {!loading && error && <p style={{ color: 'var(--red)', padding: 20 }}>{error}</p>}

          {!loading && data && j && stage && (
            <>
              <div className={`status-banner ${stage.banner}`}>
                <div className="status-icon"><BannerIcon /></div>
                <div>
                  <div className="status-label">{stage.label}</div>
                  <div className="status-sub">{bannerSub}</div>
                </div>
              </div>

              {data.stage === 'cancelled' && j.cancellation_reason && (
                <div style={{ margin: '-6px 0 20px', padding: '10px 12px', borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13 }}>
                  <strong>Reason:</strong> {j.cancellation_reason}
                </div>
              )}

              {/* ── Who carried it ── */}
              <Section title={data.stage === 'cancelled' && data.carrier ? 'Carrier (before cancellation)' : 'Carried by'}>
                {data.carrier ? (
                  <PersonCard
                    p={data.carrier}
                    tone="carrier"
                    extra={
                      <>
                        <Row label="Identity check">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            {data.carrier.verification ? <CheckPill status={data.carrier.verification.status} /> : 'Not available'}
                            {data.carrier.verification && onOpenVerification && (
                              <button
                                className="action-btn"
                                style={{ padding: '2px 8px', fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                onClick={() =>
                                  onOpenVerification(
                                    data.carrier!.user_id,
                                    fullName(data.carrier),
                                    data.carrier!.verification!.session_id
                                  )
                                }
                              >
                                <ShieldCheck size={12} /> View
                              </button>
                            )}
                          </span>
                        </Row>
                        <Row label="Deliveries completed">{data.carrier.deliveries_completed.toLocaleString()}</Row>
                        <Row label="Country">{data.carrier.country || '—'}</Row>
                        <Row label="Member since">{fmtDateTime(data.carrier.joined).split(',')[0]}</Row>
                      </>
                    }
                  />
                ) : data.stage === 'open' ? (
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-mute)' }}>No carrier has accepted this job yet.</p>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-mute)' }}>No carrier was ever assigned.</p>
                )}
              </Section>

              {/* ── Offers on an open job ── */}
              {data.stage === 'open' && (
                <Section title="Offers" right={data.offers.length ? `${data.offers.length} waiting` : undefined}>
                  {data.offers.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-mute)' }}>No live offers on this job right now.</p>
                  ) : (
                    data.offers.map((o, i) => (
                      <Row key={`${o.transporter_user_id}-${i}`} label={o.name || 'Unknown driver'}>
                        <span>
                          <strong>{money(o.offer_amount)}</strong>
                          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-mute)', fontWeight: 400 }}>
                            {[o.vehicle_type, o.contact_number, o.created_at ? timeAgo(o.created_at) : null].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                      </Row>
                    ))
                  )}
                </Section>
              )}

              {/* ── Vehicle ── */}
              {data.vehicle && (
                <Section title="Vehicle used">
                  {vehicleImages.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${vehicleImages.length}, 1fr)`, gap: 8, marginBottom: 10 }}>
                      {vehicleImages.map(([k, label]) => (
                        <Photo key={k} src={data.vehicle!.images![k] ?? undefined} label={label} />
                      ))}
                    </div>
                  )}
                  <Row label="Type">{data.vehicle.vehicle_type || '—'}</Row>
                  <Row label="Make & model">
                    {[data.vehicle.brand, data.vehicle.model].filter(Boolean).join(' ') || '—'}
                    {data.vehicle.year ? ` (${data.vehicle.year})` : ''}
                  </Row>
                  <Row label="Colour">{data.vehicle.color || '—'}</Row>
                  <Row label="Registration (VRN)">{data.vehicle.vrn || '—'}</Row>
                  <Row label="VIN">{data.vehicle.vin || '—'}</Row>
                  <Row label="Insured">{data.vehicle.insured == null ? '—' : data.vehicle.insured ? 'Yes' : 'No'}</Row>
                </Section>
              )}

              {/* ── Route ── */}
              <Section
                title="Route"
                right={
                  routeLink ? (
                    <a href={routeLink} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      Open in Google Maps <ExternalLink size={12} />
                    </a>
                  ) : undefined
                }
              >
                {(['pickup_location', 'dropoff_location'] as const).map((key) => {
                  const place = j[key];
                  const link = mapsLink(place);
                  return (
                    <Row key={key} label={key === 'pickup_location' ? 'Pickup' : 'Drop-off'}>
                      {link ? (
                        <a href={link} target="_blank" rel="noreferrer" style={{ color: 'inherit', display: 'inline-flex', gap: 4 }}>
                          <MapPin size={13} style={{ flexShrink: 0, marginTop: 2, color: 'var(--blue)' }} />
                          {place?.formatted_address || 'Pinned location'}
                        </a>
                      ) : '—'}
                    </Row>
                  );
                })}
                <Row label="Distance">{j.distance != null ? `${(j.distance / 1000).toFixed(1)} km` : '—'}</Row>
                {data.live_location && (
                  <Row label="Carrier last seen">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${data.live_location.lat},${data.live_location.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--blue)' }}
                    >
                      {data.live_location.updated_at ? timeAgo(data.live_location.updated_at) : 'Recently'} · view on map
                    </a>
                  </Row>
                )}
              </Section>

              {/* ── Parcel ── */}
              <Section title="Parcel">
                <Row label="Contents">{j.content_description || '—'}</Row>
                <Row label="Estimated weight">{j.estimated_mass != null ? `${j.estimated_mass} kg` : '—'}</Row>
                <Row label="Dangerous goods">
                  {j.dangerous_contents ? <span style={{ color: '#b91c1c', fontWeight: 600 }}>Yes</span> : 'No'}
                </Row>
                <Row label="Vehicle requested">{data.requested_vehicle?.vehicle_type || '—'}</Row>
                {j.recipient && (
                  <Row label="Recipient">{[j.recipient.name, j.recipient.phone].filter(Boolean).join(' · ') || '—'}</Row>
                )}
                <Row label="Delivery code">
                  <code style={{ fontSize: 12.5, letterSpacing: '.08em' }}>{j.delivery_code || '—'}</code>
                </Row>
              </Section>

              {/* ── Money ── */}
              <Section title="Payment">
                <Row label={data.stage === 'open' ? 'Delivery fee (posted)' : 'Delivery fee (agreed)'}>
                  <strong>{money(data.money.delivery_fee)}</strong>
                </Row>
                {data.stage === 'cancelled' ? (
                  <>
                    <Row label="FastLinQ fee">
                      {data.carrier && !data.money.platform_fee_estimated
                        ? `${money(data.money.platform_fee)} · refunded to the courier if cancelled in the app`
                        : 'Not charged'}
                    </Row>
                    <Row label="Carrier earned">Nothing — job cancelled</Row>
                  </>
                ) : (
                  <>
                    <Row label={`FastLinQ fee${data.money.platform_fee_estimated ? ' (est. 7%)' : ''}`}>{money(data.money.platform_fee)}</Row>
                    <Row label={data.stage === 'completed' ? 'Carrier earned' : data.stage === 'in_transit' ? 'Carrier will earn' : 'Carrier would earn'}>
                      {money(data.money.carrier_earnings)}
                    </Row>
                  </>
                )}
                <Row label="Payment terms">{j.payment_terms?.trim() || '—'}</Row>
              </Section>

              {/* ── Timeline ── */}
              <Section title="Timeline">
                <Row label="Posted">{fmtDateTime(j.created_at)}</Row>
                <Row label="Pickup scheduled">{fmtDateTime(j.pickup_date)}</Row>
                <Row label="Deliver by">{fmtDateTime(j.delivery_date)}</Row>
                <Row label="Delivered">{fmtDateTime(j.delivered_on)}</Row>
              </Section>

              {/* ── Client ── */}
              <Section title="Posted by">
                {data.client ? (
                  <PersonCard
                    p={data.client}
                    tone="client"
                    extra={
                      <>
                        <Row label="Jobs posted">{data.client.jobs_posted.toLocaleString()}</Row>
                        <Row label="Member since">{fmtDateTime(data.client.joined).split(',')[0]}</Row>
                      </>
                    }
                  />
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-mute)' }}>The client account no longer exists.</p>
                )}
              </Section>

              {/* ── Source ── */}
              <Section title="Source">
                <Row label="Created via">
                  {data.api_client ? `Partner API — ${data.api_client.name}` : j.source === 'api' ? 'Partner API' : 'FastLinQ app'}
                </Row>
                {j.external_ref && <Row label="Partner reference">{j.external_ref}</Row>}
              </Section>

              <details className="drawer-section">
                <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--ink-mute)' }}>Raw job record</summary>
                <pre
                  style={{
                    fontSize: 11, lineHeight: 1.5, color: 'var(--ink-soft)', background: 'var(--paper-2)',
                    padding: 12, borderRadius: 8, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 10,
                  }}
                >
                  {JSON.stringify(j, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      </div>
    </>
  );
}
