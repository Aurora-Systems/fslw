-- ============================================================
--  FastLinQ — Admin Table Setup
--  Run this in your Supabase SQL editor (project → SQL Editor)
-- ============================================================

-- 1. Create the admins table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL UNIQUE,
  name       text NOT NULL,
  role       text NOT NULL DEFAULT 'staff'
               CHECK (role IN ('super_admin', 'admin', 'staff')),
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast user_id lookups (used by every authenticated request)
CREATE INDEX IF NOT EXISTS admins_user_id_idx ON public.admins (user_id);
CREATE INDEX IF NOT EXISTS admins_email_idx   ON public.admins (email);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER admins_set_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- 2. Row-Level Security
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Helper functions (SECURITY DEFINER = runs as owner, bypasses RLS, no recursion)
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = p_user_id AND is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = p_user_id AND role = 'super_admin' AND is_active = true
  );
END;
$$;

-- Active admins can read the full admins list
CREATE POLICY "Admins can view all admins"
  ON public.admins FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Only super_admins can insert/update/delete admin records
CREATE POLICY "Super admins can manage admins"
  ON public.admins FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));


-- 3. Helper function — check if a user_id is an active admin
--    Used by server-side auth checks
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id  = p_user_id
      AND is_active = true
  );
END;
$$;


-- 4. Create your first super-admin
-- ─────────────────────────────────────────────────────────────
-- STEP A: Create an auth user in Supabase Dashboard
--         (Authentication → Users → Add user)
--         OR run:
--
--   SELECT * FROM auth.users WHERE email = 'your-admin@email.com';
--
-- STEP B: Replace the UUID below with the auth user's id, then run:

INSERT INTO public.admins (user_id, email, name, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',  -- ← replace with real auth user UUID
  'admin@fastlinq.app',                    -- ← replace with admin email
  'FastLinQ Admin',                        -- ← replace with admin name
  'super_admin'
)
ON CONFLICT (user_id) DO NOTHING;


-- ============================================================
--  Additional admins — repeat this block for each staff member
-- ============================================================
-- INSERT INTO public.admins (user_id, email, name, role)
-- VALUES (
--   '<auth-user-uuid>',
--   'staff@fastlinq.app',
--   'Staff Name',
--   'staff'   -- or 'admin'
-- );


-- ============================================================
--  Verify setup
-- ============================================================
-- SELECT * FROM public.admins;
-- SELECT public.is_admin('<your-user-uuid>');
