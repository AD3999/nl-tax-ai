import { lazy, Suspense, useEffect, useState, Component, type ReactNode } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TopNav from "./components/TopNav";
import Footer from "./components/Footer";
import LoadingScreen from "./components/LoadingScreen";
import { useAuth } from "./context/AuthContext";

// ── Error Boundary — prevents a rendering crash from blank-screening the app ──
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: "60vh", gap: 16, padding: 32, textAlign: "center",
        }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, color: "var(--ink)", margin: 0 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 14, color: "var(--ink-3)", maxWidth: 400, margin: 0 }}>
            An unexpected error occurred. Please refresh the page to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-accent btn-sm"
          >
            Refresh page
          </button>
          {import.meta.env.DEV && (
            <pre style={{ fontSize: 11, color: "var(--danger)", textAlign: "left", maxWidth: 600, overflow: "auto" }}>
              {this.state.message}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

const CalculatorPage  = lazy(() => import("./pages/CalculatorPage"));
const ChatPage        = lazy(() => import("./pages/ChatPage"));
const IntakePage      = lazy(() => import("./pages/IntakePage"));
const IBGuidePage     = lazy(() => import("./pages/IBGuidePage"));
const SimulationPage  = lazy(() => import("./pages/SimulationPage"));
const LandingPage     = lazy(() => import("./pages/LandingPage"));
const LoginPage       = lazy(() => import("./pages/LoginPage"));
const RegisterPage    = lazy(() => import("./pages/RegisterPage"));
// PricingPage removed — site is fully free during current phase
const DashboardPage   = lazy(() => import("./pages/DashboardPage"));
const TaxHistoryPage  = lazy(() => import("./pages/TaxHistoryPage"));

const AdminDashboard       = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminRulesPage       = lazy(() => import("./pages/admin/AdminRulesPage"));
const AdminRuleEditorPage  = lazy(() => import("./pages/admin/AdminRuleEditorPage"));
const AdminCalcPreviewPage = lazy(() => import("./pages/admin/AdminCalculatorPreviewPage"));
const AdminRAGPreviewPage  = lazy(() => import("./pages/admin/AdminRAGPreviewPage"));
const AdminSettingsPage    = lazy(() => import("./pages/admin/AdminSettingsPage"));

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user?.is_admin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const SPLASH_DURATION = 2400; // ms until fade starts
const SPLASH_FADE     = 500;  // ms for the fade-out transition

function App() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const isRtl = i18n.language === "fa";
  // Footer hidden on chat (full viewport) and admin pages
  const hideFooter = location.pathname === "/chat" || location.pathname.startsWith("/admin");

  const [splashFading, setSplashFading] = useState(false);
  const [splashDone,   setSplashDone]   = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setSplashFading(true),  SPLASH_DURATION);
    const t2 = setTimeout(() => setSplashDone(true),    SPLASH_DURATION + SPLASH_FADE);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} style={{ display: "flex", flexDirection: "column", minHeight: "100svh" }}>
      <TopNav />
      <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/"            element={<LandingPage />} />
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/register"    element={<RegisterPage />} />
          <Route path="/chat"        element={<ChatPage />} />
          <Route path="/intake"      element={<IntakePage />} />
          <Route path="/ib-guide"    element={<IBGuidePage />} />
          <Route path="/simulation"  element={<SimulationPage />} />
          <Route path="/pricing"     element={<Navigate to="/" replace />} />
          <Route path="/dashboard"   element={<DashboardPage />} />
          <Route path="/tax-history" element={<TaxHistoryPage />} />
          {/* Calculator: kept at URL but hidden from user nav */}
          <Route path="/calculator"  element={<CalculatorPage />} />
          {/* Admin routes — redirect to home if not staff */}
          <Route path="/admin"                    element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/rules"              element={<AdminRoute><AdminRulesPage /></AdminRoute>} />
          <Route path="/admin/rules/new"          element={<AdminRoute><AdminRuleEditorPage /></AdminRoute>} />
          <Route path="/admin/rules/:id"          element={<AdminRoute><AdminRuleEditorPage /></AdminRoute>} />
          <Route path="/admin/calculator-preview" element={<AdminRoute><AdminCalcPreviewPage /></AdminRoute>} />
          <Route path="/admin/rag-preview"        element={<AdminRoute><AdminRAGPreviewPage /></AdminRoute>} />
          <Route path="/admin/settings"           element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
      {!hideFooter && <Footer />}

      {/* Initial splash — rendered as overlay so the app hydrates behind it */}
      {!splashDone && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          opacity: splashFading ? 0 : 1,
          transition: `opacity ${SPLASH_FADE}ms ease-out`,
          pointerEvents: splashFading ? "none" : "auto",
        }}>
          <LoadingScreen />
        </div>
      )}
    </div>
  );
}

export default App;
