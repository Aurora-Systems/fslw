'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AdminData {
  role: string;
  name: string;
  is_active: boolean;
}

interface AdminLoginProps {
  onLogin: (session: Session, adminData: AdminData) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sb = createClient();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: adminData, error: adminError } = await sb
      .from('admins')
      .select('role,name,is_active')
      .eq('user_id', data.user.id)
      .single();

    if (adminError || !adminData?.is_active) {
      await sb.auth.signOut();
      setError('Access denied — not an admin.');
      setLoading(false);
      return;
    }

    onLogin(data.session, adminData);
  };

  return (
    <div id="login-page">
      <div className="login-card">
        <Image
          src="/assets/fastlinq-logo.png"
          alt="FastLinQ"
          width={120}
          height={32}
          className="login-logo"
          style={{ objectFit: 'contain' }}
        />
        <div className="login-badge">Admin Portal</div>
        <h1 className="login-title">Welcome back</h1>
        <p className="login-sub">Sign in with your FastLinQ admin credentials.</p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email address
            </label>
            <input
              className="form-input"
              type="email"
              id="email"
              placeholder="admin@fastlinq.app"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              className="form-input"
              type="password"
              id="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="login-footer">Access restricted to authorised FastLinQ personnel only.</p>
      </div>
    </div>
  );
}
