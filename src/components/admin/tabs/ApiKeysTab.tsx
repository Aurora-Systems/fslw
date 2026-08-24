'use client';

import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Copy, Check, Ban, Plus } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE;

interface ApiKeyRow {
  id: string;
  name: string | null;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
  api_clients: { id: string; name: string; contact_email: string | null; is_active: boolean } | null;
}

interface ApiKeysTabProps {
  token: string;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ALL_SCOPES = ['deliveries:read', 'deliveries:write'];

export default function ApiKeysTab({ token }: ApiKeysTabProps) {
  const [rows, setRows] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [scopes, setScopes] = useState<string[]>([...ALL_SCOPES]);
  const [creating, setCreating] = useState(false);

  // One-time reveal of a freshly created key
  const [newKey, setNewKey] = useState<{ api_key: string; key_prefix: string; client: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/admin/api-keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || 'Failed to load API keys');
        setEmpty(true);
        return;
      }
      const body = await res.json();
      const data: ApiKeyRow[] = body.data ?? [];
      setRows(data);
      setEmpty(data.length === 0);
    } catch {
      setError('Failed to load API keys');
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const toggleScope = (scope: string) => {
    setScopes(prev => (prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]));
  };

  const handleCreate = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`${API}/admin/api-keys`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          contact_email: contactEmail.trim() || undefined,
          scopes,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error || 'Failed to create API key');
        return;
      }
      setNewKey({
        api_key: body.key.api_key,
        key_prefix: body.key.key_prefix,
        client: body.client?.name ?? name.trim(),
      });
      setShowForm(false);
      setName('');
      setContactEmail('');
      setScopes([...ALL_SCOPES]);
      fetchKeys();
    } catch {
      setError('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this API key? The partner will lose access immediately and it cannot be undone.')) return;
    try {
      const res = await fetch(`${API}/admin/api-keys/${id}/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchKeys();
      else {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || 'Failed to revoke key');
      }
    } catch {
      setError('Failed to revoke key');
    }
  };

  const copyKey = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  return (
    <div className="tab-panel active">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <KeyRound size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            API Keys
          </div>
          <button
            className="btn-primary"
            onClick={() => { setShowForm(v => !v); setNewKey(null); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 8, border: 'none', background: 'var(--brand, #2563eb)', color: '#fff',
              fontWeight: 600, cursor: 'pointer', fontSize: 13,
            }}
          >
            <Plus size={15} /> New API key
          </button>
        </div>

        {error && (
          <div style={{ margin: '12px 0', padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* One-time key reveal */}
        {newKey && (
          <div style={{ margin: '12px 0', padding: '16px', border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: 10 }}>
            <div style={{ fontWeight: 700, color: '#166534', marginBottom: 6 }}>
              Key created for {newKey.client}
            </div>
            <div style={{ fontSize: 12, color: '#166534', marginBottom: 10 }}>
              Copy it now — for security it is shown only once and can never be recovered.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <code style={{ padding: '8px 12px', background: '#fff', border: '1px solid #d1fae5', borderRadius: 8, fontSize: 13, wordBreak: 'break-all', flex: 1 }}>
                {newKey.api_key}
              </code>
              <button
                onClick={copyKey}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid #86efac', background: '#fff', color: '#166534', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                {copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}
              </button>
            </div>
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div style={{ margin: '12px 0', padding: '16px', border: '1px solid var(--line, #e5e7eb)', borderRadius: 10 }}>
            <div style={{ display: 'grid', gap: 12, maxWidth: 460 }}>
              <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600 }}>
                Partner name
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Acme Store"
                  style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--line, #e5e7eb)', fontSize: 14 }}
                />
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600 }}>
                Contact email <span style={{ fontWeight: 400, color: 'var(--ink-mute)' }}>(optional)</span>
                <input
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="dev@acme.com"
                  style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--line, #e5e7eb)', fontSize: 14 }}
                />
              </label>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                Scopes
                <div style={{ display: 'flex', gap: 16, marginTop: 6, fontWeight: 400 }}>
                  {ALL_SCOPES.map(scope => (
                    <label key={scope} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" checked={scopes.includes(scope)} onChange={() => toggleScope(scope)} />
                      {scope}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleCreate}
                  disabled={creating || !name.trim() || scopes.length === 0}
                  style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: 'var(--brand, #2563eb)', color: '#fff', fontWeight: 600, cursor: creating ? 'default' : 'pointer', opacity: creating || !name.trim() || scopes.length === 0 ? 0.6 : 1, fontSize: 13 }}
                >
                  {creating ? 'Creating…' : 'Create key'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--line, #e5e7eb)', background: '#fff', color: 'var(--ink)', cursor: 'pointer', fontSize: 13 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th>Partner</th>
              <th>Key</th>
              <th>Scopes</th>
              <th>Status</th>
              <th>Last used</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {empty && !loading && (
              <tr className="state-row"><td colSpan={7}>No API keys yet</td></tr>
            )}
            {rows.map(k => {
              const revoked = !k.is_active || !!k.revoked_at;
              return (
                <tr key={k.id}>
                  <td>
                    {k.api_clients?.name ?? '—'}
                    {k.api_clients?.contact_email && (
                      <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{k.api_clients.contact_email}</div>
                    )}
                  </td>
                  <td><code style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{k.key_prefix}…</code></td>
                  <td style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{(k.scopes ?? []).join(', ')}</td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                      background: revoked ? '#fee2e2' : '#dcfce7',
                      color: revoked ? '#991b1b' : '#166534',
                    }}>
                      {revoked ? 'Revoked' : 'Active'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{fmtDate(k.last_used_at)}</td>
                  <td style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{fmtDate(k.created_at)}</td>
                  <td>
                    {!revoked && (
                      <button
                        onClick={() => handleRevoke(k.id)}
                        title="Revoke key"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid #fecaca', background: '#fff', color: '#b91c1c', cursor: 'pointer', fontSize: 12 }}
                      >
                        <Ban size={13} /> Revoke
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
