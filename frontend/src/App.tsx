import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "./context/AuthContext";

const Phase2Demo      = lazy(() => import("./pages/Phase2Demo"));
const CalculatorPage  = lazy(() => import("./pages/CalculatorPage"));
const ChatPage        = lazy(() => import("./pages/ChatPage"));
const IntakePage      = lazy(() => import("./pages/IntakePage"));
const IBGuidePage     = lazy(() => import("./pages/IBGuidePage"));
const SimulationPage  = lazy(() => import("./pages/SimulationPage"));
const LandingPage     = lazy(() => import("./pages/LandingPage"));
const LoginPage       = lazy(() => import("./pages/LoginPage"));
const RegisterPage    = lazy(() => import("./pages/RegisterPage"));

const PricingPage       = lazy(() => import("./pages/PricingPage"));
const AdminDashboard        = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminRulesPage        = lazy(() => import("./pages/admin/AdminRulesPage"));
const AdminRuleEditorPage   = lazy(() => import("./pages/admin/AdminRuleEditorPage"));
const AdminCalcPreviewPage  = lazy(() => import("./pages/admin/AdminCalculatorPreviewPage"));
const AdminRAGPreviewPage   = lazy(() => import("./pages/admin/AdminRAGPreviewPage"));
const AdminSettingsPage     = lazy(() => import("./pages/admin/AdminSettingsPage"));

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-md text-[14px] no-underline transition-colors ${
          isActive
            ? "bg-[var(--accent-bg)] text-[var(--accent)]"
            : "text-[var(--text)] hover:text-[var(--text-h)]"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function App() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div dir={i18n.language === "fa" ? "rtl" : "ltr"}>
      <nav className="px-12 border-b border-[var(--border)] flex items-center gap-1 h-[52px]">
        <NavLink to="/" className="mr-3 no-underline">
          <strong className="text-[var(--text-h)] text-[15px]">{t("app_name")}</strong>
        </NavLink>

        <NavItem to="/chat">{t("nav.chat")}</NavItem>
        <NavItem to="/calculator">Calculator</NavItem>
        <NavItem to="/ib-guide">{t("ib.nav")}</NavItem>
        <NavItem to="/simulation">{t("nav.simulation")}</NavItem>
        <NavItem to="/pricing">{t("nav.pricing")}</NavItem>
        {user?.is_admin && (
          <NavLink
            to="/admin"
            className="px-3 py-1.5 ml-2 rounded-md border border-[var(--border)] text-[14px] no-underline text-[var(--text)] hover:text-[var(--text-h)] transition-colors"
          >
            Admin
          </NavLink>
        )}

        <div className="ml-auto flex items-center gap-2">
          <select
            value={i18n.language}
            onChange={e => { i18n.changeLanguage(e.target.value); localStorage.setItem("lang", e.target.value); }}
            className="px-2 py-[5px] border border-[var(--border)] rounded-md bg-[var(--bg)] text-[var(--text)] font-[inherit] text-[13px] cursor-pointer outline-none"
          >
            <option value="nl">NL</option>
            <option value="en">EN</option>
            <option value="fa">FA</option>
          </select>

          {user ? (
            <>
              {user.plan === "premium" && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)] text-white tracking-wide">⚡ Premium</span>
              )}
              <span className="text-[13px] text-[var(--text)] max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-[5px] border border-[var(--border)] rounded-md bg-transparent text-[var(--text)] font-[inherit] text-[13px] cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <NavItem to="/login">{t("nav.login")}</NavItem>
              <NavLink
                to="/register"
                className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-[14px] font-semibold no-underline hover:opacity-85 transition-opacity"
              >
                {t("auth.register")}
              </NavLink>
            </>
          )}
        </div>
      </nav>

      <Suspense fallback={<div className="p-12 text-center text-[var(--text)] opacity-50">Loading…</div>}>
        <Routes>
          <Route path="/"           element={<LandingPage />} />
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/register"   element={<RegisterPage />} />
          <Route path="/chat"       element={<ChatPage />} />
          <Route path="/intake"     element={<IntakePage />} />
          <Route path="/ib-guide"   element={<IBGuidePage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/simulation" element={<SimulationPage />} />
          <Route path="/pricing"    element={<PricingPage />} />
          <Route path="/phase2"     element={<Phase2Demo />} />
          <Route path="/admin"                        element={<AdminDashboard />} />
          <Route path="/admin/rules"                  element={<AdminRulesPage />} />
          <Route path="/admin/rules/new"              element={<AdminRuleEditorPage />} />
          <Route path="/admin/rules/:id"              element={<AdminRuleEditorPage />} />
          <Route path="/admin/calculator-preview"     element={<AdminCalcPreviewPage />} />
          <Route path="/admin/rag-preview"            element={<AdminRAGPreviewPage />} />
          <Route path="/admin/settings"               element={<AdminSettingsPage />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
