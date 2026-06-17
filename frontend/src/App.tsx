import { lazy, Suspense, useEffect, useState, Component, type ReactNode } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import PublicLayout from "./components/PublicLayout";
import AppLayout from "./components/AppLayout";
import LoadingScreen from "./components/LoadingScreen";
import { useAuth } from "./context/AuthContext";
import { trackPageView } from "./lib/analytics";
import CookieConsentBanner, { type ConsentDecision } from "./components/CookieConsentBanner";

// ── Error Boundary ─────────────────────────────────────────────────────────────
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
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "60vh", gap: 16, padding: 32, textAlign: "center",
        }}>
          <AlertTriangle size={40} style={{ color: "var(--warn)" }} />
          <h2 style={{ fontSize: 22, color: "var(--text)", margin: 0 }}>Something went wrong</h2>
          <p style={{ fontSize: 14, color: "var(--text-3)", maxWidth: 400, margin: 0 }}>
            An unexpected error occurred. Please refresh the page to continue.
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-accent btn-sm">
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

// ── Lazy page imports ──────────────────────────────────────────────────────────
const CalculatorPage          = lazy(() => import("./pages/CalculatorPage"));
const ChatPage                = lazy(() => import("./pages/ChatPage"));
const IntakePage              = lazy(() => import("./pages/IntakePage"));
const LandingPage             = lazy(() => import("./pages/LandingPage"));
const LoginPage               = lazy(() => import("./pages/LoginPage"));
const RegisterPage            = lazy(() => import("./pages/RegisterPage"));
const DashboardPage           = lazy(() => import("./pages/DashboardPage"));
const TaxHistoryPage          = lazy(() => import("./pages/TaxHistoryPage"));
const DeductionCheckerPage    = lazy(() => import("./pages/DeductionCheckerPage"));
const ZZPTaxPage              = lazy(() => import("./pages/ZZPTaxPage"));
const ExpatTaxPage            = lazy(() => import("./pages/ExpatTaxPage"));
const TaxCalendarPage         = lazy(() => import("./pages/TaxCalendarPage"));
const AccountantPortalPage    = lazy(() => import("./pages/portal/AccountantPortalPage"));
const AccountantClientPage    = lazy(() => import("./pages/portal/AccountantClientDetailPage"));
const AccountantEngagementPage = lazy(() => import("./pages/portal/EngagementPage"));
const ClientPortalPage        = lazy(() => import("./pages/portal/ClientPortalPage"));
const ClientTasksPage         = lazy(() => import("./pages/portal/ClientTasksPage"));
const ClientDocumentsPage     = lazy(() => import("./pages/portal/ClientDocumentsPage"));
const GoogleCallbackPage      = lazy(() => import("./pages/GoogleCallbackPage"));
const AccountantInboxPage     = lazy(() => import("./pages/AccountantInboxPage"));
const AccountantSettingsPage  = lazy(() => import("./pages/AccountantSettingsPage"));
const ClientMessagesPage      = lazy(() => import("./pages/ClientMessagesPage"));
const ClientProfilePage       = lazy(() => import("./pages/ClientProfilePage"));
const ZZPWorkspacePage        = lazy(() => import("./pages/ZZPWorkspacePage"));

const AdminDashboard          = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsersPage          = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminChatLogsPage       = lazy(() => import("./pages/admin/AdminChatLogsPage"));
const AdminRulesPage          = lazy(() => import("./pages/admin/AdminRulesPage"));
const AdminRuleEditorPage     = lazy(() => import("./pages/admin/AdminRuleEditorPage"));
const AdminCalcPreviewPage    = lazy(() => import("./pages/admin/AdminCalculatorPreviewPage"));
const AdminRAGPreviewPage     = lazy(() => import("./pages/admin/AdminRAGPreviewPage"));
const AdminSettingsPage       = lazy(() => import("./pages/admin/AdminSettingsPage"));
const AdminFirmsPage          = lazy(() => import("./pages/admin/AdminFirmsPage"));
const AdminAuditLogsPage      = lazy(() => import("./pages/admin/AdminAuditLogsPage"));
const AdminAIMonitoringPage   = lazy(() => import("./pages/admin/AdminAIMonitoringPage"));
const AccountantReviewQueue   = lazy(() => import("./pages/portal/AccountantReviewQueuePage"));

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user?.is_admin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const SPLASH_DURATION = 2400;
const SPLASH_FADE     = 500;

