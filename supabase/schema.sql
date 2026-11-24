-- ============================================================================
-- PulseChain v3.2.0 — Enterprise Supabase PostgreSQL Schema & Security Infrastructure
-- Integrated Multi-Tenant Auth, 2-Step Shopkeeper Approvals, Manager Reviews,
-- and Live SAP S/4HANA OData Synchronization
--
-- Ready for execution in the Supabase SQL Editor
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USER PROFILES TABLE (Tenant Scopes & RBAC Mapping)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('REGIONAL_HEAD', 'HOSPITAL_MANAGER', 'SHOPKEEPER', 'SUPPLIER', 'REGIONAL_ADMIN')),
  hospital_id TEXT, -- e.g. 'H001'–'H006' (Mandatory for HOSPITAL_MANAGER & SHOPKEEPER)
  supplier_id TEXT, -- e.g. 'V1001'–'V1003' (Mandatory for SUPPLIER)
  city TEXT,        -- e.g. 'BHOPAL', 'INDORE', 'JABALPUR'
  sap_synced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely add sap_synced column if user_profiles already existed without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'sap_synced'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN sap_synced BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_hospital ON public.user_profiles(hospital_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_supplier ON public.user_profiles(supplier_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON public.user_profiles(city);

-- 3. REGIONAL HEADS TABLE
CREATE TABLE IF NOT EXISTS public.regional_heads (
  user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  region_name TEXT NOT NULL DEFAULT 'MP_CENTRAL_WEST',
  assigned_cities TEXT[] NOT NULL DEFAULT ARRAY['BHOPAL', 'INDORE', 'JABALPUR'],
  escalation_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regional_heads_region ON public.regional_heads(region_name);

-- 4. SHOPKEEPERS TABLE
CREATE TABLE IF NOT EXISTS public.shopkeepers (
  user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  hospital_id TEXT NOT NULL,
  city TEXT NOT NULL,
  warehouse_bay TEXT DEFAULT 'COLD_CHAIN_BAY_1',
  can_approve_dispatch BOOLEAN DEFAULT TRUE,
  can_approve_receipt BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopkeepers_hospital ON public.shopkeepers(hospital_id);
CREATE INDEX IF NOT EXISTS idx_shopkeepers_city ON public.shopkeepers(city);

-- 5. SUPPLIER BIDS TABLE (Emergency RFQs & Quotations)
CREATE TABLE IF NOT EXISTS public.supplier_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_hospital_id TEXT NOT NULL,
  material_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  offered_qty NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  lead_time_days INTEGER NOT NULL,
  osrm_travel_days INTEGER,
  osrm_max_allowed_days INTEGER,
  delay_reason TEXT DEFAULT '',
  compliance TEXT DEFAULT 'Y',
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACCEPTED', 'REJECTED', 'DELIVERED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_bids_rfq ON public.supplier_bids(rfq_hospital_id);
CREATE INDEX IF NOT EXISTS idx_supplier_bids_supplier ON public.supplier_bids(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_bids_status ON public.supplier_bids(status);

-- 6. SHIPMENT APPROVALS TABLE (2-Step Goods Approval)
-- Tracks orders without moving SAP stock immediately until Shopkeepers verify physical movement
CREATE TABLE IF NOT EXISTS public.shipment_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type TEXT NOT NULL CHECK (order_type IN ('HOSPITAL_TRANSFER', 'SUPPLIER_DELIVERY')),
  source_hospital_id TEXT,
  supplier_id TEXT,
  dest_hospital_id TEXT NOT NULL,
  material_id TEXT NOT NULL,
  qty NUMERIC NOT NULL,
  bid_id UUID REFERENCES public.supplier_bids(id) ON DELETE SET NULL,
  requested_by_manager_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING_DISPATCH', 'IN_TRANSIT', 'DELIVERED', 'REJECTED')),
  dispatch_approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  dispatch_approved_at TIMESTAMPTZ,
  receipt_approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  receipt_approved_at TIMESTAMPTZ,
  sap_dispatch_committed BOOLEAN DEFAULT FALSE,
  sap_receipt_committed BOOLEAN DEFAULT FALSE,
  rejection_note TEXT,
  review_submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_dest ON public.shipment_approvals(dest_hospital_id);
CREATE INDEX IF NOT EXISTS idx_shipments_source ON public.shipment_approvals(source_hospital_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipment_approvals(status);

-- 7. SUPPLIER REVIEWS TABLE (Manager Post-Delivery Review → SAP HANA Re-ranking)
CREATE TABLE IF NOT EXISTS public.supplier_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID UNIQUE NOT NULL REFERENCES public.shipment_approvals(id) ON DELETE CASCADE,
  supplier_id TEXT NOT NULL,
  material_id TEXT NOT NULL,
  hospital_id TEXT NOT NULL,
  reviewed_by_manager_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  delivery_speed INTEGER NOT NULL CHECK (delivery_speed BETWEEN 1 AND 100),
  on_time_rate INTEGER NOT NULL CHECK (on_time_rate BETWEEN 1 AND 100),
  reliability INTEGER NOT NULL CHECK (reliability BETWEEN 1 AND 100),
  quality_score INTEGER NOT NULL CHECK (quality_score BETWEEN 1 AND 100),
  emerg_response INTEGER NOT NULL CHECK (emerg_response BETWEEN 1 AND 100),
  cold_chain_score INTEGER NOT NULL CHECK (cold_chain_score BETWEEN 1 AND 100),
  fulfilment_rate INTEGER NOT NULL CHECK (fulfilment_rate BETWEEN 1 AND 100),
  doc_cert_score INTEGER NOT NULL CHECK (doc_cert_score BETWEEN 1 AND 100),
  comments TEXT DEFAULT '',
  synced_to_sap BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_reviews_supplier ON public.supplier_reviews(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_hospital ON public.supplier_reviews(hospital_id);

-- 8. AUDIT & TASK MANAGEMENT TABLES (Own-Hospital Scope)
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

CREATE TABLE IF NOT EXISTS public.hospital_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT NOT NULL,
  material_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospital_tasks_hospital ON public.hospital_tasks(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_tasks_status ON public.hospital_tasks(status);

-- 9. AUTO-PROVISION TRIGGER ON auth.users
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
  v_region TEXT;
  v_warehouse_bay TEXT;
  v_escalation_email TEXT;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'SHOPKEEPER');
  
  -- Normalize legacy aliases
  IF v_role = 'REGIONAL_ADMIN' THEN
    v_role := 'REGIONAL_HEAD';
  ELSIF v_role = 'STOCK_COUNTER' THEN
    v_role := 'SHOPKEEPER';
  ELSIF v_role = 'INVENTORY_MANAGER' THEN
    v_role := 'HOSPITAL_MANAGER';
  END IF;

  v_hospital_id := NEW.raw_user_meta_data->>'hospital_id';
  v_supplier_id := NEW.raw_user_meta_data->>'supplier_id';
  v_city := NEW.raw_user_meta_data->>'city';
  v_region := COALESCE(NEW.raw_user_meta_data->>'region_name', NEW.raw_user_meta_data->>'region', 'MP_CENTRAL_WEST');
  v_warehouse_bay := COALESCE(NEW.raw_user_meta_data->>'warehouse_bay', 'COLD_CHAIN_BAY_1');
  v_escalation_email := COALESCE(NEW.raw_user_meta_data->>'escalation_email', NEW.email);

  -- 1. Insert or update user_profiles
  INSERT INTO public.user_profiles (
    id, email, full_name, role, hospital_id, supplier_id, city, sap_synced, created_at
  ) VALUES (
    NEW.id, NEW.email, v_full_name, v_role, v_hospital_id, v_supplier_id, v_city, false, NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    hospital_id = EXCLUDED.hospital_id,
    supplier_id = EXCLUDED.supplier_id,
    city = EXCLUDED.city;

  -- 2. Auto-provision role-specific tables
  IF v_role = 'REGIONAL_HEAD' THEN
    INSERT INTO public.regional_heads (user_id, region_name, assigned_cities, escalation_email, created_at)
    VALUES (NEW.id, v_region, ARRAY['BHOPAL', 'INDORE', 'JABALPUR'], v_escalation_email, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      region_name = EXCLUDED.region_name,
      escalation_email = EXCLUDED.escalation_email;
  ELSIF v_role = 'SHOPKEEPER' THEN
    INSERT INTO public.shopkeepers (user_id, hospital_id, city, warehouse_bay, can_approve_dispatch, can_approve_receipt, created_at)
    VALUES (NEW.id, COALESCE(v_hospital_id, 'H004'), COALESCE(v_city, 'BHOPAL'), v_warehouse_bay, true, true, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      hospital_id = EXCLUDED.hospital_id,
      city = EXCLUDED.city,
      warehouse_bay = EXCLUDED.warehouse_bay;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES & HELPER FUNCTIONS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopkeepers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_tasks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_regional_head()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('REGIONAL_HEAD', 'REGIONAL_ADMIN')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_hospital_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT hospital_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_supplier_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT supplier_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- RLS: user_profiles
DROP POLICY IF EXISTS "Profiles visible to authenticated members" ON public.user_profiles;
CREATE POLICY "Profiles visible to authenticated members" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_regional_head() OR hospital_id = public.get_auth_hospital_id());

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_regional_head());

-- RLS: regional_heads
DROP POLICY IF EXISTS "Regional heads viewable" ON public.regional_heads;
CREATE POLICY "Regional heads viewable" ON public.regional_heads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_regional_head());

-- RLS: shopkeepers
DROP POLICY IF EXISTS "Shopkeepers viewable" ON public.shopkeepers;
CREATE POLICY "Shopkeepers viewable" ON public.shopkeepers
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR hospital_id = public.get_auth_hospital_id() OR public.is_regional_head());

-- RLS: supplier_bids
DROP POLICY IF EXISTS "Supplier bids viewable" ON public.supplier_bids;
CREATE POLICY "Supplier bids viewable" ON public.supplier_bids
  FOR SELECT TO authenticated
  USING (public.is_regional_head() OR supplier_id = public.get_auth_supplier_id() OR rfq_hospital_id = public.get_auth_hospital_id());

DROP POLICY IF EXISTS "Suppliers can insert bids" ON public.supplier_bids;
CREATE POLICY "Suppliers can insert bids" ON public.supplier_bids
  FOR INSERT TO authenticated
  WITH CHECK (supplier_id = public.get_auth_supplier_id() OR public.is_regional_head());

DROP POLICY IF EXISTS "Update supplier bids" ON public.supplier_bids;
CREATE POLICY "Update supplier bids" ON public.supplier_bids
  FOR UPDATE TO authenticated
  USING (supplier_id = public.get_auth_supplier_id() OR rfq_hospital_id = public.get_auth_hospital_id() OR public.is_regional_head());

-- RLS: shipment_approvals
DROP POLICY IF EXISTS "Shipment approvals viewable" ON public.shipment_approvals;
CREATE POLICY "Shipment approvals viewable" ON public.shipment_approvals
  FOR SELECT TO authenticated
  USING (
    public.is_regional_head() OR
    dest_hospital_id = public.get_auth_hospital_id() OR
    source_hospital_id = public.get_auth_hospital_id() OR
    supplier_id = public.get_auth_supplier_id()
  );

DROP POLICY IF EXISTS "Create shipment approvals" ON public.shipment_approvals;
CREATE POLICY "Create shipment approvals" ON public.shipment_approvals
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_regional_head() OR
    dest_hospital_id = public.get_auth_hospital_id() OR
    source_hospital_id = public.get_auth_hospital_id()
  );

DROP POLICY IF EXISTS "Update shipment approvals" ON public.shipment_approvals;
CREATE POLICY "Update shipment approvals" ON public.shipment_approvals
  FOR UPDATE TO authenticated
  USING (
    public.is_regional_head() OR
    dest_hospital_id = public.get_auth_hospital_id() OR
    source_hospital_id = public.get_auth_hospital_id()
  );

-- RLS: supplier_reviews
DROP POLICY IF EXISTS "Supplier reviews viewable" ON public.supplier_reviews;
CREATE POLICY "Supplier reviews viewable" ON public.supplier_reviews
  FOR SELECT TO authenticated
  USING (
    public.is_regional_head() OR
    hospital_id = public.get_auth_hospital_id() OR
    supplier_id = public.get_auth_supplier_id()
  );

DROP POLICY IF EXISTS "Managers can insert supplier reviews" ON public.supplier_reviews;
CREATE POLICY "Managers can insert supplier reviews" ON public.supplier_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_regional_head() OR
    hospital_id = public.get_auth_hospital_id()
  );

-- RLS: stock_audits
DROP POLICY IF EXISTS "Stock audits viewable" ON public.stock_audits;
CREATE POLICY "Stock audits viewable" ON public.stock_audits
  FOR SELECT TO authenticated
  USING (public.is_regional_head() OR hospital_id = public.get_auth_hospital_id());

DROP POLICY IF EXISTS "Insert stock audits" ON public.stock_audits;
CREATE POLICY "Insert stock audits" ON public.stock_audits
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_regional_head());

-- RLS: hospital_tasks
DROP POLICY IF EXISTS "Hospital tasks viewable" ON public.hospital_tasks;
CREATE POLICY "Hospital tasks viewable" ON public.hospital_tasks
  FOR SELECT TO authenticated
  USING (public.is_regional_head() OR hospital_id = public.get_auth_hospital_id());

DROP POLICY IF EXISTS "Insert hospital tasks" ON public.hospital_tasks;
CREATE POLICY "Insert hospital tasks" ON public.hospital_tasks
  FOR INSERT TO authenticated
  WITH CHECK (public.is_regional_head() OR hospital_id = public.get_auth_hospital_id());

DROP POLICY IF EXISTS "Update hospital tasks" ON public.hospital_tasks;
CREATE POLICY "Update hospital tasks" ON public.hospital_tasks
  FOR UPDATE TO authenticated
  USING (public.is_regional_head() OR hospital_id = public.get_auth_hospital_id());
