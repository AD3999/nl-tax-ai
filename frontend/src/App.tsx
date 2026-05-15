import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
      <nav style={{ padding: "1rem", borderBottom: "1px solid #eee", display: "flex", gap: "1rem", alignItems: "center" }}>
        <strong>{t("app_name")}</strong>
        <a href="/chat">{t("nav.chat")}</a>
        <select
          value={i18n.language}
          onChange={(e) => { i18n.changeLanguage(e.target.value); localStorage.setItem("lang", e.target.value); }}
        >
          <option value="nl">NL</option>
          <option value="en">EN</option>
          <option value="fa">FA</option>
        </select>
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/chat"
          element={isAuthenticated() ? <ChatPage /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </div>
  );
}

export default App;
