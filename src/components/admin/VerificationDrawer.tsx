'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X, CheckCircle, Clock, XCircle, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface VerificationDrawerProps {
  open: boolean;
  userId: string | null;
  userName: string;
  /** Open one specific Didit session (a person can have several attempts). */
  sessionId?: string | null;
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

// ── Didit v3 evidence ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRec = Record<string, any>;

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="drawer-row">
      <span className="label">{label}</span>
      <span className="value">{children}</span>
    </div>
  );
}

export function CheckPill({ status }: { status?: string }) {
  if (!status) return <>—</>;
  const s = status.toLowerCase();
  const tone =
    s === 'approved' ? { bg: '#dcfce7', fg: '#166534' }
    : s === 'declined' ? { bg: '#fee2e2', fg: '#991b1b' }
    : s === 'in review' ? { bg: '#fef3c7', fg: '#92400e' }
    : { bg: '#f1f5f9', fg: '#475569' };
  return (
    <span style={{ fontSize: 11.5, fontWeight: 600, padding: '2px 9px', borderRadius: 999, background: tone.bg, color: tone.fg }}>
      {status}
    </span>
  );
}

export function Photo({ src, label }: { src?: string; label: string }) {
  if (!src) return null;
  return (
    <a href={src} target="_blank" rel="noreferrer" title={`Open ${label.toLowerCase()} full size`} style={{ display: 'block' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        referrerPolicy="no-referrer"
        loading="lazy"
        style={{
          width: '100%', height: 118, objectFit: 'cover', borderRadius: 8,
          border: '1px solid var(--border, #e5e7eb)', background: 'var(--paper-2)',
        }}
      />
      <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 4, textAlign: 'center' }}>{label}</div>
    </a>
  );
}

