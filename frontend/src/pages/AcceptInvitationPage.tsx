import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { apiBase } from "../api/client";

type State = "loading" | "success" | "register_required" | "error";

const TX = {
  en: {
    loading:    "Accepting your invitation…",
    success:    "Invitation accepted! Setting up your portal…",
    needAcct:   "Create a free account to accept this invitation",
    needSub:    "Your accountant has invited you to TaxWijs. Create an account to access your personalised tax portal.",
    registerBtn:"Create account",
    loginBtn:   "Log in instead",
    errorTitle: "Invitation failed",
    goLogin:    "Go to login",
  },
  nl: {
    loading:    "Uitnodiging accepteren…",
    success:    "Uitnodiging geaccepteerd! Uw portaal wordt ingesteld…",
    needAcct:   "Maak een gratis account aan om deze uitnodiging te accepteren",
    needSub:    "Uw accountant heeft u uitgenodigd voor TaxWijs. Maak een account aan om toegang te krijgen tot uw persoonlijke belastingportaal.",
    registerBtn:"Account aanmaken",
    loginBtn:   "Inloggen",
    errorTitle: "Uitnodiging mislukt",
    goLogin:    "Naar inloggen",
  },
  fa: {
    loading:    "در حال پذیرش دعوتنامه…",
    success:    "دعوتنامه پذیرفته شد! پورتال شما در حال راه‌اندازی است…",
    needAcct:   "برای پذیرش این دعوتنامه یک حساب رایگان ایجاد کنید",
    needSub:    "مشاور مالیاتی شما شما را به TaxWijs دعوت کرده است. برای دسترسی به پورتال مالیاتی شخصی‌سازی شده خود حساب ایجاد کنید.",
    registerBtn:"ایجاد حساب",
    loginBtn:   "ورود به حساب",
    errorTitle: "دعوتنامه ناموفق",
    goLogin:    "رفتن به ورود",
  },
};

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const lang           = (localStorage.getItem("taxwijs_lang") as "nl" | "en" | "fa") || "nl";
  const tx             = TX[lang] ?? TX.en;

  const token     = searchParams.get("token") ?? "";
  const [state,    setState]    = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [regUrl,   setRegUrl]   = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMsg("No invitation token found in the link.");
      return;
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const accessToken = localStorage.getItem("access_token");
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    fetch(`${apiBase}/portal/invitations/accept/`, {
      method:  "POST",
      headers,
      body:    JSON.stringify({ token }),
    })
      .then(async res => {
        const body = await res.json() as {
          status?: string;
          redirect_to?: string;
          email?: string;
          detail?: string;
        };

        if (res.ok || res.status === 200) {
          if (body.status === "register_required") {
            setRegUrl(body.redirect_to ?? `/register?invitation_token=${token}`);
            setState("register_required");
          } else {
            setState("success");
            setTimeout(() => navigate("/client"), 2000);
          }
        } else {
          throw new Error(body.detail ?? "Failed to accept invitation.");
        }
      })
      .catch((err: unknown) => {
        setState("error");
        setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      });
  }, [token, navigate]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg)", padding: "var(--sp-6)",
    }}>
      <div className="card" style={{ maxWidth: 440, width: "100%", textAlign: "center", padding: "var(--sp-8)" }}>

        {state === "loading" && (
          <>
            <div style={{ width: 40, height: 40, border: "4px solid var(--border)", borderTopColor: "var(--blue)", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto var(--sp-4)" }} />
            <p style={{ color: "var(--text-3)", fontSize: "var(--text-sm)" }}>{tx.loading}</p>
          </>
        )}

        {state === "success" && (
          <>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--ok-subtle)", border: "1px solid var(--ok)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--sp-4)", fontSize: 22, color: "var(--ok-text)" }}>✓</div>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, marginBottom: "var(--sp-2)" }}>{tx.success}</h1>
          </>
        )}

        {state === "register_required" && (
          <>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--blue-subtle)", border: "1px solid var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--sp-4)", fontSize: 22 }}>✉️</div>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, marginBottom: "var(--sp-3)" }}>{tx.needAcct}</h1>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", marginBottom: "var(--sp-6)", lineHeight: 1.6 }}>{tx.needSub}</p>
            <button className="btn btn-accent" style={{ width: "100%", justifyContent: "center", marginBottom: "var(--sp-3)" }} onClick={() => navigate(regUrl)}>
              {tx.registerBtn}
            </button>
            <Link to={`/login?next=/portal/accept-invitation?token=${token}`} style={{ display: "block", fontSize: "var(--text-sm)", color: "var(--ink-4)" }}>
              {tx.loginBtn}
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--danger-subtle)", border: "1px solid var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--sp-4)", fontSize: 22, color: "var(--danger)" }}>✕</div>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, marginBottom: "var(--sp-3)" }}>{tx.errorTitle}</h1>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", marginBottom: "var(--sp-6)" }}>{errorMsg}</p>
            <button className="btn btn-ghost" onClick={() => navigate("/login")}>{tx.goLogin}</button>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
