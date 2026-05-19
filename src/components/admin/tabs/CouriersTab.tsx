'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useDebounce } from '../hooks/useDebounce';

const BATCH = 25;

interface Courier {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  country: string;
  didit_session_id: string | null;
  created_at: string;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface CouriersTabProps {
  onOpenVerifyDrawer: (userId: string, name: string) => void;
}

export default function CouriersTab({ onOpenVerifyDrawer }: CouriersTabProps) {
  const [rows, setRows] = useState<Courier[]>([]);
  const [fleetMap, setFleetMap] = useState<Record<string, number>>({});
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [empty, setEmpty] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const sb = createClient();

  const reset = useCallback(() => {
    setRows([]);
    setOffset(0);
    offsetRef.current = 0;
    setHasMore(true);
    hasMoreRef.current = true;
    setLoading(false);
    loadingRef.current = false;
    setTotal(null);
    setEmpty(false);
  }, []);

  const fetchCouriers = useCallback(
    async (currentOffset: number, currentSearch: string) => {
      if (loadingRef.current || !hasMoreRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      let q = sb
        .from('users')
        .select('user_id,first_name,last_name,email,contact_number,country,didit_session_id,created_at', {
          count: 'exact',
        })
        .eq('acc_type', 'driver')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + BATCH - 1);

      if (currentSearch) {
        q = q.or(
          `first_name.ilike.%${currentSearch}%,last_name.ilike.%${currentSearch}%,email.ilike.%${currentSearch}%,contact_number.ilike.%${currentSearch}%`
        );
      }

      const { data, count, error } = await q;
      loadingRef.current = false;
      setLoading(false);

      if (error || (!data?.length && currentOffset === 0)) {
        setEmpty(true);
        hasMoreRef.current = false;
        setHasMore(false);
        return;
      }

      const newRows = (data || []) as unknown as Courier[];
      const ids = newRows.map(c => c.user_id);
      if (ids.length) {
        const { data: fleet } = await sb.from('fleet').select('user_id').in('user_id', ids);
        const fm: Record<string, number> = {};
        (fleet || []).forEach(f => { fm[f.user_id] = (fm[f.user_id] || 0) + 1; });
        setFleetMap(prev => ({ ...prev, ...fm }));
      }

      setRows(prev => (currentOffset === 0 ? newRows : [...prev, ...newRows]));
      const newOffset = currentOffset + newRows.length;
      offsetRef.current = newOffset;
      setOffset(newOffset);
      if (count !== null && count !== undefined) setTotal(count);
      if (newRows.length < BATCH) { hasMoreRef.current = false; setHasMore(false); }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    reset();
    fetchCouriers(0, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          fetchCouriers(offsetRef.current, debouncedSearch);
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const countLabel = total != null ? `${offset} / ${total.toLocaleString()}` : `${offset} loaded`;

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
              <th>Fleet</th>
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
                    <span className="badge badge-review-needed">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'middle', marginRight: '3px' }}>
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                        <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Has session
                    </span>
                  ) : (
                    <span className="badge" style={{ background: '#f4f4f4', color: 'var(--ink-mute)' }}>None</span>
                  )}
                </td>
                <td style={{ fontSize: '12px', fontWeight: 500 }}>{fleetMap[c.user_id] || 0}</td>
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
