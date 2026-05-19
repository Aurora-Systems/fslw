'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

const API = process.env.NEXT_PUBLIC_API_BASE;
const LIMIT = 25;

interface Courier {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  country: string;
  didit_session_id: string | null;
  created_at: string;
  vehicles?: { vehicle_id: string }[];
}

interface CouriersTabProps {
  onOpenVerifyDrawer: (userId: string, name: string) => void;
  token: string;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CouriersTab({ onOpenVerifyDrawer, token }: CouriersTabProps) {
  const [rows, setRows] = useState<Courier[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [search, setSearch] = useState('');
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

  const fetchCouriers = useCallback(
    async (currentPage: number, currentSearch: string) => {
      if (loadingRef.current || !hasMoreRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      try {
        const params = new URLSearchParams({ page: String(currentPage), limit: String(LIMIT) });
        const res = await fetch(`${API}/admin/couriers?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setEmpty(true); hasMoreRef.current = false; setHasMore(false); return; }

        const body = await res.json();
        const newRows: Courier[] = body.data ?? [];
        const totalCount: number = body.meta?.total ?? 0;

        const filtered = currentSearch
          ? newRows.filter(c => {
              const q = currentSearch.toLowerCase();
              return (
                (c.first_name || '').toLowerCase().includes(q) ||
                (c.last_name || '').toLowerCase().includes(q) ||
                (c.email || '').toLowerCase().includes(q) ||
                (c.contact_number || '').toLowerCase().includes(q)
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
        setTotal(totalCount);

        pageRef.current = currentPage + 1;
        setPage(currentPage + 1);

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
    fetchCouriers(1, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          fetchCouriers(pageRef.current, debouncedSearch);
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const countLabel = total != null ? `${rows.length} / ${total.toLocaleString()}` : `${rows.length} loaded`;

  return (
    <div className="tab-panel active">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Couriers</div>
          <div className="panel-count">{countLabel}</div>
          <div className="search-wrap" style={{ marginLeft: 'auto' }}>
            <span className="search-icon"><Search /></span>
            <input
              className="search-input"
              type="text"
              placeholder="Name, email, phone…"
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
              <th>Country</th>
              <th>ID Verification</th>
              <th>Vehicles</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {empty && (
              <tr className="state-row"><td colSpan={7}>No couriers found</td></tr>
            )}
            {rows.map(c => (
              <tr key={c.user_id}>
                <td>
                  <div className="user-cell">
                    <div
                      className="user-avatar"
                      style={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', color: '#065f46' }}
                    >
                      {(c.first_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                      <div className="user-name">{c.first_name || ''} {c.last_name || ''}</div>
                      <div className="user-sub">{c.email || '—'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '12px' }}>{c.contact_number || '—'}</td>
                <td style={{ fontSize: '12px' }}>{c.country || '—'}</td>
                <td>
                  {c.didit_session_id ? (
                    <span className="badge badge-review-needed">Has session</span>
                  ) : (
                    <span className="badge" style={{ background: '#f4f4f4', color: 'var(--ink-mute)' }}>None</span>
                  )}
                </td>
                <td style={{ fontSize: '12px', fontWeight: 500 }}>{c.vehicles?.length ?? 0}</td>
                <td style={{ color: 'var(--ink-mute)', fontSize: '12px' }}>{fmtDate(c.created_at)}</td>
                <td>
                  {c.didit_session_id && (
                    <button
                      className="action-btn"
                      onClick={() => onOpenVerifyDrawer(c.user_id, `${c.first_name} ${c.last_name}`)}
                    >
                      Review ID
                    </button>
                  )}
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
            All couriers loaded
          </div>
        </div>
      </div>
    </div>
  );
}
