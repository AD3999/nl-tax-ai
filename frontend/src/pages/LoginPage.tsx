import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { login, fetchProfile } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import Wordmark from "../components/Wordmark";
import { Icon } from "../components/Icon";
import { useMobile } from "../hooks/useMobile";
import { useToast } from "../context/ToastContext";

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { showToast } = useToast();
  const isMobile = useMobile();
  const lang = i18n.language as "nl" | "en" | "fa";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const LOGIN_ERR: Record<string, string> = {
    nl: "Onjuist e-mailadres of wachtwoord.",
    en: "Incorrect email address or password.",
    fa: "آدرس ایمیل یا رمز عبور اشتباه است.",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ username: email, password });
      const profile = await fetchProfile();
      setUser(profile);
      if (profile?.id) localStorage.setItem("taxwijs_user_id", String(profile.id));
      showToast(
        lang === "nl" ? "Ingelogd! Welkom terug." : lang === "fa" ? "وارد شدید! خوش آمدید." : "Logged in! Welcome back.",
        "success",
      );
      navigate("/chat");
    } catch {
      const msg = LOGIN_ERR[lang] ?? t("auth.login_error");
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 1fr", minHeight: "calc(100vh - 64px)" }}>
      {/* Left — form */}
      <div style={{ padding: isMobile ? "28px 20px" : "36px 56px", display: "flex", flexDirection: "column", background: "var(--paper)", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Wordmark size={16} />
          <Link to="/" style={{ fontSize: 13, color: "var(--ink-3)" }}>← Back to home</Link>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{ width: "100%", maxWidth: 380 }}>
            <div className="eyebrow eyebrow-accent">Welcome back</div>
            <h1 style={{ marginTop: 8, fontSize: 36, fontFamily: "var(--serif)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              Log in to your<br />tax workspace.
            </h1>

            {error && (
              <div style={{ marginTop: 16, padding: 12, background: "var(--danger-soft)", borderRadius: "var(--r-sm)", fontSize: 13, color: "var(--danger)" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div className="tw-label" style={{ marginBottom: 6 }}>{t("auth.email")}</div>
                <input className="tw-input" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span className="tw-label">{t("auth.password")}</span>
                  <span style={{ fontSize: 11.5, color: "var(--sage-700)", cursor: "pointer" }}>Forgot?</span>
                </div>
                <input className="tw-input" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
              </div>

              <button className="btn btn-accent btn-lg" type="submit" disabled={loading} style={{ marginTop: 6 }}>
                {loading ? "Logging in…" : <>{t("nav.login")} <Icon.arrow /></>}
              </button>
            </form>

            <div style={{ margin: "22px 0", display: "flex", alignItems: "center", gap: 12, color: "var(--ink-4)", fontSize: 11 }}>
              <span className="hair" style={{ flex: 1 }} /> OR <span className="hair" style={{ flex: 1 }} />
            </div>

            <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
              {t("auth.no_account")}{" "}
              <Link to="/register" style={{ color: "var(--sage-700)", fontWeight: 500 }}>
                {t("auth.register")} →
              </Link>
            </p>
          </div>
        </div>

        <div style={{ fontSize: 11, color: "var(--ink-4)", display: "flex", justifyContent: "space-between" }}>
          <span>© 2026 TaxWijs</span>
          <span>Privacy · Terms</span>
        </div>
      </div>

      {/* Right — editorial side (hidden on mobile) */}
      {!isMobile && <div className="grain" style={{ padding: 36, borderLeft: "1px solid var(--hairline)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Wordmark size={14} />
        <div>
          <span className="pill" style={{ background: "rgba(255,255,255,0.18)", color: "var(--ink-2)" }}>Today's tip</span>
          <h2 style={{ marginTop: 16, color: "var(--ink)", fontFamily: "var(--serif)", fontWeight: 400, fontSize: 32, lineHeight: 1.12, letterSpacing: "-0.015em" }}>
            "Startersaftrek runs out at the end of <em>2026</em> — last call for the €2,123 deduction."
          </h2>
          <p style={{ marginTop: 16, color: "var(--ink-3)", fontSize: 13, maxWidth: 360 }}>
            One of 28 verified 2026 rules in your knowledge base.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[["28", "Rules verified"], ["3", "Languages"], ["1,225 h", "ZZP hour rule"]].map(([n, l]) => (
            <div key={l} style={{ padding: 14, background: "var(--paper)", border: "1px solid var(--hairline)", borderRadius: "var(--r)" }}>
              <div className="font-serif" style={{ fontSize: 26, color: "var(--ink)", lineHeight: 1 }}>{n}</div>
              <div className="eyebrow" style={{ marginTop: 6 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
}
