'use client';

import Image from 'next/image';
import { BarChart2, Package, Users, UserX, Bike, ShieldCheck, Car, CreditCard, LogOut } from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  adminName: string;
  adminRole: string;
  pendingBadge: number;
  verifyBadge: number;
  incompleteBadge: number;
}

export default function AdminSidebar({
  activeTab,
  onTabChange,
  onLogout,
  adminName,
  adminRole,
  pendingBadge,
  verifyBadge,
  incompleteBadge,
}: AdminSidebarProps) {
  const avatarLetter = adminName?.[0]?.toUpperCase() || 'A';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Image
          src="/assets/fastlinq-logo.png"
          alt="FastLinQ"
          width={100}
          height={26}
          className="sidebar-logo"
          style={{ objectFit: 'contain' }}
        />
        <div className="sidebar-badge">Admin Portal</div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Overview</div>
        <button
          className={`nav-item${activeTab === 'overview' ? ' active' : ''}`}
          onClick={() => onTabChange('overview')}
        >
          <span className="icon">
            <BarChart2 />
          </span>
          Dashboard
        </button>

        <div className="nav-section-label">Operations</div>
        <button
          className={`nav-item${activeTab === 'jobs' ? ' active' : ''}`}
          onClick={() => onTabChange('jobs')}
        >
          <span className="icon">
            <Package />
          </span>
          Jobs
          {pendingBadge > 0 && (
            <span className="nav-badge blue">{pendingBadge}</span>
          )}
        </button>
        <button
          className={`nav-item${activeTab === 'users' ? ' active' : ''}`}
          onClick={() => onTabChange('users')}
        >
          <span className="icon">
            <Users />
          </span>
          Users
        </button>
        <button
          className={`nav-item${activeTab === 'incomplete' ? ' active' : ''}`}
          onClick={() => onTabChange('incomplete')}
        >
          <span className="icon">
            <UserX />
          </span>
          Incomplete
          {incompleteBadge > 0 && (
            <span className="nav-badge" style={{ background: '#fef3c7', color: '#92400e' }}>{incompleteBadge}</span>
          )}
        </button>
        <button
          className={`nav-item${activeTab === 'couriers' ? ' active' : ''}`}
          onClick={() => onTabChange('couriers')}
        >
          <span className="icon">
            <Bike />
          </span>
          Couriers
        </button>

        <div className="nav-section-label">Reviews</div>
        <button
          className={`nav-item${activeTab === 'verifications' ? ' active' : ''}`}
          onClick={() => onTabChange('verifications')}
        >
          <span className="icon">
            <ShieldCheck />
          </span>
          Verifications
          {verifyBadge > 0 && (
            <span className="nav-badge">{verifyBadge}</span>
          )}
        </button>
        <button
          className={`nav-item${activeTab === 'vehicles' ? ' active' : ''}`}
          onClick={() => onTabChange('vehicles')}
        >
          <span className="icon">
            <Car />
          </span>
          Vehicles
        </button>

        <div className="nav-section-label">Finance</div>
        <button
          className={`nav-item${activeTab === 'transactions' ? ' active' : ''}`}
          onClick={() => onTabChange('transactions')}
        >
          <span className="icon">
            <CreditCard />
          </span>
          Transactions
        </button>
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{avatarLetter}</div>
          <div>
            <div className="sidebar-user-name">{adminName}</div>
            <div className="sidebar-user-role">{adminRole.replace('_', ' ')}</div>
          </div>
          <button className="btn-logout" title="Sign out" onClick={onLogout}>
            <LogOut />
          </button>
        </div>
      </div>
    </aside>
  );
}
