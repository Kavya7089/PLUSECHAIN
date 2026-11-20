import React from 'react';
import { PulseChainProvider, usePulseChain } from './context/PulseChainContext';
import LoginScreen from './components/LoginScreen';
import ShopkeeperPortal from './components/ShopkeeperPortal';
import SupplierPortal from './components/SupplierPortal';
import Sidebar from './components/Sidebar';
import ThreeBackground from './components/ThreeBackground';
import ProcessingOverlay from './components/ProcessingOverlay';
import Screen1ControlTower from './components/screens/Screen1ControlTower';
import Screen2ImpactAnalysis from './components/screens/Screen2ImpactAnalysis';
import Screen3RecoveryPlanning from './components/screens/Screen3RecoveryPlanning';
import Screen4ComplianceCheck from './components/screens/Screen4ComplianceCheck';
import Screen5HumanApproval from './components/screens/Screen5HumanApproval';
import ScreenSuppliers from './components/screens/ScreenSuppliers';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  RefreshCw,
  RotateCcw,
  Server,
  Sparkles,
  Zap,
  LogOut,
  User,
  Shield,
  Building2,
  Truck,
  MapPin,
  UserCheck,
} from 'lucide-react';

function DashboardShell() {
  const {
    user,
    isAuthenticated,
    quickDemoLogin,
    logout,
    activeScreen,
    setActiveScreen,
    disruptionLength,
    inventory,
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
  } = usePulseChain();

  // If not logged in, show enterprise LoginScreen
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen text-[#e0e8e2] flex font-sans selection:bg-[#89c07e]/30 selection:text-[#f0cd6e]">
        <ThreeBackground />
        <LoginScreen />
      </div>
    );
  }

  const criticalHospitalsCount = React.useMemo(() => {
    return new Set(
      inventory
        .filter((item) => item.daysCover < disruptionLength)
        .map((item) => item.HOSPITAL_ID)
    ).size;
  }, [inventory, disruptionLength]);

  const screenWorkflowTitles = {
    1: '1. Dashboard (Disruption Radar)',
    2: '2. Disruption Alerts (Shortage Impact)',
    3: '3. AI Scenario Planner (Reallocation)',
    4: '4. Compliance Check (Cold-Chain Verification)',
    5: '5. Human Approval (SAP Authorization)',
    6: '6. Supplier Directory (Vendor Master)',
  };

  const roleNameMap = {
    INVENTORY_MANAGER: 'Inventory Manager',
    STOCK_COUNTER: 'Medical Shopkeeper',
    SUPPLIER: 'Commercial Supplier',
  };

  return (
    <div className="relative min-h-screen text-[#e0e8e2] flex font-sans selection:bg-[#89c07e]/30 selection:text-[#f0cd6e]">
      {/* 3D Three.js Ambient Particle Shield */}
      <ThreeBackground />

      {/* 3-Second Execution Loading Overlay */}
      <ProcessingOverlay
        isOpen={isProcessing}
        transferDetails={activeExecutionPlan}
        onComplete={handleProcessingComplete}
      />

      {/* Render Sidebar ONLY for INVENTORY_MANAGER */}
      {user?.role === 'INVENTORY_MANAGER' && (
        <Sidebar
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
          criticalCount={criticalHospitalsCount}
          selectedPlan={selectedPlan}
          isCompliancePassed={true}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-20 w-full glass-panel border-b border-[#e0e8e2]/15 bg-[#2c2e35]/85 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            {/* Left: Active Workflow Stage or Portal Badge */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {user?.role === 'INVENTORY_MANAGER' ? (
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-[#2a3f3f]/60 border border-[#89c07e]/30">
                  <span className="w-2 h-2 rounded-full bg-[#89c07e] animate-ping"></span>
                  <span className="text-[10px] sm:text-[11px] font-mono text-[#89c07e] font-semibold uppercase tracking-wider">
                    Workflow
                  </span>
                  <span className="text-xs font-mono text-[#e0e8e2]/40">/</span>
                  <span className="text-xs font-bold font-mono text-white truncate max-w-[180px] sm:max-w-none">
                    {screenWorkflowTitles[activeScreen] || '1. Dashboard'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-[#2a3f3f]/60 border border-[#f0cd6e]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f0cd6e] animate-ping"></span>
                  <span className="text-xs font-semibold font-mono text-white flex items-center gap-1.5">
                    {user?.role === 'STOCK_COUNTER' ? (
                      <>
                        <Building2 className="w-3.5 h-3.5 text-[#f0cd6e]" />
                        <span>Medical Shopkeeper Audit Portal</span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-3.5 h-3.5 text-[#89c07e]" />
                        <span>Emergency Supplier Bidding Portal</span>
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Middle: Live Fast Demo Role Switcher (Presentation Convenience with DEMO MODE indicator) */}
            <div className="flex items-center space-x-1.5 bg-[#2a3f3f]/50 p-1 rounded-2xl border border-[#e0e8e2]/10 text-xs font-mono">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#f0cd6e]/20 text-[#f0cd6e] border border-[#f0cd6e]/40 font-bold uppercase tracking-wider hidden sm:inline">
                DEMO MODE
              </span>
              <span className="text-[10px] text-[#e0e8e2]/50 px-1 uppercase font-medium hidden md:inline">
                Role:
              </span>
              <button
                onClick={() => quickDemoLogin('manager')}
                className={`px-2.5 py-1 rounded-xl transition-all text-[11px] font-medium flex items-center gap-1.5 ${
                  user?.role === 'INVENTORY_MANAGER'
                    ? 'bg-[#89c07e] text-slate-950 shadow'
                    : 'text-[#e0e8e2]/70 hover:text-white'
                }`}
                title="Switch to Kavya Rajoria (Inventory Manager)"
              >
                <UserCheck className="w-3 h-3" />
                <span>Kavya</span>
              </button>
              <button
                onClick={() => quickDemoLogin('shopkeeper')}
                className={`px-2.5 py-1 rounded-xl transition-all text-[11px] font-medium flex items-center gap-1.5 ${
                  user?.role === 'STOCK_COUNTER'
                    ? 'bg-[#f0cd6e] text-slate-950 shadow'
                    : 'text-[#e0e8e2]/70 hover:text-white'
                }`}
                title="Switch to Sejal Tiwari (Medical Shopkeeper - H004 Bhopal)"
              >
                <Building2 className="w-3 h-3" />
                <span>Sejal</span>
              </button>
              <button
                onClick={() => quickDemoLogin('supplier')}
                className={`px-2.5 py-1 rounded-xl transition-all text-[11px] font-medium flex items-center gap-1.5 ${
                  user?.role === 'SUPPLIER'
                    ? 'bg-[#89c07e] text-slate-950 shadow'
                    : 'text-[#e0e8e2]/70 hover:text-white'
                }`}
                title="Switch to Saumay Dubey (Commercial Supplier - V1001)"
              >
                <Truck className="w-3 h-3" />
                <span>Saumay</span>
              </button>
            </div>

            {/* Right: User Profile & Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              {/* User Identity Chip */}
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/15 text-xs">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#467750] to-[#89c07e] flex items-center justify-center font-bold text-[10px] text-slate-950">
                  {user?.avatar || 'U'}
                </div>
                <div className="leading-tight">
                  <div className="font-semibold text-white text-xs">{user?.name}</div>
                  <div className="text-[10px] text-[#f0cd6e] font-mono flex items-center gap-1">
                    {user?.city ? (
                      <>
                        <MapPin className="w-2.5 h-2.5 text-[#f0cd6e]" />
                        <span>{user.city}</span>
                      </>
                    ) : (
                      roleNameMap[user?.role] || user?.role
                    )}
                  </div>
                </div>
              </div>

              {/* Reset Baseline (Manager Only) */}
              {user?.role === 'INVENTORY_MANAGER' && (
                <button
                  onClick={resetBaseline}
                  disabled={loading || isProcessing}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#2c2e35]/80 border border-[#e0e8e2]/15 text-[#e0e8e2]/80 hover:text-[#f0cd6e] hover:border-[#f0cd6e]/40 transition-all"
                  title="Reset inventory baseline"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}

              {/* Sync SAP */}
              <button
                onClick={fetchInventory}
                disabled={loading || isProcessing}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#467750] to-[#89c07e] text-[#2c2e35] font-bold shadow-md shadow-[#467750]/30 hover:brightness-110 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync SAP</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/50 hover:text-white transition-all"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Status Toast Notification */}
        {statusMessage && (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-300 animate-in slide-in-from-top-2 ${
                statusMessage.type === 'success'
                  ? 'glass-mint text-[#e0e8e2] border-[#89c07e]/50 glow-mint'
                  : 'glass-gold text-[#f0cd6e] border-[#f0cd6e]/50 glow-gold'
              }`}
            >
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-[#89c07e] shrink-0" />
                <span className="text-sm font-semibold">{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-xs uppercase tracking-wider font-bold opacity-60 hover:opacity-100 ml-4 px-2 py-1 rounded"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* MAIN ROLE-BASED VIEWPORT */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
          {/* VIEW 1: INVENTORY_MANAGER -> Full 6-Screen Dashboard */}
          {user?.role === 'INVENTORY_MANAGER' && (
            <>
              {activeScreen === 1 && (
                <Screen1ControlTower
                  inventory={inventory}
                  disruptionLength={disruptionLength}
                  onNavigateToScreen2={() => setActiveScreen(2)}
                />
              )}

              {activeScreen === 2 && (
                <Screen2ImpactAnalysis
                  inventory={inventory}
                  disruptionLength={disruptionLength}
                  selectedShortage={selectedShortage}
                  onSelectShortage={setSelectedShortage}
                  onProceedToRecovery={(shortage) => {
                    setSelectedShortage(shortage);
                    setActiveScreen(3);
                  }}
                  loading={loading}
                />
              )}

              {activeScreen === 3 && (
                <Screen3RecoveryPlanning
                  selectedShortage={selectedShortage}
                  selectedPlan={selectedPlan}
                  onSelectPlan={setSelectedPlan}
                  onProceedToCompliance={(plan) => {
                    setSelectedPlan(plan);
                    setActiveScreen(4);
                  }}
                />
              )}

              {activeScreen === 4 && (
                <Screen4ComplianceCheck
                  selectedPlan={selectedPlan}
                  onProceedToApproval={() => setActiveScreen(5)}
                />
              )}

              {activeScreen === 5 && (
                <Screen5HumanApproval
                  selectedPlan={selectedPlan}
                  onExecuteSapTransfer={executeSapTransfer}
                  isExecuting={isProcessing}
                  onResetBaseline={resetBaseline}
                  onNavigateToScreen={(screenNum) => setActiveScreen(screenNum)}
                />
              )}

              {activeScreen === 6 && (
                <ScreenSuppliers
                  onSelectPlanForApproval={(plan) => {
                    setSelectedPlan(plan);
                    setActiveScreen(5);
                  }}
                  onNavigateToScreen={(screenNum) => setActiveScreen(screenNum)}
                />
              )}
            </>
          )}

          {/* VIEW 2: STOCK_COUNTER -> Focused Medical Shopkeeper Audit Portal */}
          {user?.role === 'STOCK_COUNTER' && <ShopkeeperPortal />}

          {/* VIEW 3: SUPPLIER -> Focused Emergency Bidding Portal */}
          {user?.role === 'SUPPLIER' && <SupplierPortal />}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#e0e8e2]/10 bg-[#2c2e35]/60 py-4 px-6 text-center text-xs text-[#e0e8e2]/60 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              PulseChain Enterprise Control Tower • Multi-Role Agentic Supply Chain Resilience
            </span>
            <div className="flex items-center space-x-4 font-mono text-[#89c07e]">
              <span>RFC: Z_PULSE_GET_STOCK</span>
              <span>•</span>
              <span>RFC: Z_PULSE_COUNT_STOCK</span>
              <span>•</span>
              <span>RFC: Z_PULSE_SUBMIT_BID</span>
              <span>•</span>
              <span>RFC: Z_PULSE_UPDATE_STOCK</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <PulseChainProvider>
      <DashboardShell />
    </PulseChainProvider>
  );
}
