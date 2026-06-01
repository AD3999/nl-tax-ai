import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "../components/Icon";
import { useMobile } from "../hooks/useMobile";
import { apiBase } from "../api/client";

const USER_TYPE_DOTS = [
  { label: "ZZP",      color: "var(--sage-600)" },
  { label: "Employee", color: "oklch(0.55 0.12 230)" },
  { label: "Expat",    color: "oklch(0.62 0.13 50)" },
  { label: "DGA",      color: "oklch(0.55 0.10 290)" },
];

const FEATURES = [
  { kbd: "01", title: "Deduction Checker", body: "Find out which Dutch tax deductions you qualify for — zelfstandigenaftrek, MKB, KIA and more — in 60 seconds", to: "/deduction-checker" },
  { kbd: "02", title: "Chat",              body: "Plain-language tax answers in NL, EN, or FA — grounded in 2026 rules and your own numbers", to: "/chat" },
  { kbd: "03", title: "Calculator",        body: "Box 1, 2 & 3, ZZP deductions, credits and Wet DBA — calculated, not estimated", to: "/intake" },
  { kbd: "04", title: "IB Return",         body: "Field-by-field walkthrough of the official aangifte with explanations and traps", to: "/ib-guide" },
];

const PROOF_ROWS = [
  ["ZZP · 1 client",         "€72,000", "WET DBA · HIGH"],
  ["Employee · 30% ruling",  "€95,000", "RULING YEAR 2"],
  ["DGA · BV salary + div",  "€56,000", "DIVIDEND €12k"],
];

