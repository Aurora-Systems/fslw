'use client';

import { useEffect, useState } from 'react';
import { Activity, PackageX } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE;

interface Insights {
  totals: { total: number; open: number; open_stale: number; active: number; completed: number; cancelled: number; taken: number };
  rates: { take_rate: number; completion_rate: number; cancellation_rate: number };
  stale_after_hours: number;
}

const FUNNEL = [
  { key: 'open', label: 'Open (not taken)', color: '#f59e0b' },
  { key: 'active', label: 'Active', color: '#1e90d9' },
  { key: 'completed', label: 'Completed', color: '#22c55e' },
  { key: 'cancelled', label: 'Cancelled', color: '#ef4444' },
] as const;

function Rate({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div style={{ flex: '1 1 120px', minWidth: 110, border: '1px solid var(--border, #eee)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: tone, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}%</div>
      <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 6 }}>{label}</div>
    </div>
  );
}

export default function JobInsights({ token }: { token: string }) {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/admin/job-insights`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { if (!cancelled) setError('Could not load job insights'); return; }
        const body: Insights = await res.json();
        if (!cancelled) setData(body);
      } catch {
        if (!cancelled) setError('Could not load job insights');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const t = data?.totals;
  const funnelTotal = t ? t.open + t.active + t.completed + t.cancelled : 0;

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} /> Job operations
        </div>
        {t && <span className="panel-count" style={{ marginLeft: 'auto' }}>{t.total.toLocaleString()} jobs total</span>}
      </div>

      <div style={{ padding: '18px 20px' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-mute)', fontSize: 13 }}>
            <span className="spinner" /> Loading…
          </div>
        )}
        {!loading && error && <div style={{ color: 'var(--red)', fontSize: 13 }}>{error}</div>}

        {!loading && !error && data && t && (
          <>
            {/* Rates */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Rate label="Take rate (got a carrier)" value={data.rates.take_rate} tone="var(--green)" />
              <Rate label="Completion rate" value={data.rates.completion_rate} tone="var(--blue)" />
              <Rate label="Cancellation rate" value={data.rates.cancellation_rate} tone="var(--red)" />
            </div>

            {/* Not being taken — the headline concern */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '12px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12 }}>
              <PackageX size={20} style={{ color: '#c2680c', flex: 'none' }} />
              <div style={{ fontSize: 13, color: 'var(--ink)' }}>
                <strong style={{ fontSize: 15 }}>{t.open.toLocaleString()}</strong> job{t.open === 1 ? '' : 's'} waiting for a carrier
                {t.open_stale > 0 && (
                  <> — <strong style={{ color: '#c2680c' }}>{t.open_stale.toLocaleString()}</strong> open for over {data.stale_after_hours}h</>
                )}
              </div>
            </div>

            {/* Funnel */}
            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: 'var(--border, #eee)' }}>
                {FUNNEL.map((f) => {
                  const v = t[f.key];
                  const w = funnelTotal > 0 ? (v / funnelTotal) * 100 : 0;
                  return w > 0 ? <div key={f.key} title={`${f.label}: ${v}`} style={{ width: `${w}%`, background: f.color }} /> : null;
                })}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
                {FUNNEL.map((f) => (
                  <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: f.color }} />
                    <span style={{ color: 'var(--ink-mute)' }}>{f.label}</span>
                    <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{t[f.key].toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
