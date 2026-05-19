'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

const API = process.env.NEXT_PUBLIC_API_BASE;
const LIMIT = 25;

interface Verification {
  user_id: string;
  first_name: string;
  last_name: string;
  contact_number: string;
  didit_session_id: string | null;
  didit_status: string;
  created_at: string;
}

interface VerificationsTabProps {
  onOpenVerifyDrawer: (userId: string, name: string) => void;
  onVerifyBadge: (count: number) => void;
  token: string;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function diditBadge(status: string) {
  const s = (status || 'Unknown').toLowerCase();
  const map: Record<string, string> = {
    approved: 'badge-completed',
    declined: 'badge-cancelled',
    pending: 'badge-pending',
    processing: 'badge-active',
  };
  return <span className={`badge ${map[s] || 'badge-pending'}`}>{status}</span>;
}

export default function VerificationsTab({ onOpenVerifyDrawer, onVerifyBadge, token }: VerificationsTabProps) {
  const [rows, setRows] = useState<Verification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [empty, setEmpty] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const reset = useCallback(() => {
    setRows([]);
    setPage(1);
    pageRef.current = 1;
    setHasMore(true);
    hasMoreRef.current = true;
    setLoading(false);
    loadingRef.current = false;
    setTotal(null);
    setEmpty(false);
  }, []);

  const fetchVerifications = useCallback(
    async (currentPage: number, currentSearch: string, currentFilter: string) => {
      if (loadingRef.current || !hasMoreRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      try {
        const params = new URLSearchParams({ page: String(currentPage), limit: String(LIMIT) });
        const res = await fetch(`${API}/admin/verifications?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setEmpty(true); hasMoreRef.current = false; setHasMore(false); return; }

        const body = await res.json();
        const newRows: Verification[] = body.data ?? [];
        const totalCount: number = body.meta?.total ?? 0;

        if (currentPage === 1 && totalCount > 0) onVerifyBadge(totalCount);

        let filtered = newRows;
        if (currentSearch) {
          const q = currentSearch.toLowerCase();
          filtered = filtered.filter(c =>
            (c.first_name || '').toLowerCase().includes(q) ||
            (c.last_name || '').toLowerCase().includes(q) ||
            (c.contact_number || '').toLowerCase().includes(q)
          );
        }
        if (currentFilter) {
          filtered = filtered.filter(c =>
            (c.didit_status || '').toLowerCase() === currentFilter.toLowerCase()
          );
        }

        if (!filtered.length && currentPage === 1) {
          setEmpty(true);
          hasMoreRef.current = false;
          setHasMore(false);
          return;
        }

        setRows(prev => (currentPage === 1 ? filtered : [...prev, ...filtered]));
        setTotal(totalCount);

        pageRef.current = currentPage + 1;
        setPage(currentPage + 1);

        if (newRows.length < LIMIT) { hasMoreRef.current = false; setHasMore(false); }
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [token, onVerifyBadge]
  );

  useEffect(() => {
    reset();
    fetchVerifications(1, debouncedSearch, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filter]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          fetchVerifications(pageRef.current, debouncedSearch, filter);
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filter]);

  const countLabel = total != null ? `${rows.length} / ${total.toLocaleString()}` : `${rows.length} loaded`;

  return (
    <div className="tab-panel active">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Identity Verifications</div>
          <div className="panel-count">{countLabel}</div>
          <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Declined">Declined</option>
          </select>
          <div className="search-wrap">
            <span className="search-icon"><Search /></span>
            <input
              className="search-input"
              type="text"
              placeholder="Name, phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}><X /></button>
            )}
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Courier</th>
              <th>Contact</th>
              <th>Session ID</th>
              <th>Didit Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {empty && (
              <tr className="state-row"><td colSpan={6}>No verifications found</td></tr>
            )}
            {rows.map(c => (
              <tr key={c.user_id}>
                <td>
                  <div className="user-cell">
                    <div
                      className="user-avatar"
                      style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)', color: '#92400e' }}
                    >
                      {(c.first_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                      <div className="user-name">{c.first_name || ''} {c.last_name || ''}</div>
                      <div className="user-sub">{c.contact_number || '—'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '12px' }}>{c.contact_number || '—'}</td>
                <td
                  style={{ fontSize: '11px', color: 'var(--ink-mute)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={c.didit_session_id || ''}
                >
                  {c.didit_session_id ? c.didit_session_id.slice(0, 18) + '…' : '—'}
                </td>
                <td>{diditBadge(c.didit_status || 'Unknown')}</td>
                <td style={{ color: 'var(--ink-mute)', fontSize: '12px' }}>{fmtDate(c.created_at)}</td>
                <td>
                  <button
                    className="action-btn primary"
                    onClick={() => onOpenVerifyDrawer(c.user_id, `${c.first_name} ${c.last_name}`)}
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="sentinel" ref={sentinelRef}>
          <div className={`load-spinner${loading ? ' active' : ''}`}>
            <span className="spinner"></span> Loading more…
          </div>
          <div className={`end-msg${!hasMore && rows.length > 0 ? ' active' : ''}`}>
            All verifications loaded
          </div>
        </div>
      </div>
    </div>
  );
}
