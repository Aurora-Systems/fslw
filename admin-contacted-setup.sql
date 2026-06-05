-- ============================================================
--  FastLinQ — Admin Contacted Users Table
--  Run in Supabase SQL Editor after admin-setup.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_contacted_users (
  user_id      uuid        PRIMARY KEY,          -- auth.users.id (cross-schema, no FK)
  contacted_at timestamptz NOT NULL DEFAULT now(),
  contacted_by uuid                              -- admin's auth user id
);

CREATE INDEX IF NOT EXISTS admin_contacted_users_contacted_by_idx
  ON public.admin_contacted_users (contacted_by);

ALTER TABLE public.admin_contacted_users ENABLE ROW LEVEL SECURITY;

-- Any active admin can read, insert, or delete contacted records
CREATE POLICY "Admins can manage contacted users"
  ON public.admin_contacted_users FOR ALL
  USING  (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