function EmailCaptureBar({ lang, apiBase }: { lang: "nl" | "en" | "fa"; apiBase: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const label = { nl: "Ontvang 2026 ZZP belastingtips", en: "Get 2026 ZZP tax tips", fa: "دریافت نکات مالیاتی ZZP 2026" }[lang];
  const placeholder = { nl: "uw@emailadres.nl", en: "your@email.com", fa: "ایمیل شما" }[lang];
  const btnLabel = { nl: "Stuur mij tips", en: "Send me tips", fa: "ارسال" }[lang];
  const thanksMsg = { nl: "Bedankt! We sturen u snel belastingtips.", en: "Thanks! Tax tips are on their way.", fa: "ممنون! نکات مالیاتی برای شما ارسال می‌شود." }[lang];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    try {
      await fetch(`${apiBase}/users/email-capture/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source_page: "landing" }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ padding: "40px 56px", background: "var(--paper-tint)", borderTop: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        {sent ? (
          <p style={{ color: "var(--sage-700)", fontWeight: 500 }}>{thanksMsg}</p>
        ) : (
          <>
            <p style={{ color: "var(--ink-2)", fontSize: "var(--text-sm)", marginBottom: 14, fontWeight: 500 }}>{label}</p>
            <form onSubmit={submit} style={{ display: "flex", gap: 8, maxWidth: 420, margin: "0 auto", flexWrap: "wrap" }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={placeholder}
                required
                className="tw-input"
                style={{ flex: 1, minWidth: 200, fontSize: 16 }}
              />
              <button type="submit" className="btn btn-accent" disabled={loading}>
                {loading ? "..." : btnLabel}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const lang = i18n.language as "nl" | "en" | "fa";

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>

      {/* ── HERO ── */}
      <section className="grain" style={{ padding: isMobile ? "var(--sp-10) var(--sp-4) var(--sp-8)" : "var(--sp-16) var(--sp-16) var(--sp-12)", borderBottom: "1px solid var(--hairline)" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.15fr 1fr", gap: isMobile ? "var(--sp-8)" : "var(--sp-16)", alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 11px", borderRadius: 999, background: "var(--paper)", border: "1px solid var(--accent-line)" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--sage-600)" }} />
              <span className="eyebrow eyebrow-accent">
                {lang === "fa" ? "شفاف‌سازی مالیات در هلند" : lang === "nl" ? "Belasting AI · 2026" : "Dutch Tax AI · 2026"}
              </span>
            </div>

            {/* Hero headline — fluid type size prevents overflow at 320px */}
            <h1 style={{
              marginTop: "var(--sp-5)",
              fontSize: isMobile ? "clamp(2rem, 10vw, 3.5rem)" : "var(--text-6xl)",
              lineHeight: "var(--leading-tight)",
              color: "var(--ink)",
              fontWeight: 400,
              fontFamily: "var(--serif)",
              letterSpacing: "-0.025em",
            }}>
              {t("landing.headline_1")}<br />
              <span style={{ fontStyle: "italic", color: "var(--sage-700)" }}>{t("landing.headline_2")}</span>
            </h1>

            <p style={{ marginTop: "var(--sp-4)", fontSize: "var(--text-lg)", lineHeight: "var(--leading-normal)", color: "var(--ink-2)", maxWidth: 520 }}>
              {t("landing.subheadline")}
            </p>

            <div style={{ marginTop: "var(--sp-6)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--sp-3)" }}>
              <button className="btn btn-accent btn-lg" onClick={() => navigate("/deduction-checker")}>
                {t("landing.cta_primary")} <Icon.arrow />
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => navigate("/intake")}>
                {t("landing.cta_secondary")}
              </button>
            </div>
            <div style={{ marginTop: "var(--sp-3)" }}>
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--ink-3)", fontSize: "var(--text-xs)" }} onClick={() => navigate("/chat")}>
                {t("landing.cta_tertiary")} →
              </button>
            </div>

            <div style={{ marginTop: "var(--sp-4)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--sp-3)", color: "var(--ink-3)", fontSize: "var(--text-xs)" }}>
              <span>{t("landing.no_account_needed")}</span>
              <span aria-hidden="true" style={{ color: "var(--hairline-2)" }}>|</span>
              <span>2026 rules verified</span>
              <span aria-hidden="true" style={{ color: "var(--hairline-2)" }}>|</span>
              <span>Sources on every answer</span>
            </div>
          </div>

          {/* Hero artifact card — hidden on mobile to keep the page scannable */}
          {!isMobile && <div style={{ position: "relative" }}>
            <div className="card" style={{ padding: 18, boxShadow: "var(--shadow-lg)", borderRadius: "var(--r-xl)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 6px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--sage-500)" }} />
                  <span className="eyebrow">Live answer · ZZP · €72,000</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--ink-4)" }}>2.3s</span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                <div style={{ padding: "8px 14px", borderRadius: 16, background: "var(--ink)", color: "var(--paper)", fontSize: 13, maxWidth: 320 }}>
                  Am I a Wet DBA risk if I have one client?
                </div>
              </div>

              <div style={{ padding: 16, background: "var(--paper-3)", borderRadius: "var(--r)", border: "1px solid var(--hairline)" }}>
                <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
                  Yes — one client accounting for 100% of revenue places you in{" "}
                  <strong style={{ color: "var(--ink)" }}>HIGH risk</strong> under the Wet DBA test. The Belastingdienst can reclassify the relationship as employment.
                </p>
                <div style={{ marginTop: 12, padding: 12, background: "var(--paper)", borderRadius: "var(--r-sm)", border: "1px dashed var(--accent-line)" }}>
                  <div className="eyebrow eyebrow-accent" style={{ marginBottom: 4 }}>Your numbers</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 4, fontSize: 13 }}>
                    <span>Revenue</span><span className="num">€ 72,000</span>
                    <span>Single-client share</span><span className="num">100 %</span>
                    <span>Risk band</span><span className="num" style={{ color: "var(--danger)" }}>HIGH</span>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["What proves independence?", "Add a second client", "Modelovereenkomst guide"].map(s => (
                    <span key={s} style={{ padding: "5px 10px", borderRadius: 999, fontSize: 12, background: "var(--paper)", border: "1px solid var(--hairline-2)", color: "var(--ink-2)" }}>{s}</span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 4px 2px", fontSize: 11, color: "var(--ink-3)" }}>
                <span className="eyebrow">Sources</span>
                <span>belastingdienst.nl/wet-dba</span>
                <span>·</span>
                <span>kvk.nl/modelovereenkomst</span>
              </div>
            </div>

            {/* Floating chips */}
            <div className="card" style={{ position: "absolute", left: -32, top: 36, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--shadow)" }}>
              <span style={{ width: 22, height: 22, borderRadius: 999, background: "var(--sage-100)", display: "grid", placeItems: "center", color: "var(--sage-700)", fontSize: 11, fontWeight: 600 }}>NL</span>
              <span style={{ fontSize: 12 }}>Switch to Nederlands</span>
            </div>
            <div className="card" style={{ position: "absolute", right: -28, bottom: 60, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--shadow)" }}>
              <span className="font-mono" style={{ fontSize: 11, color: "var(--sage-700)" }}>€ 24,310</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>tax to reserve</span>
            </div>
          </div>}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: isMobile ? "48px 20px" : "72px 56px", borderBottom: "1px solid var(--hairline)" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "flex-end", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: isMobile ? 12 : 0, marginBottom: 32 }}>
            <div>
              <div className="eyebrow eyebrow-accent">What it does</div>
              <h2 style={{ fontSize: 36, fontFamily: "var(--serif)", fontWeight: 400, color: "var(--ink)", marginTop: 6, letterSpacing: "-0.02em" }}>
                Four tools, one tax brain.
              </h2>
            </div>
            <p style={{ maxWidth: 360, color: "var(--ink-3)", fontSize: 14 }}>
              Each tool shares the same verified ruleset, your stored profile and the same calculation engine — answers stay consistent.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 1, background: "var(--hairline)", border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
            {FEATURES.map(f => (
              <div key={f.kbd} onClick={() => navigate(f.to)} style={{ padding: "var(--sp-6) var(--sp-5) var(--sp-8)", background: "var(--paper)", display: "flex", flexDirection: "column", gap: "var(--sp-3)", minHeight: 200, cursor: "pointer", transition: "background .15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--paper-3)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--paper)")}>
                <span className="eyebrow">{f.kbd}</span>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-2xl)", fontWeight: 400, color: "var(--ink)" }}>{f.title}</h3>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)", lineHeight: "var(--leading-relaxed)" }}>{f.body}</p>
                <span style={{ marginTop: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--sage-700)", fontWeight: 500 }}>
                  {lang === "nl" ? "Openen" : lang === "fa" ? "باز کردن" : "Open"} <Icon.arrow />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROOF / WHO IT'S FOR ── */}
      <section style={{ padding: isMobile ? "48px 20px" : "72px 56px", background: "var(--paper-tint)", borderBottom: "1px solid var(--hairline)" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.1fr", gap: isMobile ? 28 : 56, alignItems: "center" }}>
          <div>
            <div className="eyebrow eyebrow-accent">Built for the four ways NL gets taxed</div>
            <h2 style={{ fontSize: 36, fontFamily: "var(--serif)", fontWeight: 400, marginTop: 6, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              Same engine. Different rules per type.
            </h2>
            <p style={{ marginTop: 14, color: "var(--ink-3)", fontSize: 14.5, lineHeight: 1.55, maxWidth: 460 }}>
              The system knows the rules that apply to <em>you</em> — including the ones most people miss, like MKB-vrijstelling, IACK, or the last year of startersaftrek.
            </p>
            <div style={{ marginTop: 22, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {USER_TYPE_DOTS.map(v => (
                <span key={v.label} style={{ padding: "8px 14px", border: "1px solid var(--hairline-2)", borderRadius: 999, background: "var(--paper)", fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: v.color }} />
                  {v.label}
                </span>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: "var(--paper)", padding: 0, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", padding: "14px 22px", background: "var(--paper-3)", borderBottom: "1px solid var(--hairline)" }}>
              <span className="eyebrow">Sample profile</span>
              <span className="eyebrow" style={{ textAlign: "right" }}>Income</span>
              <span className="eyebrow" style={{ textAlign: "right" }}>Flag</span>
            </div>
            {PROOF_ROWS.map(([a, b, c], i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", padding: "18px 22px", borderBottom: i < PROOF_ROWS.length - 1 ? "1px solid var(--hairline)" : "none", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--ink)" }}>{a}</span>
                <span className="num" style={{ color: "var(--ink)" }}>{b}</span>
                <span className="num" style={{ fontSize: 11, color: "var(--sage-700)", letterSpacing: "0.06em" }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMAIL CAPTURE ── */}
      <EmailCaptureBar lang={lang} apiBase={apiBase} />

      {/* ── FOOTER CTA ── */}
      <section style={{ padding: isMobile ? "var(--sp-12) var(--sp-4)" : "var(--sp-16) var(--sp-16)" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: isMobile ? "var(--text-3xl)" : "var(--text-5xl)", fontFamily: "var(--serif)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: "var(--leading-snug)" }}>
            {lang === "nl" ? "Doe 2026 aangifte met een tweede paar ogen" : lang === "fa" ? "اظهارنامه ۲۰۲۶ را با یک جفت چشم دوم تکمیل کنید" : "File 2026 with a second pair of eyes"}
          </h2>
          <p style={{ marginTop: "var(--sp-3)", color: "var(--ink-3)", fontSize: "var(--text-md)" }}>
            {lang === "nl" ? "Gratis te proberen · upgrade als u onbeperkt wilt" : lang === "fa" ? "رایگان امتحان کنید · در صورت نیاز به نامحدود ارتقا دهید" : "Free to try · upgrade only if you want unlimited"}
          </p>
          <div style={{ marginTop: "var(--sp-5)", display: "inline-flex", flexWrap: "wrap", gap: "var(--sp-3)", justifyContent: "center" }}>
            <button className="btn btn-accent btn-lg" onClick={() => navigate("/register")}>
              {lang === "nl" ? "Gratis beginnen" : lang === "fa" ? "شروع رایگان" : "Start free"}
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate("/chat")}>
              {lang === "nl" ? "Probeer gratis" : lang === "fa" ? "امتحان کن" : "Try it free"}
            </button>
          </div>
          <p style={{ marginTop: "var(--sp-10)", fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>
            {t("chat.disclaimer")}
          </p>
        </div>
      </section>
    </main>
  );
}
