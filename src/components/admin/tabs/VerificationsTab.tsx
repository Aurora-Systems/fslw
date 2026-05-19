'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useDebounce } from '../hooks/useDebounce';

const BATCH = 25;

interface Verification {
  user_id: string;
  first_name: string;
  last_name: string;
  contact_number: string;
  didit_session_id: string | null;
  created_at: string;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface VerificationsTabProps {
  onOpenVerifyDrawer: (userId: string, name: string) => void;
  onVerifyBadge: (count: number) => void;
}

export default function VerificationsTab({ onOpenVerifyDrawer, onVerifyBadge }: VerificationsTabProps) {
  const [rows, setRows] = useState<Verification[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
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

  const fetchVerifications = useCallback(
    async (currentOffset: number, currentSearch: string, currentFilter: string) => {
      if (loadingRef.current || !hasMoreRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      let q = sb
        .from('users')
        .select('user_id,first_name,last_name,contact_number,didit_session_id,created_at', {
          count: 'exact',
        })
        .eq('acc_type', 'driver')
        .not('didit_session_id', 'is', null)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + BATCH - 1);

      if (currentSearch) {
        q = q.or(
          `first_name.ilike.%${currentSearch}%,last_name.ilike.%${currentSearch}%,contact_number.ilike.%${currentSearch}%`
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

      // Update verify badge on first fetch
      if (currentOffset === 0 && count && count > 0) {
        onVerifyBadge(count);
      }

      const newRows = ((data || []) as unknown as Verification[]).filter(c => {
        if (!currentFilter) return true;
        // Without server-side Didit status, we show all when filtered
        return true;
      });

      setRows(prev => (currentOffset === 0 ? newRows : [...prev, ...newRows]));
      const newOffset = currentOffset + (data?.length || 0);
      offsetRef.current = newOffset;
      setOffset(newOffset);
      if (count !== null && count !== undefined) setTotal(count);
      if ((data?.length || 0) < BATCH) { hasMoreRef.current = false; setHasMore(false); }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onVerifyBadge]
  );

  useEffect(() => {
    reset();
    fetchVerifications(0, debouncedSearch, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filter]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          fetchVerifications(offsetRef.current, debouncedSearch, filter);
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filter]);

  const countLabel = total != null ? `${offset} / ${total.toLocaleString()}` : `${offset} loaded`;

  return (
    <div className="tab-panel active">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Identity Verifications</div>
          <div className="panel-count">{countLabel}</div>
          <select
            className="filter-select"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
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
                  style={{
                    fontSize: '11px',
                    color: 'var(--ink-mute)',
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={c.didit_session_id || ''}
                >
                  {c.didit_session_id ? c.didit_session_id.slice(0, 18) + '…' : '—'}
                </td>
                <td>
                  <span className="badge badge-Unknown">Unknown</span>
                  <span className="badge badge-review-needed" style={{ marginLeft: '4px' }}>Review</span>
                </td>
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
