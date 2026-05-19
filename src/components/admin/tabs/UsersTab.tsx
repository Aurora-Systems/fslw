'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

const API = process.env.NEXT_PUBLIC_API_BASE;
const LIMIT = 25;

interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  acc_type: string;
  contact_number: string;
  country: string;
  balance: number;
  created_at: string;
}

interface UsersTabProps {
  token: string;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function UsersTab({ token }: UsersTabProps) {
  const [rows, setRows] = useState<User[]>([]);
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

  const fetchUsers = useCallback(
    async (currentPage: number, currentSearch: string) => {
      if (loadingRef.current || !hasMoreRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      try {
        const params = new URLSearchParams({ page: String(currentPage), limit: String(LIMIT) });
        const res = await fetch(`${API}/admin/users?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setEmpty(true); hasMoreRef.current = false; setHasMore(false); return; }

        const body = await res.json();
        const newRows: User[] = body.data ?? [];
        const totalCount: number = body.meta?.total ?? 0;

        const filtered = currentSearch
          ? newRows.filter(u => {
              const q = currentSearch.toLowerCase();
              return (
                (u.first_name || '').toLowerCase().includes(q) ||
                (u.last_name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.contact_number || '').toLowerCase().includes(q)
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
    fetchUsers(1, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          fetchUsers(pageRef.current, debouncedSearch);
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
          <div className="panel-title">Users</div>
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
              <th>User</th>
              <th>Type</th>
              <th>Contact</th>
              <th>Country</th>
              <th>Balance</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {empty && (
              <tr className="state-row"><td colSpan={6}>No users found</td></tr>
            )}
            {rows.map(u => (
              <tr key={u.user_id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">
                      {(u.first_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                      <div className="user-name">{u.first_name || ''} {u.last_name || ''}</div>
                      <div className="user-sub">{u.email || u.contact_number || '—'}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge badge-${u.acc_type === 'driver' ? 'driver' : 'customer'}`}>
                    {u.acc_type || 'customer'}
                  </span>
                </td>
                <td style={{ fontSize: '12px' }}>{u.contact_number || '—'}</td>
                <td style={{ fontSize: '12px' }}>{u.country || '—'}</td>
                <td style={{ fontWeight: 600 }}>${(u.balance || 0).toFixed(2)}</td>
                <td style={{ color: 'var(--ink-mute)', fontSize: '12px' }}>{fmtDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="sentinel" ref={sentinelRef}>
          <div className={`load-spinner${loading ? ' active' : ''}`}>
            <span className="spinner"></span> Loading more…
          </div>
          <div className={`end-msg${!hasMore && rows.length > 0 ? ' active' : ''}`}>
            All users loaded
          </div>
        </div>
      </div>
    </div>
  );
}
