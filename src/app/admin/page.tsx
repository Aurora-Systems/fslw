'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminApp from '@/components/admin/AdminApp';

interface AdminData {
  role: string;
  name: string;
  is_active: boolean;
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [checking, setChecking] = useState(true);

  const sb = createClient();

  const verifyAdmin = async (userId: string): Promise<AdminData | null> => {
    const { data, error } = await sb
      .from('admins')
      .select('role,name,is_active')
      .eq('user_id', userId)
      .single();
    return !error && data?.is_active ? data : null;
  };

  useEffect(() => {
    const check = async () => {
      const { data: { session: s } } = await sb.auth.getSession();
      if (s) {
        const ad = await verifyAdmin(s.user.id);
        if (ad) {
          setSession(s);
          setAdminData(ad);
        }
      }
      setChecking(false);
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = (s: Session, ad: AdminData) => {
    setSession(s);
    setAdminData(ad);
  };

  const handleLogout = async () => {
    await sb.auth.signOut();
    setSession(null);
    setAdminData(null);
  };

  if (checking) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg,#0f1827 0%,#1a2a40 50%,#0d1f35 100%)',
        }}
      >
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }}></span>
      </div>
    );
  }

  if (!session || !adminData) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <AdminApp
      session={session}
      adminData={adminData}
      onLogout={handleLogout}
    />
  );
}
