import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "../components/Icon";
import { useMobile } from "../hooks/useMobile";

type Lang = "nl" | "en" | "fa";

// ── Palettes — CSS-var based so they adapt to dark/light theme ───────────────
const SLIDE_PAL = [
  { accent: "var(--blue)",   soft: "var(--blue-subtle)",   border: "var(--blue-border)",   symbol: "✓" },
  { accent: "var(--ok)",     soft: "var(--ok-subtle)",     border: "var(--ok-border)",     symbol: "◎" },
  { accent: "var(--warn)",   soft: "var(--warn-subtle)",   border: "var(--warn-border)",   symbol: "∑" },
  { accent: "var(--purple)", soft: "var(--purple-subtle)", border: "var(--purple-subtle)", symbol: "▦" },
];

const USER_PAL = [
  "var(--blue)",   // ZZP
  "var(--ok)",     // Employee
  "var(--warn)",   // Expat
  "var(--purple)", // DGA
];

// ── Copy — three languages ────────────────────────────────────────────────
const TX = {
  hero: {
    badge: {
      nl: "Belastingassistent · ZZP · 2026",
      en: "Tax assistant · ZZP · 2026",
      fa: "دستیار مالیاتی · ZZP · ۲۰۲۶",
    },
    h1a: { nl: "Belasting in Nederland,", en: "Dutch taxes,",        fa: "مالیات هلند،" },
    h1b: { nl: "helder uitgelegd.",       en: "made simple.",         fa: "ساده توضیح داده شده." },
    sub: {
      nl: "Geverifieerde regels voor ZZP, werknemers, expats en DGA — berekend, niet geschat.",
      en: "Verified rules for ZZP, employees, expats and DGAs — calculated, not estimated.",
      fa: "قوانین تأیید‌شده برای ZZP، کارمندان، مهاجران و DGA — محاسبه‌شده، نه تخمینی.",
    },
    cta1:  { nl: "Aftrekken controleren",  en: "Check my deductions", fa: "بررسی کسورات" },
    cta2:  { nl: "Belasting berekenen",    en: "Calculate my tax",    fa: "محاسبه مالیات" },
    trust: {
      nl: ["28 regels geverifieerd", "Bronnen bij elk antwoord", "Geen account nodig"],
      en: ["28 rules verified",      "Sources on every answer",  "No account needed"],
      fa: ["۲۸ قانون تأیید‌شده",    "استناد برای هر پاسخ",     "بدون نیاز به حساب"],
    },
    card: {
      badge:   { nl: "Live antwoord · ZZP · €72.000", en: "Live answer · ZZP · €72,000", fa: "پاسخ زنده · ZZP · €۷۲,۰۰۰" },
      q:       { nl: "Ben ik een Wet DBA-risico?",     en: "Am I a Wet DBA risk?",         fa: "آیا ریسک Wet DBA دارم؟" },
      ans:     { nl: "Ja — één klant betekent ",        en: "Yes — one client means ",       fa: "بله — یک مشتری یعنی سطح " },
      risk:    { nl: "HOOG risico",                      en: "HIGH risk",                     fa: "ریسک بالا" },
      suffix:  { nl: " onder Wet DBA.",                  en: " under Wet DBA.",               fa: " زیر Wet DBA." },
      revenue: { nl: "Omzet",        en: "Revenue",     fa: "درآمد" },
      share:   { nl: "Klantaandeel", en: "Client share",fa: "سهم مشتری" },
      risk2:   { nl: "Risico",       en: "Risk",        fa: "ریسک" },
      source:  { nl: "Bron",         en: "Source",      fa: "منبع" },
      annualTax: { nl: "jaarlijkse belasting", en: "annual tax", fa: "مالیات سالانه" },
    },
  },

  features: {
    eyebrow: { nl: "Tools",                         en: "Tools",              fa: "ابزارها" },
    h2:      { nl: "Alles wat u nodig heeft",        en: "Everything you need", fa: "همه آنچه نیاز دارید" },
    open:    { nl: "Openen",                         en: "Open",               fa: "باز کردن" },
    items: {
      nl: [
        { title: "Aftrekposten-keurder",   body: "Ontdek in 60 seconden welke aftrekken u kunt claimen.",     to: "/deduction-checker" },
        { title: "Chat-assistent",         body: "Belastingvragen beantwoord in gewone taal, in uw taal.",    to: "/chat" },
        { title: "Rekenmachine",           body: "Box 1, 2 en 3 nauwkeurig berekend met uw eigen cijfers.",  to: "/intake" },
        { title: "IB Aangifte-gids",       body: "Stap-voor-stap begeleiding bij de officiële aangifte.",    to: "/ib-guide" },
      ],
      en: [
        { title: "Deduction Checker", body: "Discover in 60 seconds which deductions you qualify for.",            to: "/deduction-checker" },
        { title: "Chat Assistant",    body: "Tax questions answered in plain language, in your language.",          to: "/chat" },
        { title: "Calculator",        body: "Box 1, 2 and 3 accurately calculated with your own numbers.",         to: "/intake" },
        { title: "IB Return Guide",   body: "Step-by-step guidance through the official tax return.",              to: "/ib-guide" },
      ],
      fa: [
        { title: "بررسی کسورات",     body: "در ۶۰ ثانیه بدانید به چه کسوراتی واجد شرایط هستید.",  to: "/deduction-checker" },
        { title: "دستیار گفتگو",     body: "پاسخ سوالات مالیاتی به زبان ساده، به زبان شما.",       to: "/chat" },
        { title: "محاسبه‌گر",        body: "باکس ۱، ۲ و ۳ با ارقام واقعی شما محاسبه می‌شود.",     to: "/intake" },
        { title: "راهنمای اظهارنامه", body: "راهنمای گام به گام اظهارنامه رسمی IB.",               to: "/ib-guide" },
      ],
    },
  },

  userTypes: {
    eyebrow: { nl: "Voor wie",                      en: "Who it's for",                fa: "برای چه کسانی" },
    h2:      { nl: "Gebouwd voor uw situatie",       en: "Built for your situation",    fa: "ساخته شده برای وضعیت شما" },
    tabs: {
      nl: ["ZZP", "Werknemer", "Expat", "DGA"],
      en: ["ZZP", "Employee",  "Expat", "DGA"],
      fa: ["ZZP", "کارمند",    "مهاجر", "DGA"],
    },
    cards: {
      nl: [
        { sub: "Zelfstandige ondernemer",  items: ["Zelfstandigenaftrek €1.200", "MKB-winstvrijstelling 12,7%", "ZVW bijdrage 4,85%", "Wet DBA risicoscore"] },
        { sub: "In loondienst",            items: ["Arbeidskorting €5.685", "IACK werkende ouders €3.032", "Reiskostenvergoeding", "Pensioenjaarruimte"] },
        { sub: "Buitenlandse werker",      items: ["30%-regeling 5-jaar afbouw", "Eerste IB-aangifte gids", "Zorgtoeslag €129/maand", "Belastingverdrag"] },
        { sub: "Directeur-aandeelhouder",  items: ["Gebruikelijk loon €56.000", "Dividend vs salaris", "Box 2 tarieven 24,5%/31%", "BV-optimalisatietips"] },
      ],
      en: [
        { sub: "Self-employed freelancer", items: ["Zelfstandigenaftrek €1,200", "MKB exemption 12.7%", "ZVW health contribution 4.85%", "Wet DBA risk score"] },
        { sub: "Salaried employee",        items: ["Labour tax credit €5,685", "IACK child credit €3,032", "Commuting allowance", "Pension contribution space"] },
        { sub: "Foreign worker",           items: ["30% ruling phase-down", "First IB return guide", "Zorgtoeslag €129/month", "Tax treaty info"] },
        { sub: "Director-shareholder",     items: ["Minimum salary €56,000", "Dividend vs salary choice", "Box 2 rates 24.5%/31%", "BV optimisation tips"] },
      ],
      fa: [
        { sub: "کارآفرین مستقل",   items: ["کسر ZZP €۱٬۲۰۰", "معافیت MKB 12.7%", "کمک بهداشت ZVW 4.85%", "امتیاز ریسک Wet DBA"] },
        { sub: "کارمند استخدامی",  items: ["اعتبار مالیاتی کار €۵٬۶۸۵", "اعتبار IACK €۳٬۰۳۲", "کمک هزینه رفت‌وآمد", "فضای بازنشستگی"] },
        { sub: "کارگر خارجی",      items: ["کاهش ۵ ساله قانون ۳۰٪", "راهنمای اولین اظهارنامه IB", "zorgtoeslag €۱۲۹/ماه", "معاهده مالیاتی"] },
        { sub: "مدیر سهامدار",     items: ["حداقل حقوق €۵۶٬۰۰۰", "سود سهام در مقابل حقوق", "نرخ‌های باکس ۲", "نکات بهینه‌سازی BV"] },
      ],
    },
  },

  cta: {
    h2: {
      nl: "Doe uw 2026 aangifte met vertrouwen",
      en: "File your 2026 return with confidence",
      fa: "اظهارنامه ۲۰۲۶ خود را با اطمینان تکمیل کنید",
    },
    sub: {
      nl: "Gratis te proberen · geen account vereist",
      en: "Free to try · no account required",
      fa: "رایگان امتحان کنید · بدون نیاز به حساب",
    },
    btn1: { nl: "Gratis beginnen", en: "Start free",   fa: "شروع رایگان" },
    btn2: { nl: "Chat proberen",   en: "Try the chat", fa: "امتحان چت" },
  },
} as const;

