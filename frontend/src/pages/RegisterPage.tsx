import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { register, login, googleAuth, fetchProfile } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import Wordmark from "../components/Wordmark";
import { Icon } from "../components/Icon";
import { useMobile } from "../hooks/useMobile";
import { useToast } from "../context/ToastContext";

type ApiError = { response?: { data?: Record<string, string[]> } };

const USER_TYPES = {
  zzp:      { label: "ZZP",      glyph: "ZZ", desc: "Freelance · self-employed",   color: "var(--sage-600)",      benefits: ["Wet DBA risk check on every chat", "Zelfstandigenaftrek + MKB-vrijstelling auto-applied", "Quarterly VAT reminders"] },
  employee: { label: "Employee", glyph: "EM", desc: "Salaried · payslip",          color: "oklch(0.55 0.12 230)", benefits: ["Payslip translator (loonheffing → take-home)", "Box 3 forecast with WOZ inputs", "All standard tax credits"] },
  expat:    { label: "Expat",    glyph: "EX", desc: "30% ruling · foreign income", color: "oklch(0.62 0.13 50)",  benefits: ["30%-ruling year tracker (years 1–5)", "Foreign income reconciliation", "EN + FA chat as a first-class language"] },
  dga:      { label: "DGA",      glyph: "DG", desc: "Director · own BV",           color: "oklch(0.55 0.10 290)", benefits: ["Optimal salary vs. dividend split", "Box 2 calculations for your BV", "DGA-only deductions surfaced first"] },
} as const;
type UTK = keyof typeof USER_TYPES;

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { showToast } = useToast();
  const isMobile = useMobile();
  const lang = i18n.language as "nl" | "en" | "fa";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<UTK>("zzp");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleGoogle = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      setError("Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to frontend/.env and restart the dev server.");
      return;
    }
    if (!window.google) {
      setError("Google sign-in is still loading — please try again in a moment.");
      return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "email profile",
      callback: async (resp) => {
        if (resp.error) {
          const msg = lang === "nl" ? "Google-registratie mislukt." : lang === "fa" ? "ثبت‌نام با گوگل ناموفق بود." : "Google sign-up failed.";
          setError(msg);
          return;
        }
        setLoading(true);
        setError("");
        try {
          await googleAuth(resp.access_token, userType);
          const profile = await fetchProfile();
          setUser(profile);
          if (profile?.id) localStorage.setItem("taxwijs_user_id", String(profile.id));
          showToast(
            lang === "nl" ? "Account aangemaakt! Welkom bij TaxWijs." : lang === "fa" ? "حساب ایجاد شد! به TaxWijs خوش آمدید." : "Account created! Welcome to TaxWijs.",
            "success",
          );
          navigate("/intake");
        } catch {
          const msg = lang === "nl" ? "Google-registratie mislukt." : lang === "fa" ? "ثبت‌نام با گوگل ناموفق بود." : "Google sign-up failed.";
          setError(msg);
          showToast(msg, "error");
        } finally {
          setLoading(false);
        }
      },
    });
    client.requestAccessToken();
  };

  const EMAIL_TAKEN: Record<string, string> = {
    nl: "Er bestaat al een account met dit e-mailadres.",
    en: "An account with this email address already exists.",
    fa: "یک حساب با این آدرس ایمیل قبلاً ثبت شده است.",
  };
  const PW_WEAK: Record<string, string> = {
    nl: "Wachtwoord is te zwak of te kort (min. 8 tekens).",
    en: "Password is too weak or too short (min. 8 characters).",
    fa: "رمز عبور خیلی ضعیف یا کوتاه است (حداقل ۸ کاراکتر).",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({ email, username: email, password, user_type: userType, preferred_language: lang });
      await login({ username: email, password });
      const profile = await fetchProfile();
      setUser(profile);
      if (profile?.id) localStorage.setItem("taxwijs_user_id", String(profile.id));
      showToast(
        lang === "nl" ? "Account aangemaakt! Welkom bij TaxWijs." : lang === "fa" ? "حساب ایجاد شد! به TaxWijs خوش آمدید." : "Account created! Welcome to TaxWijs.",
        "success",
      );
      navigate("/intake");
    } catch (err: unknown) {
      const data = (err as ApiError)?.response?.data;
      let msg: string;
      if (data?.email || data?.username) {
        msg = EMAIL_TAKEN[lang] ?? EMAIL_TAKEN.en;
      } else if (data?.password) {
        msg = (data.password[0] ?? "") || (PW_WEAK[lang] ?? PW_WEAK.en);
      } else {
        msg = t("auth.register_error");
      }
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const t2 = USER_TYPES[userType];

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
            <div className="eyebrow eyebrow-accent">Step 1 of 3</div>
            <h1 style={{ marginTop: 8, fontSize: 36, fontFamily: "var(--serif)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              Make an account.
            </h1>
            <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 14 }}>
              We'll personalise everything to your tax type.
            </p>

            {/* User type selector — shown before Google too so user picks their type */}
            <div style={{ marginTop: 20 }}>
              <div className="tw-label" style={{ marginBottom: 8 }}>
                {lang === "nl" ? "Ik ben een" : lang === "fa" ? "من یک" : "I'm a"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(Object.entries(USER_TYPES) as [UTK, typeof USER_TYPES[UTK]][]).map(([k, v]) => {
                  const on = userType === k;
                  return (
                    <button key={k} type="button" onClick={() => setUserType(k)} style={{
                      textAlign: "left", padding: "12px 14px", borderRadius: "var(--r-sm)",
                      border: `1px solid ${on ? "var(--sage-600)" : "var(--hairline-2)"}`,
                      background: on ? "var(--accent-soft)" : "var(--paper)",
                      display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "all .15s",
                    }}>
                      <span style={{ width: 32, height: 32, borderRadius: 8, background: v.color, color: "white", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", flexShrink: 0 }}>
                        {v.glyph}
                      </span>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{v.label}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{v.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Google sign-up — primary CTA */}
            <button
              onClick={() => handleGoogle()}
              disabled={loading}
              style={{
                marginTop: 18, width: "100%", height: 48, borderRadius: "var(--r-sm)",
                border: "1px solid var(--hairline-2)", background: "var(--paper)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                fontSize: 14.5, fontWeight: 500, color: "var(--ink)", cursor: "pointer",
                transition: "border-color .15s",
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
              {loading ? "…" : lang === "nl" ? "Doorgaan met Google" : lang === "fa" ? "ثبت‌نام با گوگل" : "Continue with Google"}
            </button>

            {error && (
              <div style={{ marginTop: 12, padding: 12, background: "var(--danger-soft)", borderRadius: "var(--r-sm)", fontSize: 13, color: "var(--danger)" }}>
                {error}
              </div>
            )}

            <div style={{ margin: "18px 0", display: "flex", alignItems: "center", gap: 12, color: "var(--ink-4)", fontSize: 11 }}>
              <span className="hair" style={{ flex: 1 }} />
              {lang === "nl" ? "of met e-mail" : lang === "fa" ? "یا با ایمیل" : "or with email"}
              <span className="hair" style={{ flex: 1 }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div className="tw-label" style={{ marginBottom: 6 }}>{t("auth.email")}</div>
                <input className="tw-input" type="email" placeholder="you@example.nl" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <div className="tw-label" style={{ marginBottom: 6 }}>{t("auth.password")}</div>
                <input className="tw-input" type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required />
              </div>

              <button className="btn btn-accent btn-lg" type="submit" disabled={loading} style={{ marginTop: 6 }}>
                {loading ? "Creating…" : <>Continue <Icon.arrow /></>}
              </button>
            </form>

            <p style={{ marginTop: 22, fontSize: 13, color: "var(--ink-3)" }}>
              {t("auth.have_account")}{" "}
              <Link to="/login" style={{ color: "var(--sage-700)", fontWeight: 500 }}>
                {t("nav.login")} →
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
          <span className="pill pill-accent">For {t2.label.toLowerCase()}s</span>
          <h2 style={{ marginTop: 14, color: "var(--ink)", fontFamily: "var(--serif)", fontWeight: 400, fontSize: 32, lineHeight: 1.12, letterSpacing: "-0.015em" }}>
            We'll tune the chat, the calculator and the return guide to <em>{t2.label}</em> situations.
          </h2>
          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
            {t2.benefits.map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, color: "var(--ink-2)" }}>
                <span style={{ marginTop: 5, width: 14, height: 14, borderRadius: 999, background: t2.color, color: "white", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon.check style={{ width: 9, height: 9 }} />
                </span>
                {l}
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--ink-4)" }}>Can change later in your profile.</div>
      </div>}
    </div>
  );
}
