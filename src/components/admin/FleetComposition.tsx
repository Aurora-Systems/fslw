'use client';

import { useEffect, useState } from 'react';
import { Car } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE;

interface CompositionRow {
  vehicle_id: string;
  vehicle_type: string;
  description: string | null;
  count: number;
}
interface Verification {
  approved: number;
  declined: number;
  pending: number;
  not_started: number;
  unknown: number;
  total: number;
}
interface CompositionResponse {
  data: CompositionRow[];
  totals: {
    verified_drivers: number;
    drivers_with_vehicle: number;
    checked: number;
    unknown: number;
  };
  verification?: Verification;
}

const VERIF_SEGMENTS = [
  { key: 'approved', label: 'Approved', color: '#22c55e' },
  { key: 'pending', label: 'In review', color: '#f59e0b' },
  { key: 'declined', label: 'Declined', color: '#ef4444' },
  { key: 'not_started', label: 'Not started', color: '#c4c9d4' },
  { key: 'unknown', label: 'Unknown', color: '#8a94a6' },
] as const;

const BAR_COLORS = ['#1e90d9', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#1b6bba', '#0ea5e9', '#14b8a6'];

export default function FleetComposition({ token }: { token: string }) {
  const [data, setData] = useState<CompositionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/admin/driver-vehicle-composition`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!cancelled) setError('Could not load fleet composition');
          return;
        }
        const body: CompositionResponse = await res.json();
        if (!cancelled) setData(body);
      } catch {
        if (!cancelled) setError('Could not load fleet composition');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const rows = data?.data ?? [];
  const verified = data?.totals.verified_drivers ?? 0;
  const maxCount = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Car size={16} /> Verified courier fleet composition
        </div>
        <span className="panel-count" style={{ marginLeft: 'auto' }}>
          {loading ? '' : `${verified.toLocaleString()} verified driver${verified === 1 ? '' : 's'}`}
        </span>
      </div>

      <div style={{ padding: '18px 20px' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-mute)', fontSize: 13, padding: '8px 0' }}>
            <span className="spinner" /> Checking driver verifications…
          </div>
        )}

        {!loading && error && (
          <div style={{ color: 'var(--red)', fontSize: 13 }}>{error}</div>
        )}

        {/* Verification status breakdown across drivers who registered a vehicle */}
        {!loading && !error && data?.verification && data.verification.total > 0 && (
          <div style={{ marginBottom: rows.length > 0 ? 22 : 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 9 }}>
              Verification status · {data.verification.total} with a vehicle
            </div>
            <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', background: 'var(--border, #eee)' }}>
              {VERIF_SEGMENTS.map((s) => {
                const v = (data.verification as unknown as Record<string, number>)[s.key] || 0;
                const w = data.verification!.total > 0 ? (v / data.verification!.total) * 100 : 0;
                return w > 0 ? <div key={s.key} title={`${s.label}: ${v}`} style={{ width: `${w}%`, background: s.color }} /> : null;
              })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 11 }}>
              {VERIF_SEGMENTS.map((s) => {
                const v = (data.verification as unknown as Record<string, number>)[s.key] || 0;
                if (!v) return null;
                return (
                  <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
                    <span style={{ color: 'var(--ink-mute)' }}>{s.label}</span>
                    <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div style={{ color: 'var(--ink-mute)', fontSize: 13 }}>No approved drivers with a registered vehicle yet.</div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
            Approved drivers by vehicle type
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div style={{ display: 'grid', gap: 14 }}>
            {rows.map((r, i) => {
              const pct = verified > 0 ? Math.round((r.count / verified) * 100) : 0;
              const width = Math.max(4, (r.count / maxCount) * 100);
              const color = BAR_COLORS[i % BAR_COLORS.length];
              return (
                <div
                  key={r.vehicle_id}
                  style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: 14, alignItems: 'center' }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.vehicle_type}
                    </div>
                    {r.description && (
                      <div style={{ fontSize: 11, color: 'var(--ink-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.description}
                      </div>
                    )}
                  </div>
                  <div style={{ height: 22, background: 'var(--border, #eee)', borderRadius: 6, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${width}%`,
                        background: color,
                        borderRadius: 6,
                        transition: 'width .4s ease',
                        minWidth: 4,
                      }}
                      title={`${r.count} verified driver${r.count === 1 ? '' : 's'}`}
                    />
                  </div>
                  <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 14, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                    {r.count}
                    <span style={{ color: 'var(--ink-mute)', fontWeight: 400, fontSize: 12, marginLeft: 6 }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div style={{ marginTop: 16, fontSize: 11.5, color: 'var(--ink-mute)', lineHeight: 1.5 }}>
            Verified = identity-approved drivers who have registered a vehicle. Drivers registered
            for more than one vehicle type are counted in each, so percentages can exceed 100%.
            {data && data.totals.unknown > 0 &&
              ` ${data.totals.unknown} verification${data.totals.unknown === 1 ? '' : 's'} could not be checked and are excluded.`}
          </div>
        )}
      </div>
    </div>
  );
}