function DiditEvidence({ d }: { d: DiditData }) {
  const idv = (d.id_verifications as AnyRec[] | undefined)?.[0];
  const live = (d.liveness_checks as AnyRec[] | undefined)?.[0];
  const face = (d.face_matches as AnyRec[] | undefined)?.[0];

  // The warnings are why Didit sent this session to manual review.
  const seen = new Set<string>();
  const warnings = [idv, live, face]
    .flatMap((c) => (c?.warnings ?? []) as AnyRec[])
    .filter((w) => {
      const key = String(w.risk ?? w.short_description ?? '');
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const name = idv?.full_name || [idv?.first_name, idv?.last_name].filter(Boolean).join(' ');
  const score = (n: unknown) =>
    typeof n === 'number' ? <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>score {n.toFixed(1)}</span> : null;

  if (!idv && !live && !face) {
    return (
      <div className="drawer-section">
        <p style={{ fontSize: 13, color: 'var(--ink-mute)', margin: 0 }}>
          No ID or selfie evidence has been captured for this session yet.
        </p>
      </div>
    );
  }

  return (
    <>
      {warnings.length > 0 && (
        <div className="drawer-section">
          <div className="drawer-section-title">Why it needs review</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
            {warnings.map((w, i) => (
              <li key={i} title={w.long_description || ''} style={{ fontSize: 13, color: '#92400e' }}>
                {w.short_description || String(w.risk).replace(/_/g, ' ').toLowerCase()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(live?.reference_image || idv?.portrait_image) && (
        <div className="drawer-section">
          <div className="drawer-section-title">Face comparison</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Photo src={live?.reference_image} label="Selfie" />
            <Photo src={idv?.portrait_image} label="Photo on ID" />
          </div>
        </div>
      )}

      {(live || face) && (
        <div className="drawer-section">
          <div className="drawer-section-title">Selfie checks</div>
          {live && (
            <Row label="Liveness">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <CheckPill status={live.status} /> {score(live.score)}
              </span>
            </Row>
          )}
          {face && (
            <Row label="Face match">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <CheckPill status={face.status} /> {score(face.score)}
              </span>
            </Row>
          )}
        </div>
      )}

      {idv && (
        <div className="drawer-section">
          <div className="drawer-section-title">ID document</div>
          {(idv.front_image || idv.back_image) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <Photo src={idv.front_image} label="Front" />
              <Photo src={idv.back_image} label="Back" />
            </div>
          )}
          <Row label="ID check"><CheckPill status={idv.status} /></Row>
          <Row label="Name">{name || '—'}</Row>
          <Row label="Date of birth">
            {idv.date_of_birth ? `${idv.date_of_birth}${idv.age != null ? ` (age ${idv.age})` : ''}` : '—'}
          </Row>
          <Row label="Gender">{idv.gender || '—'}</Row>
          <Row label="Document">{[idv.document_type, idv.document_number].filter(Boolean).join(' · ') || '—'}</Row>
          <Row label="Issued by">{idv.issuing_state_name || idv.issuing_state || '—'}</Row>
          <Row label="Issued → expires">{`${idv.date_of_issue || '—'} → ${idv.expiration_date || 'no expiry date'}`}</Row>
        </div>
      )}
    </>
  );
}

interface DecisionResult {
  status: string;
  is_current?: boolean;
  now_current?: boolean;
  already_verified?: boolean;
  linked_account?: boolean;
  notified?: boolean;
}

// Say what actually changed for the courier — it depends on whether this was
// the attempt the app checks.
function decisionMessage(status: string, r: DecisionResult | null): string {
  const told = r?.notified ? ' They have been notified.' : '';
  if (status === 'Approved') {
    if (!r || r.is_current === undefined) return 'Approved. The courier can now accept jobs and has been notified.';
    if (r.already_verified) return 'Approved. The courier was already verified on their current attempt, so nothing changes for them.';
    if (r.linked_account === false) return 'Approved in Didit. No FastLinQ account is linked to this session.';
    if (r.now_current) return `Approved. The courier can now accept jobs.${told}`;
    return 'Approved in Didit, but the courier has started a newer attempt, so the app still checks that one.';
  }
  if (!r || r.is_current === undefined) return 'Declined. The courier has been notified.';
  if (r.is_current) return `Declined. The courier can't accept jobs.${told}`;
  return "Declined this older attempt. The courier's access is unchanged and they were not notified.";
}

export default function VerificationDrawer({
  open,
  userId,
  userName,
  sessionId,
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
  const [decisionResult, setDecisionResult] = useState<DecisionResult | null>(null);
  // Which attempt the app checks for this courier, when it isn't the one open here.
  const [currentSession, setCurrentSession] = useState<{ session_id: string; status: string | null } | null>(null);
  const [isCurrent, setIsCurrent] = useState<boolean | null>(null);
  // Bumped each time the drawer loads someone, so late responses for the
  // previous person (a slow load or decision) are dropped.
  const genRef = useRef(0);

  const sb = createClient();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

  useEffect(() => {
    if (!open || (!userId && !sessionId)) return;

    const gen = ++genRef.current;
    setLoading(true);
    setUserData(null);
    setDiditData(null);
    setNote('');
    setDeciding(null);
    setDecisionError(null);
    setDecisionDone(null);
    setDecisionResult(null);
    setCurrentSession(null);
    setIsCurrent(null);

    const load = async () => {
      let ud: UserData | null = null;
      let dd: DiditData | null = null;

      if (API_BASE && !API_BASE.includes('YOUR_SERVER') && currentToken) {
        try {
          const url = sessionId
            ? `${API_BASE}/admin/verifications/session/${sessionId}`
            : `${API_BASE}/admin/verifications/${userId}`;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${currentToken}` },
          });
          if (res.ok) {
            const body = await res.json();
            if (gen !== genRef.current) return;
            ud = body.data;
            dd = body.didit;
            if (typeof body.is_current === 'boolean') setIsCurrent(body.is_current);
            if (body.current_session) setCurrentSession(body.current_session);
          }
        } catch {}
      }
      if (gen !== genRef.current) return;

      if (!ud && !sessionId && userId) {
        const { data } = await sb
          .from('users')
          .select('user_id,first_name,last_name,email,contact_number,country,didit_session_id,created_at')
          .eq('user_id', userId)
          .single();
        ud = data;
      }
      if (gen !== genRef.current) return;

      setUserData(ud);
      setDiditData(dd);
      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId, sessionId]);

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
    if ((!userId && !sessionId) || !currentToken || deciding) return;
    const label = decision === 'approve' ? 'Approve' : 'Decline';
    if (!window.confirm(`${label} ${userName || 'this courier'}'s identity verification? This is recorded in Didit.`)) return;

    const gen = genRef.current;
    setDeciding(decision);
    setDecisionError(null);
    try {
      const decisionUrl = sessionId
        ? `${API_BASE}/admin/verifications/session/${sessionId}/decision`
        : `${API_BASE}/admin/verifications/${userId}/decision`;
      const res = await fetch(decisionUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment: note.trim() || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) onDecided?.(); // refresh lists even if the admin has moved on
      if (gen !== genRef.current) return; // the drawer now shows someone else
      if (!res.ok) {
        setDecisionError(body?.error || `Could not ${decision} this verification`);
        // If Didit says it's no longer In Review, reflect the real status.
        if (body?.status) setDiditData((d) => ({ ...(d ?? {}), status: body.status }));
        return;
      }
      setDiditData((d) => ({ ...(d ?? {}), status: body.status }));
      setDecisionDone(body.status);
      setDecisionResult(body);
    } catch {
      if (gen === genRef.current) setDecisionError('Network error — please try again');
    } finally {
      if (gen === genRef.current) setDeciding(null);
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
          {!loading && !userData && !diditData && (
            <p style={{ color: 'var(--red)', padding: '20px' }}>Could not load this verification.</p>
          )}
          {!loading && (userData || diditData) && (
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
                  {isCurrent === false && userData ? (
                    <div style={{ margin: '0 0 10px', padding: '10px 12px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', fontSize: 12.5, lineHeight: 1.5 }}>
                      <strong>This isn&apos;t the attempt the app checks for this courier.</strong>{' '}
                      Their current attempt is {currentSession?.status ? <strong>{currentSession.status}</strong> : 'unknown'}.{' '}
                      {currentSession?.status === 'Approved'
                        ? 'They are already verified, so deciding this one only clears it from the review queue.'
                        : 'Approving makes this their active verification and lets them accept jobs. Declining leaves their access unchanged and does not notify them.'}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12.5, color: 'var(--ink-mute)', margin: '0 0 10px' }}>
                      Check the ID details below before deciding. The decision is saved in Didit with your
                      name on the audit trail, and the courier is notified.
                    </p>
                  )}
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
                  {decisionMessage(decisionDone, decisionResult)}
                </div>
              )}
              {userData ? (
              <div className="drawer-section">
                <div className="drawer-section-title">Courier</div>
                <div className="drawer-row">
                  <span className="label">Name</span>
                  <span className="value">
                    {userData!.first_name || ''} {userData!.last_name || ''}
                  </span>
                </div>
                <div className="drawer-row">
                  <span className="label">Email</span>
                  <span className="value">{userData!.email || '—'}</span>
                </div>
                <div className="drawer-row">
                  <span className="label">Contact</span>
                  <span className="value">{userData!.contact_number || '—'}</span>
                </div>
                <div className="drawer-row">
                  <span className="label">Country</span>
                  <span className="value">{userData!.country || '—'}</span>
                </div>
                <div className="drawer-row">
                  <span className="label">Joined</span>
                  <span className="value">{fmtDate(userData!.created_at)}</span>
                </div>
                <div className="drawer-row">
                  <span className="label">Session ID</span>
                  <span className="value" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                    {sessionId || userData!.didit_session_id || '—'}
                  </span>
                </div>
              </div>
              ) : (
                <div className="drawer-section">
                  <p style={{ fontSize: 13, color: 'var(--ink-mute)', margin: 0 }}>
                    No FastLinQ account is linked to this Didit session.
                  </p>
                </div>
              )}
              {diditData && (
                <>
                  <DiditEvidence d={diditData} />
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
