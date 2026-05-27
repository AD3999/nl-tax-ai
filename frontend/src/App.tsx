import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TopNav from "./components/TopNav";
import LoadingScreen from "./components/LoadingScreen";
import { useAuth } from "./context/AuthContext";

const CalculatorPage  = lazy(() => import("./pages/CalculatorPage"));
const ChatPage        = lazy(() => import("./pages/ChatPage"));
const IntakePage      = lazy(() => import("./pages/IntakePage"));
const IBGuidePage     = lazy(() => import("./pages/IBGuidePage"));
const SimulationPage  = lazy(() => import("./pages/SimulationPage"));
const LandingPage     = lazy(() => import("./pages/LandingPage"));
const LoginPage       = lazy(() => import("./pages/LoginPage"));
const RegisterPage    = lazy(() => import("./pages/RegisterPage"));
const PricingPage     = lazy(() => import("./pages/PricingPage"));
const DashboardPage   = lazy(() => import("./pages/DashboardPage"));

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
  const isRtl = i18n.language === "fa";

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
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/"            element={<LandingPage />} />
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/register"    element={<RegisterPage />} />
          <Route path="/chat"        element={<ChatPage />} />
          <Route path="/intake"      element={<IntakePage />} />
          <Route path="/ib-guide"    element={<IBGuidePage />} />
          <Route path="/simulation"  element={<SimulationPage />} />
          <Route path="/pricing"     element={<PricingPage />} />
          <Route path="/dashboard"   element={<DashboardPage />} />
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
