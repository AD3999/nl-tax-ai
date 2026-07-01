import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { register, requestAccountantAccess } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import Wordmark from "../components/Wordmark";
import { Icon } from "../components/Icon";
import { useMobile } from "../hooks/useMobile";
import { useToast } from "../context/ToastContext";
import { apiBase } from "../api/client";
import { generatePKCE } from "../utils/pkce";

type ApiError = { response?: { data?: Record<string, string[]> } };

const USER_TYPES = {
  zzp:        { label: "ZZP",        glyph: "ZZ", color: "var(--blue)",   desc: "Freelance · self-employed" },
  accountant: { label: "Accountant", glyph: "AC", color: "var(--danger)", desc: "Tax advisor · firm"        },
} as const;

const USER_TYPE_TX: Record<string, {
  label: Record<string, string>;
  desc:  Record<string, string>;
  benefits: Record<string, string[]>;
}> = {
  zzp:      {
    label: { nl: "ZZP", en: "ZZP", fa: "ZZP" },
    desc:  { nl: "Freelancer · zelfstandige", en: "Freelance · self-employed", fa: "آزادکار · کارآفرین مستقل" },
    benefits: {
      nl: ["Wet DBA-risico bij elke chat", "Zelfstandigenaftrek + MKB automatisch", "Kwartaalherinneringen BTW"],
      en: ["Wet DBA risk check on every chat", "Zelfstandigenaftrek + MKB-vrijstelling auto-applied", "Quarterly VAT reminders"],
      fa: ["بررسی ریسک Wet DBA در هر گفتگو", "اعمال خودکار کسر ZZP و MKB", "یادآوری فصلی BTW"],
    },
  },
  accountant: {
    label: { nl: "Belastingadviseur", en: "Tax Advisor", fa: "مشاور مالیاتی" },
    desc:  { nl: "Belastingadviseur · kantoor", en: "Tax advisor · firm", fa: "مشاور مالیاتی · شرکت" },
    benefits: {
      nl: ["Klantportaal voor meerdere cliënten", "Automatische belastingberekeningen per cliënt", "Documenten uploaden + aangifte-workflows"],
      en: ["Multi-client accountant portal", "Automated tax calculations per client", "Document upload + tax return workflows"],
      fa: ["پورتال چند مشتری برای حسابداران", "محاسبات مالیاتی خودکار برای هر مشتری", "آپلود اسناد و گردش کار اظهارنامه"],
    },
  },
};

