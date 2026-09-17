'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, RefreshCw } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

const API = process.env.NEXT_PUBLIC_API_BASE;
const LIMIT = 25;

// Didit's own session statuses.
const STATUS_OPTIONS = ['In Review', 'Approved', 'Declined', 'In Progress', 'Not Started', 'Expired', 'Abandoned'];

interface SessionRow {
  session_id: string;
  session_number: number | null;
  status: string;
  is_latest: boolean;
  created_at: string | null;
  full_name: string | null;
  document_type: string | null;
  country: string | null;
  user: { user_id: string; first_name: string; last_name: string; contact_number: string } | null;
  user_id: string | null;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  in_review: number;
  status_counts: Record<string, number>;
  synced_at: string;
  refreshing: boolean;
}

interface VerificationsTabProps {
  onOpenVerifyDrawer: (userId: string, name: string, sessionId?: string) => void;
  onVerifyBadge: (count: number) => void;
  token: string;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs} h ago` : fmtDate(iso);
}

function diditBadge(status: string) {
  const map: Record<string, string> = {
    approved: 'badge-completed',
    declined: 'badge-cancelled',
    'in review': 'badge-pending',
    'in progress': 'badge-active',
    'not started': 'badge-pending',
    expired: 'badge-cancelled',
    abandoned: 'badge-cancelled',
  };
  return <span className={`badge ${map[(status || '').toLowerCase()] || 'badge-pending'}`}>{status || 'Unknown'}</span>;
}

function displayName(r: SessionRow): string {
  const app = r.user ? `${r.user.first_name || ''} ${r.user.last_name || ''}`.trim() : '';
  return app || r.full_name || 'Unknown courier';
}

export default function VerificationsTab({ onOpenVerifyDrawer, onVerifyBadge, token }: VerificationsTabProps) {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  // Refs let infinite scroll always use current values — including an auth
  // token that was refreshed while the tab stayed open.
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const queryRef = useRef({ search: '', filter: '' });
  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const loadingRef = useRef(false);
  const reqIdRef = useRef(0); // drop responses that belong to an older query
  const sentinelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (page: number, sync = false) => {
      if (page > 1 && (loadingRef.current || !hasMoreRef.current)) return;
      const reqId = page === 1 ? ++reqIdRef.current : reqIdRef.current;
      loadingRef.current = true;
      setLoading(true);
      if (sync) setSyncing(true);
      if (page === 1) setError(null);

      try {
        const { search: q, filter: status } = queryRef.current;
        const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
        if (status) params.set('status', status);
        if (q.trim()) params.set('search', q.trim());
        if (sync) params.set('sync', '1');

        const res = await fetch(`${API}/admin/verifications?${params}`, {
          headers: { Authorization: `Bearer ${tokenRef.current}` },
        });
        if (reqId !== reqIdRef.current) return;
        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(
            res.status === 401
              ? 'Your admin session expired — reload the page to sign in again.'
              : body?.error || 'Could not load verifications'
          );
          hasMoreRef.current = false;
          setHasMore(false);
          return;
        }

        const newRows: SessionRow[] = body.data ?? [];
        const m: Meta = body.meta;
        setRows(prev => {
          if (page === 1) return newRows;
          // The snapshot can refresh between pages; skip anything already shown.
          const seen = new Set(prev.map(r => r.session_id));
          return [...prev, ...newRows.filter(r => !seen.has(r.session_id))];
        });
        setMeta(m);
        onVerifyBadge(m?.in_review ?? 0);
        pageRef.current = page + 1;
        hasMoreRef.current = page < (m?.pages ?? 0);
        setHasMore(hasMoreRef.current);
      } catch {
        if (reqId === reqIdRef.current) setError('Network error — check your connection and try again.');
      } finally {
        if (reqId === reqIdRef.current) {
          loadingRef.current = false;
          setLoading(false);
          setSyncing(false);
        }
      }
    },
    [onVerifyBadge]
  );

  // New query → start again from page 1.
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
  const inReview = meta?.in_review ?? 0;

  return (
    <div className="tab-panel active">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Identity Verifications</div>
          <div className="panel-count">{countLabel}</div>
          <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All statuses{meta ? ` (${Object.values(meta.status_counts).reduce((a, b) => a + b, 0).toLocaleString()})` : ''}</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s === 'In Review' ? 'In Review — needs decision' : s}
                {meta?.status_counts[s] != null ? ` (${meta.status_counts[s].toLocaleString()})` : ''}
              </option>
            ))}
          </select>
          <div className="search-wrap">
            <span className="search-icon"><Search /></span>
            <input
              className="search-input"
              type="text"
              placeholder="Name, phone, email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}><X /></button>
            )}
          </div>
          <button
            className="action-btn"
            onClick={() => load(1, true)}
            disabled={syncing}
            title="Fetch the latest sessions from Didit now"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} style={syncing ? { animation: 'spin .8s linear infinite' } : undefined} />
            {syncing ? 'Syncing…' : 'Sync with Didit'}
          </button>
        </div>

        {meta && (
          <div
            style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12,
              padding: '10px 20px', borderBottom: '1px solid var(--border, #eee)', fontSize: 12.5, color: 'var(--ink-mute)',
            }}
          >
            <span>
              Live from Didit · synced {timeAgo(meta.synced_at)}
              {meta.refreshing ? ' · updating in the background' : ''}
            </span>
            {filter !== 'In Review' && inReview > 0 && (
              <button
                onClick={() => setFilter('In Review')}
                style={{
                  marginLeft: 'auto', border: '1px solid #fcd34d', background: '#fffbeb', color: '#92400e',
                  borderRadius: 999, padding: '4px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {inReview.toLocaleString()} awaiting review →
              </button>
            )}
          </div>
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th>Courier</th>
              <th>Didit status</th>
              <th>Document</th>
              <th>Started</th>
              <th>Session</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr className="state-row">
                <td colSpan={6} style={{ color: 'var(--red)' }}>
                  {error}{' '}
                  <button className="action-btn" style={{ marginLeft: 8 }} onClick={() => load(1)}>Try again</button>
                </td>
              </tr>
            )}
            {!error && !loading && rows.length === 0 && (
              <tr className="state-row"><td colSpan={6}>No verifications match</td></tr>
            )}
            {rows.map(r => {
              const name = displayName(r);
              const sub = [r.user?.contact_number, r.full_name && r.user ? `ID: ${r.full_name}` : null, !r.user ? 'No FastLinQ account linked' : null]
                .filter(Boolean)
                .join(' · ');
              return (
                <tr key={r.session_id}>
                  <td>
                    <div className="user-cell">
                      <div
                        className="user-avatar"
                        style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)', color: '#92400e' }}
                      >
                        {(name[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <div className="user-name">{name}</div>
                        <div className="user-sub">{sub || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {diditBadge(r.status)}
                      {!r.is_latest && (
                        <span
                          title="The app checks a different verification attempt for this courier"
                          style={{ fontSize: 10.5, color: 'var(--ink-mute)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 999, padding: '1px 7px' }}
                        >
                          Not current attempt
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{[r.document_type, r.country].filter(Boolean).join(' · ') || '—'}</td>
                  <td style={{ color: 'var(--ink-mute)', fontSize: 12 }}>{fmtDate(r.created_at)}</td>
                  <td style={{ color: 'var(--ink-mute)', fontSize: 12 }}>{r.session_number != null ? `#${r.session_number}` : '—'}</td>
                  <td>
                    <button
                      className="action-btn primary"
                      onClick={() => onOpenVerifyDrawer(r.user?.user_id ?? r.user_id ?? '', name, r.session_id)}
                    >
                      {r.status === 'In Review' ? 'Approve / Decline' : 'Review'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="sentinel" ref={sentinelRef}>
          <div className={`load-spinner${loading ? ' active' : ''}`}>
            <span className="spinner"></span> {syncing ? 'Syncing with Didit…' : 'Loading…'}
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
