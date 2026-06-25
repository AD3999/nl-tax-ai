import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { apiBase } from "../api/client";
import { useToast } from "../context/ToastContext";

const TX = {
  nl: { title: "Nieuw wachtwoord instellen", pw: "Nieuw wachtwoord", conf: "Wachtwoord bevestigen", btn: "Wachtwoord instellen", saving: "Opslaan…", mismatch: "Wachtwoorden komen niet overeen.", tooShort: "Minimaal 8 tekens.", success: "Wachtwoord ingesteld! U kunt nu inloggen.", loginBtn: "Ga naar inloggen" },
  en: { title: "Set a new password", pw: "New password", conf: "Confirm password", btn: "Set password", saving: "Saving…", mismatch: "Passwords do not match.", tooShort: "At least 8 characters required.", success: "Password set! You can now log in.", loginBtn: "Go to login" },
  fa: { title: "تنظیم رمز عبور جدید", pw: "رمز عبور جدید", conf: "تأیید رمز عبور", btn: "تنظیم رمز عبور", saving: "ذخیره…", mismatch: "رمزهای عبور مطابقت ندارند.", tooShort: "حداقل ۸ کاراکتر لازم است.", success: "رمز عبور تنظیم شد! اکنون می‌توانید وارد شوید.", loginBtn: "رفتن به ورود" },
};

export default function ResetPasswordPage() {
  const [params]    = useSearchParams();
  const navigate    = useNavigate();
  const { showToast } = useToast();
  const lang = (localStorage.getItem("taxwijs_lang") as "nl" | "en" | "fa") || "nl";

  const uid   = params.get("uid")   ?? "";
  const token = params.get("token") ?? "";

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [saving,    setSaving]    = useState(false);
  const [done,      setDone]      = useState(false);

  const tx = TX[lang] ?? TX.en;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm)  { showToast(tx.mismatch, "error"); return; }
    if (password.length < 8)   { showToast(tx.tooShort, "error"); return; }
    if (!uid || !token)        { showToast("Invalid reset link.", "error"); return; }

    setSaving(true);
    try {
      const res  = await fetch(`${apiBase}/users/password-reset/confirm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, password }),
      });
      const data = await res.json() as { detail?: string };
      if (!res.ok) throw new Error(data.detail ?? "Reset failed.");
      setDone(true);
      showToast(tx.success, "success");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Reset failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!uid || !token) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card" style={{ padding: "var(--sp-8)", maxWidth: 400, textAlign: "center" }}>
          <p style={{ color: "var(--danger)" }}>❌ Invalid or expired reset link.</p>
          <Link to="/forgot-password" style={{ display: "block", marginTop: "var(--sp-4)", fontSize: "var(--text-sm)", color: "var(--blue)" }}>Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "var(--sp-6)" }}>
      <div className="card" style={{ maxWidth: 420, width: "100%", padding: "var(--sp-8)" }}>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-2xl)", fontWeight: 400, marginBottom: "var(--sp-6)" }}>{tx.title}</h1>
        {!done ? (
          <form onSubmit={(e) => { void handleSubmit(e); }}>
            <label className="tw-label">{tx.pw}</label>
            <input className="tw-input" type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", fontSize: 16, marginBottom: "var(--sp-4)" }} autoComplete="new-password" />
            <label className="tw-label">{tx.conf}</label>
            <input className="tw-input" type="password" required minLength={8} value={confirm}  onChange={e => setConfirm(e.target.value)}  style={{ width: "100%", fontSize: 16, marginBottom: "var(--sp-5)" }} autoComplete="new-password" />
            <button type="submit" className="btn btn-accent" style={{ width: "100%", justifyContent: "center" }} disabled={saving}>{saving ? tx.saving : tx.btn}</button>
          </form>
        ) : (
          <>
            <p style={{ color: "var(--ok-text)", background: "var(--ok-subtle)", border: "1px solid var(--ok)", borderRadius: "var(--r)", padding: "var(--sp-4)" }}>✅ {tx.success}</p>
            <Link to="/login" style={{ display: "block", marginTop: "var(--sp-4)", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--blue)" }}>{tx.loginBtn}</Link>
          </>
        )}
      </div>
    </div>
  );
}
