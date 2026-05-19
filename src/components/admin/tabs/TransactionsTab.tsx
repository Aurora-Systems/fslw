'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_BASE;
const LIMIT = 25;

interface Transaction {
  transaction_id: string;
  total: number;
  created_at: string;
  users: { first_name: string; last_name: string } | null;
}

interface TransactionsTabProps {
  token: string;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TransactionsTab({ token }: TransactionsTabProps) {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [empty, setEmpty] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const fetchTransactions = useCallback(
    async (currentPage: number) => {
      if (loadingRef.current || !hasMoreRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      try {
        const params = new URLSearchParams({ page: String(currentPage), limit: String(LIMIT) });
        const res = await fetch(`${API}/admin/transactions?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setEmpty(true); hasMoreRef.current = false; setHasMore(false); return; }

        const body = await res.json();
        const newRows: Transaction[] = body.data ?? [];
        const totalCount: number = body.meta?.total ?? 0;

        if (!newRows.length && currentPage === 1) {
          setEmpty(true);
          hasMoreRef.current = false;
          setHasMore(false);
          return;
        }

        setRows(prev => (currentPage === 1 ? newRows : [...prev, ...newRows]));
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
    fetchTransactions(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          fetchTransactions(pageRef.current);
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const countLabel = total != null ? `${rows.length} / ${total.toLocaleString()}` : `${rows.length} loaded`;

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