type UTK = keyof typeof USER_TYPES;

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setUser, refreshUser } = useAuth();
  const { showToast } = useToast();
  const isMobile = useMobile();
  const lang = i18n.language as "nl" | "en" | "fa";

  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get("invitation_token") ?? "";
  const prefilledEmail  = searchParams.get("email") ?? "";
  const [email,      setEmail]      = useState(prefilledEmail);
  const [password,   setPassword]   = useState("");
  const [userType,   setUserType]   = useState<UTK>("zzp");
  const [firmName,   setFirmName]   = useState("");
  const [acctFirstName, setAcctFirstName] = useState("");
  const [acctLastName,  setAcctLastName]  = useState("");
  const [kvkNumber,  setKvkNumber]  = useState("");
  const [error,          setError]          = useState("");
  const [loading,        setLoading]        = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const isAccountant = userType === "accountant";

  useEffect(() => {
    const googleError = searchParams.get("google_error");
    if (googleError) {
      const base = lang === "nl" ? "Google-registratie mislukt" : lang === "fa" ? "ثبت‌نام با گوگل ناموفق بود" : "Google sign-up failed";
      setError(`${base} (${googleError})`);
    }
  }, [searchParams, lang]);

  const handleGoogle = useCallback(async () => {
    if (isAccountant) {
      setError(lang === "nl" ? "Gebruik e-mail registratie voor een accountantaccount" : lang === "fa" ? "برای حساب حسابدار، از ثبت‌نام با ایمیل استفاده کنید" : "Use email sign-up for an accountant account");
      return;
    }
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) { setError("Google Client ID not configured"); return; }
    const { verifier, challenge } = await generatePKCE();
    sessionStorage.setItem("google_auth_user_type", userType);
    sessionStorage.setItem("google_auth_redirect", "/intake");
    sessionStorage.setItem("google_pkce_verifier", verifier);
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    sessionStorage.setItem("google_auth_redirect_uri", redirectUri);
    const params = new URLSearchParams({
      client_id:             clientId,
      redirect_uri:          redirectUri,
      response_type:         "code",
      scope:                 "openid email profile",
      code_challenge:        challenge,
      code_challenge_method: "S256",
      prompt:                "select_account",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }, [isAccountant, lang, userType]);

  const EMAIL_TAKEN: Record<string, string> = {
    nl: "Er bestaat al een account met dit e-mailadres",
    en: "An account with this email address already exists",
    fa: "یک حساب با این آدرس ایمیل قبلاً ثبت شده است",
  };
  const PW_WEAK: Record<string, string> = {
    nl: "Wachtwoord is te zwak of te kort (min. 8 tekens)",
    en: "Password is too weak or too short (min. 8 characters)",
    fa: "رمز عبور خیلی ضعیف یا کوتاه است (حداقل ۸ کاراکتر)",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      if (isAccountant) {
        // Accountant self-registration is blocked — use request-access flow instead
        const fullName = `${acctFirstName.trim()} ${acctLastName.trim()}`.trim();
        await requestAccountantAccess({
          email,
          full_name:   fullName || email,
          firm_name:   firmName,
          kvk_number:  kvkNumber,
          designation: "other",
        });
        const msg = lang === "nl"
          ? "Uw aanvraag is ontvangen! U wordt op de hoogte gesteld zodra uw account is goedgekeurd."
          : lang === "fa"
          ? "درخواست شما دریافت شد! پس از تأیید حساب به شما اطلاع داده خواهد شد."
          : "Your request has been received! You will be notified once your account is approved.";
        setSuccessMessage(msg);
        setAcctFirstName("");
        setAcctLastName("");
        showToast(msg, "success");
        return;
      }
      const payload = {
        email,
        username: email,
        password,
        user_type: userType,
        role: "client" as const,
        preferred_language: lang,
      };
      const result = await register(payload);
      setUser(result.user);
      if (result.user.id) localStorage.setItem("taxwijs_user_id", String(result.user.id));
      showToast(
        lang === "nl" ? "Account aangemaakt! Welkom bij TaxWijs" : lang === "fa" ? "حساب ایجاد شد! به TaxWijs خوش آمدید" : "Account created! Welcome to TaxWijs",
        "success",
      );
      if (invitationToken) {
        try {
          const accessToken = result.access ?? localStorage.getItem("access_token") ?? "";
          const invRes = await fetch(`${apiBase}/portal/invitations/accept/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ token: invitationToken }),
          });
          if (!invRes.ok) {
            const body = await invRes.json().catch(() => ({})) as { detail?: string };
            const errDetail = body.detail ?? (
              lang === "nl" ? "Uitnodiging accepteren mislukt. Neem contact op met uw accountant."
              : lang === "fa" ? "پذیرش دعوتنامه ناموفق بود. با مشاور مالیاتی خود تماس بگیرید."
              : "Failed to accept invitation. Please contact your accountant."
            );
            showToast(errDetail, "error");
            navigate("/dashboard");
            return;
          }
          // Refresh user so has_accountant flips to true and sidebar shows My Portal immediately.
          await refreshUser().catch(() => null);
          navigate("/client");
          return;
        } catch {
          showToast(
            lang === "nl" ? "Uitnodiging accepteren mislukt. Probeer het later opnieuw."
            : lang === "fa" ? "پذیرش دعوتنامه ناموفق بود. بعداً دوباره امتحان کنید."
            : "Failed to accept invitation. Please try again later.",
            "error",
          );
          navigate("/dashboard");
          return;
        }
      }
      navigate("/intake");
    } catch (err: unknown) {
      const data = (err as ApiError)?.response?.data;
      const errMsg = (err instanceof Error) ? err.message : null;
      let msg: string;
      if (data?.email || data?.username) {
        msg = EMAIL_TAKEN[lang] ?? EMAIL_TAKEN.en;
      } else if (data?.password) {
        msg = (data.password[0] ?? "") || (PW_WEAK[lang] ?? PW_WEAK.en);
      } else if (errMsg) {
        msg = errMsg;
      } else {
        msg = t("auth.register_error");
      }
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const t2   = USER_TYPES[userType];
  const t2tx = USER_TYPE_TX[userType];

  const clientTypes = (Object.entries(USER_TYPES) as [UTK, typeof USER_TYPES[UTK]][]).filter(([k]) => k !== "accountant");
  const acType      = USER_TYPES.accountant;

  return (
    <div style={{ flex: 1, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", minHeight: "calc(100vh - 64px)" }}>
      {/* Left — form */}
      <div style={{ padding: isMobile ? "var(--sp-8) var(--sp-5)" : "var(--sp-10) var(--sp-12)", display: "flex", flexDirection: "column", background: "var(--paper)", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Wordmark size={16} />
          <Link to="/" style={{ fontSize: 13, color: "var(--ink-3)" }}>
            {lang === "nl" ? "← Terug naar home" : lang === "fa" ? "← بازگشت به صفحه اصلی" : "← Back to home"}
          </Link>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{ width: "100%", maxWidth: 420 }}>
            <div className="eyebrow eyebrow-accent">
              {lang === "nl" ? "Stap 1 van 3" : lang === "fa" ? "مرحله ۱ از ۳" : "Step 1 of 3"}
            </div>
            <h1 style={{ marginTop: 8, fontSize: 36, fontFamily: "var(--serif)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              {lang === "nl" ? "Maak een account" : lang === "fa" ? "ایجاد حساب کاربری" : "Make an account"}
            </h1>
            <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 14 }}>
              {lang === "nl" ? "We personaliseren alles op uw belastingtype" : lang === "fa" ? "همه چیز بر اساس وضعیت مالیاتی شما شخصی‌سازی می‌شود" : "We'll personalise everything to your tax type"}
            </p>

            {/* User type selector */}
            <div style={{ marginTop: 20 }}>
              <div className="tw-label" style={{ marginBottom: 8 }}>
                {lang === "nl" ? "Ik ben een" : lang === "fa" ? "وضعیت شغلی من:" : "I'm a"}
              </div>
              {/* 2×2 client grid */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                {clientTypes.map(([k, v]) => {
                  const on = userType === k;
                  return (
                    <button key={k} type="button" onClick={() => setUserType(k)} style={{
                      textAlign: "start", padding: "12px 14px", borderRadius: "var(--r-sm)",
                      border: `1px solid ${on ? "var(--sage-600)" : "var(--hairline-2)"}`,
                      background: on ? "var(--accent-soft)" : "var(--paper)",
                      display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "all .15s",
                    }}>
                      <span style={{ width: 32, height: 32, borderRadius: 8, background: v.color, color: "white", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", flexShrink: 0 }}>
                        {v.glyph}
                      </span>
                      <div>
                        <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--ink)" }}>{USER_TYPE_TX[k]?.label[lang] ?? v.label}</div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>{USER_TYPE_TX[k]?.desc[lang] ?? v.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Full-width accountant option below the 2×2 grid */}
              {(() => {
                const on = userType === "accountant";
                return (
                  <button type="button" onClick={() => setUserType("accountant")} style={{
                    marginTop: 8, width: "100%", textAlign: "start", padding: "12px 14px",
                    borderRadius: "var(--r-sm)",
                    border: `1px solid ${on ? "var(--danger-border)" : "var(--hairline-2)"}`,
                    background: on ? "var(--danger-subtle)" : "var(--paper)",
                    display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "all .15s",
                  }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: acType.color, color: "#fff", display: "grid", placeItems: "center", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.04em", flexShrink: 0 }}>
                      {acType.glyph}
                    </span>
                    <div>
                      <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--ink)" }}>
                        {USER_TYPE_TX.accountant.label[lang]}
                      </div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
                        {USER_TYPE_TX.accountant.desc[lang]}
                      </div>
                    </div>
                    <span style={{ marginInlineStart: "auto", fontSize: 11, padding: "3px 8px", borderRadius: 99, background: "var(--danger-subtle)", color: "var(--danger-text)", fontWeight: 600 }}>
                      B2B
                    </span>
                  </button>
                );
              })()}
            </div>

            {/* Google CTA — disabled for accountant flow */}
            <button
              onClick={() => handleGoogle()}
              disabled={loading || isAccountant}
              style={{
                marginTop: 18, width: "100%", height: 48, borderRadius: "var(--r-sm)",
                border: "1px solid var(--hairline-2)", background: "var(--paper)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                fontSize: 14.5, fontWeight: 500,
                color: isAccountant ? "var(--ink-4)" : "var(--ink)",
                cursor: isAccountant ? "not-allowed" : "pointer",
                opacity: isAccountant ? 0.5 : 1,
                transition: "border-color .15s",
              }}
              onMouseOver={e => { if (!isAccountant) e.currentTarget.style.borderColor = "var(--ink-3)"; }}
              onMouseOut={e  => { if (!isAccountant) e.currentTarget.style.borderColor = "var(--hairline-2)"; }}
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
            {isAccountant && (
              <p style={{ marginTop: 6, fontSize: 12, color: "var(--ink-4)", textAlign: "center" }}>
                {lang === "nl" ? "Google-aanmelding is niet beschikbaar voor accountantaccounts. Gebruik e-mailregistratie." :
                 lang === "fa" ? "ورود با گوگل برای حساب‌های حسابدار در دسترس نیست. لطفاً از ثبت‌نام با ایمیل استفاده کنید." :
                 "Google sign-in is not available for accountant accounts. Please use email registration."}
              </p>
            )}

            {isAccountant && (
              <div style={{ marginTop: 12, padding: 12, background: "var(--info-soft, oklch(0.93 0.04 230))", borderRadius: "var(--r-sm)", fontSize: 13, color: "var(--info-text, oklch(0.35 0.09 230))", border: "1px solid var(--info-border, oklch(0.80 0.06 230))" }}>
                {lang === "nl"
                  ? "Accountantaccounts vereisen goedkeuring door een beheerder. Vul het formulier hieronder in om toegang aan te vragen."
                  : lang === "fa"
                  ? "حساب‌های حسابداری نیاز به تأیید مدیر دارند. فرم زیر را پر کنید تا درخواست دسترسی ارسال کنید."
                  : "Accountant accounts require admin approval. Fill in the form below to request access."}
              </div>
            )}

            {successMessage && (
              <div style={{ marginTop: 12, padding: 12, background: "var(--ok-soft, oklch(0.93 0.06 145))", borderRadius: "var(--r-sm)", fontSize: 13, color: "var(--ok, oklch(0.40 0.10 145))", border: "1px solid var(--ok-border, oklch(0.80 0.07 145))" }}>
                {successMessage}
                {isAccountant && (
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", marginTop: "var(--sp-3)", lineHeight: 1.6, marginBottom: 0 }}>
                    {lang === "nl"
                      ? "U ontvangt een e-mail zodra uw account is goedgekeurd, met een link om uw wachtwoord in te stellen."
                      : lang === "fa"
                      ? "پس از تأیید حساب، ایمیلی با لینک تنظیم رمز عبور دریافت خواهید کرد."
                      : "You will receive an email when your account is approved with a link to set your password."}
                  </p>
                )}
              </div>
            )}

            {error && (
              <div style={{ marginTop: 12, padding: 12, background: "var(--danger-soft)", borderRadius: "var(--r-sm)", fontSize: 13, color: "var(--danger)" }}>
                {error}
              </div>
            )}

            {!isAccountant && (
              <div style={{ margin: "18px 0", display: "flex", alignItems: "center", gap: 12, color: "var(--ink-4)", fontSize: 11 }}>
                <span className="hair" style={{ flex: 1 }} />
                {lang === "nl" ? "of met e-mail" : lang === "fa" ? "یا با ایمیل" : "or with email"}
                <span className="hair" style={{ flex: 1 }} />
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: isAccountant ? 18 : 0 }}>
              <div>
                <label htmlFor="reg-email" className="tw-label">{t("auth.email")}</label>
                <input id="reg-email" className="tw-input" type="email" placeholder="you@example.nl" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required style={{ fontSize: 16 }} />
              </div>
              {!isAccountant && (
                <div>
                  <label htmlFor="reg-password" className="tw-label">{t("auth.password")}</label>
                  <input id="reg-password" className="tw-input" type="password" placeholder={lang === "nl" ? "Minimaal 8 tekens" : lang === "fa" ? "حداقل ۸ کاراکتر" : "At least 8 characters"} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required style={{ fontSize: 16 }} />
                </div>
              )}

              {/* Extra fields for accountant only */}
              {isAccountant && (
                <>
                  <div style={{ padding: "14px 16px", background: "var(--danger-subtle)", borderRadius: "var(--r-sm)", border: "1px solid var(--danger-border)" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--danger-text)", marginBottom: 12 }}>
                      {lang === "nl" ? "Kantoorgegevens (optioneel)" : lang === "fa" ? "اطلاعات شرکت (اختیاری)" : "Firm details (optional)"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <label className="tw-label">
                          {lang === "nl" ? "Voornaam *" : lang === "fa" ? "نام *" : "First name *"}
                        </label>
                        <input
                          type="text"
                          required
                          className="tw-input"
                          style={{ width: "100%", fontSize: 16 }}
                          value={acctFirstName}
                          onChange={e => setAcctFirstName(e.target.value)}
                          placeholder={lang === "nl" ? "Uw voornaam" : lang === "fa" ? "نام شما" : "Your first name"}
                        />
                      </div>
                      <div>
                        <label className="tw-label">
                          {lang === "nl" ? "Achternaam *" : lang === "fa" ? "نام خانوادگی *" : "Last name *"}
                        </label>
                        <input
                          type="text"
                          required
                          className="tw-input"
                          style={{ width: "100%", fontSize: 16 }}
                          value={acctLastName}
                          onChange={e => setAcctLastName(e.target.value)}
                          placeholder={lang === "nl" ? "Uw achternaam" : lang === "fa" ? "نام خانوادگی شما" : "Your last name"}
                        />
                      </div>
                      <div>
                        <label htmlFor="firm-name" className="tw-label">
                          {lang === "nl" ? "Kантoor-/bedrijfsnaam" : lang === "fa" ? "نام شرکت یا دفتر" : "Firm / practice name"}
                        </label>
                        <input id="firm-name" className="tw-input" type="text" placeholder={lang === "nl" ? "Bijv. De Vries Belastingadvies" : lang === "fa" ? "مثلاً: دفتر مشاوره مالیاتی" : "e.g. Smith Tax Advisory"} value={firmName} onChange={e => setFirmName(e.target.value)} style={{ fontSize: 15 }} />
                      </div>
                      <div>
                        <label htmlFor="kvk-number" className="tw-label">
                          {lang === "nl" ? "KvK-nummer" : lang === "fa" ? "شماره KvK" : "KvK number"}
                        </label>
                        <input id="kvk-number" className="tw-input" type="text" placeholder="12345678" value={kvkNumber} onChange={e => setKvkNumber(e.target.value)} maxLength={12} style={{ fontSize: 15 }} />
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--ink-4)", margin: 0 }}>
                    {lang === "nl"
                      ? "Na registratie kunt u uw profiel voltooien in het accountantsportaal"
                      : lang === "fa"
                      ? "پس از ثبت‌نام، می‌توانید پروفایل خود را در پورتال حسابداران تکمیل کنید"
                      : "After signing up you can complete your profile in the accountant portal"}
                  </p>
                </>
              )}

              <button className="btn btn-accent btn-lg" type="submit" disabled={loading || !!successMessage} style={{ marginTop: 6 }}>
                {loading
                  ? (lang === "nl" ? "Bezig…" : lang === "fa" ? "در حال ارسال…" : "Submitting…")
                  : isAccountant
                  ? <>{lang === "nl" ? "Toegang aanvragen" : lang === "fa" ? "درخواست دسترسی" : "Request access"} <Icon.arrow /></>
                  : <>{lang === "nl" ? "Doorgaan" : lang === "fa" ? "ادامه" : "Continue"} <Icon.arrow /></>
                }
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

        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", display: "flex", justifyContent: "space-between", paddingTop: "var(--sp-4)" }}>
          <span>© {new Date().getFullYear()} TaxWijs</span>
          <span><a href="/privacy" style={{ color: "inherit" }}>Privacy</a> · <a href="/terms" style={{ color: "inherit" }}>Terms</a></span>
        </div>
      </div>

      {/* Right — editorial panel */}
      {!isMobile && (
        <div className="grain" style={{ padding: 36, borderInlineStart: "1px solid var(--hairline)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <Wordmark size={14} />
          <div>
            <span className="pill pill-accent">
              {lang === "nl" ? `Voor ${(t2tx?.label.nl ?? t2.label).toLowerCase()}s` : lang === "fa" ? `برای ${t2tx?.label.fa ?? t2.label}` : `For ${t2.label.toLowerCase()}s`}
            </span>
            <h2 style={{ marginTop: 14, color: "var(--ink)", fontFamily: "var(--serif)", fontWeight: 400, fontSize: 32, lineHeight: 1.12, letterSpacing: "-0.015em" }}>
              {isAccountant
                ? (lang === "nl" ? <>Beheer meerdere cliënten vanuit één portal</>
                  : lang === "fa" ? <>مدیریت چندین مشتری از یک پورتال</>
                  : <>Manage multiple clients from one portal</>)
                : (lang === "nl"
                    ? <>We stemmen de chat, rekenmachine en aangifte af op <em>{t2tx?.label.nl ?? t2.label}</em>-situaties</>
                    : lang === "fa"
                    ? <>چت، محاسبه‌گر و راهنمای اظهارنامه را بر اساس وضعیت <em>{t2tx?.label.fa ?? t2.label}</em> تنظیم می‌کنیم</>
                    : <>We'll tune the chat, the calculator and the return guide to <em>{t2.label}</em> situations</>)}
            </h2>
            <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
              {(t2tx?.benefits[lang] ?? []).map((l: string, i: number) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, color: "var(--ink-2)" }}>
                  <span style={{ marginTop: 5, width: 14, height: 14, borderRadius: 999, background: isAccountant ? "oklch(0.46 0.14 15)" : t2.color, color: "white", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon.check style={{ width: 9, height: 9 }} />
                  </span>
                  {l}
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-4)" }}>
            {lang === "nl" ? "Later te wijzigen in uw profiel" : lang === "fa" ? "بعداً در پروفایل خود قابل تغییر است" : "Can change later in your profile"}
          </div>
        </div>
      )}
    </div>
  );
}
