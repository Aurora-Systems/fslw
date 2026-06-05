'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Mail, MessageCircle, CheckCircle, Clock } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE;
const LIMIT = 50;

interface IncompleteUser {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in: string | null;
  confirmed: boolean;
}

interface IncompleteTabProps {
  token: string;
  onBadge?: (count: number) => void;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function waLink(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const msg = encodeURIComponent(
    'Hi! We noticed you signed up on FastLinQ but haven\'t completed your profile. ' +
    'It only takes a minute — open the app to get started and make your first delivery or booking.'
  );
  return `https://wa.me/${digits}?text=${msg}`;
}

function mailtoLink(email: string): string {
  const subject = encodeURIComponent('Complete your FastLinQ profile');
  const body = encodeURIComponent(
    `Hi,\n\nWe noticed you signed up for FastLinQ but haven't completed your profile yet.\n\n` +
    `Open the FastLinQ app to finish setting up your account — it only takes a minute.\n\n` +
    `If you need any help, just reply to this email.\n\nThe FastLinQ Team`
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export default function IncompleteTab({ token, onBadge }: IncompleteTabProps) {
  const [rows, setRows] = useState<IncompleteUser[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [empty, setEmpty] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const fetchIncomplete = useCallback(
    async (currentPage: number) => {
      if (loadingRef.current || !hasMoreRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      try {
        const params = new URLSearchParams({ page: String(currentPage), limit: String(LIMIT) });
        const res = await fetch(`${API}/admin/incomplete-signups?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errBody = await res.text();
          console.error('incomplete-signups error', res.status, errBody);
          setEmpty(true); hasMoreRef.current = false; setHasMore(false); return;
        }

        const body = await res.json();
        const newRows: IncompleteUser[] = body.data ?? [];
        const totalCount: number = body.meta?.total ?? 0;

        if (!newRows.length && currentPage === 1) {
          setEmpty(true);
          hasMoreRef.current = false;
          setHasMore(false);
          return;
        }

        setRows(prev => (currentPage === 1 ? newRows : [...prev, ...newRows]));
        setTotal(totalCount);
        if (currentPage === 1 && totalCount > 0) onBadge?.(totalCount);

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
    fetchIncomplete(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          fetchIncomplete(pageRef.current);
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
          <div className="panel-title">Incomplete Signups</div>
          <div className="panel-count">{countLabel}</div>
          <div
            style={{
              marginLeft: 'auto',
              fontSize: '12px',
              color: 'var(--ink-mute)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Auth users who never completed onboarding
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Contact</th>
              <th>Type</th>
              <th>Confirmed</th>
              <th>Signed Up</th>
              <th>Last Seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {empty && (
              <tr className="state-row">
                <td colSpan={6}>No incomplete signups — everyone has completed onboarding</td>
              </tr>
            )}
            {rows.map(u => {
              const hasEmail = !!u.email;
              const hasPhone = !!u.phone;
              const displayContact = u.email || u.phone || '—';

              return (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <div
                        className="user-avatar"
                        style={{ background: 'linear-gradient(135deg,#fce7f3,#fbcfe8)', color: '#9d174d' }}
                      >
                        {(displayContact[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <div className="user-name" style={{ fontSize: '13px' }}>{displayContact}</div>
                        <div className="user-sub" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                          {u.id.slice(0, 16)}…
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {hasEmail && (
                      <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                        Email
                      </span>
                    )}
                    {hasPhone && (
                      <span className="badge" style={{ background: '#f0fdf4', color: '#15803d', marginLeft: hasEmail ? '4px' : '0' }}>
                        Phone
                      </span>
                    )}
                  </td>
                  <td>
                    {u.confirmed ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--green)', fontSize: '12px' }}>
                        <CheckCircle size={13} /> Confirmed
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--ink-mute)', fontSize: '12px' }}>
                        <Clock size={13} /> Pending
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--ink-mute)', fontSize: '12px' }}>{fmtDate(u.created_at)}</td>
                  <td style={{ color: 'var(--ink-mute)', fontSize: '12px' }}>{fmtDate(u.last_sign_in)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {hasEmail && (
                        <a
                          href={mailtoLink(u.email!)}
                          className="action-btn"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                        >
                          <Mail size={12} />
                          Email
                        </a>
                      )}
                      {hasPhone && (
                        <a
                          href={waLink(u.phone!)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none',
                            background: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                          }}
                        >
                          <MessageCircle size={12} />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="sentinel" ref={sentinelRef}>
          <div className={`load-spinner${loading ? ' active' : ''}`}>
            <span className="spinner"></span> Loading more…
          </div>
          <div className={`end-msg${!hasMore && rows.length > 0 ? ' active' : ''}`}>
            All incomplete signups loaded
          </div>
        </div>
      </div>
    </div>
  );
}
