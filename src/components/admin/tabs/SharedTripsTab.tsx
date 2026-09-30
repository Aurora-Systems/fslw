'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE;
const LIMIT = 25;
// Drivers pay 7% of the trip total; it is only charged when they start the trip.
const PLATFORM_FEE_RATE = 0.07;
// Shares are split by weight, counting light parcels as 2 kg (server MIN_SPLIT_KG).
const MIN_SPLIT_KG = 2;

type TripStatus = 'open' | 'starting' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
type ParcelStatus = 'joined' | 'left' | 'active' | 'delivered' | 'cancelled';

export const TRIP_STATUS_META: Record<TripStatus, { label: string; badge: string }> = {
  open: { label: 'Open', badge: 'badge-pending' },
  starting: { label: 'Starting', badge: 'badge-active' },
  in_progress: { label: 'On the way', badge: 'badge-active' },
  completed: { label: 'Completed', badge: 'badge-completed' },
  cancelled: { label: 'Cancelled', badge: 'badge-cancelled' },
  expired: { label: 'Expired', badge: 'badge-Unknown' },
};

const PARCEL_STATUS_META: Record<ParcelStatus, { label: string; badge: string }> = {
  joined: { label: 'Joined', badge: 'badge-pending' },
  left: { label: 'Left', badge: 'badge-Unknown' },
  active: { label: 'On the way', badge: 'badge-active' },
  delivered: { label: 'Delivered', badge: 'badge-completed' },
  cancelled: { label: 'Cancelled', badge: 'badge-cancelled' },
};

// Epoch-ms columns are Postgres numerics; accept a number or numeric string.
type EpochMs = number | string | null;

interface PersonLite { user_id: string; first_name: string | null; last_name: string | null; contact_number: string | null }

interface Place { lat?: number; lng?: number; formatted_address?: string }

interface TripRow {
  id: string;
  created_at: string;
  status: string;
  origin_label: string;
  destination_label: string;
  vehicle_type: string | null;
  departure_at: EpochMs;
  parcels_count: number;
  max_parcels: number;
  total_mass: number | null;
  current_total: number | null;
  final_total: number | null;
  platform_fee_total: number | null;
  organiser: PersonLite | null;
  carrier: PersonLite | null;
  started_at: EpochMs;
  completed_at: EpochMs;
}

interface TripParcel {
  id: string;
  status: string;
  sender: PersonLite | null;
  content_description: string | null;
  estimated_mass: number | null;
  share_fee: number | null;
  swiftlink_fee: number | null;
  job_id: number | null;
  pickup_location: Place | null;
  dropoff_location: Place | null;
  created_at: string;
}

type TripDetail = TripRow & { parcels: TripParcel[] };

