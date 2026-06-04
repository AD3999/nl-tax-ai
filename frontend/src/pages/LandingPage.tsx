import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "../components/Icon";
import { useMobile } from "../hooks/useMobile";
import { apiBase } from "../api/client";

type Lang = "nl" | "en" | "fa";

const TX = {
  userTypeDots: {
    nl: ["ZZP", "Werknemer", "Expat", "DGA"],
    en: ["ZZP", "Employee", "Expat", "DGA"],
    fa: ["ZZP", "کارمند", "مهاجر خارجی", "DGA"],
  },
  featuresSection: {
    eyebrow: { nl: "Wat doet het", en: "What it does", fa: "قابلیت‌ها" },
    heading: { nl: "Vier tools, één belastingbrein", en: "Four tools, one tax brain", fa: "چهار ابزار، یک مغز مالیاتی" },
    subtext: {
      nl: "Elk hulpmiddel deelt dezelfde geverifieerde regelset, uw profiel en de berekeningsmotor — antwoorden zijn altijd consistent",
      en: "Each tool shares the same verified ruleset, your stored profile and the same calculation engine — answers stay consistent",
      fa: "هر ابزار از همان مجموعه قوانین تأیید‌شده، پروفایل ذخیره‌شده و موتور محاسبه استفاده می‌کند — پاسخ‌ها همیشه سازگار هستند",
    },
    open: { nl: "Openen", en: "Open", fa: "باز کردن" },
  },
  features: {
    nl: [
      { kbd: "01", title: "Keurder aftrekposten", body: "Ontdek welke Nederlandse belastingaftrekken u kunt claimen — zelfstandigenaftrek, MKB, KIA en meer — in 60 seconden", to: "/deduction-checker" },
      { kbd: "02", title: "Chat",                 body: "Belastingantwoorden in gewone taal in NL, EN of FA — gebaseerd op 2026 regels en uw eigen cijfers", to: "/chat" },
      { kbd: "03", title: "Rekenmachine",          body: "Box 1, 2 & 3, ZZP-aftrekken, kortingen en Wet DBA — berekend, niet geschat", to: "/intake" },
      { kbd: "04", title: "IB Aangifte",           body: "Veld-voor-veld begeleiding bij de officiële aangifte met uitleg en veelgemaakte fouten", to: "/ib-guide" },
    ],
    en: [
      { kbd: "01", title: "Deduction Checker", body: "Find out which Dutch tax deductions you qualify for — zelfstandigenaftrek, MKB, KIA and more — in 60 seconds", to: "/deduction-checker" },
      { kbd: "02", title: "Chat",              body: "Plain-language tax answers in NL, EN, or FA — grounded in 2026 rules and your own numbers", to: "/chat" },
      { kbd: "03", title: "Calculator",        body: "Box 1, 2 & 3, ZZP deductions, credits and Wet DBA — calculated, not estimated", to: "/intake" },
      { kbd: "04", title: "IB Return",         body: "Field-by-field walkthrough of the official aangifte with explanations and traps", to: "/ib-guide" },
    ],
    fa: [
      { kbd: "01", title: "بررسی کسورات",         body: "دریابید کدام کسورات مالیاتی هلند شامل حال شما می‌شود — زلفستاندیهنافترک، MKB، KIA و بیشتر — در ۶۰ ثانیه", to: "/deduction-checker" },
      { kbd: "02", title: "گفتگو",                body: "پاسخ‌های مالیاتی به زبان ساده به فارسی، هلندی یا انگلیسی — بر اساس قوانین ۲۰۲۶ و اعداد شخصی شما", to: "/chat" },
      { kbd: "03", title: "محاسبه‌گر مالیاتی",    body: "باکس ۱، ۲ و ۳، کسورات ZZP، اعتبارات و Wet DBA — محاسبه‌شده، نه تخمینی", to: "/intake" },
      { kbd: "04", title: "اظهارنامه IB",         body: "راهنمای فیلد به فیلد اظهارنامه رسمی با توضیحات و هشدار اشتباهات رایج", to: "/ib-guide" },
    ],
  },
  proofSection: {
    eyebrow: {
      nl: "Voor de vier manieren waarop NL belast wordt",
      en: "Built for the four ways NL gets taxed",
      fa: "طراحی شده برای چهار نوع مشمول مالیات در هلند",
    },
    heading: {
      nl: "Dezelfde motor. Andere regels per type",
      en: "Same engine. Different rules per type",
      fa: "یک موتور محاسبه، قوانین متفاوت برای هر نوع",
    },
    subtext: {
      nl: "Het systeem kent de regels die op u van toepassing zijn — inclusief de regels die de meesten missen, zoals MKB-vrijstelling, IACK of het laatste jaar startersaftrek",
      en: "The system knows the rules that apply to you — including the ones most people miss, like MKB-vrijstelling, IACK, or the last year of startersaftrek",
      fa: "سیستم قوانین مخصوص به شما را می‌شناسد — از جمله آنهایی که اغلب نادیده گرفته می‌شوند، مانند MKB-vrijstelling، IACK، یا آخرین سال startersaftrek",
    },
    colProfile: { nl: "Voorbeeldprofiel", en: "Sample profile", fa: "نمونه پروفایل" },
    colIncome:  { nl: "Inkomen",          en: "Income",         fa: "درآمد" },
    colFlag:    { nl: "Kenmerk",          en: "Flag",           fa: "علامت" },
  },
  proofRows: {
    nl: [
      ["ZZP · 1 klant",             "€72.000", "WET DBA · HOOG"],
      ["Werknemer · 30%-regeling",  "€95.000", "REGELING JAAR 2"],
      ["DGA · BV-salaris + div",    "€56.000", "DIVIDEND €12k"],
    ],
    en: [
      ["ZZP · 1 client",         "€72,000", "WET DBA · HIGH"],
      ["Employee · 30% ruling",  "€95,000", "RULING YEAR 2"],
      ["DGA · BV salary + div",  "€56,000", "DIVIDEND €12k"],
    ],
    fa: [
      ["ZZP · ۱ مشتری",             "€۷۲,۰۰۰", "WET DBA · بالا"],
      ["کارمند · قانون ۳۰٪",        "€۹۵,۰۰۰", "سال ۲ قانون ۳۰٪"],
      ["DGA · حقوق BV + سود سهام", "€۵۶,۰۰۰", "سود سهام €۱۲k"],
    ],
  },
  trustBar: {
    rules: { nl: "regels 2026 geverifieerd", en: "2026 rules verified", fa: "قوانین ۲۰۲۶ تأیید شده" },
    sources: { nl: "bronnen bij elk antwoord", en: "Sources on every answer", fa: "استناد برای هر پاسخ" },
  },
  heroCard: {
    badge: { nl: "Live antwoord · ZZP · €72.000", en: "Live answer · ZZP · €72,000", fa: "پاسخ زنده · ZZP · €۷۲,۰۰۰" },
    question: {
      nl: "Ben ik een Wet DBA-risico met één klant?",
      en: "Am I a Wet DBA risk if I have one client?",
      fa: "اگر فقط یک مشتری داشته باشم، آیا ریسک Wet DBA دارم؟",
    },
    answer: {
      nl: "Ja — één klant die 100% van uw omzet vertegenwoordigt, plaatst u in het ",
      en: "Yes — one client accounting for 100% of revenue places you in ",
      fa: "بله — یک مشتری با ۱۰۰٪ درآمد شما را در سطح ریسک ",
    },
    riskLabel: { nl: "HOOG risico", en: "HIGH risk", fa: "بالا" },
    answerSuffix: {
      nl: " onder de Wet DBA-test. De Belastingdienst kan de relatie als dienstverband aanmerken",
      en: " under the Wet DBA test. The Belastingdienst can reclassify the relationship as employment",
      fa: " قرار می‌دهد. Belastingdienst می‌تواند رابطه را به عنوان استخدام طبقه‌بندی کند",
    },
    yourNumbers: { nl: "Uw cijfers", en: "Your numbers", fa: "اعداد شما" },
    revenue:     { nl: "Omzet",          en: "Revenue",             fa: "درآمد" },
    clientShare: { nl: "Klantconcentratie", en: "Single-client share", fa: "سهم مشتری واحد" },
    riskBand:    { nl: "Risicoklasse",   en: "Risk band",           fa: "سطح ریسک" },
    chips: {
      nl: ["Wat bewijst zelfstandigheid?", "Tweede klant toevoegen", "Modelovereenkomst"],
      en: ["What proves independence?", "Add a second client", "Modelovereenkomst guide"],
      fa: ["چه چیزی استقلال را ثابت می‌کند؟", "افزودن مشتری دوم", "Modelovereenkomst"],
    },
    switchLang:  { nl: "Schakel naar Engels", en: "Switch to Nederlands", fa: "تغییر به هلندی" },
    taxReserve:  { nl: "belasting reserveren", en: "tax to reserve", fa: "ذخیره مالیاتی" },
    sources:     { nl: "Bronnen", en: "Sources", fa: "منابع" },
  },
  footerCta: {
    heading: {
      nl: "Doe 2026 aangifte met een tweede paar ogen",
      en: "File 2026 with a second pair of eyes",
      fa: "اظهارنامه مالیاتی ۲۰۲۶ خود را با پشتیبانی هوشمند تکمیل کنید",
    },
    sub: {
      nl: "Gratis te proberen · upgrade als u onbeperkt wilt",
      en: "Free to try · upgrade only if you want unlimited",
      fa: "رایگان امتحان کنید · در صورت نیاز به دسترسی نامحدود ارتقاء دهید",
    },
    btnPrimary: { nl: "Gratis beginnen", en: "Start free", fa: "شروع رایگان" },
    btnSecondary: { nl: "Probeer gratis", en: "Try it free", fa: "امتحان کنید" },
  },
};

