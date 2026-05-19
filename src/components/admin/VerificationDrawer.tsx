'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, Clock, RefreshCw, XCircle, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface VerificationDrawerProps {
  open: boolean;
  userId: string | null;
  userName: string;
  onClose: () => void;
  currentToken: string | null;
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
}: VerificationDrawerProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [diditData, setDiditData] = useState<DiditData | null>(null);
  const [loading, setLoading] = useState(false);

  const sb = createClient();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

  useEffect(() => {
    if (!open || !userId) return;

    setLoading(true);
    setUserData(null);
    setDiditData(null);

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
  const bannerCls =
    status === 'Approved'
      ? 'approved'
      : status === 'Declined'
      ? 'declined'
      : ['Pending', 'Processing'].includes(status)
      ? 'pending'
      : 'unknown';

  const StatusIcon = () => {
    if (status === 'Approved') return <CheckCircle style={{ width: 28, height: 28, stroke: '#22c55e' }} />;
    if (status === 'Pending' || status === 'Processing') return <Clock style={{ width: 28, height: 28, stroke: '#f59e0b' }} />;
    if (status === 'Declined') return <XCircle style={{ width: 28, height: 28, stroke: '#ef4444' }} />;
    return <HelpCircle style={{ width: 28, height: 28, stroke: '#8a8a8a' }} />;
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
                    {diditData ? 'Live from Didit API' : 'Connect server URL to see live status'}
                  </div>
                </div>
              </div>
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
