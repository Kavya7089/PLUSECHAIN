import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { PulseChainProvider, usePulseChain } from './context/PulseChainContext';
import LoginScreen from './components/LoginScreen';
import ShopkeeperPortal from './components/ShopkeeperPortal';
import SupplierPortal from './components/SupplierPortal';
import RegionalHeadDashboard from './components/RegionalHeadDashboard';
import SupplierReviewModal from './components/SupplierReviewModal';
import Sidebar from './components/Sidebar';
import ProcessingOverlay from './components/ProcessingOverlay';
import Screen1ControlTower from './components/screens/Screen1ControlTower';
import Screen2ImpactAnalysis from './components/screens/Screen2ImpactAnalysis';
import Screen3RecoveryPlanning from './components/screens/Screen3RecoveryPlanning';
import Screen4ComplianceCheck from './components/screens/Screen4ComplianceCheck';
import Screen5HumanApproval from './components/screens/Screen5HumanApproval';
import ScreenSuppliers from './components/screens/ScreenSuppliers';
import Screen7StaffDirectory from './components/screens/Screen7StaffDirectory';
import ThreeBackground from './components/ThreeBackground';

// Utility & Common Components
import ScrollProgressBar from './components/common/ScrollProgressBar';
import StairTransition from './components/common/StairTransition';
import BackToTopButton from './components/common/BackToTopButton';
import CookieBanner from './components/common/CookieBanner';
import FloatingSupportButton from './components/common/FloatingSupportButton';
import HelpFaqAccordion from './components/common/HelpFaqAccordion';
import ConfirmModal from './components/common/ConfirmModal';
import SiteSearchModal from './components/common/SiteSearchModal';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useDocumentTitle } from './hooks/useDocumentTitle';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  RefreshCw,
  RotateCcw,
  LogOut,
  User,
  Shield,
  Building2,
  Truck,
  MapPin,
  UserCheck,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  HelpCircle,
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
    theme,
    toggleTheme,
  } = usePulseChain();

  // Dynamic Document Title
  const activeScreenTitle = useMemo(() => {
    if (!isAuthenticated) return 'Sign In';
    if (['VERIFICATION_OFFICER', 'COLD_CHAIN_OFFICER', 'STOCK_COUNTER', 'SHOPKEEPER'].includes(user?.role)) {
      return 'Verification & Cold-Chain Approvals';
    }
    if (user?.role === 'SUPPLIER') return 'Supplier Portal';
    switch (activeScreen) {
      case 1:
        return 'Control Tower Overview';
      case 2:
        return 'Disruption Alerts & Impact';
      case 3:
        return 'AI Recovery Planner';
      case 4:
        return 'Cold-Chain Compliance Check';
      case 5:
        return 'SAP Authorization & Transfer';
      case 6:
        return 'Supplier Directory & Performance';
      case 7:
        return 'Staff Roster & SAP UserSet';
      default:
        return 'Resilience Dashboard';
    }
  }, [isAuthenticated, user?.role, activeScreen]);

  useDocumentTitle(
    activeScreenTitle,
    'PulseChain Enterprise Healthcare Supply Chain Resilience Control Tower connected live to SAP S/4HANA OData and Supabase Auth.'
  );

  // Search Modal State & Keyboard Shortcuts (Unconditionally declared)
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqDrawerOpen, setFaqDrawerOpen] = useState(false);
  const [confirmSignOutOpen, setConfirmSignOutOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Critical Hospital Metrics (Unconditionally declared)
  const criticalHospitalsCount = useMemo(() => {
    if (!inventory || !Array.isArray(inventory)) return 0;
    return new Set(
      inventory
        .filter((item) => item.daysCover < (disruptionLength || 12))
        .map((item) => item.HOSPITAL_ID)
    ).size;
  }, [inventory, disruptionLength]);

  // Pending Supplier Reviews State (Unconditionally declared)
  const [pendingReviewShipments, setPendingReviewShipments] = useState([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeReviewShipment, setActiveReviewShipment] = useState(null);

  // Regional Head View State (Unconditionally declared)
  const isRegionalUser = useMemo(() => {
    return (
      ['REGIONAL_ADMIN', 'REGIONAL_HEAD'].includes(user?.role) ||
      user?.canonicalRole === 'REGIONAL_HEAD' ||
      user?.canonicalRole === 'REGIONAL_ADMIN'
    );
  }, [user]);

  const [showRegionalDashboard, setShowRegionalDashboard] = useState(isRegionalUser);

  useEffect(() => {
    setShowRegionalDashboard(isRegionalUser);
  }, [isRegionalUser]);

  const fetchPendingReviews = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/reviews/pending`);
      if (res.data?.success) {
        setPendingReviewShipments(res.data.shipments || []);
      }
    } catch {
      // ignore unauthenticated or network note
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPendingReviews();
    const interval = setInterval(fetchPendingReviews, 15000);
    return () => clearInterval(interval);
  }, [fetchPendingReviews]);

  const screenWorkflowTitles = {
    1: '1. Dashboard (Disruption Radar)',
    2: '2. Disruption Alerts (Shortage Impact)',
    3: '3. AI Scenario Planner (Reallocation)',
    4: '4. Compliance Check (Cold-Chain Verification)',
    5: '5. Human Approval (SAP Authorization)',
    6: '6. Supplier Directory (Vendor Master)',
    7: '7. Staff Directory (SAP UserSet)',
  };

  const handleSearchResult = (item) => {
    if (item.screen) {
      setActiveScreen(item.screen);
      setShowRegionalDashboard(false);
    }
  };

  // If not authenticated, render LoginScreen with 3D Background (All hooks already called)
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen bg-abyss-canvas text-abyss-text flex font-sans selection:bg-volt selection:text-volt-text">
        <ThreeBackground />
        <div className="relative z-10 w-full flex flex-col min-h-screen">
          <ScrollProgressBar />
          <LoginScreen />
          <CookieBanner />
          <FloatingSupportButton />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-abyss-canvas text-abyss-text flex font-sans selection:bg-volt selection:text-volt-text">
      {/* 3D Interactive Ambient Three.js Background */}
      <ThreeBackground />

      {/* Accessible Skip-to-Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-volt focus:text-volt-text focus:font-bold focus:rounded-xl focus:shadow-xl focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Viewport Scroll Progress Bar */}
      <ScrollProgressBar />

      {/* Staggered Stair Page Transition (Cascading Steps Across Screen) */}
      <StairTransition />

      {/* 3-Second Execution Loading Overlay */}
      <ProcessingOverlay
        isOpen={isProcessing}
        transferDetails={activeExecutionPlan}
        onComplete={handleProcessingComplete}
      />

      {/* Render Sidebar for Managers & Regional Admins */}
      {(['INVENTORY_MANAGER', 'HOSPITAL_MANAGER', 'REGIONAL_ADMIN', 'REGIONAL_HEAD'].includes(user?.role) || isRegionalUser) && (
        <div className="hidden lg:block shrink-0 relative z-20">
          <Sidebar
            activeScreen={activeScreen}
            setActiveScreen={setActiveScreen}
            criticalCount={criticalHospitalsCount}
            selectedPlan={selectedPlan}
            isCompliancePassed={true}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto relative z-10">
        {/* Top Header */}
        <header className="sticky top-0 z-30 w-full border-b border-sand-border bg-abyss-card/85 backdrop-blur-xl shadow-sm transition-colors print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
            {/* Left: Brand / Home Link + Official PulseChain Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="lg:hidden p-2 rounded-xl bg-abyss-elevated border border-sand-border text-abyss-text hover:bg-sand-border/30"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveScreen(1);
                  setShowRegionalDashboard(isRegionalUser);
                }}
                className="flex items-center space-x-2.5 group text-left focus-visible:ring-2 focus-visible:ring-[#FFD400] rounded-lg p-1"
                title="Return to Home Dashboard"
              >
                <div className="w-8 h-8 rounded-lg bg-abyss-elevated border border-sand-border flex items-center justify-center overflow-hidden p-0.5">
                  <img
                    src="/pulsechain-logo.png"
                    alt="PulseChain"
                    width="26"
                    height="26"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-black text-sm text-abyss-text group-hover:text-volt transition-colors">
                  PulseChain
                </span>
              </button>

              <div className="hidden sm:block text-abyss-muted/40 font-mono text-xs">/</div>

              {/* Multi-Tenant Scoping Badge */}
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-abyss-elevated border border-sand-border text-xs font-mono text-abyss-text">
                <Shield className="w-3 h-3 text-volt" />
                <span className="truncate max-w-[200px] sm:max-w-none">
                  {user?.role === 'REGIONAL_ADMIN' || user?.canonicalRole === 'REGIONAL_HEAD'
                    ? 'REGIONAL HEAD • ALL MUNICIPALITIES'
                    : user?.role === 'SUPPLIER'
                    ? `${user?.supplierId || 'V1001'} • SUPPLIER`
                    : `${user?.hospitalId || 'H004'} • ${user?.city || 'BHOPAL'} • ${
                        ['VERIFICATION_OFFICER', 'COLD_CHAIN_OFFICER', 'STOCK_COUNTER', 'SHOPKEEPER'].includes(user?.role)
                          ? 'VERIFICATION OFFICER'
                          : 'MANAGER'
                      }`}
                </span>
              </div>
            </div>

            {/* Middle: Functional Site Search Input */}
            <div className="flex-1 max-w-xs hidden md:block">
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-abyss-elevated border border-sand-border text-xs text-abyss-muted hover:text-abyss-text hover:border-abyss-border transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-volt" />
                  <span>Search hospitals, medicines, vendors...</span>
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-abyss-card border border-sand-border text-[10px] font-mono text-abyss-muted">
                  /
                </kbd>
              </button>
            </div>

            {/* Right: Quick Demo Persona Switchers & User Actions */}
            <div className="flex items-center space-x-2">
              {/* Working Dark / Light Mode Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-abyss-elevated border border-sand-border text-abyss-text hover:text-volt transition-colors"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                aria-label={`Toggle theme (currently ${theme})`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-volt" /> : <Moon className="w-4 h-4 text-volt" />}
              </button>

              {/* Help & FAQ Drawer Toggle */}
              <button
                type="button"
                onClick={() => setFaqDrawerOpen((prev) => !prev)}
                className="p-2 rounded-xl bg-abyss-elevated border border-sand-border text-abyss-text hover:text-volt transition-colors"
                title="Operating Protocols FAQ"
                aria-label="Toggle FAQ drawer"
              >
                <HelpCircle className="w-4 h-4 text-volt" />
              </button>

              {/* Quick Persona Switcher Menu */}
              <div className="hidden xl:flex items-center space-x-1 font-mono text-[11px] bg-abyss-elevated p-1 rounded-xl border border-sand-border">
                <button
                  type="button"
                  onClick={() => quickDemoLogin('manager')}
                  className="px-2 py-0.5 rounded hover:bg-abyss-card text-abyss-muted hover:text-abyss-text transition-colors"
                  title="Switch to H004 Manager"
                >
                  H004
                </button>
                <button
                  type="button"
                  onClick={() => quickDemoLogin('verification_officer')}
                  className="px-2 py-0.5 rounded hover:bg-abyss-card text-abyss-muted hover:text-abyss-text transition-colors"
                  title="Switch to Cold-Chain & Stock Verification Officer"
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={() => quickDemoLogin('admin')}
                  className="px-2 py-0.5 rounded hover:bg-abyss-card text-abyss-muted hover:text-abyss-text transition-colors"
                  title="Switch to Regional Admin"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => quickDemoLogin('supplier')}
                  className="px-2 py-0.5 rounded hover:bg-abyss-card text-abyss-muted hover:text-abyss-text transition-colors"
                  title="Switch to Supplier V1001"
                >
                  Vendor
                </button>
              </div>

              {/* Active User Avatar & Sign Out */}
              <div className="flex items-center space-x-2 pl-1">
                <div className="w-8 h-8 rounded-xl bg-abyss-elevated border border-sand-border flex items-center justify-center font-bold font-mono text-xs text-volt">
                  {user?.avatar || 'PC'}
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmSignOutOpen(true)}
                  className="p-2 rounded-xl bg-abyss-elevated border border-sand-border text-abyss-muted hover:text-red-400 hover:border-red-500/50 transition-colors"
                  title="Sign Out"
                  aria-label="Sign out of PulseChain"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Operational FAQ Accordion Drawer */}
        {faqDrawerOpen && (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4 animate-in slide-in-from-top duration-200">
            <HelpFaqAccordion />
          </div>
        )}

        {/* Post-Delivery Supplier Performance Review Pending Alert Banner */}
        {pendingReviewShipments.length > 0 && (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-3">
            <div className="p-3.5 rounded-xl bg-abyss-card border border-volt/50 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-abyss-text shadow-md">
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-volt shrink-0 animate-pulse" />
                <span>
                  <strong>POST-DELIVERY REVIEW REQUIRED:</strong> Delivered supplier shipment{' '}
                  <code className="text-volt font-bold">{pendingReviewShipments[0].id}</code> (Vendor{' '}
                  <strong className="text-volt">{pendingReviewShipments[0].supplier_id}</strong>) requires auditor performance scoring.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveReviewShipment(pendingReviewShipments[0]);
                  setReviewModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-volt text-volt-text font-bold text-xs uppercase hover:bg-volt-hover active:scale-95 transition-colors focus-visible:ring-2 focus-visible:ring-[#FFD400]"
              >
                Review Supplier Now
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Status Toast Notification */}
        {statusMessage && (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
            <div className="p-4 rounded-xl border border-sand-border bg-abyss-card flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-volt shrink-0" />
                <span className="text-sm font-semibold text-abyss-text">{statusMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-xs uppercase tracking-wider font-bold text-abyss-muted hover:text-abyss-text ml-4 px-2 py-1 rounded"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* MAIN ROLE-BASED VIEWPORT */}
        <main id="main-content" tabIndex="-1" className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 outline-none">
          {['INVENTORY_MANAGER', 'HOSPITAL_MANAGER', 'REGIONAL_ADMIN', 'REGIONAL_HEAD'].includes(user?.role) || isRegionalUser ? (
            <>
              {activeScreen === 1 && (
                isRegionalUser && showRegionalDashboard ? (
                  <RegionalHeadDashboard />
                ) : (
                  <Screen1ControlTower
                    inventory={inventory}
                    disruptionLength={disruptionLength}
                    onNavigateToScreen2={() => setActiveScreen(2)}
                  />
                )
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

              {activeScreen === 7 && <Screen7StaffDirectory />}
            </>
          ) : ['VERIFICATION_OFFICER', 'COLD_CHAIN_OFFICER', 'STOCK_COUNTER', 'SHOPKEEPER'].includes(user?.role) ? (
            <ShopkeeperPortal />
          ) : user?.role === 'SUPPLIER' ? (
            <SupplierPortal />
          ) : (
            // Safe fallback if role is undefined or unrecognized
            <Screen1ControlTower
              inventory={inventory}
              disruptionLength={disruptionLength}
              onNavigateToScreen2={() => setActiveScreen(2)}
            />
          )}
        </main>

        {/* Post-Delivery Supplier Performance Review Modal */}
        <SupplierReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setActiveReviewShipment(null);
          }}
          shipment={activeReviewShipment}
          onReviewSuccess={() => {
            fetchPendingReviews();
            fetchInventory();
          }}
        />

        {/* Global Accessible Confirm Modal for Sign Out */}
        <ConfirmModal
          isOpen={confirmSignOutOpen}
          title="Sign Out of PulseChain"
          message="Are you sure you want to end your active enterprise session? Unsaved local forms will be discarded."
          confirmLabel="Sign Out"
          cancelLabel="Stay Logged In"
          isDestructive={true}
          onConfirm={logout}
          onClose={() => setConfirmSignOutOpen(false)}
        />

        {/* Functional Global Site Search Modal */}
        <SiteSearchModal
          isOpen={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          onSelectResult={handleSearchResult}
        />

        {/* Floating Utilities */}
        <BackToTopButton />
        <FloatingSupportButton />
        <CookieBanner />

        {/* Footer */}
        <footer className="border-t border-sand-border bg-abyss-card py-4 px-6 text-center text-xs text-abyss-muted mt-auto print:hidden">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              © {new Date().getFullYear()} PulseChain Enterprise Control Tower • Multi-Role Agentic Supply Chain Resilience
            </span>
            <div className="flex items-center space-x-3 font-mono text-abyss-muted text-[11px]">
              <span>SAP Gateway: ZPLUSE_SRV</span>
              <span>•</span>
              <span>OSRM Transit Guardrail</span>
              <span>•</span>
              <span>Supabase Auth & RLS</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PulseChainProvider>
        <DashboardShell />
      </PulseChainProvider>
    </ErrorBoundary>
  );
}
