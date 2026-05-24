import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "./context/AuthContext";

const Phase2Demo   = lazy(() => import("./pages/Phase2Demo"));
const CalculatorPage = lazy(() => import("./pages/CalculatorPage"));
const ChatPage     = lazy(() => import("./pages/ChatPage"));
const IntakePage   = lazy(() => import("./pages/IntakePage"));
const IBGuidePage  = lazy(() => import("./pages/IBGuidePage"));
const LandingPage  = lazy(() => import("./pages/LandingPage"));
const LoginPage    = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  padding: "6px 12px",
  borderRadius: "6px",
  fontSize: "14px",
  textDecoration: "none",
  color: isActive ? "var(--accent)" : "var(--text)",
  background: isActive ? "var(--accent-bg)" : "transparent",
});

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
      <nav style={{
        padding: "0 48px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        height: "52px",
      }}>
        <NavLink to="/" style={{ marginRight: "12px", textDecoration: "none" }}>
          <strong style={{ color: "var(--text-h)", fontSize: "15px" }}>
            {t("app_name")}
          </strong>
        </NavLink>

        <NavLink to="/chat" style={navLinkStyle}>{t("nav.chat")}</NavLink>
        <NavLink to="/calculator" style={navLinkStyle}>Calculator</NavLink>
        <NavLink to="/ib-guide" style={navLinkStyle}>{t("ib.nav")}</NavLink>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <select
            value={i18n.language}
            onChange={e => { i18n.changeLanguage(e.target.value); localStorage.setItem("lang", e.target.value); }}
            style={{
              padding: "5px 8px",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              background: "var(--bg)",
              color: "var(--text)",
              font: "inherit",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <option value="nl">NL</option>
            <option value="en">EN</option>
            <option value="fa">FA</option>
          </select>

          {user ? (
            <>
              <span style={{ fontSize: "13px", color: "var(--text)", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: "5px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  background: "transparent",
                  color: "var(--text)",
                  font: "inherit",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" style={navLinkStyle}>{t("nav.login")}</NavLink>
              <NavLink
                to="/register"
                style={{ ...navLinkStyle({ isActive: false }), background: "var(--accent)", color: "#fff", fontWeight: 600 }}
              >
                {t("auth.register")}
              </NavLink>
            </>
          )}
        </div>
      </nav>

      <Suspense fallback={<div style={{ padding: "3rem", textAlign: "center", color: "var(--text)" }}>Loading…</div>}>
        <Routes>
          <Route path="/"           element={<LandingPage />} />
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/register"   element={<RegisterPage />} />
          <Route path="/chat"       element={<ChatPage />} />
          <Route path="/intake"     element={<IntakePage />} />
          <Route path="/ib-guide"   element={<IBGuidePage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/phase2"     element={<Phase2Demo />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