const SLIDE_INTERVAL = 3800; // ms per slide
const TAB_INTERVAL   = 4500; // ms per tab

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const lang = i18n.language as Lang;
  const isRtl = lang === "fa";

  // ── Feature slider state ─────────────────────────────────────────────────
  const [slideIdx, setSlideIdx]     = useState(0);
  const [slidePaused, setSlidePaused] = useState(false);
  const [slideDir, setSlideDir]     = useState<"next" | "prev">("next");
  const slideTick = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStart = useRef<number | null>(null);

  const goSlide = useCallback((idx: number, dir: "next" | "prev" = "next") => {
    setSlideDir(dir);
    setSlideIdx(idx);
  }, []);

  const nextSlide = useCallback(() => {
    setSlideDir("next");
    setSlideIdx(i => (i + 1) % 4);
  }, []);

  const prevSlide = useCallback(() => {
    setSlideDir("prev");
    setSlideIdx(i => (i - 1 + 4) % 4);
  }, []);

  useEffect(() => {
    if (slidePaused) return;
    slideTick.current = setInterval(nextSlide, SLIDE_INTERVAL);
    return () => { if (slideTick.current) clearInterval(slideTick.current); };
  }, [slidePaused, nextSlide]);

  // ── User-type tabs state ─────────────────────────────────────────────────
  const [tabIdx, setTabIdx]       = useState(0);
  const [tabPaused, setTabPaused] = useState(false);
  const tabTick = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectTab = useCallback((idx: number) => {
    setTabIdx(idx);
    setTabPaused(true);
  }, []);

  useEffect(() => {
    if (tabPaused) return;
    tabTick.current = setInterval(() => setTabIdx(i => (i + 1) % 4), TAB_INTERVAL);
    return () => { if (tabTick.current) clearInterval(tabTick.current); };
  }, [tabPaused]);

  // ── Data shortcuts ───────────────────────────────────────────────────────
  const features   = TX.features.items[lang]      ?? TX.features.items.en;
  const tabLabels  = TX.userTypes.tabs[lang]       ?? TX.userTypes.tabs.en;
  const typeCards  = TX.userTypes.cards[lang]      ?? TX.userTypes.cards.en;
  const pal        = SLIDE_PAL[slideIdx];
  const activeCard = typeCards[tabIdx];
  const activeColor = USER_PAL[tabIdx];
  const hc         = TX.hero.card;

  // ── Arrow SVGs ────────────────────────────────────────────────────────────
  const ArrowLeft  = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  const ArrowRight = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;

  return (
    <main
      style={{ background: "var(--paper)", flex: 1, overflowX: "hidden" }}
      dir={isRtl ? "rtl" : "ltr"}
    >

      {/* ══════════════════════ HERO ══════════════════════════ */}
      <section
        className="grain"
        style={{
          padding: isMobile ? "64px 20px 52px" : "96px 64px 80px",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <div style={{
          maxWidth: 1180, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
          gap: isMobile ? "44px" : "72px",
          alignItems: "center",
        }}>

          {/* Left — headline + CTAs */}
          <div>
            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "5px 14px", borderRadius: 999,
              background: "var(--paper)", border: "1px solid var(--accent-line)",
              marginBottom: 24,
              animation: "heroFadeUp 0.55s ease both",
              animationDelay: "0.05s",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--sage-500)", flexShrink: 0 }} />
              <span className="eyebrow eyebrow-accent">{TX.hero.badge[lang]}</span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: isMobile ? "clamp(2.2rem, 9vw, 3.2rem)" : "clamp(2.8rem, 3.8vw, 4rem)",
              lineHeight: 1.1,
              fontFamily: "var(--serif)",
              fontWeight: 400,
              letterSpacing: "-0.025em",
              color: "var(--ink)",
              margin: 0,
            }}>
              <span style={{ display: "block", animation: "heroFadeUp 0.65s ease both", animationDelay: "0.15s" }}>
                {TX.hero.h1a[lang]}
              </span>
              <span style={{ display: "block", color: "var(--blue-text)", animation: "heroFadeUp 0.65s ease both", animationDelay: "0.28s" }}>
                {TX.hero.h1b[lang]}
              </span>
            </h1>

            {/* Sub */}
            <p style={{
              marginTop: 20, fontSize: 16, lineHeight: 1.65,
              color: "var(--ink-2)", maxWidth: 460,
              animation: "heroFadeUp 0.65s ease both", animationDelay: "0.40s",
            }}>
              {TX.hero.sub[lang]}
            </p>

            {/* CTAs */}
            <div style={{
              marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12,
              animation: "heroFadeUp 0.65s ease both", animationDelay: "0.52s",
            }}>
              <button className="btn btn-accent btn-lg" onClick={() => navigate("/deduction-checker")}>
                {TX.hero.cta1[lang]} <Icon.arrow />
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => navigate("/intake")}>
                {TX.hero.cta2[lang]}
              </button>
            </div>

            {/* Trust row */}
            <div style={{
              marginTop: 22, display: "flex", flexWrap: "wrap",
              gap: "8px 18px", fontSize: 12.5, color: "var(--ink-3)",
              animation: "heroFadeUp 0.65s ease both", animationDelay: "0.64s",
            }}>
              {TX.hero.trust[lang].map((item, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Icon.check style={{ color: "var(--sage-500)" }} />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Right — floating demo card (desktop only) */}
          {!isMobile && (
            <div
              style={{
                position: "relative",
                animation: "heroFadeIn 0.9s ease both",
                animationDelay: "0.30s",
              }}
            >
              <div
                className="card"
                style={{
                  padding: 22,
                  boxShadow: "var(--shadow-lg)",
                  borderRadius: "var(--r-xl)",
                  animation: "floatCard 5.5s ease-in-out infinite",
                  animationDelay: "0.5s",
                }}
              >
                {/* Card header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: "1px solid var(--hairline)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--sage-500)" }} />
                    <span className="eyebrow eyebrow-accent">{hc.badge[lang]}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--mono)" }}>2.3s</span>
                </div>

                {/* User question bubble */}
                <div style={{ padding: "14px 0 10px", display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ padding: "10px 16px", borderRadius: "16px 16px 4px 16px", background: "var(--blue)", color: "#fff", fontSize: 13.5, maxWidth: 280, lineHeight: 1.5 }}>
                    {hc.q[lang]}
                  </div>
                </div>

                {/* AI answer */}
                <div style={{ padding: 16, background: "var(--paper-tint)", borderRadius: "var(--r)", border: "1px solid var(--hairline)" }}>
                  <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>
                    {hc.ans[lang]}
                    <strong style={{ color: "var(--danger)" }}>{hc.risk[lang]}</strong>
                    {hc.suffix[lang]}
                  </p>
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--paper)", borderRadius: "var(--r-sm)", border: "1px dashed var(--accent-line)", display: "grid", gridTemplateColumns: "1fr auto", rowGap: 6, fontSize: 13 }}>
                    <span style={{ color: "var(--ink-3)" }}>{hc.revenue[lang]}</span>
                    <span className="num">€ 72,000</span>
                    <span style={{ color: "var(--ink-3)" }}>{hc.share[lang]}</span>
                    <span className="num">100 %</span>
                    <span style={{ color: "var(--ink-3)" }}>{hc.risk2[lang]}</span>
                    <span className="num" style={{ color: "var(--danger)", fontWeight: 700 }}>{hc.risk[lang]}</span>
                  </div>
                </div>

                {/* Source */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 12, fontSize: 11, color: "var(--ink-4)" }}>
                  <span className="eyebrow">{hc.source[lang]}:</span>
                  <span>belastingdienst.nl/wet-dba</span>
                </div>
              </div>

              {/* Floating stat chip */}
              <div
                className="card"
                style={{ position: "absolute", right: -24, bottom: 60, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--shadow)", animation: "floatCard 5.5s ease-in-out infinite", animationDelay: "1s" }}
              >
                <span style={{ width: 28, height: 28, borderRadius: 999, background: "var(--accent-soft)", display: "grid", placeItems: "center" }}>
                  <Icon.spark style={{ color: "var(--sage-700)", width: 13, height: 13 }} />
                </span>
                <div>
                  <div className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--sage-700)" }}>€ 14,736</div>
                  <div style={{ fontSize: 11, color: "var(--ink-4)" }}>{hc.annualTax[lang]}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════ FEATURE SLIDER ══════════════════════════ */}
      <section
        style={{ padding: isMobile ? "52px 20px 56px" : "88px 64px", borderBottom: "1px solid var(--hairline)" }}
        onMouseEnter={() => setSlidePaused(true)}
        onMouseLeave={() => setSlidePaused(false)}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>

          {/* Section header + nav arrows */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 44, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div className="eyebrow eyebrow-accent" style={{ marginBottom: 8 }}>
                {TX.features.eyebrow[lang]}
              </div>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: isMobile ? 26 : 36, fontWeight: 400, letterSpacing: "-0.022em", color: "var(--ink)", margin: 0 }}>
                {TX.features.h2[lang]}
              </h2>
            </div>

            {/* Prev / Next (always visible, compact on mobile) */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => { prevSlide(); setSlidePaused(true); }}
                aria-label="Previous feature"
                style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--hairline-2)", background: "var(--paper)", cursor: "pointer", display: "grid", placeItems: "center", transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--sage-600)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--hairline-2)"; e.currentTarget.style.background = "var(--paper)"; }}
              >
                {isRtl ? <ArrowRight /> : <ArrowLeft />}
              </button>
              <div style={{ display: "flex", gap: 5 }}>
                {SLIDE_PAL.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { goSlide(i, i > slideIdx ? "next" : "prev"); setSlidePaused(true); }}
                    aria-label={`Slide ${i + 1}`}
                    style={{ width: i === slideIdx ? 22 : 8, height: 8, borderRadius: 4, background: i === slideIdx ? pal.accent : "var(--hairline-2)", border: "none", cursor: "pointer", transition: "all .3s ease", padding: 0 }}
                  />
                ))}
              </div>
              <button
                onClick={() => { nextSlide(); setSlidePaused(true); }}
                aria-label="Next feature"
                style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--hairline-2)", background: "var(--paper)", cursor: "pointer", display: "grid", placeItems: "center", transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--sage-600)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--hairline-2)"; e.currentTarget.style.background = "var(--paper)"; }}
              >
                {isRtl ? <ArrowLeft /> : <ArrowRight />}
              </button>
            </div>
          </div>

          {/* Slide layout: big card (left) + list (right) */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
            gap: isMobile ? "24px" : "36px",
            alignItems: "center",
          }}>

            {/* Main slide card — key change re-triggers the CSS animation */}
            <div
              key={slideIdx}
              onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
              onTouchEnd={e => {
                if (touchStart.current === null) return;
                const diff = touchStart.current - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 48) {
                  if (diff > 0) { nextSlide(); setSlidePaused(true); }
                  else          { prevSlide(); setSlidePaused(true); }
                }
                touchStart.current = null;
              }}
              style={{
                padding: isMobile ? "28px 22px" : "44px 40px",
                background: "var(--paper)",
                border: `1px solid ${pal.border}`,
                borderRadius: "var(--r-xl)",
                boxShadow: "var(--shadow)",
                animation: (slideDir === "next")
                  ? "slideInFromRight 0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94) both"
                  : "slideInFromLeft  0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
              }}
            >
              {/* Icon */}
              <div style={{ width: 52, height: 52, borderRadius: "var(--r-lg)", background: pal.soft, display: "grid", placeItems: "center", fontSize: 22, color: pal.accent, fontFamily: "var(--mono)", fontWeight: 700, marginBottom: 22 }}>
                {pal.symbol}
              </div>

              <div className="eyebrow" style={{ marginBottom: 8 }}>0{slideIdx + 1} / 04</div>

              <h3 style={{ fontFamily: "var(--serif)", fontSize: isMobile ? 26 : 30, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
                {features[slideIdx].title}
              </h3>
              <p style={{ marginTop: 12, fontSize: 15, color: "var(--ink-2)", lineHeight: 1.65, maxWidth: 380 }}>
                {features[slideIdx].body}
              </p>

              <button
                className="btn btn-sm"
                style={{ marginTop: 24, background: pal.soft, color: pal.accent, border: "none" }}
                onClick={() => navigate(features[slideIdx].to)}
              >
                {TX.features.open[lang]} <Icon.arrow style={{ color: pal.accent }} />
              </button>
            </div>

            {/* Right: stacked mini-cards (feature list) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {features.map((f, i) => (
                <button
                  key={i}
                  onClick={() => { goSlide(i, i > slideIdx ? "next" : "prev"); setSlidePaused(true); }}
                  style={{
                    padding: "14px 16px",
                    background: i === slideIdx ? "var(--accent-soft)" : "var(--paper)",
                    border: `1px solid ${i === slideIdx ? "var(--accent-line)" : "var(--hairline)"}`,
                    borderRadius: "var(--r-lg)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    textAlign: "start",
                    transition: "all .2s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", background: SLIDE_PAL[i].soft, display: "grid", placeItems: "center", fontSize: 15, color: SLIDE_PAL[i].accent, flexShrink: 0 }}>
                    {SLIDE_PAL[i].symbol}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: i === slideIdx ? 600 : 400, color: i === slideIdx ? "var(--sage-700)" : "var(--ink)", lineHeight: 1.3 }}>
                    {f.title}
                  </span>
                  {/* Progress bar on active slide */}
                  {i === slideIdx && !slidePaused && (
                    <div
                      key={`${slideIdx}-prog`}
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        height: 2,
                        background: pal.accent,
                        borderRadius: 1,
                        animation: `progressBar ${SLIDE_INTERVAL}ms linear both`,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ USER TYPE TABS ══════════════════════════ */}
      <section
        style={{ padding: isMobile ? "52px 20px 56px" : "88px 64px", background: "var(--paper-tint)", borderBottom: "1px solid var(--hairline)" }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <div className="eyebrow eyebrow-accent" style={{ marginBottom: 8 }}>{TX.userTypes.eyebrow[lang]}</div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: isMobile ? 26 : 36, fontWeight: 400, letterSpacing: "-0.022em", color: "var(--ink)", margin: 0 }}>
              {TX.userTypes.h2[lang]}
            </h2>
          </div>

          {/* Tab buttons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
            {tabLabels.map((label, i) => (
              <button
                key={i}
                onClick={() => selectTab(i)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 999,
                  border: `2px solid ${i === tabIdx ? USER_PAL[i] : "var(--hairline)"}`,
                  background: i === tabIdx ? `${USER_PAL[i]}18` : "transparent",
                  color: i === tabIdx ? USER_PAL[i] : "var(--ink-3)",
                  fontWeight: i === tabIdx ? 600 : 400,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all .2s ease",
                  minHeight: "var(--touch-min)",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Animated tab content */}
          <div
            key={tabIdx}
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? "20px" : "28px",
              animation: "fadeSlideIn 0.38s ease both",
            }}
          >
            {/* Feature card */}
            <div
              className="card"
              style={{
                padding: isMobile ? "22px 18px" : "32px 28px",
                borderTop: `3px solid ${activeColor}`,
                borderRadius: "var(--r-xl)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div style={{ width: 42, height: 42, borderRadius: "var(--r-sm)", background: `${activeColor}18`, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: activeColor, fontFamily: "var(--mono)", flexShrink: 0 }}>
                  {tabLabels[tabIdx].slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)", lineHeight: 1 }}>{tabLabels[tabIdx]}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 3 }}>{activeCard.sub}</div>
                </div>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {activeCard.items.map((item, j) => (
                  <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: `${activeColor}22`, display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2 }}>
                      <Icon.check style={{ width: 10, height: 10, color: activeColor }} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA column */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
              <div>
                <div className="eyebrow eyebrow-accent" style={{ marginBottom: 8 }}>{tabLabels[tabIdx]}</div>
                <p style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.65, margin: 0 }}>
                  {TX.hero.sub[lang]}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", flexWrap: "wrap", gap: 10 }}>
                <button
                  className="btn btn-accent"
                  style={{ justifyContent: "flex-start" }}
                  onClick={() => navigate("/deduction-checker")}
                >
                  {TX.hero.cta1[lang]} <Icon.arrow />
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ justifyContent: "flex-start" }}
                  onClick={() => navigate("/chat")}
                >
                  {TX.cta.btn2[lang]}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ FOOTER CTA ══════════════════════════ */}
      <section style={{ padding: isMobile ? "60px 20px" : "96px 64px", background: "var(--bg-2)", borderTop: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
        <div className="dot-grid" style={{ position: "absolute", inset: 0, opacity: 0.2, pointerEvents: "none", maskImage: "radial-gradient(ellipse 60% 80% at 50% 50%, #000 30%, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse 60% 80% at 50% 50%, #000 30%, transparent 75%)" }} />
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <h2 style={{
            fontFamily: "var(--font)",
            fontSize: isMobile ? "var(--text-3xl)" : "var(--text-5xl)",
            fontWeight: 800,
            color: "var(--text)",
            letterSpacing: "-0.03em",
            lineHeight: 1.12,
            margin: 0,
          }}>
            {TX.cta.h2[lang]}
          </h2>
          <p style={{ marginTop: 16, fontSize: 15, color: "var(--text-2)", lineHeight: 1.6 }}>
            {TX.cta.sub[lang]}
          </p>
          <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <button
              className="btn btn-lg btn-accent"
              onClick={() => navigate("/register")}
            >
              {TX.cta.btn1[lang]} <Icon.arrow />
            </button>
            <button
              className="btn btn-ghost btn-lg"
              onClick={() => navigate("/chat")}
            >
              {TX.cta.btn2[lang]}
            </button>
          </div>
          <p style={{ marginTop: 28, fontSize: 11.5, color: "var(--text-4)", lineHeight: 1.7 }}>
            {t("chat.disclaimer")}
          </p>
        </div>
      </section>
    </main>
  );
}
