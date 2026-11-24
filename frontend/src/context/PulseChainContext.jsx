import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { captureUtmParams } from '../utils/utmTracker';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

const PulseChainContext = createContext(null);

export function PulseChainProvider({ children }) {
  // -------------------------------------------------------------
  // 1. Supabase Auth & Multi-Tenant State
  // -------------------------------------------------------------
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pulsechain_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('pulsechain_token') || null;
  });

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Working Dark / Light Mode Toggle:
  // Dark Mode (Default): 60% Abyss Teal canvas/cards with Glassmorphism, 30% Sand Putty, 10% Taxi Volt.
  // Light Mode: Flips canvas to warm Sand Putty (#F1ECE2), crisp off-white cards (#FAF7F0), Abyss Teal text, Taxi Volt CTAs.
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('pulsechain-theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    captureUtmParams();
  }, []);

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
      }
      localStorage.setItem('pulsechain-theme', theme);
    } catch (e) {
      console.warn('Failed to update theme', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Sync axios Authorization header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('pulsechain_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('pulsechain_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('pulsechain_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pulsechain_user');
    }
  }, [user]);

  /**
   * Helper: Normalize user tenant profile from Supabase
   */
  const extractUserProfile = async (session) => {
    if (!session?.user) return null;
    const authUser = session.user;
    let profileData = null;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!error && data) {
        profileData = data;
      }
    } catch (profileErr) {
      console.warn('[Supabase Profile] Table lookup note:', profileErr.message);
    }

    const meta = authUser.user_metadata || {};
    const rawRole = (profileData?.role || meta.role || 'HOSPITAL_MANAGER').toUpperCase();
    
    // Map roles for backwards and forwards compatibility
    let normalizedRole = rawRole;
    if (rawRole === 'HOSPITAL_MANAGER') normalizedRole = 'INVENTORY_MANAGER';
    if (rawRole === 'SHOPKEEPER') normalizedRole = 'STOCK_COUNTER';

    const normalizedUser = {
      id: authUser.id,
      email: authUser.email,
      name: profileData?.full_name || meta.full_name || authUser.email?.split('@')[0] || 'User',
      full_name: profileData?.full_name || meta.full_name || 'User',
      role: normalizedRole,
      canonicalRole: rawRole,
      hospitalId: profileData?.hospital_id || meta.hospital_id || (normalizedRole === 'INVENTORY_MANAGER' ? 'H005' : 'H004'),
      hospital_id: profileData?.hospital_id || meta.hospital_id || (normalizedRole === 'INVENTORY_MANAGER' ? 'H005' : 'H004'),
      supplierId: profileData?.supplier_id || meta.supplier_id || (normalizedRole === 'SUPPLIER' ? 'V1001' : null),
      supplier_id: profileData?.supplier_id || meta.supplier_id || (normalizedRole === 'SUPPLIER' ? 'V1001' : null),
      city: profileData?.city || meta.city || 'BHOPAL',
      avatar: (profileData?.full_name || meta.full_name || authUser.email || 'PC')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
    };

    return normalizedUser;
  };

  /**
   * Supabase Auth State Change Listener
   */
  useEffect(() => {
    let isMounted = true;

    // Check existing Supabase session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      if (session) {
        const profile = await extractUserProfile(session);
        setUser(profile);
        setToken(session.access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (session) {
        const profile = await extractUserProfile(session);
        setUser(profile);
        setToken(session.access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
      } else if (!localStorage.getItem('pulsechain_token')) {
        setUser(null);
        setToken(null);
        delete axios.defaults.headers.common['Authorization'];
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Supabase User Registration (Multi-Tenant SignUp with Live SAP UserSet Dual-Sync)
   */
  const register = async (email, password, { full_name, role, hospital_id, supplier_id, city, region_name, warehouse_bay }) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      // 1. Call backend dual-sync registration (Supabase Auth + SAP S/4HANA UserSet)
      const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: email.trim(),
        password,
        full_name: full_name.trim(),
        role,
        hospital_id: role === 'SUPPLIER' || role === 'REGIONAL_HEAD' ? null : (hospital_id || 'H004'),
        supplier_id: role === 'SUPPLIER' ? (supplier_id || 'V1001') : null,
        city: city || 'BHOPAL',
        region_name: region_name || (role === 'REGIONAL_HEAD' ? 'MP_CENTRAL_WEST' : null),
        warehouse_bay: warehouse_bay || (role === 'SHOPKEEPER' ? 'COLD_CHAIN_BAY_1' : null),
      });

      // 2. Sign in via Supabase client to get active session
      try {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (!signInErr && signInData?.session) {
          const profile = await extractUserProfile(signInData.session);
          setUser(profile);
          setToken(signInData.session.access_token);
          return { success: true, user: profile, message: 'Account registered & synced live with SAP S/4HANA UserSet!' };
        }
      } catch (signInCatch) {
        console.warn('Auto sign-in fallback:', signInCatch.message);
      }

      // If backend returned token directly
      if (res.data?.token && res.data?.user) {
        setUser(res.data.user);
        setToken(res.data.token);
        return { success: true, user: res.data.user, message: 'Registered & synced live with SAP S/4HANA UserSet!' };
      }

      return {
        success: true,
        message: res.data?.message || 'Registered & synced live with SAP S/4HANA UserSet! Please proceed to Sign In.',
      };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * User Login: Dual Supabase Auth with Local Backend JWT Fallback
   */
  const login = async (email, password) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      // 1. Primary: Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!error && data?.session) {
        const profile = await extractUserProfile(data.session);
        setUser(profile);
        setToken(data.session.access_token);
        return { success: true, user: profile };
      }

      // 2. Fallback: Local Backend Auth (for offline/demo fallback)
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: email.trim(),
        password,
      });

      if (response.data?.success) {
        setUser(response.data.user);
        setToken(response.data.token);
        return { success: true, user: response.data.user };
      }

      throw new Error(error?.message || response.data?.message || 'Login failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password';
      setAuthError(msg);
      return { success: false, message: msg };
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Quick-Fill Demo Logins (Instant live tenant switching for evaluators)
   */
  const quickDemoLogin = async (roleKey) => {
    let email = 'kavyarajoria9691@gmail.com';
    let defaultPass = 'Pulse@2026';

    if (roleKey === 'shopkeeper' || roleKey === 'STOCK_COUNTER') {
      email = 'tiwarisejal80@gmail.com';
    } else if (roleKey === 'shopkeeper_h005') {
      email = 'shopkeeper.h005@pulsechain.org';
    } else if (roleKey === 'manager_indore' || roleKey === 'h006') {
      email = 'manager.h006@pulsechain.org';
    } else if (roleKey === 'manager_h005' || roleKey === 'h005') {
      email = 'kavyarajoriakr@gmail.com';
    } else if (roleKey === 'supplier' || roleKey === 'SUPPLIER') {
      email = 'soumaydubey073@gmail.com';
    } else if (roleKey === 'supplier_v1002' || roleKey === 'v1002') {
      email = '0111cd23058@technocratsgroup.edu.in';
    } else if (roleKey === 'supplier_v1003' || roleKey === 'v1003') {
      email = 'v1003@fastmed.in';
    } else if (roleKey === 'admin' || roleKey === 'REGIONAL_ADMIN') {
      email = 'kavya.0111cd231058@technocratsgrou.com';
    }

    const res = await login(email, defaultPass);
    if (!res.success) {
      // Fallback with pass123 for local backend demo credentials
      return await login(email, 'pass123');
    }
    return res;
  };

  /**
   * Logout
   */
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore network errors during sign-out
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('pulsechain_user');
    localStorage.removeItem('pulsechain_token');
    delete axios.defaults.headers.common['Authorization'];
  };

  // -------------------------------------------------------------
  // 2. Control Tower Dashboard State
  // -------------------------------------------------------------
  const [activeScreen, setActiveScreen] = useState(1);
  const [disruptionLength, setDisruptionLength] = useState(12);

  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [openShortages, setOpenShortages] = useState([]);
  const [supplierBids, setSupplierBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  // Recovery Scenario Selection
  const [selectedShortage, setSelectedShortage] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // 3-Second Execution Overlay
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeExecutionPlan, setActiveExecutionPlan] = useState(null);

  // Audit Logs
  const [transferHistory, setTransferHistory] = useState([]);

  /**
   * Fetch inventory from /api/inventory (automatically tenant scoped by backend)
   */
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory`);
      const { data } = response.data;

      const processed = (data || []).map((item) => {
        const days = item.DAILY_USE > 0 ? Math.floor(item.STOCK_QTY / item.DAILY_USE) : 999;
        return {
          ...item,
          daysCover: days,
          DAYS_COVER: days,
        };
      });

      setInventory(processed);

      // Auto-select first critical shortage
      const firstShortage =
        processed.find((i) => (i.HOSPITAL_ID === 'H004' || i.HOSPITAL_ID === 'H002') && i.daysCover < disruptionLength) ||
        processed.find((i) => i.daysCover < disruptionLength);

      if (firstShortage && !selectedShortage) {
        setSelectedShortage(firstShortage);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  }, [disruptionLength, selectedShortage]);

  /**
   * Fetch suppliers from /api/suppliers
   */
  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/suppliers`);
      setSuppliers(response.data.data || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  }, []);

  /**
   * Fetch open shortages from /api/open-shortages
   */
  const fetchOpenShortages = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/open-shortages`);
      setOpenShortages(response.data.data || []);
    } catch (err) {
      console.error('Failed to load open shortages:', err);
    }
  }, []);

  /**
   * Fetch supplier bids from /api/supplier-bids
   */
  const fetchSupplierBids = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/supplier-bids`);
      setSupplierBids(response.data.data || []);
    } catch (err) {
      console.error('Failed to load supplier bids:', err);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchSuppliers();
    fetchOpenShortages();
    fetchSupplierBids();
  }, [fetchInventory, fetchSuppliers, fetchOpenShortages, fetchSupplierBids]);

  /**
   * Execute SAP Stock Transfer (Screen 5)
   */
  const executeSapTransfer = async (plan) => {
    setIsProcessing(true);
    setActiveExecutionPlan(plan);

    try {
      const payload = {
        fromHospital: plan.fromHospital || 'H005',
        toHospital: plan.toHospital || 'H004',
        materialId: plan.materialId || 'AMX002',
        qty: plan.qty || 250,
      };

      const response = await axios.post(`${API_BASE_URL}/transfer`, payload);

      if (response.data.success) {
        setTransferHistory((prev) => [
          {
            id: response.data.transactionId || `DOC-${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...payload,
            planType: plan.type,
            dispatchEmailSent: response.data.dispatchEmailSent,
          },
          ...prev,
        ]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('SAP Transfer Failed:', err);
      return false;
    }
  };

  /**
   * Callback after 3-second execution animation finishes
   */
  const handleProcessingComplete = async () => {
    setIsProcessing(false);
    await fetchInventory();
    await fetchOpenShortages();
    setStatusMessage({
      type: 'success',
      text: `SAP Transfer completed! Stock updated in ERP ledger & Dispatch Confirmation email sent.`,
    });
    setTimeout(() => setStatusMessage(null), 6000);
  };

  /**
   * Reset Baseline
   */
  const resetBaseline = async () => {
    try {
      await axios.post(`${API_BASE_URL}/reset`);
      await fetchInventory();
      await fetchOpenShortages();
      setActiveScreen(1);
    } catch (err) {
      console.error(err);
    }
  };

  const value = {
    // Auth & Tenant Scope
    user,
    token,
    isAuthenticated: !!user && !!token,
    authLoading,
    authError,
    login,
    register,
    quickDemoLogin,
    logout,
    supabase,
    theme,
    toggleTheme,

    // Core Dashboard
    activeScreen,
    setActiveScreen,
    disruptionLength,
    setDisruptionLength,
    inventory,
    suppliers,
    openShortages,
    supplierBids,
    loading,
    statusMessage,
    setStatusMessage,
    selectedShortage,
    setSelectedShortage,
    selectedPlan,
    setSelectedPlan,
    isProcessing,
    activeExecutionPlan,
    executeSapTransfer,
    handleProcessingComplete,
    resetBaseline,
    fetchInventory,
    fetchSuppliers,
    fetchOpenShortages,
    fetchSupplierBids,
    transferHistory,
  };

  return (
    <PulseChainContext.Provider value={value}>
      {children}
    </PulseChainContext.Provider>
  );
}

export function usePulseChain() {
  const context = useContext(PulseChainContext);
  if (!context) {
    throw new Error('usePulseChain must be used within a PulseChainProvider');
  }
  return context;
}