const USER_TYPE_COLORS = [
  "var(--sage-600)",
  "oklch(0.55 0.12 230)",
  "oklch(0.62 0.13 50)",
  "oklch(0.55 0.10 290)",
];

function EmailCaptureBar({ lang, apiBase }: { lang: Lang; apiBase: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const label       = { nl: "Ontvang 2026 ZZP belastingtips", en: "Get 2026 ZZP tax tips",         fa: "دریافت نکات مالیاتی ZZP 2026" }[lang];
  const placeholder = { nl: "uw@emailadres.nl",                en: "your@email.com",                fa: "ایمیل شما" }[lang];
  const btnLabel    = { nl: "Stuur mij tips",                  en: "Send me tips",                  fa: "ارسال" }[lang];
  const thanksMsg   = { nl: "Bedankt! U ontvangt snel tips",   en: "Thanks! Tax tips are on their way", fa: "با تشکر! نکات مالیاتی برای شما ارسال خواهد شد" }[lang];

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
  const lang = i18n.language as Lang;

  const features  = TX.features[lang]  ?? TX.features.en;
  const proofRows = TX.proofRows[lang] ?? TX.proofRows.en;
  const userDots  = TX.userTypeDots[lang] ?? TX.userTypeDots.en;
  const hc        = TX.heroCard;

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>

      {/* ── HERO ── */}
      <section className="grain" style={{ padding: isMobile ? "var(--sp-10) var(--sp-4) var(--sp-8)" : "var(--sp-16) var(--sp-16) var(--sp-12)", borderBottom: "1px solid var(--hairline)" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.15fr 1fr", gap: isMobile ? "var(--sp-8)" : "var(--sp-16)", alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 11px", borderRadius: 999, background: "var(--paper)", border: "1px solid var(--accent-line)" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--sage-600)" }} />
              <span className="eyebrow eyebrow-accent">
                {lang === "fa" ? "کشف کسورات مالیاتی · ZZP · ۲۰۲۶" : lang === "nl" ? "Vind uw belastingaftrekken · ZZP · 2026" : "Find missing deductions · ZZP · 2026"}
              </span>
            </div>

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
              <span>{TX.trustBar.rules[lang]}</span>
              <span aria-hidden="true" style={{ color: "var(--hairline-2)" }}>|</span>
              <span>{TX.trustBar.sources[lang]}</span>
            </div>
          </div>

          {/* Hero artifact card — hidden on mobile */}
          {!isMobile && <div style={{ position: "relative" }}>
            <div className="card" style={{ padding: 18, boxShadow: "var(--shadow-lg)", borderRadius: "var(--r-xl)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 6px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--sage-500)" }} />
                  <span className="eyebrow">{hc.badge[lang]}</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--ink-4)" }}>2.3s</span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                <div style={{ padding: "8px 14px", borderRadius: 16, background: "var(--ink)", color: "var(--paper)", fontSize: 13, maxWidth: 320 }}>
                  {hc.question[lang]}
                </div>
              </div>

              <div style={{ padding: 16, background: "var(--paper-3)", borderRadius: "var(--r)", border: "1px solid var(--hairline)" }}>
                <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
                  {hc.answer[lang]}
                  <strong style={{ color: "var(--ink)" }}>{hc.riskLabel[lang]}</strong>
                  {hc.answerSuffix[lang]}
                </p>
                <div style={{ marginTop: 12, padding: 12, background: "var(--paper)", borderRadius: "var(--r-sm)", border: "1px dashed var(--accent-line)" }}>
                  <div className="eyebrow eyebrow-accent" style={{ marginBottom: 4 }}>{hc.yourNumbers[lang]}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 4, fontSize: 13 }}>
                    <span>{hc.revenue[lang]}</span><span className="num">€ 72,000</span>
                    <span>{hc.clientShare[lang]}</span><span className="num">100 %</span>
                    <span>{hc.riskBand[lang]}</span><span className="num" style={{ color: "var(--danger)" }}>{hc.riskLabel[lang]}</span>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {hc.chips[lang].map(s => (
                    <span key={s} style={{ padding: "5px 10px", borderRadius: 999, fontSize: 12, background: "var(--paper)", border: "1px solid var(--hairline-2)", color: "var(--ink-2)" }}>{s}</span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 4px 2px", fontSize: 11, color: "var(--ink-3)" }}>
                <span className="eyebrow">{hc.sources[lang]}</span>
                <span>belastingdienst.nl/wet-dba</span>
                <span>·</span>
                <span>kvk.nl/modelovereenkomst</span>
              </div>
            </div>

            {/* Floating chips */}
            <div className="card" style={{ position: "absolute", left: -32, top: 36, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--shadow)" }}>
              <span style={{ width: 22, height: 22, borderRadius: 999, background: "var(--sage-100)", display: "grid", placeItems: "center", color: "var(--sage-700)", fontSize: 11, fontWeight: 600 }}>NL</span>
              <span style={{ fontSize: 12 }}>{hc.switchLang[lang]}</span>
            </div>
            <div className="card" style={{ position: "absolute", right: -28, bottom: 60, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--shadow)" }}>
              <span className="font-mono" style={{ fontSize: 11, color: "var(--sage-700)" }}>€ 24,310</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{hc.taxReserve[lang]}</span>
            </div>
          </div>}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: isMobile ? "48px 20px" : "72px 56px", borderBottom: "1px solid var(--hairline)" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "flex-end", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: isMobile ? 12 : 0, marginBottom: 32 }}>
            <div>
              <div className="eyebrow eyebrow-accent">{TX.featuresSection.eyebrow[lang]}</div>
              <h2 style={{ fontSize: 36, fontFamily: "var(--serif)", fontWeight: 400, color: "var(--ink)", marginTop: 6, letterSpacing: "-0.02em" }}>
                {TX.featuresSection.heading[lang]}
              </h2>
            </div>
            <p style={{ maxWidth: 360, color: "var(--ink-3)", fontSize: 14 }}>
              {TX.featuresSection.subtext[lang]}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 1, background: "var(--hairline)", border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
            {features.map(f => (
              <div key={f.kbd} onClick={() => navigate(f.to)} style={{ padding: "var(--sp-6) var(--sp-5) var(--sp-8)", background: "var(--paper)", display: "flex", flexDirection: "column", gap: "var(--sp-3)", minHeight: 200, cursor: "pointer", transition: "background .15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--paper-3)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--paper)")}>
                <span className="eyebrow">{f.kbd}</span>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-2xl)", fontWeight: 400, color: "var(--ink)" }}>{f.title}</h3>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)", lineHeight: "var(--leading-relaxed)" }}>{f.body}</p>
                <span style={{ marginTop: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--sage-700)", fontWeight: 500 }}>
                  {TX.featuresSection.open[lang]} <Icon.arrow />
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
            <div className="eyebrow eyebrow-accent">{TX.proofSection.eyebrow[lang]}</div>
            <h2 style={{ fontSize: 36, fontFamily: "var(--serif)", fontWeight: 400, marginTop: 6, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              {TX.proofSection.heading[lang]}
            </h2>
            <p style={{ marginTop: 14, color: "var(--ink-3)", fontSize: 14.5, lineHeight: 1.55, maxWidth: 460 }}>
              {TX.proofSection.subtext[lang]}
            </p>
            <div style={{ marginTop: 22, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {userDots.map((label, i) => (
                <span key={label} style={{ padding: "8px 14px", border: "1px solid var(--hairline-2)", borderRadius: 999, background: "var(--paper)", fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: USER_TYPE_COLORS[i] }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: "var(--paper)", padding: 0, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", padding: "14px 22px", background: "var(--paper-3)", borderBottom: "1px solid var(--hairline)" }}>
              <span className="eyebrow">{TX.proofSection.colProfile[lang]}</span>
              <span className="eyebrow" style={{ textAlign: "right" }}>{TX.proofSection.colIncome[lang]}</span>
              <span className="eyebrow" style={{ textAlign: "right" }}>{TX.proofSection.colFlag[lang]}</span>
            </div>
            {proofRows.map(([a, b, c], i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", padding: "18px 22px", borderBottom: i < proofRows.length - 1 ? "1px solid var(--hairline)" : "none", alignItems: "center" }}>
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
            {TX.footerCta.heading[lang]}
          </h2>
          <p style={{ marginTop: "var(--sp-3)", color: "var(--ink-3)", fontSize: "var(--text-md)" }}>
            {TX.footerCta.sub[lang]}
          </p>
          <div style={{ marginTop: "var(--sp-5)", display: "inline-flex", flexWrap: "wrap", gap: "var(--sp-3)", justifyContent: "center" }}>
            <button className="btn btn-accent btn-lg" onClick={() => navigate("/register")}>
              {TX.footerCta.btnPrimary[lang]}
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate("/chat")}>
              {TX.footerCta.btnSecondary[lang]}
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
