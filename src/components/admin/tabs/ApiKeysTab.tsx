'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { KeyRound, Copy, Check, Ban, Plus, Settings2, Webhook, X } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE;

// Runs before paint in the browser, so a closed drawer is never focusable for a frame.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Live keys are flq_live_..., test (sandbox) keys are flq_test_... */
type KeyMode = 'live' | 'test';

interface ApiClientInfo {
  id: string;
  name: string;
  contact_email: string | null;
  is_active: boolean;
  webhook_url?: string | null;
  /** Missing (not just null) until the server's api_sandbox.sql migration has been run. */
  sandbox_webhook_url?: string | null;
}

interface ApiKeyRow {
  id: string;
  name: string | null;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
  mode?: KeyMode;
  api_clients: ApiClientInfo | null;
}

/** A freshly minted key. The raw api_key is returned once and never again. */
interface CreatedKey {
  api_key: string;
  key_prefix: string;
  mode: KeyMode;
  client: string;
}

interface ApiKeysTabProps {
  token: string;
  /**
   * Lets the admin shell ask before it unmounts this tab (another tab, Refresh, sign out).
   * The guard returns false to stay. Registering returns the matching unregister function.
   */
  registerLeaveGuard?: (guard: () => boolean) => () => void;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ALL_SCOPES = ['deliveries:read', 'deliveries:write'];

const MODES: KeyMode[] = ['live', 'test'];

const MODE_META: Record<KeyMode, { label: string; badge: string; hint: string }> = {
  live: { label: 'Live', badge: 'badge-active', hint: 'Live key: real deliveries and real drivers' },
  test: { label: 'Test', badge: 'badge-pending', hint: 'Test key: simulated deliveries only' },
};

/** The server sends `mode`; fall back to the key prefix for older responses. */
function keyMode(k: { mode?: string | null; key_prefix?: string | null }): KeyMode {
  if (k.mode === 'live' || k.mode === 'test') return k.mode;
  return (k.key_prefix ?? '').startsWith('flq_test_') ? 'test' : 'live';
}

function isRevoked(k: ApiKeyRow): boolean {
  return !k.is_active || !!k.revoked_at;
}

/** Test webhooks need the sandbox columns, which the list only returns once the migration is run. */
function hasSandboxColumns(client: ApiClientInfo): boolean {
  return 'sandbox_webhook_url' in client;
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !!url.hostname;
  } catch {
    return false;
  }
}

/** The parts of an admin API response this tab reads. */
interface ApiBody {
  error?: unknown;
  message?: unknown;
  key?: { api_key?: string; key_prefix?: string; mode?: string };
  client?: { name?: string };
  webhook_url?: string | null;
  signing_secret?: string;
}

/** The JSON body of a response, or {} when there is none (e.g. a proxy's HTML error page). */
async function readBody(res: Response): Promise<ApiBody> {
  try {
    const body = await res.json();
    return body && typeof body === 'object' ? (body as ApiBody) : {};
  } catch {
    return {};
  }
}

/**
 * The server's own error text whenever it sent one (e.g. 'mode must be "live" or "test"'),
 * otherwise the fallback with the HTTP status so a failure is never silent.
 */
function apiError(res: Response, body: ApiBody, fallback: string): string {
  const msg = body.error ?? body.message;
  return typeof msg === 'string' && msg.trim() ? msg : `${fallback} (HTTP ${res.status})`;
}

/** The message with a closing full stop, so another sentence can follow it. */
function sentence(msg: string): string {
  const text = msg.trim();
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/**
 * A 4xx means the request was turned down before anything changed. Any other failed status
 * (a 5xx, a gateway timing out) can arrive after the server already stored the change.
 */
function outcomeUnknown(res: Response): boolean {
  return res.status < 400 || res.status >= 500;
}

function toCreatedKey(body: ApiBody, fallbackClient: string): CreatedKey {
  return {
    api_key: body.key?.api_key ?? '',
    key_prefix: body.key?.key_prefix ?? '',
    mode: keyMode({ mode: body.key?.mode, key_prefix: body.key?.key_prefix ?? body.key?.api_key }),
    client: body.client?.name ?? fallbackClient,
  };
}

const smallBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7,
  border: '1px solid var(--line, #e5e7eb)', background: '#fff', color: 'var(--ink)', cursor: 'pointer', fontSize: 12,
};

