import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { register, login, fetchProfile } from "../api/auth";
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

            {error && (
              <div style={{ marginTop: 16, padding: 12, background: "var(--danger-soft)", borderRadius: "var(--r-sm)", fontSize: 13, color: "var(--danger)" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div className="tw-label" style={{ marginBottom: 6 }}>{t("auth.email")}</div>
                <input className="tw-input" type="email" placeholder="you@example.nl" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <div className="tw-label" style={{ marginBottom: 6 }}>{t("auth.password")}</div>
                <input className="tw-input" type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required />
              </div>

              <div style={{ marginTop: 6 }}>
                <div className="tw-label" style={{ marginBottom: 8 }}>I'm a</div>
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

              <button className="btn btn-accent btn-lg" type="submit" disabled={loading} style={{ marginTop: 10 }}>
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
