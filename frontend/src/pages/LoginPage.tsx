import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { login, googleAuth, fetchProfile } from "../api/auth";
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

  const handleGoogle = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      setError("Google Client ID not configured — add VITE_GOOGLE_CLIENT_ID to frontend/.env and restart");
      return;
    }
    if (!window.google) {
      setError("Google sign-in is still loading — please try again in a moment");
      return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "email profile",
      callback: async (resp) => {
        if (resp.error) {
          const msg = lang === "nl" ? "Google-inloggen mislukt" : lang === "fa" ? "ورود با گوگل ناموفق بود" : "Google sign-in failed";
          setError(msg);
          return;
        }
        setLoading(true);
        setError("");
        try {
          await googleAuth(resp.access_token);
          const profile = await fetchProfile();
          setUser(profile);
          if (profile?.id) localStorage.setItem("taxwijs_user_id", String(profile.id));
          showToast(
            lang === "nl" ? "Ingelogd — welkom terug" : lang === "fa" ? "وارد شدید — خوش آمدید" : "Logged in — welcome back",
            "success",
          );
          navigate("/dashboard");
        } catch {
          const msg = lang === "nl" ? "Google-inloggen mislukt" : lang === "fa" ? "ورود با گوگل ناموفق بود" : "Google sign-in failed";
          setError(msg);
          showToast(msg, "error");
        } finally {
          setLoading(false);
        }
      },
    });
    client.requestAccessToken();
  };

  const LOGIN_ERR: Record<string, string> = {
    nl: "Onjuist e-mailadres of wachtwoord",
    en: "Incorrect email address or password",
    fa: "آدرس ایمیل یا رمز عبور اشتباه است",
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
      <div style={{ position: "relative", padding: isMobile ? "28px 20px" : "36px 56px", display: "flex", flexDirection: "column", background: "var(--paper)", overflow: "auto" }}>

        {/* Loading overlay — left panel on desktop, full screen on mobile */}
        {loading && (
          <div style={{
            position: isMobile ? "fixed" : "absolute",
            inset: 0, zIndex: 50,
            background: "var(--paper)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 22, overflow: "hidden",
          }}>
            {/* Radial brand tint */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: [
                "radial-gradient(60% 50% at 80% 0%, oklch(0.95 0.05 115 / 0.5), transparent 60%)",
                "radial-gradient(50% 40% at 0% 100%, oklch(0.95 0.03 95 / 0.55), transparent 60%)",
              ].join(", "),
            }} />

            {/* Shield with breathing rings */}
            <div style={{ position: "relative", width: 72, height: 72, display: "grid", placeItems: "center" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  position: "absolute", width: 72, height: 72, borderRadius: "50%",
                  border: "1px solid oklch(0.79 0.110 117 / 0.4)",
                  animation: `tw-breath 2.6s ease-out ${i * 0.6}s infinite`,
                  opacity: 0,
                }} />
              ))}
              <svg width={72} height={72} viewBox="0 0 64 64" fill="none">
                <defs>
                  <linearGradient id="lo-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="oklch(0.50 0.105 118)" />
                    <stop offset="1" stopColor="oklch(0.40 0.085 118)" />
                  </linearGradient>
                </defs>
                <path d="M32 4 L56 11 V32 C56 46 45.5 56.5 32 60 C18.5 56.5 8 46 8 32 V11 Z" fill="url(#lo-grad)" />
                <path
                  d="M20 32 L29 41 L46 22"
                  stroke="white" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" fill="none"
                  strokeDasharray="44" strokeDashoffset="44"
                  style={{ animation: "tw-draw 2.4s ease-out forwards infinite" }}
                />
              </svg>
            </div>

            {/* Wordmark */}
            <div style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              TaxWijs
            </div>

            {/* Status */}
            <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
              {lang === "nl" ? "Inloggen…" : lang === "fa" ? "در حال ورود…" : "Signing in…"}
            </div>

            {/* Sage progress bar at bottom */}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: "var(--paper-3)" }}>
              <div style={{
                height: "100%", width: "65%",
                background: "var(--sage-600)",
                animation: "tw-progress 1.8s ease-in-out infinite alternate",
              }} />
            </div>

            <style>{`
              @keyframes tw-breath {
                0%   { transform: scale(.7); opacity: .7; }
                80%  { opacity: 0; }
                100% { transform: scale(2.0); opacity: 0; }
              }
              @keyframes tw-draw {
                0%  { stroke-dashoffset: 44; }
                60% { stroke-dashoffset: 0; }
                100%{ stroke-dashoffset: 0; }
              }
              @keyframes tw-progress {
                from { width: 20%; margin-left: 0; }
                to   { width: 55%; margin-left: 45%; }
              }
            `}</style>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Wordmark size={16} />
          <Link to="/" style={{ fontSize: 13, color: "var(--ink-3)" }}>← Back to home</Link>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{ width: "100%", maxWidth: 380 }}>
            <div className="eyebrow eyebrow-accent">Welcome back</div>
            <h1 style={{ marginTop: 8, fontSize: 36, fontFamily: "var(--serif)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              Log in to your<br />tax workspace
            </h1>

            {/* Google sign-in — primary CTA */}
            <button
              onClick={() => handleGoogle()}
              disabled={loading}
              style={{
                marginTop: 28, width: "100%", height: 48, borderRadius: "var(--r-sm)",
                border: "1px solid var(--hairline-2)", background: "var(--paper)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                fontSize: 14.5, fontWeight: 500, color: "var(--ink)", cursor: "pointer",
                transition: "border-color .15s, box-shadow .15s",
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = "var(--ink-3)")}
              onMouseOut={e => (e.currentTarget.style.borderColor = "var(--hairline-2)")}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              {lang === "nl" ? "Doorgaan met Google" : lang === "fa" ? "ورود با گوگل" : "Continue with Google"}
            </button>

            {error && (
              <div style={{ marginTop: 12, padding: 12, background: "var(--danger-soft)", borderRadius: "var(--r-sm)", fontSize: 13, color: "var(--danger)" }}>
                {error}
              </div>
            )}

            <div style={{ margin: "20px 0", display: "flex", alignItems: "center", gap: 12, color: "var(--ink-4)", fontSize: 11 }}>
              <span className="hair" style={{ flex: 1 }} />
              {lang === "nl" ? "of met e-mail" : lang === "fa" ? "یا با ایمیل" : "or with email"}
              <span className="hair" style={{ flex: 1 }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label htmlFor="login-email" className="tw-label">{t("auth.email")}</label>
                <input
                  id="login-email"
                  className="tw-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  aria-required="true"
                  style={{ fontSize: 16 }}
                />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-2)" }}>
                  <label htmlFor="login-password" className="tw-label" style={{ marginBottom: 0 }}>{t("auth.password")}</label>
                  <span role="button" tabIndex={0} style={{ fontSize: "var(--text-xs)", color: "var(--sage-700)", cursor: "pointer" }}>
                    {lang === "nl" ? "Wachtwoord vergeten?" : lang === "fa" ? "رمز فراموش کردید؟" : "Forgot password?"}
                  </span>
                </div>
                <input
                  id="login-password"
                  className="tw-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  style={{ fontSize: 16 }}
                />
              </div>

              <button className="btn btn-accent btn-lg" type="submit" disabled={loading} style={{ marginTop: 6 }}>
                {loading
                  ? (lang === "nl" ? "Bezig…" : lang === "fa" ? "در حال ورود…" : "Signing in…")
                  : <>{t("nav.login")} <Icon.arrow /></>
                }
              </button>
            </form>

            <p style={{ marginTop: 22, fontSize: 13, color: "var(--ink-3)" }}>
              {t("auth.no_account")}{" "}
              <Link to="/register" style={{ color: "var(--sage-700)", fontWeight: 500 }}>
                {t("auth.register")} →
              </Link>
            </p>
          </div>
        </div>

        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", display: "flex", justifyContent: "space-between", paddingTop: "var(--sp-4)" }}>
          <span>© {new Date().getFullYear()} TaxWijs</span>
          <span><a href="/privacy" style={{ color: "inherit" }}>Privacy</a> · <a href="/terms" style={{ color: "inherit" }}>Terms</a></span>
        </div>
      </div>

      {/* Right — editorial side (hidden on mobile) */}
      {!isMobile && <div className="grain" style={{ padding: 36, borderLeft: "1px solid var(--hairline)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Wordmark size={14} />
        <div>
          <span className="pill" style={{ background: "rgba(255,255,255,0.18)", color: "var(--ink-2)" }}>Today's tip</span>
          <h2 style={{ marginTop: 16, color: "var(--ink)", fontFamily: "var(--serif)", fontWeight: 400, fontSize: 32, lineHeight: 1.12, letterSpacing: "-0.015em" }}>
            "Startersaftrek runs out at end of <em>2026</em> — last call for the €2,123 deduction"
          </h2>
          <p style={{ marginTop: 16, color: "var(--ink-3)", fontSize: "var(--text-sm)", maxWidth: 360 }}>
            One of 28 verified 2026 rules in your knowledge base
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
