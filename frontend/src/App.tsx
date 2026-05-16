import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Phase2Demo = lazy(() => import("./pages/Phase2Demo"));

// Page stubs — built out in Phase 5+
const ChatPage = () => {
  const { t } = useTranslation();
  return <main style={{ padding: "2rem" }}><h1>{t("chat.placeholder")}</h1></main>;
};

const LoginPage = () => {
  const { t } = useTranslation();
  return <main style={{ padding: "2rem" }}><h1>{t("auth.login")}</h1></main>;
};

const isAuthenticated = () => !!localStorage.getItem("access_token");

function App() {
  const { t, i18n } = useTranslation();

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
        <strong style={{ marginRight: "12px", color: "var(--text-h)", fontSize: "15px" }}>
          {t("app_name")}
        </strong>

        <NavLink
          to="/chat"
          style={({ isActive }) => ({
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "14px",
            textDecoration: "none",
            color: isActive ? "var(--accent)" : "var(--text)",
            background: isActive ? "var(--accent-bg)" : "transparent",
          })}
        >
          {t("nav.chat")}
        </NavLink>

        <NavLink
          to="/phase2"
          style={({ isActive }) => ({
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "14px",
            textDecoration: "none",
            color: isActive ? "var(--accent)" : "var(--text)",
            background: isActive ? "var(--accent-bg)" : "transparent",
          })}
        >
          {t("phase2.nav")}
        </NavLink>

        <div style={{ marginLeft: "auto" }}>
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
        </div>
      </nav>

      <Suspense fallback={<div style={{ padding: "3rem", textAlign: "center", color: "var(--text)" }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/phase2" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/chat"
            element={isAuthenticated() ? <ChatPage /> : <Navigate to="/login" replace />}
          />
          {/* Phase 2 RAG demo — no auth required, dev/testing tool */}
          <Route path="/phase2" element={<Phase2Demo />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
