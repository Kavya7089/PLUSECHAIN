-- ============================================================================
-- PulseChain v3.1.0 — Supabase PostgreSQL Schema & Security Infrastructure
-- Single Source of Truth for Auth, Tenant Scopes, and Non-ERP Audit Logs
-- ERP Core (ZPULSE_INV & ZPULSE_SUPP) resides strictly in SAP S/4HANA
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USER PROFILES TABLE (Tenant Scopes & RBAC Mapping)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('HOSPITAL_MANAGER', 'SHOPKEEPER', 'SUPPLIER', 'REGIONAL_ADMIN')),
  hospital_id TEXT, -- e.g. 'H001' to 'H006' (Mandatory for HOSPITAL_MANAGER & SHOPKEEPER)
  supplier_id TEXT, -- e.g. 'V1001' to 'V1003' (Mandatory for SUPPLIER)
  city TEXT,        -- e.g. 'BHOPAL', 'INDORE', 'JABALPUR'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_hospital ON public.user_profiles(hospital_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_supplier ON public.user_profiles(supplier_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON public.user_profiles(city);

-- 3. AUTO-PROFILE TRIGGER ON auth.users
-- Reads metadata passed during admin.createUser or signUp and syncs public.user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_role TEXT;
  v_hospital_id TEXT;
  v_supplier_id TEXT;
  v_city TEXT;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'SHOPKEEPER');
  v_hospital_id := NEW.raw_user_meta_data->>'hospital_id';
  v_supplier_id := NEW.raw_user_meta_data->>'supplier_id';
  v_city := NEW.raw_user_meta_data->>'city';

  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    hospital_id,
    supplier_id,
    city,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_role,
    v_hospital_id,
    v_supplier_id,
    v_city,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    hospital_id = EXCLUDED.hospital_id,
    supplier_id = EXCLUDED.supplier_id,
    city = EXCLUDED.city;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. NON-ERP AUDIT LOGGING TABLES (App-Layer History Only)
-- Note: Real-time stock counts and inventory ledgers are stored strictly in SAP HANA ZPULSE_INV

CREATE TABLE IF NOT EXISTS public.stock_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  hospital_id TEXT NOT NULL,
  material_id TEXT NOT NULL,
  previous_qty NUMERIC,
  new_qty NUMERIC NOT NULL,
  daily_use NUMERIC,
  sap_committed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_audits_hospital ON public.stock_audits(hospital_id);
CREATE INDEX IF NOT EXISTS idx_stock_audits_created ON public.stock_audits(created_at DESC);

CREATE TABLE IF NOT EXISTS public.reallocation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  from_hospital TEXT NOT NULL,
  to_hospital TEXT NOT NULL,
  material_id TEXT NOT NULL,
  qty NUMERIC NOT NULL,
  mode TEXT NOT NULL DEFAULT 'INTERNAL_TRANSFER',
  supplier_id TEXT,
  sap_committed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_realloc_to_hospital ON public.reallocation_logs(to_hospital);
CREATE INDEX IF NOT EXISTS idx_realloc_from_hospital ON public.reallocation_logs(from_hospital);
CREATE INDEX IF NOT EXISTS idx_realloc_created ON public.reallocation_logs(created_at DESC);

-- 5. ROW LEVEL SECURITY (RLS) & HELPER FUNCTIONS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reallocation_logs ENABLE ROW LEVEL SECURITY;

-- Security Definer Helper: Check if active user is Regional Admin
CREATE OR REPLACE FUNCTION public.is_regional_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'REGIONAL_ADMIN'
  );
END;
$$;

-- Security Definer Helper: Get current user profile
CREATE OR REPLACE FUNCTION public.get_current_profile()
RETURNS public.user_profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT * FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 5A. RLS POLICIES FOR user_profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_regional_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin full control on user_profiles" ON public.user_profiles;
CREATE POLICY "Admin full control on user_profiles"
  ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (public.is_regional_admin());

-- 5B. RLS POLICIES FOR stock_audits
DROP POLICY IF EXISTS "Users can insert own stock audits" ON public.stock_audits;
CREATE POLICY "Users can insert own stock audits"
  ON public.stock_audits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_regional_admin()
  );

DROP POLICY IF EXISTS "Users can select hospital stock audits" ON public.stock_audits;
CREATE POLICY "Users can select hospital stock audits"
  ON public.stock_audits
  FOR SELECT
  TO authenticated
  USING (
    public.is_regional_admin()
    OR hospital_id = (SELECT hospital_id FROM public.user_profiles WHERE id = auth.uid())
  );

-- 5C. RLS POLICIES FOR reallocation_logs
DROP POLICY IF EXISTS "Users can insert own reallocation logs" ON public.reallocation_logs;
CREATE POLICY "Users can insert own reallocation logs"
  ON public.reallocation_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = approved_by
    OR public.is_regional_admin()
  );

DROP POLICY IF EXISTS "Users can select hospital reallocation logs" ON public.reallocation_logs;
CREATE POLICY "Users can select hospital reallocation logs"
  ON public.reallocation_logs
  FOR SELECT
  TO authenticated
  USING (
    public.is_regional_admin()
    OR from_hospital = (SELECT hospital_id FROM public.user_profiles WHERE id = auth.uid())
    OR to_hospital = (SELECT hospital_id FROM public.user_profiles WHERE id = auth.uid())
  );
