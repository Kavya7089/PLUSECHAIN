import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const PulseChainContext = createContext(null);

export function PulseChainProvider({ children }) {
  // -------------------------------------------------------------
  // 1. Role-Based Authentication State
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

  // Set default authorization header if token exists
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
   * User Login via POST /api/auth/login
   */
  const login = async (email, password) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: email.trim(),
        password,
      });

      if (response.data?.success) {
        setUser(response.data.user);
        setToken(response.data.token);
        return { success: true, user: response.data.user };
      }
      return { success: false, message: response.data?.message || 'Login failed' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      setAuthError(msg);
      return { success: false, message: msg };
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Quick Demo Login (Instant switching for presentations)
   */
  const quickDemoLogin = async (roleKey) => {
    let email = 'manager@pulsechain.com';
    if (roleKey === 'shopkeeper' || roleKey === 'STOCK_COUNTER') {
      email = 'shopkeeper@pulsechain.com';
    } else if (roleKey === 'supplier' || roleKey === 'SUPPLIER') {
      email = 'supplier@pulsechain.com';
    }

    return await login(email, 'pass123');
  };

  /**
   * Logout
   */
  const logout = () => {
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
   * Fetch inventory from /api/inventory
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

      // Auto-select first critical shortage (or H004 shortage)
      const firstShortage =
        processed.find((i) => i.HOSPITAL_ID === 'H004' && i.daysCover < disruptionLength) ||
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
    // Auth
    user,
    token,
    isAuthenticated: !!user && !!token,
    authLoading,
    authError,
    login,
    quickDemoLogin,
    logout,

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