const dangerBtn: CSSProperties = { ...smallBtn, border: '1px solid #fecaca', color: '#b91c1c' };

const primaryBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none',
  background: 'var(--brand, #2563eb)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13,
};

const errorBox: CSSProperties = { margin: '12px 0', padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: 13 };

const warnBox: CSSProperties = { padding: '8px 10px', borderRadius: 8, background: 'rgba(245,158,11,.1)', color: '#92400e', fontSize: 12 };

function ModeBadge({ mode }: { mode: KeyMode }) {
  const meta = MODE_META[mode];
  return <span className={`badge ${meta.badge}`} title={meta.hint}>{meta.label}</span>;
}

function keyRevealNote(mode: KeyMode): ReactNode {
  return (
    <>
      Copy it now. For security it is shown only once and can never be recovered.
      <br />
      {mode === 'test'
        ? 'This is a test key: same base URL and endpoints, but deliveries made with it are simulated and never reach real drivers.'
        : 'This is a live key: deliveries made with it go to real drivers.'}
    </>
  );
}

/** One-time reveal of a secret the server will never return again. */
function SecretReveal({ title, note, value, onCopied, onDone }: {
  title: ReactNode;
  note: ReactNode;
  value: string;
  onCopied?: () => void;
  onDone?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  return (
    <div style={{ margin: '12px 0', padding: '16px', border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: 10 }}>
      <div style={{ fontWeight: 700, color: '#166534', marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: '#166534', marginBottom: 10 }}>
        {note}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <code style={{ padding: '8px 12px', background: '#fff', border: '1px solid #d1fae5', borderRadius: 8, fontSize: 13, wordBreak: 'break-all', flex: 1 }}>
          {value}
        </code>
        <button
          onClick={copy}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid #86efac', background: '#fff', color: '#166534', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          {copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}
        </button>
        {onDone && (
          <button
            onClick={onDone}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #bbf7d0', background: 'transparent', color: '#166534', cursor: 'pointer', fontSize: 13 }}
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

interface WebhookEditorProps {
  token: string;
  client: ApiClientInfo;
  mode: KeyMode;
  onChanged: () => void;
  /** A save or clear started (true) or finished (false). The drawer refuses to close in between. */
  onBusyChange: (busy: boolean) => void;
  /** A signing secret is on screen and has not been copied yet. */
  onSecretShown: () => void;
  /** The secret was copied, dismissed or no longer exists. */
  onSecretSettled: () => void;
}

/** Set, change or clear one of a partner's webhook endpoints (live or test). */
function WebhookEditor({ token, client, mode, onChanged, onBusyChange, onSecretShown, onSecretSettled }: WebhookEditorProps) {
  const savedUrl = (mode === 'test' ? client.sandbox_webhook_url : client.webhook_url) || null;
  const available = mode === 'live' || hasSandboxColumns(client);

  // What the server last confirmed, shown until the refreshed list catches up.
  const [override, setOverride] = useState<string | null | undefined>(undefined);
  useEffect(() => { setOverride(undefined); }, [savedUrl]);
  const current = override !== undefined ? override : savedUrl;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const label = mode === 'test' ? 'Test webhook' : 'Live webhook';
  const showInput = available && (editing || !current);

  const put = async (url: string) => {
    const res = await fetch(`${API}/admin/api-clients/${client.id}/webhook`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, mode }),
    });
    return { res, body: await readBody(res) };
  };

  // The server may have replaced or deleted the secret on screen, so it must not stay there.
  const dropSecret = () => {
    setSecret(null);
    onSecretSettled();
  };

  const save = async () => {
    if (saving) return;
    const url = draft.trim();
    if (!isHttpsUrl(url)) {
      setError('Enter a full https:// URL, for example https://shop.example.com/fastlinq/webhook');
      return;
    }
    if (current && !confirm(`Saving gives the ${label.toLowerCase()} a new signing secret. ${client.name} must switch to it, or their signature checks will fail. Continue?`)) return;
    setSaving(true);
    onBusyChange(true);
    setError(null);
    try {
      const { res, body } = await put(url);
      if (!res.ok) {
        const msg = apiError(res, body, 'Failed to save webhook');
        if (outcomeUnknown(res)) {
          // It may have been saved with a new signing secret before the error came back.
          dropSecret();
          setError(`${sentence(msg)} The webhook may have been saved anyway with a new signing secret, so a secret shown before may no longer work. Save it again to get a fresh one.`);
        } else {
          setError(msg);
        }
        onChanged();
        return;
      }
      setOverride(body.webhook_url ?? url);
      setEditing(false);
      setDraft('');
      if (typeof body.signing_secret === 'string' && body.signing_secret) {
        setSecret(body.signing_secret);
        onSecretShown();
      } else {
        // Any earlier secret was replaced on the server, so it must not stay on screen.
        dropSecret();
        setError('Saved, but the server did not return a signing secret. Save it again to get a new one.');
      }
      onChanged();
    } catch {
      // The server may have saved it (and rotated the secret) before the connection dropped.
      dropSecret();
      setError('Could not reach the server, so the webhook may or may not have been saved, and its signing secret may have been replaced. Save it again to get a fresh one.');
      onChanged();
    } finally {
      setSaving(false);
      onBusyChange(false);
    }
  };

  const clear = async () => {
    if (saving || !current) return;
    if (!confirm(`Clear the ${label.toLowerCase()} for ${client.name}? They will stop receiving ${mode} events and its signing secret is deleted.`)) return;
    setSaving(true);
    onBusyChange(true);
    setError(null);
    try {
      const { res, body } = await put('');
      if (!res.ok) {
        const msg = apiError(res, body, 'Failed to clear webhook');
        if (outcomeUnknown(res)) {
          // It may have been cleared (deleting its signing secret) before the error came back.
          dropSecret();
          setError(`${sentence(msg)} The webhook may have been cleared anyway, which deletes its signing secret. Reload this page to check, then save the webhook again if the partner still needs it.`);
        } else {
          setError(msg);
        }
        onChanged();
        return;
      }
      setOverride(null);
      setEditing(false);
      setDraft('');
      dropSecret();
      onChanged();
    } catch {
      dropSecret();
      setError('Could not reach the server, so the webhook may or may not have been cleared, and its signing secret may have been deleted. Reload this page to check, then save the webhook again if the partner still needs it.');
      onChanged();
    } finally {
      setSaving(false);
      onBusyChange(false);
    }
  };

  return (
    <div style={{ padding: 14, border: '1px solid var(--line, #e5e7eb)', borderRadius: 10, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{label}</span>
        <ModeBadge mode={mode} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 10 }}>
        {mode === 'test'
          ? 'Receives events for deliveries made with test keys only, signed with its own secret.'
          : 'Receives events for real deliveries made with live keys. Test events are never sent here.'}
      </div>

      {!available && (
        <div style={warnBox}>
          Not available until the sandbox migration has been run. Run it, then reload this page.
        </div>
      )}

      {available && current && !editing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <code style={{ flex: 1, minWidth: 0, fontSize: 12, wordBreak: 'break-all', padding: '6px 10px', background: 'var(--paper-2, #f6f7fa)', borderRadius: 7 }}>
            {current}
          </code>
          <button onClick={() => { setEditing(true); setDraft(current); setError(null); }} disabled={saving} style={smallBtn}>
            Change
          </button>
          <button onClick={clear} disabled={saving} style={{ ...dangerBtn, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Clearing…' : 'Clear'}
          </button>
        </div>
      )}

      {showInput && (
        <>
          {!current && <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 6 }}>Not set.</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="url"
              value={draft}
              onChange={e => { setDraft(e.target.value); setError(null); }}
              onKeyDown={e => { if (e.key === 'Enter') save(); }}
              placeholder="https://shop.example.com/fastlinq/webhook"
              aria-label={`${label} URL`}
              style={{ flex: 1, minWidth: 200, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line, #e5e7eb)', fontSize: 13 }}
            />
            <button
              onClick={save}
              disabled={saving || !draft.trim()}
              style={{ ...primaryBtn, padding: '8px 14px', opacity: saving || !draft.trim() ? 0.6 : 1, cursor: saving ? 'default' : 'pointer' }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {current && (
              <button onClick={() => { setEditing(false); setDraft(''); setError(null); }} disabled={saving} style={{ ...smallBtn, fontSize: 13, padding: '8px 12px' }}>
                Cancel
              </button>
            )}
          </div>
        </>
      )}

      {error && <div role="alert" style={{ fontSize: 12, color: '#b91c1c', marginTop: 6 }}>{error}</div>}

      {secret && (
        <SecretReveal
          title={`${label} signing secret for ${client.name}`}
          note="Copy it now and give it to the partner. It is shown only once. They use it to check the X-FastLinQ-Signature header (sha256 HMAC of the raw request body)."
          value={secret}
          onCopied={onSecretSettled}
          onDone={() => { setSecret(null); onSecretSettled(); }}
        />
      )}
    </div>
  );
}

interface PartnerDrawerProps {
  open: boolean;
  token: string;
  client: ApiClientInfo | null;
  keys: ApiKeyRow[];
  onClose: () => void;
  onChanged: () => void;
}

/** Matches the slide in admin.css (.drawer). */
const DRAWER_SLIDE = 'transform .28s cubic-bezier(.4,0,.2,1)';

/** Elements the focus trap cycles through. */
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** What the drawer is waiting on, for the notice that explains why it will not close. */
function busyText(busy: string[], adding: KeyMode | null): string {
  if (busy.length > 1) return 'Waiting for the server.';
  switch (busy[0]) {
    case 'key': return adding ? `Creating the ${adding} key.` : 'Creating the key.';
    case 'webhook-live': return 'Updating the live webhook.';
    case 'webhook-test': return 'Updating the test webhook.';
    default: return 'Waiting for the server.';
  }
}

/** Partner-level actions: extra keys (live or test) and both webhook endpoints. */
function PartnerDrawer({ open, token, client, keys, onClose, onChanged }: PartnerDrawerProps) {
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<KeyMode | null>(null);
  const [addedKey, setAddedKey] = useState<CreatedKey | null>(null);
  // Secrets on screen that have not been copied or dismissed yet.
  const unsavedRef = useRef<Set<string>>(new Set());
  const [unsaved, setUnsaved] = useState<string[]>([]);
  // Requests in flight ('key', 'webhook-live', 'webhook-test'). Their responses can carry a
  // secret that is shown only once, so the drawer refuses to close until they finish.
  // The close paths read the refs, which change synchronously: a response marks its secret
  // unsaved before it clears busy, so no close can slip between the two.
  const busyRef = useRef<Set<string>>(new Set());
  const [busy, setBusy] = useState<string[]>([]);
  // Someone tried to close while a request was in flight: the notice says why it stayed open.
  const [closeBlocked, setCloseBlocked] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const clientId = client?.id ?? null;
  const isBusy = busy.length > 0;

  // Start clean for every partner opened, and drop any secrets once closed. Closing is
  // refused while a request is in flight, so this never runs under a pending response.
  useEffect(() => {
    setError(null);
    setAddedKey(null);
    unsavedRef.current.clear();
    setUnsaved([]);
    setCloseBlocked(false);
  }, [open, clientId]);

  const markUnsaved = useCallback((id: string) => {
    unsavedRef.current.add(id);
    setUnsaved(Array.from(unsavedRef.current));
  }, []);
  const markSaved = useCallback((id: string) => {
    unsavedRef.current.delete(id);
    setUnsaved(Array.from(unsavedRef.current));
  }, []);

  const markBusy = useCallback((id: string) => {
    busyRef.current.add(id);
    setBusy(Array.from(busyRef.current));
  }, []);
  const markIdle = useCallback((id: string) => {
    busyRef.current.delete(id);
    setBusy(Array.from(busyRef.current));
    if (busyRef.current.size === 0) setCloseBlocked(false);
  }, []);

  const requestClose = useCallback(() => {
    if (busyRef.current.size > 0) {
      setCloseBlocked(true);
      return;
    }
    if (unsavedRef.current.size > 0 && !confirm('A key or signing secret on screen has not been copied yet. It cannot be shown again. Close anyway?')) return;
    onClose();
  }, [onClose]);

  // Escape closes (when allowed). Tab stays inside the open drawer, so the page behind it
  // (another partner, another admin tab) cannot be reached while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        requestClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const el = drawerRef.current;
      if (!el) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(n => n.getClientRects().length > 0);
      const active = document.activeElement;
      if (!items.length) {
        e.preventDefault();
        el.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (!active || !el.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && (active === first || active === el)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, requestClose]);

  // The closed drawer stays mounted (it slides out), so it is made inert: nothing in it can
  // be focused, clicked or read out. Focus moves into it on open and back out on close.
  useIsoLayoutEffect(() => {
    const el = drawerRef.current;
    if (!el) return;
    if (open) {
      const active = document.activeElement;
      returnFocusRef.current = active instanceof HTMLElement && !el.contains(active) ? active : null;
      el.inert = false;
      el.focus({ preventScroll: true });
      return;
    }
    const active = document.activeElement;
    if (!active || active === document.body || el.contains(active)) {
      const back = returnFocusRef.current;
      if (back?.isConnected) back.focus();
      else if (active instanceof HTMLElement && el.contains(active)) active.blur();
    }
    returnFocusRef.current = null;
    el.inert = true;
  }, [open]);

  // Reloading or leaving the page would also lose a pending or uncopied secret.
  useEffect(() => {
    if (!isBusy && unsaved.length === 0) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isBusy, unsaved.length]);

  const addKey = async (mode: KeyMode) => {
    if (!client || busyRef.current.has('key')) return;
    if (unsavedRef.current.has('key') && !confirm('The key on screen has not been copied yet and will be replaced. Continue?')) return;
    const { id, name } = client;
    markBusy('key');
    setAdding(mode);
    setError(null);
    try {
      const res = await fetch(`${API}/admin/api-clients/${id}/keys`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const body = await readBody(res);
      if (!res.ok) {
        setError(apiError(res, body, 'Failed to add key'));
        return;
      }
      const created = toCreatedKey(body, name);
      if (!created.api_key) {
        setError('The server reported success but returned no key. Revoke any key in the list that nobody received, then add a new one.');
        onChanged();
        return;
      }
      setAddedKey(created);
      markUnsaved('key');
      onChanged();
    } catch {
      // The server may have minted the key before the connection dropped.
      setError('Could not reach the server, so the key may or may not have been created. If a new key appears in the list, revoke it and add another.');
      onChanged();
    } finally {
      setAdding(null);
      markIdle('key');
    }
  };

  const disabled = client?.is_active === false;
  const sandboxReady = client ? hasSandboxColumns(client) : true;

  // Visible while sliding out, then hidden as well as inert.
  const drawerStyle: CSSProperties = open
    ? { outline: 'none', visibility: 'visible' }
    : { outline: 'none', visibility: 'hidden', transition: `${DRAWER_SLIDE}, visibility 0s linear .28s` };

  return (
    <>
      <div
        className={`drawer-overlay${open ? ' open' : ''}`}
        onClick={requestClose}
        style={isBusy ? { cursor: 'not-allowed' } : undefined}
      ></div>
      <div
        ref={drawerRef}
        className={`drawer${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Partner keys and webhooks"
        aria-busy={isBusy || undefined}
        tabIndex={-1}
        style={drawerStyle}
      >
        <div className="drawer-header">
          <div className="drawer-title">
            {client?.name ?? 'Partner'}
            {disabled && <span className="badge badge-cancelled" style={{ marginLeft: 10, verticalAlign: 'middle' }}>Disabled</span>}
            {client?.contact_email && (
              <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--ink-mute)' }}>{client.contact_email}</div>
            )}
          </div>
          <button
            className="drawer-close"
            onClick={requestClose}
            aria-label={isBusy ? 'Close (unavailable until the request finishes)' : 'Close'}
            aria-disabled={isBusy || undefined}
            title={isBusy ? 'Wait for the request to finish' : undefined}
            style={isBusy ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
          >
            <X />
          </button>
        </div>

        {/* Outside the scrolling body, so it is in view whatever was used to try to close. */}
        <div role="status" aria-live="polite">
          {isBusy && (
            <div
              style={{
                padding: '10px 24px', fontSize: 12, borderBottom: '1px solid var(--border, #e5e7eb)',
                ...(closeBlocked
                  ? { background: 'rgba(245,158,11,.12)', color: '#92400e', fontWeight: 600 }
                  : { background: 'var(--paper-2, #f6f7fa)', color: 'var(--ink-mute)' }),
              }}
            >
              {closeBlocked ? 'Cannot close yet. ' : ''}
              {busyText(busy, adding)} The drawer stays open until the server answers, because a new key or signing secret is shown only once.
            </div>
          )}
        </div>

        <div className="drawer-body">
          {client && !sandboxReady && (
            <div style={{ ...warnBox, marginBottom: 16 }}>
              The sandbox migration (database/api_sandbox.sql) has not been run yet. Until it is, test keys cannot create deliveries and test webhooks cannot be saved.
            </div>
          )}

          {/* ── Keys ── */}
          <div className="drawer-section">
            <div className="drawer-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <KeyRound size={13} /> API keys
            </div>
            {keys.length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>No keys yet.</div>}
            {keys.map(k => {
              const revoked = isRevoked(k);
              return (
                <div key={k.id} className="drawer-row" style={{ alignItems: 'center' }}>
                  <span className="label" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <code style={{ fontSize: 12 }}>{k.key_prefix}…</code>
                    <ModeBadge mode={keyMode(k)} />
                  </span>
                  <span className="value" style={{ fontSize: 12, fontWeight: 400, color: revoked ? '#b91c1c' : 'var(--ink-mute)' }}>
                    {revoked ? 'Revoked' : k.last_used_at ? `Last used ${fmtDate(k.last_used_at)}` : 'Never used'}
                  </span>
                </div>
              );
            })}

            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {(['test', 'live'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => addKey(mode)}
                  disabled={!client || !!adding || disabled}
                  style={{ ...smallBtn, fontSize: 13, padding: '7px 12px', opacity: !client || adding || disabled ? 0.6 : 1, cursor: !client || adding || disabled ? 'default' : 'pointer' }}
                >
                  <Plus size={14} />
                  {adding === mode ? 'Adding…' : `Add ${mode} key`}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 8 }}>
              {disabled
                ? 'This partner is disabled, so no new keys can be issued.'
                : 'A partner can hold several keys. Test keys use the same base URL and endpoints but only create simulated deliveries, so the partner can build safely before going live.'}
            </div>

            {/* Next to the buttons, so it is in view even when the key list is long. */}
            {error && <div role="alert" style={{ ...errorBox, margin: '12px 0 0' }}>{error}</div>}

            {addedKey && (
              <SecretReveal
                title={`${MODE_META[addedKey.mode].label} key created for ${addedKey.client}`}
                note={keyRevealNote(addedKey.mode)}
                value={addedKey.api_key}
                onCopied={() => markSaved('key')}
                onDone={() => { setAddedKey(null); markSaved('key'); }}
              />
            )}
          </div>

          {/* ── Webhooks ── */}
          <div className="drawer-section">
            <div className="drawer-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Webhook size={13} /> Webhooks
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 12 }}>
              Events: offer.received, delivery.assigned, delivery.completed and delivery.cancelled. Live and test events never mix: test events go only to the test URL and carry the header X-FastLinQ-Mode: test.
            </div>
            {client && MODES.map(mode => (
              <WebhookEditor
                // Remount on close so drafts and secrets never outlive the drawer. Closing waits
                // for any save in flight, so this never unmounts an editor mid-request.
                key={`${client.id}-${mode}-${open ? 'open' : 'closed'}`}
                token={token}
                client={client}
                mode={mode}
                onChanged={onChanged}
                onBusyChange={b => (b ? markBusy : markIdle)(`webhook-${mode}`)}
                onSecretShown={() => markUnsaved(`webhook-${mode}`)}
                onSecretSettled={() => markSaved(`webhook-${mode}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ApiKeysTab({ token, registerLeaveGuard }: ApiKeysTabProps) {
  const [rows, setRows] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  // Loading the list and the actions on it fail separately, so reloading the list (which
  // every action does) never wipes an action's error, such as a create whose result is unknown.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [scopes, setScopes] = useState<string[]>([...ALL_SCOPES]);
  const [createMode, setCreateMode] = useState<KeyMode>('live');
  const [creating, setCreating] = useState(false);

  // One-time reveal of a freshly created key
  const [newKey, setNewKey] = useState<CreatedKey | null>(null);
  // The revealed key has not been copied or dismissed with Done yet.
  const [newKeyUnsaved, setNewKeyUnsaved] = useState(false);
  // The guards read these refs, which change synchronously: a response marks its key unsaved
  // before it clears creating, so no leave or discard can slip between the two.
  const creatingRef = useRef(false);
  const newKeyUnsavedRef = useRef(false);

  // Partner drawer (extra keys + webhooks). The id is kept while it slides shut.
  const [partnerId, setPartnerId] = useState<string | null>(null);
  // The partner as it was when opened, used if a refresh ever drops it from the list,
  // so the drawer is never shut from outside while a request is in flight.
  const [partnerSnapshot, setPartnerSnapshot] = useState<ApiClientInfo | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API}/admin/api-keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setLoadError(apiError(res, await readBody(res), 'Failed to load API keys'));
        setEmpty(true);
        return;
      }
      const body = await res.json();
      const data: ApiKeyRow[] = body.data ?? [];
      setRows(data);
      setEmpty(data.length === 0);
    } catch {
      setLoadError('Failed to load API keys');
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

  const markCreating = useCallback((value: boolean) => {
    creatingRef.current = value;
    setCreating(value);
  }, []);
  const markNewKeyUnsaved = useCallback((value: boolean) => {
    newKeyUnsavedRef.current = value;
    setNewKeyUnsaved(value);
  }, []);

  const dismissNewKey = useCallback(() => {
    setNewKey(null);
    markNewKeyUnsaved(false);
  }, [markNewKeyUnsaved]);

  /** True when there is no uncopied key on screen, or the admin agrees to lose it. */
  const confirmDiscardNewKey = useCallback((): boolean => (
    !newKeyUnsavedRef.current
    || confirm('The new API key on screen has not been copied yet. It cannot be shown again. Discard it?')
  ), []);

  // Asked by the admin shell before it unmounts this tab. The partner drawer needs no part
  // in this: while it is open its overlay covers the sidebar and the topbar.
  const confirmLeave = useCallback((): boolean => {
    if (creatingRef.current) {
      return confirm('A new partner and its first key are still being created. If you leave now, the key is created but never shown, and you will have to revoke it. Leave anyway?');
    }
    if (newKeyUnsavedRef.current) {
      return confirm('The new API key on screen has not been copied yet. It cannot be shown again. Leave anyway?');
    }
    return true;
  }, []);

  useEffect(() => registerLeaveGuard?.(confirmLeave), [registerLeaveGuard, confirmLeave]);

  // Reloading or leaving the page would also lose a pending or uncopied key.
  useEffect(() => {
    if (!creating && !newKeyUnsaved) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [creating, newKeyUnsaved]);

  const resetForm = () => {
    setShowForm(false);
    setName('');
    setContactEmail('');
    setScopes([...ALL_SCOPES]);
    setCreateMode('live');
  };

  /** "New API key": opens or closes the form. The key on screen goes either way. */
  const toggleForm = () => {
    if (creatingRef.current) return;
    if (!confirmDiscardNewKey()) return;
    dismissNewKey();
    setShowForm(v => !v);
  };

  const handleCreate = async () => {
    const partnerName = name.trim();
    if (!partnerName || creatingRef.current) return;
    // The form is hidden while a key is on screen, so this is only a safety net.
    if (!confirmDiscardNewKey()) return;
    markCreating(true);
    setError(null);
    // Retrying after an unknown result would create a second partner with the same name.
    const mayExist = `The list is being reloaded: if ${partnerName} shows up in it, it was created, so do not create it again. Revoke its key (nobody has seen it) and use Manage on its row to add a new one.`;
    try {
      const res = await fetch(`${API}/admin/api-keys`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: partnerName,
          contact_email: contactEmail.trim() || undefined,
          scopes,
          mode: createMode,
        }),
      });
      const body = await readBody(res);
      if (!res.ok) {
        const msg = apiError(res, body, 'Failed to create API key');
        if (outcomeUnknown(res)) {
          setError(`${sentence(msg)} ${partnerName} may have been created anyway. ${mayExist}`);
          fetchKeys();
        } else {
          setError(msg);
        }
        return;
      }
      const created = toCreatedKey(body, partnerName);
      // The partner exists now, so the form must not invite a second one.
      resetForm();
      fetchKeys();
      if (!created.api_key) {
        dismissNewKey();
        setError(`The server reported success but returned no key. ${partnerName} was created, so do not create it again. Revoke its key in the list (nobody has seen it) and use Manage on its row to add a new one.`);
        return;
      }
      setNewKey(created);
      markNewKeyUnsaved(true);
    } catch {
      // The server may have created the partner and its key before the connection dropped.
      setError(`Could not reach the server, so ${partnerName} and its key may or may not have been created. ${mayExist}`);
      fetchKeys();
    } finally {
      markCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this API key? The partner will lose access immediately and it cannot be undone.')) return;
    setError(null);
    try {
      const res = await fetch(`${API}/admin/api-keys/${id}/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchKeys();
      else setError(apiError(res, await readBody(res), 'Failed to revoke key'));
    } catch {
      setError('Failed to revoke key');
    }
  };

  const openPartner = (c: ApiClientInfo) => {
    // Only the drawer closes the drawer (it refuses while a request is in flight), so an
    // open one is never switched to another partner underneath a pending response.
    if (drawerOpen) return;
    setPartnerId(c.id);
    setPartnerSnapshot(c);
    setDrawerOpen(true);
  };
  const closePartner = useCallback(() => setDrawerOpen(false), []);

  const partner = partnerId ? rows.find(r => r.api_clients?.id === partnerId)?.api_clients ?? partnerSnapshot : null;
  const partnerKeys = partnerId ? rows.filter(r => r.api_clients?.id === partnerId) : [];
  // Unknown until at least one partner exists; only warn when we know.
  const sandboxMissing = rows.some(r => r.api_clients) && !rows.some(r => r.api_clients && hasSandboxColumns(r.api_clients));

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
            onClick={toggleForm}
            disabled={creating}
            title={creating ? 'Wait until the key has been created' : undefined}
            style={{ ...primaryBtn, opacity: creating ? 0.6 : 1, cursor: creating ? 'default' : 'pointer' }}
          >
            <Plus size={15} /> New API key
          </button>
        </div>

        {loadError && (
          <div role="alert" style={errorBox}>
            {loadError}
          </div>
        )}

        {error && (
          <div role="alert" style={errorBox}>
            {error}
          </div>
        )}

        {/* One-time key reveal */}
        {newKey && (
          <SecretReveal
            key={newKey.api_key}
            title={`${MODE_META[newKey.mode].label} key created for ${newKey.client}`}
            note={keyRevealNote(newKey.mode)}
            value={newKey.api_key}
            onCopied={() => markNewKeyUnsaved(false)}
            onDone={dismissNewKey}
          />
        )}

        {/* Create form */}
        {showForm && (
          <div style={{ margin: '12px 0', padding: '16px', border: '1px solid var(--line, #e5e7eb)', borderRadius: 10 }}>
            <div style={{ display: 'grid', gap: 12, maxWidth: 460 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
                This creates a new partner with its first key. To give an existing partner another key, use Manage on its row.
              </div>
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
              <div style={{ fontSize: 13, fontWeight: 600 }} role="radiogroup" aria-label="Key mode">
                Mode
                <div style={{ display: 'flex', gap: 16, marginTop: 6, fontWeight: 400, flexWrap: 'wrap' }}>
                  {MODES.map(mode => (
                    <label key={mode} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input type="radio" name="api-key-mode" checked={createMode === mode} onChange={() => setCreateMode(mode)} />
                      {mode === 'live' ? 'Live (real deliveries)' : 'Test (simulated deliveries)'}
                    </label>
                  ))}
                </div>
                <div style={{ fontWeight: 400, fontSize: 12, color: 'var(--ink-mute)', marginTop: 6 }}>
                  Test keys only create simulated deliveries: no real drivers, payments or notifications.
                </div>
                {createMode === 'test' && sandboxMissing && (
                  <div style={{ ...warnBox, fontWeight: 400, marginTop: 8 }}>
                    The sandbox migration (database/api_sandbox.sql) has not been run yet, so test keys cannot create deliveries until it is.
                  </div>
                )}
              </div>
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
                  {creating ? 'Creating…' : `Create ${createMode} key`}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  disabled={creating}
                  style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--line, #e5e7eb)', background: '#fff', color: 'var(--ink)', cursor: creating ? 'default' : 'pointer', opacity: creating ? 0.6 : 1, fontSize: 13 }}
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
              const revoked = isRevoked(k);
              const client = k.api_clients;
              return (
                <tr key={k.id}>
                  <td>
                    {client?.name ?? '—'}
                    {client?.contact_email && (
                      <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{client.contact_email}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <code style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{k.key_prefix}…</code>
                      <ModeBadge mode={keyMode(k)} />
                    </div>
                  </td>
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
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {client && (
                        <button
                          onClick={() => openPartner(client)}
                          title={`Keys and webhooks for ${client.name}`}
                          style={smallBtn}
                        >
                          <Settings2 size={13} /> Manage
                        </button>
                      )}
                      {!revoked && (
                        <button
                          onClick={() => handleRevoke(k.id)}
                          title="Revoke key"
                          style={dangerBtn}
                        >
                          <Ban size={13} /> Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PartnerDrawer
        open={drawerOpen && !!partner}
        token={token}
        client={partner}
        keys={partnerKeys}
        onClose={closePartner}
        onChanged={fetchKeys}
      />
    </div>
  );
}
