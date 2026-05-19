'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

const BATCH = 25;

interface Transaction {
  transaction_id: string;
  total: number;
  created_at: string;
  users: { first_name: string; last_name: string } | null;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TransactionsTab() {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [empty, setEmpty] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const sb = createClient();

  const fetchTransactions = useCallback(
    async (currentOffset: number) => {
      if (loadingRef.current || !hasMoreRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      const { data, count, error } = await sb
        .from('transactions')
        .select('transaction_id,total,created_at,users:user_id(first_name,last_name)', {
          count: 'exact',
        })
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + BATCH - 1);

      loadingRef.current = false;
      setLoading(false);

      if (error || (!data?.length && currentOffset === 0)) {
        setEmpty(true);
        hasMoreRef.current = false;
        setHasMore(false);
        return;
      }

      const newRows = (data || []) as unknown as Transaction[];
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
    fetchTransactions(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          fetchTransactions(offsetRef.current);
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const countLabel = total != null ? `${offset} / ${total.toLocaleString()}` : `${offset} loaded`;

  return (
    <div className="tab-panel active">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Transactions</div>
          <div className="panel-count">{countLabel}</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>User</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {empty && (
              <tr className="state-row"><td colSpan={4}>No transactions found</td></tr>
            )}
            {rows.map(t => (
              <tr key={t.transaction_id}>
                <td>
                  <code style={{ fontSize: '11px', color: 'var(--ink-mute)' }}>
                    {t.transaction_id?.slice(0, 28) || '—'}…
                  </code>
                </td>
                <td>
                  {t.users ? `${t.users.first_name} ${t.users.last_name}` : '—'}
                </td>
                <td style={{ fontWeight: 600, color: 'var(--green)' }}>
                  +${(t.total || 0).toFixed(2)}
                </td>
                <td style={{ color: 'var(--ink-mute)', fontSize: '12px' }}>{fmtDate(t.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="sentinel" ref={sentinelRef}>
          <div className={`load-spinner${loading ? ' active' : ''}`}>
            <span className="spinner"></span> Loading more…
          </div>
          <div className={`end-msg${!hasMore && rows.length > 0 ? ' active' : ''}`}>
            All transactions loaded
          </div>
        </div>
      </div>
    </div>
  );
}
