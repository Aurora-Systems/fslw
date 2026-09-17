'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { STAGE_META } from '../JobDrawer';

const API = process.env.NEXT_PUBLIC_API_BASE;
const LIMIT = 25;

type Stage = keyof typeof STAGE_META;

interface PersonLite { user_id: string; first_name: string | null; last_name: string | null; contact_number: string | null }

interface Job {
  id: number;
  status: string | null;
  stage?: Stage;
  delivery_fee: number;
  created_at: string;
  vehicle_type?: string | null;
  pickup_location: { formatted_address?: string } | null;
  dropoff_location: { formatted_address?: string } | null;
  users: PersonLite | null;
  carrier?: PersonLite | null;
}

interface Meta {
  total: number;
  page: number;
  pages: number;
  stage_counts?: Record<Stage, number>;
  search_truncated?: boolean;
}

interface JobsTabProps {
  token: string;
  onOpenJob: (jobId: number) => void;
}

export function stageBadge(job: { stage?: Stage; status?: string | null }) {
  const meta = job.stage ? STAGE_META[job.stage] : null;
  if (meta) return <span className={`badge ${meta.badge}`}>{meta.label}</span>;
  return <span className="badge badge-pending">{job.status || 'pending'}</span>;
}

export function personName(u: PersonLite | null | undefined): string {
  if (!u) return '';
  return `${u.first_name || ''} ${u.last_name || ''}`.trim();
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ellipsis = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const;

export default function JobsTab({ token, onOpenJob }: JobsTabProps) {
  const [rows, setRows] = useState<Job[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [stageCounts, setStageCounts] = useState<Record<Stage, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Stage | ''>('');
  const debouncedSearch = useDebounce(search, 350);

  // Refs keep infinite scroll on the current query and the current (refreshed) token.
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const queryRef = useRef<{ search: string; filter: Stage | '' }>({ search: '', filter: '' });
  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const loadingRef = useRef(false);
  const reqIdRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (page: number) => {
    if (page > 1 && (loadingRef.current || !hasMoreRef.current)) return;
    const reqId = page === 1 ? ++reqIdRef.current : reqIdRef.current;
    loadingRef.current = true;
    setLoading(true);
    if (page === 1) setError(null);

    try {
      const { search: q, filter: stage } = queryRef.current;
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (stage) params.set('stage', stage);
      if (q.trim()) params.set('search', q.trim());

      const res = await fetch(`${API}/admin/jobs?${params}`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      if (reqId !== reqIdRef.current) return;
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          res.status === 401
            ? 'Your admin session expired — reload the page to sign in again.'
            : body?.error || 'Could not load jobs'
        );
        hasMoreRef.current = false;
        setHasMore(false);
        return;
      }

      const newRows: Job[] = body.data ?? [];
      const m: Meta = body.meta;
      setRows(prev => {
        if (page === 1) return newRows;
        // New jobs posted while scrolling shift the pages; skip ones already shown.
        const seen = new Set(prev.map(j => j.id));
        return [...prev, ...newRows.filter(j => !seen.has(j.id))];
      });
      setMeta(m);
      if (m?.stage_counts) setStageCounts(m.stage_counts);
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

  useEffect(() => {
    queryRef.current = { search: debouncedSearch, filter };
    pageRef.current = 1;
    hasMoreRef.current = true;
    setRows([]);
    load(1);
  }, [debouncedSearch, filter, load]);

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

  const countLabel = meta ? `${rows.length} / ${meta.total.toLocaleString()}` : rows.length ? `${rows.length} loaded` : '';
  const allCount = stageCounts ? Object.values(stageCounts).reduce((a, b) => a + b, 0) : null;

  return (
    <div className="tab-panel active">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Jobs</div>
          <div className="panel-count">{countLabel}</div>
          <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value as Stage | '')}>
            <option value="">All jobs{allCount != null ? ` (${allCount.toLocaleString()})` : ''}</option>
            {(Object.keys(STAGE_META) as Stage[]).map(s => (
              <option key={s} value={s}>
                {s === 'open' ? 'Open — waiting for a carrier' : STAGE_META[s].label}
                {stageCounts ? ` (${stageCounts[s].toLocaleString()})` : ''}
              </option>
            ))}
          </select>
          <div className="search-wrap">
            <span className="search-icon"><Search /></span>
            <input
              className="search-input"
              type="text"
              placeholder="Job #, name, phone, address…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search"><X /></button>
            )}
          </div>
        </div>
        {meta?.search_truncated && (
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', fontSize: 12.5, color: '#92400e', background: '#fffbeb' }}>
            Lots of people match that search, so only jobs for the first 100 are shown. Type more of the name or number to narrow it down.
          </div>
        )}
        <table className="data-table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Client</th>
              <th>Carrier</th>
              <th>Route</th>
              <th>Status</th>
              <th>Fee</th>
              <th>Posted</th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr className="state-row">
                <td colSpan={7} style={{ color: 'var(--red)' }}>
                  {error}{' '}
                  <button className="action-btn" style={{ marginLeft: 8 }} onClick={() => load(1)}>Try again</button>
                </td>
              </tr>
            )}
            {!error && !loading && rows.length === 0 && (
              <tr className="state-row"><td colSpan={7}>No jobs match</td></tr>
            )}
            {rows.map(j => {
              const carrier = personName(j.carrier);
              return (
                <tr
                  key={j.id}
                  className="clickable"
                  tabIndex={0}
                  onClick={() => onOpenJob(j.id)}
                  onKeyDown={e => { if (e.key === 'Enter') onOpenJob(j.id); }}
                  title="View full job details"
                >
                  <td>
                    <code style={{ fontSize: '11px', color: 'var(--ink-mute)' }}>#{j.id}</code>
                    {j.vehicle_type && <div style={{ fontSize: 11, color: 'var(--ink-mute)', ...ellipsis, maxWidth: 110 }}>{j.vehicle_type}</div>}
                  </td>
                  <td>
                    <div className="user-name" style={{ ...ellipsis, maxWidth: 150 }}>{personName(j.users) || '—'}</div>
                    {j.users?.contact_number && <div className="user-sub">{j.users.contact_number}</div>}
                  </td>
                  <td>
                    {carrier ? (
                      <>
                        <div className="user-name" style={{ ...ellipsis, maxWidth: 150 }}>{carrier}</div>
                        {j.carrier?.contact_number && <div className="user-sub">{j.carrier.contact_number}</div>}
                      </>
                    ) : (
                      <span style={{ color: 'var(--ink-mute)', fontSize: 12 }}>Not taken</span>
                    )}
                  </td>
                  <td style={{ fontSize: '12px', maxWidth: '240px' }}>
                    <div style={ellipsis} title={j.pickup_location?.formatted_address}>{j.pickup_location?.formatted_address || '—'}</div>
                    <div style={{ ...ellipsis, color: 'var(--ink-mute)' }} title={j.dropoff_location?.formatted_address}>
                      → {j.dropoff_location?.formatted_address || '—'}
                    </div>
                  </td>
                  <td>{stageBadge(j)}</td>
                  <td style={{ fontWeight: 600 }}>${(j.delivery_fee || 0).toFixed(2)}</td>
                  <td style={{ color: 'var(--ink-mute)', fontSize: '12px', whiteSpace: 'nowrap' }}>{fmtDate(j.created_at)}</td>
                </tr>
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
