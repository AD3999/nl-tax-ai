import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiBase } from "../api/client";
import { useToast } from "../context/ToastContext";

const TX = {
  en: {
    title: "Forgot your password?",
    sub: "Enter your email address and we will send you a reset link.",
    email: "Email address",
    submit: "Send reset link",
    sending: "Sending…",
    success: "Check your email for a reset link.",
    back: "Back to login",
  },
  nl: {
    title: "Wachtwoord vergeten?",
    sub: "Voer uw e-mailadres in en wij sturen u een herstelkoppeling.",
    email: "E-mailadres",
    submit: "Herstelkoppeling verzenden",
    sending: "Verzenden…",
    success: "Controleer uw e-mail voor een herstelkoppeling.",
    back: "Terug naar inloggen",
  },
  fa: {
    title: "رمز عبور را فراموش کرده‌اید؟",
    sub: "آدرس ایمیل خود را وارد کنید تا لینک بازنشانی برایتان ارسال شود.",
    email: "آدرس ایمیل",
    submit: "ارسال لینک بازنشانی",
    sending: "در حال ارسال…",
    success: "ایمیل خود را برای لینک بازنشانی بررسی کنید.",
    back: "بازگشت به ورود",
  },
};

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const { i18n } = useTranslation();
  const lang = (i18n.language as "nl" | "en" | "fa") || "nl";
  const tx = TX[lang] ?? TX.en;

  const [email,   setEmail]   = useState("");
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await fetch(`${apiBase}/users/password-reset/request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setDone(true);
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg)", padding: "var(--sp-6)",
    }}>
      <div className="card" style={{ maxWidth: 420, width: "100%", padding: "var(--sp-8)" }}>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-2xl)", fontWeight: 400, marginBottom: "var(--sp-2)" }}>
          {tx.title}
        </h1>
        {!done ? (
          <>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", marginBottom: "var(--sp-6)" }}>
              {tx.sub}
            </p>
            <form onSubmit={(e) => { void handleSubmit(e); }}>
              <label className="tw-label">{tx.email}</label>
              <input
                className="tw-input"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: "100%", fontSize: 16, marginBottom: "var(--sp-4)" }}
                autoComplete="email"
              />
              <button
                type="submit"
                className="btn btn-accent"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={sending}
              >
                {sending ? tx.sending : tx.submit}
              </button>
            </form>
          </>
        ) : (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--ok-text)", background: "var(--ok-subtle)", border: "1px solid var(--ok)", borderRadius: "var(--r)", padding: "var(--sp-4)", lineHeight: 1.6 }}>
            ✅ {tx.success}
          </p>
        )}
        <div style={{ marginTop: "var(--sp-5)", textAlign: "center" }}>
          <Link to="/login" style={{ fontSize: "var(--text-sm)", color: "var(--blue)" }}>
            ← {tx.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
