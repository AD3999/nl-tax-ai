import { lazy, Suspense } from "react";
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

function App() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === "fa";

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
    </div>
  );
}

export default App;
