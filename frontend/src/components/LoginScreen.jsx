import React, { useState } from 'react';
import { usePulseChain } from '../context/PulseChainContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Building2,
  Truck,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  Database,
  MapPin,
  Radio,
  UserCheck,
} from 'lucide-react';

export default function LoginScreen() {
  const { login, quickDemoLogin, authLoading, authError } = usePulseChain();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    await login(email, password);
  };

  const handleDemoClick = async (roleKey) => {
    if (roleKey === 'manager') {
      setEmail('manager@pulsechain.com');
      setPassword('pass123');
    } else if (roleKey === 'shopkeeper') {
      setEmail('shopkeeper@pulsechain.com');
      setPassword('pass123');
    } else if (roleKey === 'supplier') {
      setEmail('supplier@pulsechain.com');
      setPassword('pass123');
    }
    await quickDemoLogin(roleKey);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden text-[#e0e8e2] font-sans">
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        {/* 2-Column Split Layout: Left = Credentials & Demo Sign-In, Right = Dark Mode Logo & Enterprise Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Login Card & Credentials (6 Cols) */}
          <div className="lg:col-span-6 space-y-6 animate-in fade-in slide-in-from-left-6 duration-500">
            {/* Brand Header */}
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#2a3f3f]/80 border border-[#f0cd6e]/40 text-[#f0cd6e] text-xs font-mono font-bold shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-[#f0cd6e]" />
                <span>ENTERPRISE MULTI-ROLE SECURITY PLATFORM</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                PulseChain Control Tower
              </h1>
              <p className="text-xs sm:text-sm text-[#e0e8e2]/70 leading-relaxed max-w-lg">
                Autonomous Agentic Supply Chain Resilience, S/4HANA ERP Synchronization, and Same-City Municipal Geo-Fencing.
              </p>
            </div>

            {/* Login Glassmorphic Panel */}
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-[#e0e8e2]/15 bg-[#2c2e35]/90 shadow-2xl backdrop-blur-2xl space-y-5">
              {/* 1-Click Quick Demo Sign-In */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#e0e8e2]/60 font-mono">
                  <span className="uppercase tracking-wider font-bold flex items-center gap-1.5 text-[#89c07e]">
                    <Cpu className="w-3.5 h-3.5 text-[#89c07e]" />
                    1-Click Quick Demo Sign-In
                  </span>
                  <span className="text-[10px] text-[#f0cd6e]">Instant live evaluator switch</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Role 1: Manager -> KAVYA RAJORIA */}
                  <button
                    type="button"
                    onClick={() => handleDemoClick('manager')}
                    disabled={authLoading}
                    className="p-3 rounded-2xl bg-[#2a3f3f]/60 border border-[#89c07e]/40 hover:border-[#89c07e] hover:bg-[#2a3f3f] text-left transition-all group active:scale-95 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white group-hover:text-[#89c07e] transition-colors truncate flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#89c07e]" />
                        <span>Kavya Rajoria</span>
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#89c07e] shrink-0"></span>
                    </div>
                    <div className="text-[10px] text-[#89c07e] font-mono font-medium">
                      INVENTORY_MANAGER
                    </div>
                    <div className="text-[10px] text-[#e0e8e2]/50 truncate">
                      Central Hub H005
                    </div>
                  </button>

                  {/* Role 2: Shopkeeper -> SEJAL TIWARI */}
                  <button
                    type="button"
                    onClick={() => handleDemoClick('shopkeeper')}
                    disabled={authLoading}
                    className="p-3 rounded-2xl bg-[#2a3f3f]/60 border border-[#f0cd6e]/40 hover:border-[#f0cd6e] hover:bg-[#2a3f3f] text-left transition-all group active:scale-95 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white group-hover:text-[#f0cd6e] transition-colors truncate flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#f0cd6e]" />
                        <span>Sejal Tiwari</span>
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f0cd6e] shrink-0"></span>
                    </div>
                    <div className="text-[10px] text-[#f0cd6e] font-mono font-medium">
                      STOCK_COUNTER
                    </div>
                    <div className="text-[10px] text-[#e0e8e2]/50 truncate">
                      H004 Bhopal Audit
                    </div>
                  </button>

                  {/* Role 3: Supplier -> SAUMAY DUBEY */}
                  <button
                    type="button"
                    onClick={() => handleDemoClick('supplier')}
                    disabled={authLoading}
                    className="p-3 rounded-2xl bg-[#2a3f3f]/60 border border-[#467750]/50 hover:border-[#89c07e] hover:bg-[#2a3f3f] text-left transition-all group active:scale-95 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white group-hover:text-[#89c07e] transition-colors truncate flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#89c07e]" />
                        <span>Saumay Dubey</span>
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#89c07e] shrink-0"></span>
                    </div>
                    <div className="text-[10px] text-[#89c07e] font-mono font-medium">
                      SUPPLIER
                    </div>
                    <div className="text-[10px] text-[#e0e8e2]/50 truncate">
                      V1001 Emergency Bids
                    </div>
                  </button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#e0e8e2]/15"></div>
                <span className="flex-shrink mx-4 text-[10px] uppercase font-mono text-[#e0e8e2]/40 tracking-wider">
                  Or sign in with credentials
                </span>
                <div className="flex-grow border-t border-[#e0e8e2]/15"></div>
              </div>

              {/* Error Message */}
              {authError && (
                <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2.5 animate-in shake">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#e0e8e2]/70 mb-1.5 font-bold">
                    Enterprise Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e0e8e2]/40" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. manager@pulsechain.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#2a3f3f]/50 border border-[#e0e8e2]/15 text-xs text-white placeholder-[#e0e8e2]/30 focus:outline-none focus:border-[#89c07e]/60 focus:ring-1 focus:ring-[#89c07e]/50 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-mono uppercase text-[#e0e8e2]/70 font-bold">
                      Password
                    </label>
                    <span className="text-[10px] font-mono text-[#f0cd6e]">Demo: pass123</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e0e8e2]/40" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#2a3f3f]/50 border border-[#e0e8e2]/15 text-xs text-white placeholder-[#e0e8e2]/30 focus:outline-none focus:border-[#89c07e]/60 focus:ring-1 focus:ring-[#89c07e]/50 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 shadow-lg shadow-orange-500/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {authLoading ? (
                    <span>Authenticating with JWT RBAC...</span>
                  ) : (
                    <>
                      <span>Sign In to Control Tower</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </>
                  )}
                </button>
              </form>

              {/* Security Badges */}
              <div className="pt-2 border-t border-[#e0e8e2]/10 grid grid-cols-3 gap-2 text-center font-mono text-[10px] text-[#e0e8e2]/60">
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#89c07e]" />
                  <span>JWT RBAC 256-bit</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#f0cd6e]" />
                  <span>SAP S/4HANA RFC</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#89c07e]" />
                  <span>Nodemailer Alerts</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: The Empty Space Now Transformed into Dark Mode Logo & Enterprise Showcase (6 Cols) */}
          <div className="lg:col-span-6 space-y-6 animate-in fade-in slide-in-from-right-6 duration-700">
            {/* Dark Mode Logo Hero Showcase */}
            <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-[#e0e8e2]/15 bg-gradient-to-br from-[#2c2e35]/95 via-[#2a3f3f]/80 to-[#2c2e35]/95 shadow-2xl backdrop-blur-2xl relative overflow-hidden group">
              {/* Ambient Radial Glow Behind Logo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/15 transition-all duration-700"></div>

              {/* THE DARK MODE LOGO (Transparent PNG, No White Box, Crisp Luminous Artwork) */}
              <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                <div className="p-4 sm:p-6 rounded-3xl bg-[#2c2e35]/60 border border-[#89c07e]/30 shadow-2xl backdrop-blur-md hover:border-[#89c07e]/60 transition-all duration-300">
                  <img
                    src="/pulsechain-logo-dark.png"
                    alt="PulseChain Dark Mode Logo"
                    className="w-full max-w-sm sm:max-w-md h-auto object-contain filter drop-shadow-[0_0_25px_rgba(56,189,248,0.35)] transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Subtitle & Enterprise Spec */}
                <div className="space-y-2 max-w-md">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#2a3f3f]/80 text-[#89c07e] text-xs font-mono font-bold border border-[#89c07e]/40">
                    <Radio className="w-3.5 h-3.5 text-[#89c07e] animate-pulse" />
                    <span>AUTONOMOUS AGENTIC RESILIENCE ENGINE</span>
                  </div>
                  <p className="text-xs text-[#e0e8e2]/75 font-mono leading-relaxed">
                    Coupling SAP S/4HANA ERP with Google Gemini GenAI to sense, analyze, and autonomously mitigate healthcare supply chain disruptions.
                  </p>
                </div>

                {/* 4 Feature Telemetry Blocks */}
                <div className="w-full grid grid-cols-2 gap-3 text-left font-mono">
                  <div className="p-3 rounded-2xl bg-[#2a3f3f]/50 border border-[#e0e8e2]/10 space-y-1">
                    <div className="text-[10px] text-[#e0e8e2]/60 uppercase font-sans font-bold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#89c07e]" /> Same-City Geo-Filter
                    </div>
                    <div className="text-xs font-bold text-white">Bhopal Hub (H005)</div>
                    <div className="text-[10px] text-[#89c07e]">0-day courier transit</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#2a3f3f]/50 border border-[#e0e8e2]/10 space-y-1">
                    <div className="text-[10px] text-[#e0e8e2]/60 uppercase font-sans font-bold flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-[#f0cd6e]" /> S/4HANA RFC Ledger
                    </div>
                    <div className="text-xs font-bold text-white">ET_STOCK & Update</div>
                    <div className="text-[10px] text-[#f0cd6e]">Z_PULSE_UPDATE_STOCK</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#2a3f3f]/50 border border-[#e0e8e2]/10 space-y-1">
                    <div className="text-[10px] text-[#e0e8e2]/60 uppercase font-sans font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#89c07e]" /> 4-Stage GenAI
                    </div>
                    <div className="text-xs font-bold text-white">Google Gemini 3.5</div>
                    <div className="text-[10px] text-[#89c07e]">Deterministic Fallback</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#2a3f3f]/50 border border-[#e0e8e2]/10 space-y-1">
                    <div className="text-[10px] text-[#e0e8e2]/60 uppercase font-sans font-bold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#f0cd6e]" /> Automated Alerts
                    </div>
                    <div className="text-xs font-bold text-white">Nodemailer Dispatch</div>
                    <div className="text-[10px] text-[#f0cd6e]">Manager & Vendor RFQs</div>
                  </div>
                </div>

                {/* Demo Roster Card */}
                <div className="w-full p-3.5 rounded-2xl bg-[#2a3f3f]/40 border border-[#e0e8e2]/10 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-[#89c07e]" />
                    <span className="text-[#e0e8e2]/80">Active Demo Profiles:</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] font-bold">
                    <span className="text-[#89c07e]">Kavya</span>
                    <span className="text-[#e0e8e2]/30">•</span>
                    <span className="text-[#f0cd6e]">Sejal</span>
                    <span className="text-[#e0e8e2]/30">•</span>
                    <span className="text-[#89c07e]">Saumay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
