import React, { useState } from 'react';
import { usePulseChain } from '../context/PulseChainContext';
import CopyButton from './common/CopyButton';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Building2,
  Truck,
  CheckCircle2,
  AlertCircle,
  Database,
  MapPin,
  UserCheck,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  Activity,
  Shield,
  Sun,
  Moon,
} from 'lucide-react';

export default function LoginScreen() {
  const { login, register, quickDemoLogin, authLoading, authError, theme, toggleTheme } = usePulseChain();

  const [activeTab, setActiveTab] = useState('signin'); // 'signin' or 'register'

  // Passwords visibility toggle states
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Sign In Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('HOSPITAL_MANAGER');
  const [regHospitalId, setRegHospitalId] = useState('H004');
  const [regSupplierId, setRegSupplierId] = useState('V1001');
  const [regWarehouseBay, setRegWarehouseBay] = useState('COLD_CHAIN_BAY_1');
  const [regRegionName, setRegRegionName] = useState('MP_CENTRAL_WEST');
  const [regCity, setRegCity] = useState('BHOPAL');
  const [regSuccessMsg, setRegSuccessMsg] = useState(null);

  const hospitalsList = [
    { id: 'H001', name: 'Metro Health Central', city: 'BHOPAL' },
    { id: 'H002', name: "St. Luke's Memorial", city: 'BHOPAL' },
    { id: 'H003', name: 'Mercy General Medical', city: 'JABALPUR' },
    { id: 'H004', name: 'Bhopal Apex Care Hospital', city: 'BHOPAL' },
    { id: 'H005', name: 'Central Surplus Logistics Hub', city: 'BHOPAL' },
    { id: 'H006', name: 'Valley Memorial Healthcare', city: 'INDORE' },
  ];

  const suppliersList = [
    { id: 'V1001', name: 'BioPharm Global Logistics (Platinum 95)' },
    { id: 'V1002', name: 'Apex Medical Supplies (Gold 84.8)' },
    { id: 'V1003', name: 'Reliant Cold-Chain Transport (Blocked 45)' },
  ];

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    await login(email, password);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regFullName) return;

    const result = await register(regEmail, regPassword, {
      full_name: regFullName,
      role: regRole,
      hospital_id: regRole === 'SUPPLIER' || regRole === 'REGIONAL_ADMIN' ? null : regHospitalId,
      supplier_id: regRole === 'SUPPLIER' ? regSupplierId : null,
      city: regRole === 'REGIONAL_ADMIN' ? 'ALL' : regCity,
      region_name: regRole === 'REGIONAL_ADMIN' ? regRegionName : null,
      warehouse_bay: regRole === 'SHOPKEEPER' ? regWarehouseBay : null,
    });

    if (result.success) {
      setRegSuccessMsg(result.message || 'Tenant registration complete! Synchronized live with SAP ZPULSE_USERS.');
    }
  };

  const handleQuickDemo = async (roleKey) => {
    if (roleKey === 'manager') {
      setEmail('kavyarajoria9691@gmail.com');
      setPassword('Pulse@2026');
    } else if (roleKey === 'shopkeeper') {
      setEmail('tiwarisejal80@gmail.com');
      setPassword('Pulse@2026');
    } else if (roleKey === 'manager_indore') {
      setEmail('manager.h006@pulsechain.org');
      setPassword('Pulse@2026');
    } else if (roleKey === 'supplier') {
      setEmail('soumaydubey073@gmail.com');
      setPassword('Pulse@2026');
    } else if (roleKey === 'admin') {
      setEmail('kavya.0111cd231058@technocratsgrou.com');
      setPassword('Pulse@2026');
    }
    await quickDemoLogin(roleKey);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-transparent text-abyss-text font-sans relative z-10">
      <div className="w-full max-w-7xl mx-auto space-y-4">
        {/* Top Floating Utility Bar with Dark/Light Glassmorphism Switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono text-abyss-muted">
            <span className="w-2 h-2 rounded-full bg-volt animate-ping"></span>
            <span>SYSTEM STATUS: <strong>OPERATIONAL</strong></span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-abyss-card dark:bg-abyss-card/80 dark:backdrop-blur-xl border border-sand-border text-abyss-text hover:border-volt text-xs font-mono shadow-md transition-all hover:scale-105 active:scale-95"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-volt" />
                <span className="text-[11px] font-bold">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-volt" />
                <span className="text-[11px] font-bold">Dark Glass</span>
              </>
            )}
          </button>
        </div>

        {/* 2-Column Split Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT COLUMN: Auth Card & Multi-Tenant Credentials */}
          <div className="lg:col-span-6 space-y-5">
            {/* Brand Header with Official PulseChain Logo */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-abyss-card dark:bg-abyss-card/85 dark:backdrop-blur-xl border border-sand-border flex items-center justify-center p-1.5 shadow-lg shrink-0">
                  <img
                    src="/pulsechain-logo.png"
                    alt="PulseChain Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-lg bg-abyss-card dark:bg-abyss-card/85 dark:backdrop-blur-md border border-sand-border text-volt text-xs font-mono font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-volt" />
                    <span>SAP S/4HANA GATEWAY & SUPABASE AUTH</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-abyss-text tracking-tight mt-1">
                    PulseChain Control Tower
                  </h1>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-abyss-muted leading-relaxed max-w-lg">
                Healthcare supply chain resilience engine with Row-Level Security tenant scoping and live SAP S/4HANA OData v2 integration.
              </p>
            </div>

            {/* Quick Demo Sign-In Bento Card (1-Click Switchers) */}
            <div className="rounded-2xl bg-abyss-card dark:bg-abyss-card/80 dark:backdrop-blur-xl border border-sand-border p-5 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between text-xs font-mono text-abyss-muted">
                <span className="uppercase tracking-wider font-bold flex items-center gap-1.5 text-abyss-text dark:text-volt">
                  <span>Pre-Seeded Tenant Personas</span>
                </span>
                <span className="text-[10px] text-abyss-muted">Click to sign in instantly</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* 1. Regional Head / Team Techy's */}
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin')}
                  disabled={authLoading}
                  className="p-3 rounded-xl bg-abyss-elevated dark:bg-abyss-elevated/75 dark:backdrop-blur-md border border-sand-border hover:border-volt hover:bg-abyss-elevated text-left transition-all text-xs space-y-1 focus-visible:ring-2 focus-visible:ring-[#FFD400] shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-abyss-text truncate flex items-center gap-1 text-[11px]">
                      <Shield className="w-3 h-3 text-volt" />
                      <span>Team Techy's</span>
                    </span>
                  </div>
                  <div className="text-[10px] text-abyss-text dark:text-volt font-mono font-bold">Regional Admin</div>
                  <div className="text-[9px] text-abyss-muted truncate">MP State Administration</div>
                </button>

                {/* 2. H004 Manager (Bhopal) */}
                <button
                  type="button"
                  onClick={() => handleQuickDemo('manager')}
                  disabled={authLoading}
                  className="p-3 rounded-xl bg-abyss-elevated dark:bg-abyss-elevated/75 dark:backdrop-blur-md border border-sand-border hover:border-volt hover:bg-abyss-elevated text-left transition-all text-xs space-y-1 focus-visible:ring-2 focus-visible:ring-[#FFD400] shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-abyss-text truncate flex items-center gap-1 text-[11px]">
                      <UserCheck className="w-3 h-3 text-volt" />
                      <span>Dr. Kavya</span>
                    </span>
                  </div>
                  <div className="text-[10px] text-abyss-text dark:text-volt font-mono font-bold">H004 Manager</div>
                  <div className="text-[9px] text-abyss-muted truncate">Bhopal Apex Care</div>
                </button>

                {/* 3. H004 Shopkeeper */}
                <button
                  type="button"
                  onClick={() => handleQuickDemo('shopkeeper')}
                  disabled={authLoading}
                  className="p-3 rounded-xl bg-abyss-elevated dark:bg-abyss-elevated/75 dark:backdrop-blur-md border border-sand-border hover:border-volt hover:bg-abyss-elevated text-left transition-all text-xs space-y-1 focus-visible:ring-2 focus-visible:ring-[#FFD400] shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-abyss-text truncate flex items-center gap-1 text-[11px]">
                      <Building2 className="w-3 h-3 text-volt" />
                      <span>Sejal Tiwari</span>
                    </span>
                  </div>
                  <div className="text-[10px] text-abyss-text dark:text-volt font-mono font-bold">H004 Shopkeeper</div>
                  <div className="text-[9px] text-abyss-muted truncate">Physical Count & Receipt</div>
                </button>

                {/* 4. H006 Manager (Indore) */}
                <button
                  type="button"
                  onClick={() => handleQuickDemo('manager_indore')}
                  disabled={authLoading}
                  className="p-3 rounded-xl bg-abyss-elevated dark:bg-abyss-elevated/75 dark:backdrop-blur-md border border-sand-border hover:border-volt hover:bg-abyss-elevated text-left transition-all text-xs space-y-1 focus-visible:ring-2 focus-visible:ring-[#FFD400] shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-abyss-text truncate flex items-center gap-1 text-[11px]">
                      <Building2 className="w-3 h-3 text-volt" />
                      <span>H006 Manager</span>
                    </span>
                  </div>
                  <div className="text-[10px] text-abyss-text dark:text-volt font-mono font-bold">Indore Hub</div>
                  <div className="text-[9px] text-abyss-muted truncate">Valley Memorial</div>
                </button>

                {/* 5. V1001 Platinum Supplier */}
                <button
                  type="button"
                  onClick={() => handleQuickDemo('supplier')}
                  disabled={authLoading}
                  className="p-3 rounded-xl bg-abyss-elevated dark:bg-abyss-elevated/75 dark:backdrop-blur-md border border-sand-border hover:border-volt hover:bg-abyss-elevated text-left transition-all text-xs space-y-1 focus-visible:ring-2 focus-visible:ring-[#FFD400] shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-abyss-text truncate flex items-center gap-1 text-[11px]">
                      <Truck className="w-3 h-3 text-volt" />
                      <span>Saumay Dubey</span>
                    </span>
                  </div>
                  <div className="text-[10px] text-abyss-text dark:text-volt font-mono font-bold">V1001 Supplier</div>
                  <div className="text-[9px] text-abyss-muted truncate">Platinum Bidding</div>
                </button>
              </div>
            </div>

            {/* Main Auth Form Container with Tabs */}
            <div className="rounded-2xl bg-abyss-card dark:bg-abyss-card/80 dark:backdrop-blur-xl border border-sand-border p-6 shadow-2xl space-y-5">
              {/* Tab Toggle: Sign In vs Register */}
              <div className="flex p-1 rounded-xl bg-abyss-elevated dark:bg-abyss-elevated/75 dark:backdrop-blur-md border border-sand-border font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'signin'
                      ? 'bg-volt text-volt-text shadow-md scale-[1.01]'
                      : 'text-abyss-muted hover:text-abyss-text'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'register'
                      ? 'bg-volt text-volt-text shadow-md scale-[1.01]'
                      : 'text-abyss-muted hover:text-abyss-text'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register Tenant</span>
                </button>
              </div>

              {/* Status & Error Banner */}
              {authError && (
                <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {regSuccessMsg && (
                <div className="p-3.5 rounded-lg bg-sand-base text-sand-text border border-sand-border text-xs flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-abyss-canvas shrink-0" />
                  <span>{regSuccessMsg}</span>
                </div>
              )}

              {/* TAB 1: SIGN IN */}
              {activeTab === 'signin' && (
                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-abyss-muted mb-1 font-bold">
                      Enterprise Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-abyss-muted" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="manager@pulsechain.org"
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-abyss-elevated border border-sand-border text-sm text-abyss-text placeholder-abyss-muted/50 focus:outline-none focus:border-volt font-mono transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-abyss-muted mb-1 font-bold">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-abyss-muted" />
                      <input
                        type={showSignInPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-abyss-elevated border border-sand-border text-sm text-abyss-text placeholder-abyss-muted/50 focus:outline-none focus:border-volt font-mono transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword((prev) => !prev)}
                        aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-abyss-muted hover:text-abyss-text p-0.5 rounded focus-visible:ring-2 focus-visible:ring-[#FFD400]"
                      >
                        {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-volt text-volt-text font-bold text-sm tracking-wide flex items-center justify-center space-x-2 hover:bg-volt-hover active:scale-[0.99] transition-colors focus-visible:ring-2 focus-visible:ring-[#FFD400] disabled:opacity-50"
                  >
                    <span>{authLoading ? 'Verifying Supabase JWT...' : 'Authenticate & Enter Tower'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* TAB 2: REGISTER TENANT */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-mono uppercase text-abyss-muted mb-1 font-bold">
                      Full Name & Title
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Dr. Priya Sharma"
                      className="w-full px-3 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-xs text-abyss-text placeholder-abyss-muted/50 focus:outline-none focus:border-volt font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono uppercase text-abyss-muted mb-1 font-bold">
                        Corporate Email
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="priya@hospital.org"
                        className="w-full px-3 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-xs text-abyss-text placeholder-abyss-muted/50 focus:outline-none focus:border-volt font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase text-abyss-muted mb-1 font-bold">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full px-3 pr-9 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-xs text-abyss-text placeholder-abyss-muted/50 focus:outline-none focus:border-volt font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword((prev) => !prev)}
                          aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-abyss-muted hover:text-abyss-text p-0.5 rounded focus-visible:ring-2 focus-visible:ring-[#FFD400]"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-abyss-muted mb-1 font-bold">
                      System Role Assignment
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setRegRole(newRole);
                        if (newRole === 'REGIONAL_ADMIN') setRegCity('ALL');
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-xs text-abyss-text focus:outline-none focus:border-volt font-mono"
                    >
                      <option value="HOSPITAL_MANAGER">HOSPITAL_MANAGER (Facility Inventory Manager)</option>
                      <option value="SHOPKEEPER">SHOPKEEPER (Medical Shopkeeper / Physical Auditor)</option>
                      <option value="SUPPLIER">SUPPLIER (Commercial Vendor / RFQ Bidder)</option>
                      <option value="REGIONAL_ADMIN">REGIONAL_ADMIN (State Logistics Supervisor)</option>
                    </select>
                  </div>

                  {/* Dynamic Fields for Hospital Managers / Shopkeepers */}
                  {(regRole === 'HOSPITAL_MANAGER' || regRole === 'SHOPKEEPER') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-abyss-elevated border border-sand-border">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-volt mb-1 font-bold">
                          Assigned Facility
                        </label>
                        <select
                          value={regHospitalId}
                          onChange={(e) => {
                            const hid = e.target.value;
                            setRegHospitalId(hid);
                            const match = hospitalsList.find((h) => h.id === hid);
                            if (match) setRegCity(match.city);
                          }}
                          className="w-full px-2.5 py-1.5 rounded bg-abyss-card border border-sand-border text-xs text-abyss-text font-mono"
                        >
                          {hospitalsList.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.id} — {h.name} ({h.city})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-volt mb-1 font-bold">
                          Municipal City
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={regCity}
                          className="w-full px-2.5 py-1.5 rounded bg-abyss-card border border-sand-border text-xs text-abyss-text font-mono font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {/* Dynamic Fields for Suppliers */}
                  {regRole === 'SUPPLIER' && (
                    <div className="p-3 rounded-lg bg-abyss-elevated border border-sand-border">
                      <label className="block text-[10px] font-mono uppercase text-volt mb-1 font-bold">
                        Vendor Entity
                      </label>
                      <select
                        value={regSupplierId}
                        onChange={(e) => setRegSupplierId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded bg-abyss-card border border-sand-border text-xs text-abyss-text font-mono"
                      >
                        {suppliersList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.id} — {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-volt text-volt-text font-bold text-sm tracking-wide flex items-center justify-center space-x-2 hover:bg-volt-hover active:scale-[0.99] transition-colors focus-visible:ring-2 focus-visible:ring-[#FFD400] disabled:opacity-50"
                  >
                    <span>{authLoading ? 'Provisioning Postgres Profile...' : 'Register Tenant Profile'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Enterprise S/4HANA Showcase Bento Cards */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-2xl bg-abyss-card dark:bg-abyss-card/80 dark:backdrop-blur-xl border border-sand-border p-6 shadow-2xl space-y-5">
              {/* Header */}
              <div className="flex items-center space-x-3.5 border-b border-sand-border pb-4">
                <div className="w-12 h-12 rounded-xl bg-abyss-elevated dark:bg-abyss-elevated/75 dark:backdrop-blur-md border border-sand-border p-2 flex items-center justify-center shadow-md">
                  <img
                    src="/favicon.svg"
                    alt="PulseChain Emblem"
                    width="32"
                    height="32"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-base font-bold text-abyss-text tracking-tight">System Architecture</h2>
                  <div className="flex items-center gap-1.5 text-xs text-abyss-muted font-mono">
                    <span>SAP S/4HANA Gateway:</span>
                    <span className="text-abyss-text dark:text-volt font-bold">ZPLUSE_SRV</span>
                    <CopyButton text="https://merida.cob.csuchico.edu:8038/sap/opu/odata/sap/ZPLUSE_SRV" label="Copy OData URI" />
                  </div>
                </div>
              </div>

              {/* 3 Architecture Pillars in Bento Cards */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-abyss-elevated dark:bg-abyss-elevated/75 dark:backdrop-blur-md border border-sand-border flex items-start space-x-3.5 shadow-sm">
                  <div className="p-2.5 rounded-lg bg-abyss-card text-volt border border-sand-border shrink-0 mt-0.5 shadow-sm">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-abyss-text uppercase tracking-wider font-mono">
                      SAP S/4HANA OData v2 SSOT
                    </h3>
                    <p className="text-xs text-abyss-muted leading-relaxed mt-0.5 font-sans">
                      Authoritative enterprise single source of truth. Inventory (ZPULSE_INV), vendor profiles, and native 8-factor Trust Scores are computed and recorded directly in SAP HANA.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-abyss-elevated dark:bg-abyss-elevated/75 dark:backdrop-blur-md border border-sand-border flex items-start space-x-3.5 shadow-sm">
                  <div className="p-2.5 rounded-lg bg-abyss-card text-volt border border-sand-border shrink-0 mt-0.5 shadow-sm">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-abyss-text uppercase tracking-wider font-mono">
                      Supabase PostgreSQL RLS
                    </h3>
                    <p className="text-xs text-abyss-muted leading-relaxed mt-0.5 font-sans">
                      Multi-tenant authorization with PostgreSQL Row-Level Security. Enforces strict hospital facility scoping for managers and shopkeepers while isolating vendor proposals.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-abyss-elevated dark:bg-abyss-elevated/75 dark:backdrop-blur-md border border-sand-border flex items-start space-x-3.5 shadow-sm">
                  <div className="p-2.5 rounded-lg bg-abyss-card text-volt border border-sand-border shrink-0 mt-0.5 shadow-sm">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-abyss-text uppercase tracking-wider font-mono">
                      OSRM Transit Guardrail & Weather Sensing
                    </h3>
                    <p className="text-xs text-abyss-muted leading-relaxed mt-0.5 font-sans">
                      Real-time OpenStreetMap road transit times with an enforced +1 Day delay guardrail rule, coupled with live Open-Meteo and GDELT disruption scoring.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="pt-3 flex items-center justify-between text-[11px] font-mono text-abyss-muted border-t border-sand-border">
                <span className="flex items-center gap-1.5 text-abyss-text">
                  <span className="w-2 h-2 rounded-full bg-volt"></span>
                  Client: 105 • Port: 8038
                </span>
                <span className="text-abyss-text dark:text-volt font-bold">Live ERP Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
