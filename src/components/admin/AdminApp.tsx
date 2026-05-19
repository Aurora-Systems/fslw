'use client';

import { useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import OverviewTab from './tabs/OverviewTab';
import JobsTab from './tabs/JobsTab';
import UsersTab from './tabs/UsersTab';
import CouriersTab from './tabs/CouriersTab';
import VerificationsTab from './tabs/VerificationsTab';
import VehiclesTab from './tabs/VehiclesTab';
import TransactionsTab from './tabs/TransactionsTab';
import VerificationDrawer from './VerificationDrawer';
import VehicleModal from './VehicleModal';

interface AdminData {
  role: string;
  name: string;
  is_active: boolean;
}

interface AdminAppProps {
  session: Session;
  adminData: AdminData;
  onLogout: () => void;
}

const TAB_TITLES: Record<string, string> = {
  overview: 'Dashboard',
  jobs: 'Jobs',
  users: 'Users',
  couriers: 'Couriers',
  verifications: 'Identity Verifications',
  vehicles: 'Registered Vehicles',
  transactions: 'Transactions',
};

type TabKey = 'overview' | 'jobs' | 'users' | 'couriers' | 'verifications' | 'vehicles' | 'transactions';

export default function AdminApp({ session, adminData, onLogout }: AdminAppProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [initialisedTabs, setInitialisedTabs] = useState<Set<TabKey>>(new Set<TabKey>(['overview']));
  const [lastUpdated, setLastUpdated] = useState(`Updated ${new Date().toLocaleTimeString()}`);
  const [pendingBadge, setPendingBadge] = useState(0);
  const [verifyBadge, setVerifyBadge] = useState(0);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);
  const [drawerUserName, setDrawerUserName] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVehicleId, setModalVehicleId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');

  // Refresh key to force tab remount
  const [refreshKey, setRefreshKey] = useState(0);

  const adminName = adminData?.name || session.user?.email?.split('@')[0] || 'Admin';
  const adminRole = adminData?.role || 'staff';
  const currentToken = session.access_token;

  const handleTabChange = (tab: string) => {
    const t = tab as TabKey;
    setActiveTab(t);
    setInitialisedTabs(prev => new Set<TabKey>([...Array.from(prev), t]));
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    setInitialisedTabs(new Set<TabKey>([activeTab]));
    setLastUpdated(`Updated ${new Date().toLocaleTimeString()}`);
  };

  const openVerifyDrawer = useCallback((userId: string, name: string) => {
    setDrawerUserId(userId);
    setDrawerUserName(name);
    setDrawerOpen(true);
  }, []);

  const openVehicleImages = useCallback((vehicleId: string, title: string) => {
    setModalVehicleId(vehicleId);
    setModalTitle(title);
    setModalOpen(true);
  }, []);

  return (
    <div id="dashboard-page">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={onLogout}
        adminName={adminName}
        adminRole={adminRole}
        pendingBadge={pendingBadge}
        verifyBadge={verifyBadge}
      />

      <div className="main">
        <AdminTopbar
          title={TAB_TITLES[activeTab] || activeTab}
          lastUpdated={lastUpdated}
          onRefresh={handleRefresh}
        />
        <div className="content">
          {activeTab === 'overview' && (
            <OverviewTab
              key={`overview-${refreshKey}`}
              onViewAllJobs={() => handleTabChange('jobs')}
              onPendingBadge={setPendingBadge}
              token={currentToken}
            />
          )}
          {activeTab === 'jobs' && initialisedTabs.has('jobs') && (
            <JobsTab key={`jobs-${refreshKey}`} token={currentToken} />
          )}
          {activeTab === 'users' && initialisedTabs.has('users') && (
            <UsersTab key={`users-${refreshKey}`} token={currentToken} />
          )}
          {activeTab === 'couriers' && initialisedTabs.has('couriers') && (
            <CouriersTab
              key={`couriers-${refreshKey}`}
              onOpenVerifyDrawer={openVerifyDrawer}
              token={currentToken}
            />
          )}
          {activeTab === 'verifications' && initialisedTabs.has('verifications') && (
            <VerificationsTab
              key={`verifications-${refreshKey}`}
              onOpenVerifyDrawer={openVerifyDrawer}
              onVerifyBadge={setVerifyBadge}
              token={currentToken}
            />
          )}
          {activeTab === 'vehicles' && initialisedTabs.has('vehicles') && (
            <VehiclesTab
              key={`vehicles-${refreshKey}`}
              onOpenVehicleImages={openVehicleImages}
              token={currentToken}
            />
          )}
          {activeTab === 'transactions' && initialisedTabs.has('transactions') && (
            <TransactionsTab key={`transactions-${refreshKey}`} token={currentToken} />
          )}
        </div>
      </div>

      <VerificationDrawer
        open={drawerOpen}
        userId={drawerUserId}
        userName={drawerUserName}
        onClose={() => setDrawerOpen(false)}
        currentToken={currentToken}
      />

      <VehicleModal
        open={modalOpen}
        vehicleId={modalVehicleId}
        title={modalTitle}
        onClose={() => setModalOpen(false)}
        currentToken={currentToken}
      />
    </div>
  );
}
