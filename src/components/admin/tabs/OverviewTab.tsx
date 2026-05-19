'use client';

import { useEffect, useState } from 'react';
import { Users, Bike, Package, Clock } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE;

interface OverviewTabProps {
  onViewAllJobs: () => void;
  onPendingBadge: (count: number) => void;
  token: string;
}

interface RecentJob {
  id: string;
  status: string;
  delivery_fee: number;
  created_at: string;
  pickup_location: { formatted_address?: string } | null;
  dropoff_location: { formatted_address?: string } | null;
  users: { first_name: string; last_name: string } | null;
}

function statusBadge(status: string | null | undefined): string {
  const s = (status || 'pending').toLowerCase();
  const map: Record<string, string> = {
    pending: 'badge-pending',
    active: 'badge-active',
    in_progress: 'badge-active',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    canceled: 'badge-cancelled',
  };
  return `<span class="badge ${map[s] || 'badge-pending'}">${s}</span>`;
}

function userName(u: { first_name?: string; last_name?: string } | null): string {
  if (!u) return '—';
  return `${u.first_name || ''} ${u.last_name || ''}`.trim() || '—';
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function OverviewTab({ onViewAllJobs, onPendingBadge, token }: OverviewTabProps) {
  const [stats, setStats] = useState<any>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[] | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch(`${API}/admin/stats`, { headers });
        if (!res.ok) return;
        const body = await res.json();
        setStats(body);
        if (body.jobs?.pending > 0) onPendingBadge(body.jobs.pending);
      } finally {
        setLoadingStats(false);
      }
    };

    const loadRecentJobs = async () => {
      try {
        const res = await fetch(`${API}/admin/jobs?page=1&limit=8`, { headers });
        if (!res.ok) return;
        const body = await res.json();
        setRecentJobs((body.data ?? []) as RecentJob[]);
      } finally {
        setLoadingJobs(false);
      }
    };

    loadStats();
    loadRecentJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userCount = stats?.users?.total ?? 0;
  const courierCount = stats?.users?.couriers ?? 0;
  const jobCount = stats?.jobs?.total ?? 0;
  const pendingCount = stats?.jobs?.pending ?? 0;
  const completedCount = stats?.jobs?.completed ?? 0;
  const activeCount = stats?.jobs?.active ?? 0;

  return (
    <div className="tab-panel active">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon"><Users /></div>
          <div className="stat-card-label">Total Users</div>
          <div className="stat-card-value blue">
            {loadingStats ? '—' : userCount.toLocaleString()}
          </div>
          <div className="stat-card-sub">
            {loadingStats ? 'Loading…' : `${courierCount} couriers · ${userCount - courierCount} clients`}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon"><Bike /></div>
          <div className="stat-card-label">Couriers</div>
          <div className="stat-card-value green">
            {loadingStats ? '—' : courierCount.toLocaleString()}
          </div>
          <div className="stat-card-sub">{loadingStats ? 'Loading…' : 'registered drivers'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon"><Package /></div>
          <div className="stat-card-label">Total Jobs</div>
          <div className="stat-card-value blue">
            {loadingStats ? '—' : jobCount.toLocaleString()}
          </div>
          <div className="stat-card-sub">
            {loadingStats ? 'Loading…' : `${completedCount} completed · ${activeCount} active`}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon"><Clock /></div>
          <div className="stat-card-label">Pending Jobs</div>
          <div className="stat-card-value orange">
            {loadingStats ? '—' : pendingCount.toLocaleString()}
          </div>
          <div className="stat-card-sub">{loadingStats ? 'Loading…' : 'awaiting courier'}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Recent Jobs</div>
          <span className="panel-count">
            {recentJobs ? `${recentJobs.length} shown` : ''}
          </span>
          <button className="action-btn" style={{ marginLeft: 'auto' }} onClick={onViewAllJobs}>
            View all →
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Route</th>
              <th>Status</th>
              <th>Fee</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loadingJobs && (
              <tr className="state-row">
                <td colSpan={6}><span className="spinner"></span></td>
              </tr>
            )}
            {!loadingJobs && recentJobs?.length === 0 && (
              <tr className="state-row"><td colSpan={6}>No jobs yet</td></tr>
            )}
            {!loadingJobs && recentJobs?.map(j => (
              <tr key={j.id}>
                <td>
                  <code style={{ fontSize: '11px', color: 'var(--ink-mute)' }}>#{j.id}</code>
                </td>
                <td>{userName(j.users)}</td>
                <td style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {j.pickup_location?.formatted_address || '—'} → {j.dropoff_location?.formatted_address || '—'}
                </td>
                <td dangerouslySetInnerHTML={{ __html: statusBadge(j.status) }} />
                <td style={{ fontWeight: 600 }}>${(j.delivery_fee || 0).toFixed(2)}</td>
                <td style={{ color: 'var(--ink-mute)', fontSize: '12px' }}>{fmtDate(j.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
