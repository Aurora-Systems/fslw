'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

const API = process.env.NEXT_PUBLIC_API_BASE;
const LIMIT = 25;

interface Job {
  id: string;
  status: string;
  delivery_fee: number;
  delivery_code: string | null;
  created_at: string;
  pickup_location: { formatted_address?: string } | null;
  dropoff_location: { formatted_address?: string } | null;
  users: { first_name: string; last_name: string } | null;
}

interface JobsTabProps {
  token: string;
}

function statusBadge(status: string | null | undefined) {
  const s = (status || 'pending').toLowerCase();
  const map: Record<string, string> = {
    pending: 'badge-pending',
    active: 'badge-active',
    in_progress: 'badge-active',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    canceled: 'badge-cancelled',
  };
  return <span className={`badge ${map[s] || 'badge-pending'}`}>{s}</span>;
}

function userName(u: { first_name?: string; last_name?: string } | null): string {
  if (!u) return '—';
  return `${u.first_name || ''} ${u.last_name || ''}`.trim() || '—';
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function JobsTab({ token }: JobsTabProps) {
  const [rows, setRows] = useState<Job[]>([]);
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

  const fetchJobs = useCallback(
    async (currentPage: number, currentSearch: string, currentFilter: string) => {
      if (loadingRef.current || !hasMoreRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      try {
        const params = new URLSearchParams({ page: String(currentPage), limit: String(LIMIT) });
        if (currentFilter) params.set('status', currentFilter);
        const res = await fetch(`${API}/admin/jobs?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setEmpty(true); hasMoreRef.current = false; setHasMore(false); return; }

        const body = await res.json();
        const newRows: Job[] = body.data ?? [];
        const total: number = body.meta?.total ?? 0;

        // Client-side search filter (server doesn't support text search on this endpoint)
        const filtered = currentSearch
          ? newRows.filter(j => {
              const q = currentSearch.toLowerCase();
              return (
                (j.delivery_code || '').toLowerCase().includes(q) ||
                (j.pickup_location?.formatted_address || '').toLowerCase().includes(q) ||
                (j.dropoff_location?.formatted_address || '').toLowerCase().includes(q) ||
                userName(j.users).toLowerCase().includes(q)
              );
            })
          : newRows;

        if (!filtered.length && currentPage === 1) {
          setEmpty(true);
          hasMoreRef.current = false;
          setHasMore(false);
          return;
        }

        setRows(prev => (currentPage === 1 ? filtered : [...prev, ...filtered]));
        setTotal(total);

        const nextPage = currentPage + 1;
        pageRef.current = nextPage;
        setPage(nextPage);

        if (newRows.length < LIMIT) { hasMoreRef.current = false; setHasMore(false); }
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    reset();
    fetchJobs(1, debouncedSearch, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filter]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          fetchJobs(pageRef.current, debouncedSearch, filter);
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
          <div className="panel-title">Jobs</div>
          <div className="panel-count">{countLabel}</div>
          <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="search-wrap">
            <span className="search-icon"><Search /></span>
            <input
              className="search-input"
              type="text"
              placeholder="Delivery code, address…"
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
              <th>ID</th>
              <th>Client</th>
              <th>Pickup</th>
              <th>Dropoff</th>
              <th>Status</th>
              <th>Fee</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {empty && (
              <tr className="state-row"><td colSpan={7}>No jobs found</td></tr>
            )}
            {rows.map(j => (
              <tr key={j.id}>
                <td><code style={{ fontSize: '11px', color: 'var(--ink-mute)' }}>#{j.id}</code></td>
                <td>{userName(j.users)}</td>
                <td style={{ fontSize: '12px', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {j.pickup_location?.formatted_address || '—'}
                </td>
                <td style={{ fontSize: '12px', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {j.dropoff_location?.formatted_address || '—'}
                </td>
                <td>{statusBadge(j.status)}</td>
                <td style={{ fontWeight: 600 }}>${(j.delivery_fee || 0).toFixed(2)}</td>
                <td style={{ color: 'var(--ink-mute)', fontSize: '12px' }}>{fmtDate(j.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="sentinel" ref={sentinelRef}>
          <div className={`load-spinner${loading ? ' active' : ''}`}>
            <span className="spinner"></span> Loading more…
          </div>
          <div className={`end-msg${!hasMore && rows.length > 0 ? ' active' : ''}`}>
            All jobs loaded
          </div>
        </div>
      </div>
    </div>
  );
}
