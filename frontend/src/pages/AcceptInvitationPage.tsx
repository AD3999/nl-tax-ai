import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiBase } from "../api/client";
import { useAuth } from "../context/AuthContext";

type State = "loading" | "confirm" | "accepting" | "success" | "declined" | "register_required" | "error";

const TX = {
  en: {
    loading:      "Loading invitation…",
    confirmTitle: "You have been invited",
    confirmBody:  "An accountant has invited you to connect on TaxWijs. Would you like to accept?",
    acceptBtn:    "Accept invitation",
    declineBtn:   "Decline",
    accepting:    "Accepting…",
    declining:    "Declining…",
    success:      "Invitation accepted! Setting up your portal…",
    declineTitle: "Invitation declined",
    declineBody:  "You have declined this invitation. No data has been shared.",
    needAcct:     "Create a free account to accept this invitation",
    needSub:      "Your accountant has invited you to TaxWijs. Create an account to access your personalised tax portal.",
    registerBtn:  "Create account",
    loginBtn:     "Log in instead",
    errorTitle:   "Invitation failed",
    goHome:       "Go to home",
  },
  nl: {
    loading:      "Uitnodiging laden…",
    confirmTitle: "U bent uitgenodigd",
    confirmBody:  "Een accountant heeft u uitgenodigd om verbinding te maken op TaxWijs. Wilt u accepteren?",
    acceptBtn:    "Uitnodiging accepteren",
    declineBtn:   "Weigeren",
    accepting:    "Accepteren…",
    declining:    "Weigeren…",
    success:      "Uitnodiging geaccepteerd! Uw portaal wordt ingesteld…",
    declineTitle: "Uitnodiging geweigerd",
    declineBody:  "U heeft deze uitnodiging geweigerd. Er zijn geen gegevens gedeeld.",
    needAcct:     "Maak een gratis account aan om deze uitnodiging te accepteren",
    needSub:      "Uw accountant heeft u uitgenodigd voor TaxWijs. Maak een account aan om toegang te krijgen tot uw persoonlijke belastingportaal.",
    registerBtn:  "Account aanmaken",
    loginBtn:     "Inloggen",
    errorTitle:   "Uitnodiging mislukt",
    goHome:       "Naar startpagina",
  },
  fa: {
    loading:      "بارگذاری دعوتنامه…",
    confirmTitle: "شما دعوت شده‌اید",
    confirmBody:  "یک حسابدار از شما دعوت کرده تا در TaxWijs متصل شوید. آیا می‌خواهید بپذیرید؟",
    acceptBtn:    "پذیرش دعوتنامه",
    declineBtn:   "رد",
    accepting:    "در حال پذیرش…",
    declining:    "در حال رد…",
    success:      "دعوتنامه پذیرفته شد! پورتال شما در حال راه‌اندازی است…",
    declineTitle: "دعوتنامه رد شد",
    declineBody:  "شما این دعوتنامه را رد کردید. هیچ داده‌ای به اشتراک گذاشته نشده است.",
    needAcct:     "برای پذیرش این دعوتنامه یک حساب رایگان ایجاد کنید",
    needSub:      "مشاور مالیاتی شما شما را به TaxWijs دعوت کرده است. برای دسترسی به پورتال مالیاتی شخصی‌سازی شده خود حساب ایجاد کنید.",
    registerBtn:  "ایجاد حساب",
    loginBtn:     "ورود به حساب",
    errorTitle:   "دعوتنامه ناموفق",
    goHome:       "رفتن به صفحه اصلی",
  },
} as const;

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { refreshUser } = useAuth();
  const { i18n }       = useTranslation();
  const lang           = (i18n.language as "nl" | "en" | "fa") || "nl";
  const tx             = TX[lang] ?? TX.en;

  const token     = searchParams.get("token") ?? "";
  const [state,    setState]    = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [regUrl,   setRegUrl]   = useState("");
  const [acting,   setActing]   = useState<"accept" | "decline" | null>(null);

  // On load just show confirm screen — do NOT auto-accept
  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMsg("No invitation token found in the link.");
      return;
    }
    setState("confirm");
  }, [token]);

  async function handleAccept() {
    if (acting) return;
    setActing("accept");
    setState("accepting");

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const accessToken = localStorage.getItem("access_token");
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    try {
      const res = await fetch(`${apiBase}/portal/invitations/accept/`, {
        method: "POST",
        headers,
        body: JSON.stringify({ token }),
      });
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
          // Refresh user so sidebar shows My Portal + Messages immediately
          refreshUser().catch(() => null);
          setTimeout(() => navigate("/client"), 2000);
        }
      } else {
        throw new Error(body.detail ?? "Failed to accept invitation.");
      }
    } catch (err: unknown) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setActing(null);
    }
  }

  async function handleDecline() {
    if (acting) return;
    setActing("decline");

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const accessToken = localStorage.getItem("access_token");
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    try {
      const res = await fetch(`${apiBase}/portal/invitations/decline/`, {
        method: "POST",
        headers,
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setState("declined");
      } else {
        const body = await res.json() as { detail?: string };
        throw new Error(body.detail ?? "Failed to decline invitation.");
      }
    } catch (err: unknown) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setActing(null);
    }
  }

  const card: React.CSSProperties = {
    maxWidth: 440, width: "100%", textAlign: "center", padding: "var(--sp-8)",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg)", padding: "var(--sp-6)",
    }}>
      <div className="card" style={card}>

        {/* ── Loading ── */}
        {(state === "loading") && (
          <>
            <div style={{ width: 40, height: 40, border: "4px solid var(--border)", borderTopColor: "var(--blue)", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto var(--sp-4)" }} />
            <p style={{ color: "var(--ink-4)", fontSize: "var(--text-sm)" }}>{tx.loading}</p>
          </>
        )}

        {/* ── Confirm screen — Accept or Decline ── */}
        {(state === "confirm" || state === "accepting") && (
          <>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--blue-subtle)", border: "1px solid var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--sp-4)", fontSize: 24 }}>✉️</div>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, marginBottom: "var(--sp-3)" }}>
              {tx.confirmTitle}
            </h1>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)", marginBottom: "var(--sp-6)", lineHeight: 1.6 }}>
              {tx.confirmBody}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
              <button
                className="btn btn-accent"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={acting !== null}
                onClick={() => { void handleAccept(); }}
              >
                {acting === "accept" ? tx.accepting : tx.acceptBtn}
              </button>
              <button
                className="btn btn-ghost"
                style={{ width: "100%", justifyContent: "center", color: "var(--ink-4)" }}
                disabled={acting !== null}
                onClick={() => { void handleDecline(); }}
              >
                {acting === "decline" ? tx.declining : tx.declineBtn}
              </button>
            </div>
          </>
        )}

        {/* ── Accepted ── */}
        {state === "success" && (
          <>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--ok-subtle)", border: "1px solid var(--ok)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--sp-4)", fontSize: 24, color: "var(--ok-text)" }}>✓</div>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, marginBottom: "var(--sp-2)" }}>{tx.success}</h1>
          </>
        )}

        {/* ── Declined ── */}
        {state === "declined" && (
          <>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--bg-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--sp-4)", fontSize: 22 }}>✗</div>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, marginBottom: "var(--sp-3)" }}>
              {tx.declineTitle}
            </h1>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)", marginBottom: "var(--sp-6)", lineHeight: 1.6 }}>
              {tx.declineBody}
            </p>
            <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => navigate("/")}>
              {tx.goHome}
            </button>
          </>
        )}

        {/* ── Register required ── */}
        {state === "register_required" && (
          <>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--blue-subtle)", border: "1px solid var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--sp-4)", fontSize: 24 }}>✉️</div>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, marginBottom: "var(--sp-3)" }}>{tx.needAcct}</h1>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)", marginBottom: "var(--sp-6)", lineHeight: 1.6 }}>{tx.needSub}</p>
            <button className="btn btn-accent" style={{ width: "100%", justifyContent: "center", marginBottom: "var(--sp-3)" }} onClick={() => navigate(regUrl)}>
              {tx.registerBtn}
            </button>
            <Link to={`/login?next=/portal/accept-invitation?token=${token}`} style={{ display: "block", fontSize: "var(--text-sm)", color: "var(--ink-4)" }}>
              {tx.loginBtn}
            </Link>
          </>
        )}

        {/* ── Error ── */}
        {state === "error" && (
          <>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--danger-subtle)", border: "1px solid var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--sp-4)", fontSize: 22, color: "var(--danger)" }}>✕</div>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, marginBottom: "var(--sp-3)" }}>{tx.errorTitle}</h1>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)", marginBottom: "var(--sp-6)" }}>{errorMsg}</p>
            <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => navigate("/")}>{tx.goHome}</button>
          </>
        )}

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