interface DetailState {
  loading: boolean;
  error: string | null;
  data: TripDetail | null;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface SharedTripsTabProps {
  token: string;
  onOpenJob: (jobId: number) => void;
}

function tripBadge(status: string) {
  const meta = TRIP_STATUS_META[status as TripStatus];
  if (meta) return <span className={`badge ${meta.badge}`}>{meta.label}</span>;
  return <span className="badge badge-Unknown">{status || 'Unknown'}</span>;
}

function parcelBadge(status: string) {
  const meta = PARCEL_STATUS_META[status as ParcelStatus];
  if (meta) return <span className={`badge ${meta.badge}`}>{meta.label}</span>;
  return <span className="badge badge-Unknown">{status || 'Unknown'}</span>;
}

function personName(u: PersonLite | null | undefined): string {
  if (!u) return '';
  return `${u.first_name || ''} ${u.last_name || ''}`.trim();
}

function toDate(v: EpochMs | undefined): Date | null {
  if (v == null || v === '') return null;
  const d = new Date(typeof v === 'string' && /^\d+(\.\d+)?$/.test(v) ? Number(v) : v);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDateTime(v: EpochMs | undefined): string {
  const d = toDate(v);
  if (!d) return '—';
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function relative(v: EpochMs | undefined): string {
  const d = toDate(v);
  if (!d) return '';
  const mins = Math.round((d.getTime() - Date.now()) / 60000);
  const abs = Math.abs(mins);
  const span = abs < 60 ? `${abs} min` : abs < 48 * 60 ? `${Math.round(abs / 60)} h` : `${Math.round(abs / 1440)} days`;
  return mins >= 0 ? `in ${span}` : `${span} ago`;
}

function money(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return '—';
  return `$${Number(n).toFixed(2)}`;
}

function kg(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return '—';
  return `${Number(Number(n).toFixed(1))} kg`;
}

function isStarted(t: TripRow): boolean {
  return t.final_total != null || t.status === 'in_progress' || t.status === 'completed';
}

function tripTotal(t: TripRow): number | null {
  return t.final_total ?? t.current_total ?? null;
}

// Rough share for a parcel before the trip starts (the server fixes the real one at start).
function estimatedShare(trip: TripDetail, parcel: TripParcel): number | null {
  if (parcel.status !== 'joined' || trip.current_total == null) return null;
  const live = trip.parcels.filter(p => p.status === 'joined' || p.status === 'active');
  const weight = (p: TripParcel) => Math.max(Number(p.estimated_mass) || 0, MIN_SPLIT_KG);
  const sum = live.reduce((a, p) => a + weight(p), 0);
  if (!sum) return null;
  return Math.round(Number(trip.current_total) * (weight(parcel) / sum) * 100) / 100;
}

const ellipsis = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const;
const muted = { color: 'var(--ink-mute)', fontSize: 12 } as const;
// Nested table headers must not inherit the list's sticky header behaviour.
const subTh = { position: 'static', background: 'transparent', padding: '8px 12px' } as const;
const subTd = { padding: '9px 12px', fontSize: 12.5, background: '#fff' } as const;
const COLS = 9;

export default function SharedTripsTab({ token, onOpenJob }: SharedTripsTabProps) {
  const [rows, setRows] = useState<TripRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState<TripStatus | ''>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, DetailState>>({});

  // Refs keep infinite scroll on the current filter and the current (refreshed) token.
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const filterRef = useRef<TripStatus | ''>('');
  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const loadingRef = useRef(false);
  const reqIdRef = useRef(0); // drop list responses that belong to an older filter
  const detailGenRef = useRef(0); // drop trip details fetched before the list was reset
  const detailLoadingRef = useRef<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (page: number) => {
    if (page > 1 && (loadingRef.current || !hasMoreRef.current)) return;
    const reqId = page === 1 ? ++reqIdRef.current : reqIdRef.current;
    loadingRef.current = true;
    setLoading(true);
    if (page === 1) setError(null);

    try {
      const status = filterRef.current;
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (status) params.set('status', status);

      const res = await fetch(`${API}/admin/shared-trips?${params}`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      if (reqId !== reqIdRef.current) return;
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          res.status === 401
            ? 'Your admin session expired — reload the page to sign in again.'
            : body?.error || 'Could not load shared trips'
        );
        hasMoreRef.current = false;
        setHasMore(false);
        return;
      }

      const newRows: TripRow[] = body.data ?? [];
      const m: Meta = body.meta;
      setRows(prev => {
        if (page === 1) return newRows;
        // New trips created while scrolling shift the pages; skip ones already shown.
        const seen = new Set(prev.map(t => t.id));
        return [...prev, ...newRows.filter(t => !seen.has(t.id))];
      });
      setMeta(m);
      pageRef.current = page + 1;
      hasMoreRef.current = page < (m?.pages ?? 0);
      setHasMore(hasMoreRef.current);
    } catch {
      if (reqId === reqIdRef.current) setError('Network error — check your connection and try again.');
    } finally {
      if (reqId === reqIdRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    if (detailLoadingRef.current.has(id)) return;
    detailLoadingRef.current.add(id);
    const gen = detailGenRef.current;
    setDetails(prev => ({ ...prev, [id]: { loading: true, error: null, data: prev[id]?.data ?? null } }));

    let next: DetailState;
    try {
      const res = await fetch(`${API}/admin/shared-trips/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        next = {
          loading: false,
          data: null,
          error: res.status === 401
            ? 'Your admin session expired — reload the page to sign in again.'
            : body?.error || 'Could not load this trip',
        };
      } else {
        const data: TripDetail | null = body.data ? { ...body.data, parcels: body.data.parcels ?? [] } : null;
        next = { loading: false, error: data ? null : 'Could not load this trip', data };
      }
    } catch {
      next = { loading: false, data: null, error: 'Network error — check your connection and try again.' };
    }

    if (gen === detailGenRef.current) {
      detailLoadingRef.current.delete(id);
      setDetails(prev => ({ ...prev, [id]: next }));
    }
  }, []);

  // New filter → start again from page 1 and forget any expanded trip.
  useEffect(() => {
    filterRef.current = filter;
    pageRef.current = 1;
    hasMoreRef.current = true;
    detailGenRef.current += 1;
    detailLoadingRef.current = new Set();
    setRows([]);
    setExpandedId(null);
    setDetails({});
    load(1);
  }, [filter, load]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) load(pageRef.current);
      },
      { rootMargin: '160px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [load]);

  const toggle = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    const d = details[id];
    if (!d || (!d.data && !d.loading)) loadDetail(id);
  };

  const countLabel = meta ? `${rows.length} / ${meta.total.toLocaleString()}` : rows.length ? `${rows.length} loaded` : '';

  const renderDetail = (trip: TripRow) => {
    const d = details[trip.id];
    if (!d || (d.loading && !d.data)) {
      return (
        <div style={{ ...muted, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="spinner"></span> Loading parcels…
        </div>
      );
    }
    if (d.error || !d.data) {
      return (
        <div style={{ color: 'var(--red)', fontSize: 13 }}>
          {d.error || 'Could not load this trip'}{' '}
          <button className="action-btn" style={{ marginLeft: 8 }} onClick={() => loadDetail(trip.id)}>Try again</button>
        </div>
      );
    }

    const detail = d.data;
    const timeline = [
      `Created ${fmtDateTime(detail.created_at)}`,
      detail.started_at != null ? `Started ${fmtDateTime(detail.started_at)}` : null,
      detail.completed_at != null ? `Finished ${fmtDateTime(detail.completed_at)}` : null,
    ].filter(Boolean).join(' · ');

    return (
      <>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'baseline', marginBottom: 10, ...muted }}>
          <span>Trip <code style={{ fontSize: 11 }}>{detail.id}</code></span>
          <span>{timeline}</span>
          {!isStarted(detail) && (
            <span style={{ marginLeft: 'auto' }}>Shares are estimates until the driver starts the trip.</span>
          )}
        </div>
        {detail.parcels.length === 0 ? (
          <div style={muted}>No parcels on this trip.</div>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={subTh}>Sender</th>
                  <th style={subTh}>Contents</th>
                  <th style={subTh}>Weight</th>
                  <th style={subTh}>Share</th>
                  <th style={subTh}>Status</th>
                  <th style={subTh}>Route</th>
                  <th style={subTh}>Job</th>
                </tr>
              </thead>
              <tbody>
                {detail.parcels.map(p => {
                  const est = p.share_fee == null ? estimatedShare(detail, p) : null;
                  const isOrganiser = !!p.sender && p.sender.user_id === detail.organiser?.user_id;
                  return (
                    <tr key={p.id}>
                      <td style={subTd}>
                        <div className="user-name" style={{ ...ellipsis, maxWidth: 160 }}>
                          {personName(p.sender) || '—'}
                          {isOrganiser && (
                            <span style={{ marginLeft: 6, fontSize: 10.5, color: 'var(--blue-dark)', fontWeight: 600 }}>Organiser</span>
                          )}
                        </div>
                        {p.sender?.contact_number && <div className="user-sub">{p.sender.contact_number}</div>}
                      </td>
                      <td style={{ ...subTd, maxWidth: 180 }}>
                        <div style={ellipsis} title={p.content_description || undefined}>{p.content_description || '—'}</div>
                      </td>
                      <td style={{ ...subTd, whiteSpace: 'nowrap' }}>{kg(p.estimated_mass)}</td>
                      <td style={{ ...subTd, whiteSpace: 'nowrap' }}>
                        {p.share_fee != null ? (
                          <>
                            <div style={{ fontWeight: 600 }}>{money(p.share_fee)}</div>
                            {p.swiftlink_fee != null && <div className="user-sub">Fee {money(p.swiftlink_fee)}</div>}
                          </>
                        ) : est != null ? (
                          <div title="Estimate — the share is fixed when the driver starts the trip">
                            ≈ {money(est)} <span className="user-sub">est.</span>
                          </div>
                        ) : (
                          <span style={muted}>—</span>
                        )}
                      </td>
                      <td style={{ ...subTd, whiteSpace: 'nowrap' }}>{parcelBadge(p.status)}</td>
                      <td style={{ ...subTd, maxWidth: 240 }}>
                        <div style={ellipsis} title={p.pickup_location?.formatted_address}>{p.pickup_location?.formatted_address || '—'}</div>
                        <div style={{ ...ellipsis, color: 'var(--ink-mute)' }} title={p.dropoff_location?.formatted_address}>
                          → {p.dropoff_location?.formatted_address || '—'}
                        </div>
                      </td>
                      <td style={{ ...subTd, whiteSpace: 'nowrap' }}>
                        {p.job_id != null ? (
                          <button
                            className="action-btn"
                            onClick={e => { e.stopPropagation(); onOpenJob(Number(p.job_id)); }}
                            title="Open the job details"
                          >
                            Job #{p.job_id}
                          </button>
                        ) : (
                          <span style={muted}>Not started</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="tab-panel active">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Shared Trips</div>
          <div className="panel-count">{countLabel}</div>
          <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value as TripStatus | '')}>
            <option value="">All statuses</option>
            {(Object.keys(TRIP_STATUS_META) as TripStatus[]).map(s => (
              <option key={s} value={s}>{TRIP_STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 28, paddingRight: 0 }}></th>
              <th>Route</th>
              <th>Departure</th>
              <th>Status</th>
              <th>Parcels</th>
              <th>Trip total</th>
              <th>Platform fee</th>
              <th>Organiser</th>
              <th>Driver</th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr className="state-row">
                <td colSpan={COLS} style={{ color: 'var(--red)' }}>
                  {error}{' '}
                  <button className="action-btn" style={{ marginLeft: 8 }} onClick={() => load(1)}>Try again</button>
                </td>
              </tr>
            )}
            {!error && !loading && rows.length === 0 && (
              <tr className="state-row"><td colSpan={COLS}>No shared trips match</td></tr>
            )}
            {rows.map(t => {
              const open = expandedId === t.id;
              const started = isStarted(t);
              const total = tripTotal(t);
              const organiser = personName(t.organiser);
              const driver = personName(t.carrier);
              const upcoming = t.status === 'open' || t.status === 'starting';
              return (
                <Fragment key={t.id}>
                  <tr
                    className="clickable"
                    tabIndex={0}
                    aria-expanded={open}
                    onClick={() => toggle(t.id)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(t.id); } }}
                    title={open ? 'Hide parcels' : 'Show parcels'}
                  >
                    <td style={{ paddingRight: 0, color: 'var(--ink-mute)', lineHeight: 0 }}>
                      {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      <div className="user-name" style={ellipsis} title={`${t.origin_label} → ${t.destination_label}`}>
                        {t.origin_label} → {t.destination_label}
                      </div>
                      <div className="user-sub" style={ellipsis}>
                        {[t.vehicle_type, `#${t.id.slice(0, 8)}`].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                      <div>{fmtDateTime(t.departure_at)}</div>
                      {upcoming && <div className="user-sub">{relative(t.departure_at)}</div>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{tripBadge(t.status)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600 }}>{t.parcels_count} / {t.max_parcels}</div>
                      <div className="user-sub">{kg(t.total_mass)}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600 }}>{money(total)}</div>
                      {!started && total != null && <div className="user-sub">{upcoming ? 'Estimate' : 'Never started'}</div>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {t.platform_fee_total != null ? (
                        <div style={{ fontWeight: 600 }}>{money(t.platform_fee_total)}</div>
                      ) : total != null && t.status !== 'cancelled' && t.status !== 'expired' ? (
                        <div title="7% of the current trip total — charged to the driver when they start the trip">
                          ≈ {money(Math.round(total * PLATFORM_FEE_RATE * 100) / 100)}
                          <div className="user-sub">Charged at start</div>
                        </div>
                      ) : (
                        <span style={muted}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="user-name" style={{ ...ellipsis, maxWidth: 150 }}>{organiser || '—'}</div>
                      {t.organiser?.contact_number && <div className="user-sub">{t.organiser.contact_number}</div>}
                    </td>
                    <td>
                      {driver ? (
                        <>
                          <div className="user-name" style={{ ...ellipsis, maxWidth: 150 }}>{driver}</div>
                          {t.carrier?.contact_number && <div className="user-sub">{t.carrier.contact_number}</div>}
                        </>
                      ) : (
                        <span style={muted}>Not taken</span>
                      )}
                    </td>
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={COLS} style={{ background: 'var(--paper-2)', padding: '14px 20px 16px 44px' }}>
                        {renderDetail(t)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        <div className="sentinel" ref={sentinelRef}>
          <div className={`load-spinner${loading ? ' active' : ''}`}>
            <span className="spinner"></span> Loading…
          </div>
          {!loading && hasMore && (
            <button className="action-btn" onClick={() => load(pageRef.current)}>Load more</button>
          )}
          <div className={`end-msg${!hasMore && !loading && rows.length > 0 ? ' active' : ''}`}>
            All {meta?.total.toLocaleString() ?? ''} loaded
          </div>
        </div>
      </div>
    </div>
  );
}
