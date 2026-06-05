'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Mail, MessageCircle, CheckCircle, Clock, Download } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE;
const LIMIT = 50;

interface IncompleteUser {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in: string | null;
  confirmed: boolean;
  contacted: boolean;
  contacted_at: string | null;
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
    "Hi! We noticed you signed up on FastLinQ but haven't completed your profile. " +
    "It only takes a minute — open the app to get started."
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

function downloadCSV(rows: IncompleteUser[], type: 'all' | 'phone' | 'email') {
  const filtered =
    type === 'phone' ? rows.filter(r => r.phone) :
    type === 'email' ? rows.filter(r => r.email) :
    rows;

  const headers = ['ID', 'Email', 'Phone', 'Confirmed', 'Signed Up', 'Last Seen', 'Contacted', 'Contacted At'];
  const escape  = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines   = [
    headers.map(escape).join(','),
    ...filtered.map(r => [
      r.id,
      r.email        || '',
      r.phone        || '',
      r.confirmed    ? 'Yes' : 'No',
      r.created_at   ? new Date(r.created_at).toISOString().slice(0, 10) : '',
      r.last_sign_in ? new Date(r.last_sign_in).toISOString().slice(0, 10) : '',
      r.contacted    ? 'Yes' : 'No',
      r.contacted_at ? new Date(r.contacted_at).toISOString().slice(0, 10) : '',
    ].map(v => escape(String(v))).join(',')),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `incomplete-signups-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function IncompleteTab({ token, onBadge }: IncompleteTabProps) {
  const [rows, setRows] = useState<IncompleteUser[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [empty, setEmpty] = useState(false);

  // contacted IDs managed optimistically on top of server state
  const [contactedSet, setContactedSet] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  // export state
  const [exporting, setExporting] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef     = useRef(1);
  const hasMoreRef  = useRef(true);
  const loadingRef  = useRef(false);
  const allRowsRef  = useRef<IncompleteUser[]>([]); // accumulates across pages for export

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

        const body            = await res.json();
        const newRows: IncompleteUser[] = body.data ?? [];
        const totalCount: number        = body.meta?.total ?? 0;

        if (!newRows.length && currentPage === 1) {
          setEmpty(true); hasMoreRef.current = false; setHasMore(false); return;
        }

        // Seed contacted set from server data
        setContactedSet(prev => {
          const next = new Set(prev);
          newRows.forEach(r => { if (r.contacted) next.add(r.id); });
          return next;
        });

        setRows(prev => {
          const merged = currentPage === 1 ? newRows : [...prev, ...newRows];
          allRowsRef.current = merged;
          return merged;
        });
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
    [token, onBadge]
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

  const toggleContacted = useCallback(async (userId: string) => {
    if (toggling.has(userId)) return;
    const wasContacted = contactedSet.has(userId);

    // Optimistic update
    setContactedSet(prev => {
      const next = new Set(prev);
      wasContacted ? next.delete(userId) : next.add(userId);
      return next;
    });
    setToggling(prev => { const next = new Set(prev); next.add(userId); return next; });

    try {
      const method = wasContacted ? 'DELETE' : 'POST';
      const res = await fetch(`${API}/admin/incomplete-signups/${userId}/contact`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('failed');
    } catch {
      // Revert on failure
      setContactedSet(prev => {
        const next = new Set(prev);
        wasContacted ? next.add(userId) : next.delete(userId);
        return next;
      });
    } finally {
      setToggling(prev => { const next = new Set(prev); next.delete(userId); return next; });
    }
  }, [token, contactedSet, toggling]);

  const handleExport = useCallback(async (type: 'all' | 'phone' | 'email') => {
    setExporting(true);
    try {
      // Fetch all rows (no pagination) from server
      const params = new URLSearchParams({ export: 'true', type });
      const res = await fetch(`${API}/admin/incomplete-signups?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { alert('Export failed — check console'); return; }
      const body = await res.json();

      // Merge contacted state from current UI
      const enriched: IncompleteUser[] = (body.data ?? []).map((r: IncompleteUser) => ({
        ...r,
        contacted: contactedSet.has(r.id) || r.contacted,
      }));

      downloadCSV(enriched, type);
    } finally {
      setExporting(false);
    }
  }, [token, contactedSet]);

  const countLabel = total != null ? `${rows.length} / ${total.toLocaleString()}` : `${rows.length} loaded`;

  return (
    <div className="tab-panel active">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Incomplete Signups</div>
          <div className="panel-count">{countLabel}</div>

          {/* Export buttons */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
            {exporting && <span style={{ fontSize: '12px', color: 'var(--ink-mute)' }}>Exporting…</span>}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                className="action-btn"
                disabled={exporting || rows.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                onClick={() => handleExport('all')}
              >
                <Download size={13} /> Export All
              </button>
            </div>
            <button
              className="action-btn"
              disabled={exporting || rows.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
              onClick={() => handleExport('phone')}
            >
              <Download size={13} /> Phone Only
            </button>
            <button
              className="action-btn"
              disabled={exporting || rows.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
              onClick={() => handleExport('email')}
            >
              <Download size={13} /> Email Only
            </button>
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
              <th>Reach Out</th>
              <th style={{ textAlign: 'center' }}>Contacted</th>
            </tr>
          </thead>
          <tbody>
            {empty && (
              <tr className="state-row">
                <td colSpan={7}>No incomplete signups — everyone has completed onboarding</td>
              </tr>
            )}
            {rows.map(u => {
              const hasEmail      = !!u.email;
              const hasPhone      = !!u.phone;
              const displayContact = u.email || u.phone || '—';
              const isContacted   = contactedSet.has(u.id);
              const isToggling    = toggling.has(u.id);

              return (
                <tr key={u.id} style={isContacted ? { opacity: 0.6 } : undefined}>
                  <td>
                    <div className="user-cell">
                      <div
                        className="user-avatar"
                        style={{ background: isContacted ? '#f3f4f6' : 'linear-gradient(135deg,#fce7f3,#fbcfe8)', color: isContacted ? '#9ca3af' : '#9d174d' }}
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
                      <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>Email</span>
                    )}
                    {hasPhone && (
                      <span className="badge" style={{ background: '#f0fdf4', color: '#15803d', marginLeft: hasEmail ? '4px' : '0' }}>Phone</span>
                    )}
                  </td>
                  <td>
                    {u.confirmed ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--green)', fontSize: '12px' }}>
                        <CheckCircle size={13} /> Yes
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--ink-mute)', fontSize: '12px' }}>
                        <Clock size={13} /> No
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
                          <Mail size={12} /> Email
                        </a>
                      )}
                      {hasPhone && (
                        <a
                          href={waLink(u.phone!)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}
                        >
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <label
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: isToggling ? 'wait' : 'pointer', fontSize: '12px', color: isContacted ? 'var(--green)' : 'var(--ink-mute)' }}
                      title={isContacted ? 'Mark as not contacted' : 'Mark as contacted'}
                    >
                      <input
                        type="checkbox"
                        checked={isContacted}
                        disabled={isToggling}
                        onChange={() => toggleContacted(u.id)}
                        style={{ width: '15px', height: '15px', cursor: isToggling ? 'wait' : 'pointer', accentColor: 'var(--green)' }}
                      />
                      {isContacted ? 'Done' : ''}
                    </label>
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
