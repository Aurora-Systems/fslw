'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, Clock, XCircle, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface VerificationDrawerProps {
  open: boolean;
  userId: string | null;
  userName: string;
  onClose: () => void;
  currentToken: string | null;
  /** Called after an admin approves/declines, so lists can refresh. */
  onDecided?: () => void;
}

interface UserData {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  country: string;
  didit_session_id: string | null;
  created_at: string;
}

interface DiditData {
  status?: string;
  kyc_data?: {
    first_name?: string;
    last_name?: string;
    dob?: string;
    nationality?: string;
    id_number?: string;
    document_type?: string;
  };
  rejection_reasons?: string[];
  [key: string]: unknown;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function VerificationDrawer({
  open,
  userId,
  userName,
  onClose,
  currentToken,
  onDecided,
}: VerificationDrawerProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [diditData, setDiditData] = useState<DiditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [deciding, setDeciding] = useState<'approve' | 'decline' | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [decisionDone, setDecisionDone] = useState<string | null>(null);

  const sb = createClient();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

  useEffect(() => {
    if (!open || !userId) return;

    setLoading(true);
    setUserData(null);
    setDiditData(null);
    setNote('');
    setDeciding(null);
    setDecisionError(null);
    setDecisionDone(null);

    const load = async () => {
      let ud: UserData | null = null;
      let dd: DiditData | null = null;

      if (API_BASE && !API_BASE.includes('YOUR_SERVER') && currentToken) {
        try {
          const res = await fetch(`${API_BASE}/admin/verifications/${userId}`, {
            headers: { Authorization: `Bearer ${currentToken}` },
          });
          if (res.ok) {
            const body = await res.json();
            ud = body.data;
            dd = body.didit;
          }
        } catch {}
      }

      if (!ud) {
        const { data } = await sb
          .from('users')
          .select('user_id,first_name,last_name,email,contact_number,country,didit_session_id,created_at')
          .eq('user_id', userId)
          .single();
        ud = data;
      }

      setUserData(ud);
      setDiditData(dd);
      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const status = diditData?.status || 'Unknown';
  // Didit's manual-review state is "In Review"; the others are the user still
  // working through the flow.
  const PENDING_STATES = ['In Review', 'Pending', 'Processing', 'In Progress', 'Not Started', 'Resubmitted', 'Awaiting User'];
  const bannerCls =
    status === 'Approved'
      ? 'approved'
      : status === 'Declined'
      ? 'declined'
      : PENDING_STATES.includes(status)
      ? 'pending'
      : 'unknown';
  const canDecide = status === 'In Review' && !decisionDone;

  const StatusIcon = () => {
    if (status === 'Approved') return <CheckCircle style={{ width: 28, height: 28, stroke: '#22c55e' }} />;
    if (PENDING_STATES.includes(status)) return <Clock style={{ width: 28, height: 28, stroke: '#f59e0b' }} />;
    if (status === 'Declined') return <XCircle style={{ width: 28, height: 28, stroke: '#ef4444' }} />;
    return <HelpCircle style={{ width: 28, height: 28, stroke: '#8a8a8a' }} />;
  };

  const decide = async (decision: 'approve' | 'decline') => {
    if (!userId || !currentToken || deciding) return;
    const label = decision === 'approve' ? 'Approve' : 'Decline';
    if (!window.confirm(`${label} ${userName || 'this courier'}'s identity verification? This is recorded in Didit.`)) return;

    setDeciding(decision);
    setDecisionError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/verifications/${userId}/decision`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment: note.trim() || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDecisionError(body?.error || `Could not ${decision} this verification`);
        // If Didit says it's no longer In Review, reflect the real status.
        if (body?.status) setDiditData((d) => ({ ...(d ?? {}), status: body.status }));
        return;
      }
      setDiditData((d) => ({ ...(d ?? {}), status: body.status }));
      setDecisionDone(body.status);
      onDecided?.();
    } catch {
      setDecisionError('Network error — please try again');
    } finally {
      setDeciding(null);
    }
  };

  return (
    <>
      <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={onClose}></div>
      <div className={`drawer${open ? ' open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-title">{userName || 'Identity Review'}</div>
          <button className="drawer-close" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="drawer-body">
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-mute)' }}>
              <span className="spinner"></span>
            </div>
          )}
          {!loading && !userData && (
            <p style={{ color: 'var(--red)', padding: '20px' }}>Could not load user data.</p>
          )}
          {!loading && userData && (
            <>
              <div className={`status-banner ${bannerCls}`}>
                <div className="status-icon">
                  <StatusIcon />
                </div>
                <div>
                  <div className="status-label">{status}</div>
                  <div className="status-sub">
                    {decisionDone
                      ? `Updated in Didit just now`
                      : status === 'In Review'
                      ? 'Awaiting manual review — check the details below'
                      : diditData ? 'Live from Didit API' : 'Connect server URL to see live status'}
                  </div>
                </div>
              </div>

              {canDecide && (
                <div className="drawer-section">
                  <div className="drawer-section-title">Review decision</div>
                  <p style={{ fontSize: 12.5, color: 'var(--ink-mute)', margin: '0 0 10px' }}>
                    Check the ID details below before deciding. The decision is saved in Didit with your
                    name on the audit trail, and the courier is notified.
                  </p>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional note (e.g. why you approved or declined)"
                    maxLength={500}
                    rows={3}
                    style={{
                      width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: 13,
                      padding: '9px 11px', borderRadius: 8, border: '1px solid var(--border, #e5e7eb)',
                      marginBottom: 10, boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => decide('approve')}
                      disabled={!!deciding}
                      style={{
                        flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '10px 14px', borderRadius: 8, border: 'none', cursor: deciding ? 'default' : 'pointer',
                        background: '#16a34a', color: '#fff', fontWeight: 600, fontSize: 13.5,
                        opacity: deciding && deciding !== 'approve' ? 0.5 : 1,
                      }}
                    >
                      <CheckCircle size={16} /> {deciding === 'approve' ? 'Approving…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => decide('decline')}
                      disabled={!!deciding}
                      style={{
                        flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '10px 14px', borderRadius: 8, border: '1px solid #fecaca', cursor: deciding ? 'default' : 'pointer',
                        background: '#fff', color: '#b91c1c', fontWeight: 600, fontSize: 13.5,
                        opacity: deciding && deciding !== 'decline' ? 0.5 : 1,
                      }}
                    >
                      <XCircle size={16} /> {deciding === 'decline' ? 'Declining…' : 'Decline'}
                    </button>
                  </div>
                </div>
              )}

              {decisionError && (
                <div style={{ margin: '0 0 14px', padding: '10px 12px', borderRadius: 8, background: '#fee2e2', color: '#991b1b', fontSize: 13 }}>
                  {decisionError}
                </div>
              )}
              {decisionDone && (
                <div style={{ margin: '0 0 14px', padding: '10px 12px', borderRadius: 8, background: decisionDone === 'Approved' ? '#dcfce7' : '#fef3c7', color: decisionDone === 'Approved' ? '#166534' : '#92400e', fontSize: 13 }}>
                  {decisionDone === 'Approved'
                    ? 'Approved. The courier can now accept jobs and has been notified.'
                    : 'Declined. The courier has been notified.'}
                </div>
              )}
              <div className="drawer-section">
                <div className="drawer-section-title">Courier</div>
                <div className="drawer-row">
                  <span className="label">Name</span>
                  <span className="value">
                    {userData.first_name || ''} {userData.last_name || ''}
                  </span>
                </div>
                <div className="drawer-row">
                  <span className="label">Email</span>
                  <span className="value">{userData.email || '—'}</span>
                </div>
                <div className="drawer-row">
                  <span className="label">Contact</span>
                  <span className="value">{userData.contact_number || '—'}</span>
                </div>
                <div className="drawer-row">
                  <span className="label">Country</span>
                  <span className="value">{userData.country || '—'}</span>
                </div>
                <div className="drawer-row">
                  <span className="label">Joined</span>
                  <span className="value">{fmtDate(userData.created_at)}</span>
                </div>
                <div className="drawer-row">
                  <span className="label">Session ID</span>
                  <span className="value" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                    {userData.didit_session_id || '—'}
                  </span>
                </div>
              </div>
              {diditData && (
                <>
                  <div className="drawer-section">
                    <div className="drawer-section-title">Didit Decision</div>
                    {diditData.kyc_data && (
                      <>
                        <div className="drawer-row">
                          <span className="label">Full Name</span>
                          <span className="value">
                            {diditData.kyc_data.first_name || ''} {diditData.kyc_data.last_name || ''}
                          </span>
                        </div>
                        <div className="drawer-row">
                          <span className="label">Date of Birth</span>
                          <span className="value">{diditData.kyc_data.dob || '—'}</span>
                        </div>
                        <div className="drawer-row">
                          <span className="label">Nationality</span>
                          <span className="value">{diditData.kyc_data.nationality || '—'}</span>
                        </div>
                        <div className="drawer-row">
                          <span className="label">ID Number</span>
                          <span className="value">{diditData.kyc_data.id_number || '—'}</span>
                        </div>
                        <div className="drawer-row">
                          <span className="label">Document</span>
                          <span className="value">{diditData.kyc_data.document_type || '—'}</span>
                        </div>
                      </>
                    )}
                    {diditData.rejection_reasons?.length ? (
                      <div className="drawer-row">
                        <span className="label">Rejection</span>
                        <span className="value" style={{ color: 'var(--red)' }}>
                          {diditData.rejection_reasons.join(', ')}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div className="drawer-section">
                    <div className="drawer-section-title">Raw Response</div>
                    <pre
                      style={{
                        fontSize: '11px',
                        lineHeight: 1.5,
                        color: 'var(--ink-soft)',
                        background: 'var(--paper-2)',
                        padding: '12px',
                        borderRadius: '8px',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {JSON.stringify(diditData, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
