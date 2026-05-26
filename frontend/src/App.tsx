import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TopNav from "./components/TopNav";

const Phase2Demo      = lazy(() => import("./pages/Phase2Demo"));
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

function App() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === "fa";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} style={{ display: "flex", flexDirection: "column", minHeight: "100svh" }}>
      <TopNav />
      <Suspense fallback={
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-4)", fontSize: 14 }}>
          Loading…
        </div>
      }>
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
          {/* Calculator: kept accessible at URL but not in user nav */}
          <Route path="/calculator"  element={<CalculatorPage />} />
          <Route path="/phase2"      element={<Phase2Demo />} />
          <Route path="/admin"                    element={<AdminDashboard />} />
          <Route path="/admin/rules"              element={<AdminRulesPage />} />
          <Route path="/admin/rules/new"          element={<AdminRuleEditorPage />} />
          <Route path="/admin/rules/:id"          element={<AdminRuleEditorPage />} />
          <Route path="/admin/calculator-preview" element={<AdminCalcPreviewPage />} />
          <Route path="/admin/rag-preview"        element={<AdminRAGPreviewPage />} />
          <Route path="/admin/settings"           element={<AdminSettingsPage />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