function App() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const isRtl = i18n.language === "fa";

  const [splashFading, setSplashFading] = useState(false);
  const [splashDone,   setSplashDone]   = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setSplashFading(true),  SPLASH_DURATION);
    const t2 = setTimeout(() => setSplashDone(true),    SPLASH_DURATION + SPLASH_FADE);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  function handleConsent(_decision: ConsentDecision) {
    // Re-trigger page view now that consent may have been given
    trackPageView(location.pathname);
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      <CookieConsentBanner onDecision={handleConsent} />
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>

            {/* ── Public routes: TopNav + Footer ── */}
            <Route element={<PublicLayout />}>
              <Route path="/"                        element={<LandingPage />} />
              <Route path="/login"                   element={<LoginPage />} />
              <Route path="/register"                element={<RegisterPage />} />
              <Route path="/auth/google/callback"    element={<GoogleCallbackPage />} />
              <Route path="/zzp-tax-netherlands"     element={<ZZPTaxPage />} />
              <Route path="/expat-tax-netherlands"   element={<ExpatTaxPage />} />
            </Route>

            {/* ── App routes: Sidebar layout ── */}
            <Route element={<AppLayout />}>
              <Route path="/deduction-checker"      element={<DeductionCheckerPage />} />
              <Route path="/dashboard"              element={<DashboardPage />} />
              <Route path="/chat"                   element={<ChatPage />} />
              <Route path="/intake"                 element={<IntakePage />} />
              <Route path="/tax-history"            element={<TaxHistoryPage />} />
              <Route path="/tax-calendar"           element={<TaxCalendarPage />} />
              <Route path="/calculator"             element={<CalculatorPage />} />
              <Route path="/accountant/portal"           element={<AccountantPortalPage />} />
              <Route path="/accountant/clients/:id"      element={<AccountantClientPage />} />
              <Route path="/accountant/engagements/:id"  element={<AccountantEngagementPage />} />
              <Route path="/accountant/review-queue"     element={<AccountantReviewQueue />} />
              <Route path="/client"                 element={<ClientPortalPage />} />
              <Route path="/client/tasks"           element={<ClientTasksPage />} />
              <Route path="/client/documents"       element={<ClientDocumentsPage />} />
              <Route path="/client/messages"        element={<ClientMessagesPage />} />
              <Route path="/client/profile"         element={<ClientProfilePage />} />
              <Route path="/accountant/inbox"       element={<AccountantInboxPage />} />
              <Route path="/accountant/settings"    element={<AccountantSettingsPage />} />
              <Route path="/zzp-workspace"          element={<ZZPWorkspacePage />} />

            </Route>

            {/* ── Admin routes: AdminLayout handles its own sidebar/topbar ── */}
            <Route path="/admin"                    element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users"              element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
            <Route path="/admin/chat-logs"          element={<AdminRoute><AdminChatLogsPage /></AdminRoute>} />
            <Route path="/admin/rules"              element={<AdminRoute><AdminRulesPage /></AdminRoute>} />
            <Route path="/admin/rules/new"          element={<AdminRoute><AdminRuleEditorPage /></AdminRoute>} />
            <Route path="/admin/rules/:id"          element={<AdminRoute><AdminRuleEditorPage /></AdminRoute>} />
            <Route path="/admin/calculator-preview" element={<AdminRoute><AdminCalcPreviewPage /></AdminRoute>} />
            <Route path="/admin/rag-preview"        element={<AdminRoute><AdminRAGPreviewPage /></AdminRoute>} />
            <Route path="/admin/settings"           element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
            <Route path="/admin/firms"              element={<AdminRoute><AdminFirmsPage /></AdminRoute>} />
            <Route path="/admin/audit-logs"         element={<AdminRoute><AdminAuditLogsPage /></AdminRoute>} />
            <Route path="/admin/ai-monitoring"      element={<AdminRoute><AdminAIMonitoringPage /></AdminRoute>} />

            {/* ── Redirects ── */}
            <Route path="/ib-guide"    element={<Navigate to="/chat?mode=ib-return" replace />} />
            <Route path="/simulation"  element={<Navigate to="/chat?mode=simulation" replace />} />
            <Route path="/pricing"     element={<Navigate to="/" replace />} />
            <Route path="/accountant"  element={<Navigate to="/accountant/portal" replace />} />
            <Route path="*"            element={<Navigate to="/" replace />} />

          </Routes>
        </Suspense>
      </ErrorBoundary>

      {/* Splash overlay */}
      {!splashDone && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
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
