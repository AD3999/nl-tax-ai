import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "../components/Icon";
import { useMobile } from "../hooks/useMobile";

type Lang = "nl" | "en" | "fa";

// ── Feature palette: each tool gets its own accent colour ──────────────────
const FEAT_PAL = [
  { accent: "oklch(0.50 0.105 118)", soft: "oklch(0.96 0.048 118)" },  // sage
  { accent: "oklch(0.45 0.12 230)",  soft: "oklch(0.94 0.040 230)" },  // blue
  { accent: "oklch(0.48 0.14 75)",   soft: "oklch(0.96 0.048 75)" },   // amber
  { accent: "oklch(0.44 0.11 290)",  soft: "oklch(0.94 0.038 290)" },  // violet
];

// ── User-type palette ──────────────────────────────────────────────────────
const USER_PAL = [
  "oklch(0.50 0.105 118)",  // sage   — ZZP
  "oklch(0.45 0.12 230)",   // blue   — Employee
  "oklch(0.48 0.14 75)",    // amber  — Expat
  "oklch(0.44 0.11 290)",   // violet — DGA
];

// ── All copy, three languages ──────────────────────────────────────────────
const TX = {
  hero: {
    badge: { nl: "Vind uw belastingaftrekken · ZZP · 2026", en: "Find missing deductions · ZZP · 2026", fa: "کشف کسورات مالیاتی · ZZP · ۲۰۲۶" },
    sub: {
      nl: "Geverifieerde Nederlandse belastingregels voor ZZP, werknemers, expats en DGA — in het Nederlands, Engels en Farsi.",
      en: "Verified Dutch tax rules for ZZP, employees, expats and DGAs — in Dutch, English and Persian.",
      fa: "قوانین مالیاتی هلند برای ZZP، کارمندان، مهاجران و DGA — به فارسی، هلندی و انگلیسی.",
    },
    cta1:  { nl: "Aftrekken controleren",  en: "Check deductions",    fa: "بررسی کسورات" },
    cta2:  { nl: "Belasting berekenen",    en: "Calculate my tax",    fa: "محاسبه مالیات" },
    trust: {
      nl: ["28 regels geverifieerd", "Bronnen bij elk antwoord", "Geen account nodig"],
      en: ["28 rules verified",      "Sources on every answer",  "No account needed"],
      fa: ["۲۸ قانون تأیید‌شده", "استناد برای هر پاسخ", "بدون نیاز به حساب"],
    },
  },

  stats: {
    nl: [
      { val: "28",   label: "regels geverifieerd", color: "var(--sage-600)" },
      { val: "3",    label: "talen volledig",        color: "oklch(0.45 0.12 230)" },
      { val: "2026", label: "belastingjaar actief",  color: "oklch(0.48 0.14 75)" },
      { val: "6",    label: "scenario's getest",     color: "oklch(0.44 0.11 290)" },
    ],
    en: [
      { val: "28",   label: "rules verified",     color: "var(--sage-600)" },
      { val: "3",    label: "full languages",      color: "oklch(0.45 0.12 230)" },
      { val: "2026", label: "active tax year",     color: "oklch(0.48 0.14 75)" },
      { val: "6",    label: "scenarios tested",    color: "oklch(0.44 0.11 290)" },
    ],
    fa: [
      { val: "۲۸",   label: "قانون تأیید‌شده",     color: "var(--sage-600)" },
      { val: "۳",    label: "زبان کامل",             color: "oklch(0.45 0.12 230)" },
      { val: "۲۰۲۶", label: "سال مالیاتی فعال",     color: "oklch(0.48 0.14 75)" },
      { val: "۶",    label: "سناریو آزمایش‌شده",    color: "oklch(0.44 0.11 290)" },
    ],
  },

  features: {
    eyebrow: { nl: "Wat doet het",        en: "What it does",   fa: "قابلیت‌ها" },
    heading: { nl: "Vier tools, één brein", en: "Four tools, one brain", fa: "چهار ابزار، یک مغز" },
    sub: {
      nl: "Elk hulpmiddel gebruikt dezelfde geverifieerde regelset en uw profiel — antwoorden zijn altijd consistent.",
      en: "Every tool shares the same verified ruleset and your profile — answers stay consistent.",
      fa: "همه ابزارها از یک مجموعه قوانین تأیید‌شده استفاده می‌کنند — پاسخ‌ها همیشه سازگارند.",
    },
    open: { nl: "Openen", en: "Open", fa: "باز کردن" },
    items: {
      nl: [
        { title: "Keurder aftrekposten", body: "Ontdek welke aftrekken u kunt claimen — zelfstandigenaftrek, MKB, KIA en meer — in 60 seconden.", to: "/deduction-checker" },
        { title: "Chat",                 body: "Belastingantwoorden in gewone taal in NL, EN of FA — gebaseerd op 2026 regels en uw eigen cijfers.", to: "/chat" },
        { title: "Rekenmachine",         body: "Box 1, 2 & 3, ZZP-aftrekken, kortingen en Wet DBA — berekend, niet geschat.", to: "/intake" },
        { title: "IB Aangifte",          body: "Veld-voor-veld begeleiding bij de officiële aangifte met uitleg en veelgemaakte fouten.", to: "/ib-guide" },
      ],
      en: [
        { title: "Deduction Checker", body: "Find out which Dutch tax deductions you qualify for — zelfstandigenaftrek, MKB, KIA and more — in 60 seconds.", to: "/deduction-checker" },
        { title: "Chat",              body: "Plain-language tax answers in NL, EN, or FA — grounded in 2026 rules and your own numbers.", to: "/chat" },
        { title: "Calculator",        body: "Box 1, 2 & 3, ZZP deductions, credits and Wet DBA — calculated, not estimated.", to: "/intake" },
        { title: "IB Return",         body: "Field-by-field walkthrough of the official aangifte with explanations and traps.", to: "/ib-guide" },
      ],
      fa: [
        { title: "بررسی کسورات",        body: "کسورات مالیاتی واجد شرایط شما — زلفستاندیهنافترک، MKB، KIA و بیشتر — در ۶۰ ثانیه.", to: "/deduction-checker" },
        { title: "گفتگو",               body: "پاسخ مالیاتی به زبان ساده به فارسی، هلندی یا انگلیسی — بر اساس قوانین ۲۰۲۶.", to: "/chat" },
        { title: "محاسبه‌گر",           body: "باکس ۱، ۲ و ۳، کسورات ZZP، اعتبارات و Wet DBA — محاسبه‌شده، نه تخمینی.", to: "/intake" },
        { title: "اظهارنامه IB",        body: "راهنمای فیلد به فیلد اظهارنامه رسمی با توضیحات و هشدار اشتباهات رایج.", to: "/ib-guide" },
      ],
    },
  },

  userTypes: {
    eyebrow: { nl: "Voor wie",       en: "Who is this for",  fa: "برای چه کسانی" },
    heading: { nl: "Gebouwd voor vier soorten belastingplichtige", en: "Built for four kinds of Dutch taxpayer", fa: "طراحی شده برای چهار نوع مشمول مالیات" },
    sub: {
      nl: "Het systeem kent de regels die op ú van toepassing zijn — inclusief de regels die de meesten missen.",
      en: "The system knows the rules that apply to you — including the ones most people miss.",
      fa: "سیستم قوانین مخصوص شما را می‌شناسد — از جمله قوانینی که اغلب نادیده گرفته می‌شوند.",
    },
    cards: {
      nl: [
        { label: "ZZP",       sub: "Zelfstandige",           items: ["Zelfstandigenaftrek €1.200", "MKB-winstvrijstelling 12,7%", "ZVW bijdrage 4,85%", "Wet DBA risicoscore"] },
        { label: "Werknemer", sub: "In loondienst",          items: ["30%-regeling berekening", "IACK werkende ouders €3.032", "Reiskostenvergoeding", "Pensioenjaarruimte"] },
        { label: "Expat",     sub: "Buitenlandse werker",    items: ["30% ruling 5-jaar afbouw", "Eerste IB-aangifte gids", "Zorgtoeslag €129/mo check", "Dubbele belastingverdrag"] },
        { label: "DGA",       sub: "Directeur-aandeelhouder", items: ["Gebruikelijk loon €56.000", "Dividend vs salaris keuze", "Box 2 tarieven 24,5%/31%", "BV-optimalisatietips"] },
      ],
      en: [
        { label: "ZZP",       sub: "Self-employed",          items: ["Zelfstandigenaftrek €1,200", "MKB-vrijstelling 12.7%", "ZVW health contribution 4.85%", "Wet DBA risk score"] },
        { label: "Employee",  sub: "In employment",          items: ["30% ruling calculation", "IACK child tax credit €3,032", "Commuting allowance", "Pension contribution space"] },
        { label: "Expat",     sub: "Foreign worker",         items: ["30% ruling 5-year phase-down", "First IB return guide", "Zorgtoeslag €129/mo check", "Tax treaty info"] },
        { label: "DGA",       sub: "Director-shareholder",   items: ["Minimum salary €56,000", "Dividend vs salary choice", "Box 2 rates 24.5%/31%", "BV optimisation tips"] },
      ],
      fa: [
        { label: "ZZP",         sub: "خوداشتغالی",         items: ["کسر ZZP €۱٬۲۰۰", "معافیت MKB 12.7%", "کمک بهداشت ZVW 4.85%", "امتیاز ریسک Wet DBA"] },
        { label: "کارمند",      sub: "استخدام",            items: ["محاسبه قانون ۳۰٪", "اعتبار IACK €۳٬۰۳۲", "کمک هزینه رفت‌وآمد", "فضای مشارکت بازنشستگی"] },
        { label: "مهاجر خارجی", sub: "کارگر خارجی",       items: ["کاهش ۵ ساله قانون ۳۰٪", "راهنمای اولین اظهارنامه IB", "بررسی zorgtoeslag €۱۲۹/ماه", "اطلاعات معاهده مالیاتی"] },
        { label: "DGA",         sub: "مدیر سهامدار",       items: ["حداقل حقوق €۵۶٬۰۰۰", "انتخاب سود سهام یا حقوق", "نرخ‌های باکس ۲: ۲۴.۵٪/۳۱٪", "نکات بهینه‌سازی BV"] },
      ],
    },
  },

  cta: {
    heading: {
      nl: "Doe 2026 aangifte met een tweede paar ogen",
      en: "File 2026 with a second pair of eyes",
      fa: "اظهارنامه ۲۰۲۶ خود را با پشتیبانی هوشمند تکمیل کنید",
    },
    sub: {
      nl: "Gratis te proberen · upgrade alleen als u onbeperkt wilt",
      en: "Free to try · upgrade only if you want unlimited",
      fa: "رایگان امتحان کنید · در صورت نیاز به دسترسی نامحدود ارتقاء دهید",
    },
    btn1: { nl: "Gratis beginnen",    en: "Start free",     fa: "شروع رایگان" },
    btn2: { nl: "Chat proberen",      en: "Try the chat",   fa: "امتحان چت" },
  },

  heroCard: {
    badge:    { nl: "Live antwoord · ZZP · €72.000", en: "Live answer · ZZP · €72,000", fa: "پاسخ زنده · ZZP · €۷۲,۰۰۰" },
    q:        { nl: "Ben ik een Wet DBA-risico met één klant?", en: "Am I a Wet DBA risk if I have one client?", fa: "اگر فقط یک مشتری داشته باشم، آیا ریسک Wet DBA دارم؟" },
    ans:      { nl: "Ja — één klant met 100% omzetaandeel plaatst u in ", en: "Yes — one client at 100% revenue places you in ", fa: "بله — یک مشتری با ۱۰۰٪ درآمد شما را در سطح " },
    risk:     { nl: "HOOG risico", en: "HIGH risk", fa: "بالا" },
    suffix:   { nl: " onder de Wet DBA-test.", en: " under the Wet DBA test.", fa: " قرار می‌دهد." },
    revenue:  { nl: "Omzet", en: "Revenue", fa: "درآمد" },
    share:    { nl: "Klantaandeel", en: "Client share", fa: "سهم مشتری" },
    riskBand: { nl: "Risicoklasse", en: "Risk band", fa: "سطح ریسک" },
    source:   { nl: "Bron", en: "Source", fa: "منبع" },
  },
};

// ── Feature icons (Unicode symbols, consistent with site language) ─────────
const FEAT_SYMBOL = ["✓", "◎", "∑", "▦"];

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate   = useNavigate();
  const isMobile   = useMobile();
  const lang       = i18n.language as Lang;

  const stats    = TX.stats[lang]   ?? TX.stats.en;
  const features = TX.features.items[lang] ?? TX.features.items.en;
  const cards    = TX.userTypes.cards[lang] ?? TX.userTypes.cards.en;
  const hc       = TX.heroCard;

  // ── helpers ─────────────────────────────────────────────────────────────
  const px = (mobile: string, desk: string) => (isMobile ? mobile : desk);

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>

      {/* ════════════════════ HERO ════════════════════ */}
      <section
        className="grain"
        style={{
          padding: px("72px 20px 56px", "96px 64px 80px"),
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <div style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.15fr 1fr",
          gap: px("48px", "72px"),
          alignItems: "center",
        }}>

          {/* Left — copy */}
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 14px", borderRadius: 999,
              background: "var(--paper)", border: "1px solid var(--accent-line)",
              marginBottom: 28,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--sage-500)" }} />
              <span className="eyebrow eyebrow-accent">{TX.hero.badge[lang]}</span>
            </div>

            <h1 style={{
              fontSize: isMobile ? "clamp(2.4rem, 10vw, 3.8rem)" : "clamp(3rem, 4.5vw, 4.2rem)",
              lineHeight: 1.08,
              fontFamily: "var(--serif)",
              fontWeight: 400,
              letterSpacing: "-0.028em",
              color: "var(--ink)",
              margin: 0,
            }}>
              {t("landing.headline_1")}<br />
              <em style={{ fontStyle: "italic", color: "var(--sage-700)" }}>{t("landing.headline_2")}</em>
            </h1>

            <p style={{
              marginTop: 24, fontSize: 17, lineHeight: 1.6,
              color: "var(--ink-2)", maxWidth: 480,
            }}>
              {TX.hero.sub[lang]}
            </p>

            <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12 }}>
              <button className="btn btn-accent btn-lg" onClick={() => navigate("/deduction-checker")}>
                {TX.hero.cta1[lang]} <Icon.arrow />
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => navigate("/intake")}>
                {TX.hero.cta2[lang]}
              </button>
            </div>

            <div style={{
              marginTop: 24, display: "flex", flexWrap: "wrap",
              gap: "10px 20px", fontSize: 12.5, color: "var(--ink-3)",
            }}>
              {TX.hero.trust[lang].map((item, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Icon.check style={{ color: "var(--sage-500)" }} />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Right — demo card (hidden on mobile) */}
          {!isMobile && (
            <div style={{ position: "relative" }}>
              <div className="card" style={{ padding: 22, boxShadow: "var(--shadow-lg)", borderRadius: "var(--r-xl)" }}>

                {/* Card header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  paddingBottom: 14, borderBottom: "1px solid var(--hairline)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--sage-500)" }} />
                    <span className="eyebrow eyebrow-accent">{hc.badge[lang]}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--mono)" }}>2.3s</span>
                </div>

                {/* Chat bubble */}
                <div style={{ padding: "14px 0 10px", display: "flex", justifyContent: "flex-end" }}>
                  <div style={{
                    padding: "10px 16px", borderRadius: "16px 16px 4px 16px",
                    background: "var(--ink)", color: "var(--paper)", fontSize: 13.5,
                    maxWidth: 300, lineHeight: 1.5,
                  }}>
                    {hc.q[lang]}
                  </div>
                </div>

                {/* Answer */}
                <div style={{
                  padding: 16, background: "var(--paper-tint)",
                  borderRadius: "var(--r)", border: "1px solid var(--hairline)",
                }}>
                  <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>
                    {hc.ans[lang]}
                    <strong style={{ color: "var(--danger)" }}>{hc.risk[lang]}</strong>
                    {hc.suffix[lang]}
                  </p>

                  {/* Numbers grid */}
                  <div style={{
                    marginTop: 12, padding: "10px 14px",
                    background: "var(--paper)", borderRadius: "var(--r-sm)",
                    border: "1px dashed var(--accent-line)",
                    display: "grid", gridTemplateColumns: "1fr auto", rowGap: 6, fontSize: 13,
                  }}>
                    <span style={{ color: "var(--ink-3)" }}>{hc.revenue[lang]}</span>
                    <span className="num">€ 72,000</span>
                    <span style={{ color: "var(--ink-3)" }}>{hc.share[lang]}</span>
                    <span className="num">100 %</span>
                    <span style={{ color: "var(--ink-3)" }}>{hc.riskBand[lang]}</span>
                    <span className="num" style={{ color: "var(--danger)" }}>{hc.risk[lang]}</span>
                  </div>
                </div>

                {/* Source */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  paddingTop: 12, fontSize: 11, color: "var(--ink-4)",
                }}>
                  <span className="eyebrow">{hc.source[lang]}:</span>
                  <span>belastingdienst.nl/wet-dba</span>
                </div>
              </div>

              {/* Floating chip — tax amount */}
              <div className="card" style={{
                position: "absolute", right: -28, bottom: 56,
                padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
                boxShadow: "var(--shadow)",
              }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 999,
                  background: "var(--accent-soft)", display: "grid", placeItems: "center",
                }}>
                  <Icon.spark style={{ color: "var(--sage-700)", width: 13, height: 13 }} />
                </span>
                <div>
                  <div className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--sage-700)" }}>€ 24,310</div>
                  <div style={{ fontSize: 11, color: "var(--ink-4)" }}>
                    {lang === "fa" ? "ذخیره مالیاتی" : lang === "nl" ? "belasting reserveren" : "tax to reserve"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════ STATS BAR ════════════════════ */}
      <section style={{
        padding: px("28px 20px", "28px 64px"),
        borderBottom: "1px solid var(--hairline)",
        background: "var(--paper-tint)",
      }}>
        <div style={{
          maxWidth: 1180, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: isMobile ? "16px 8px" : 0,
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: px("8px 0", "12px 0"),
              borderRight: (!isMobile && i < stats.length - 1) ? "1px solid var(--hairline)" : "none",
              gap: 4,
            }}>
              <span className="font-mono" style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, color: s.color }}>
                {s.val}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════ FEATURES ════════════════════ */}
      <section style={{ padding: px("56px 20px", "88px 64px"), borderBottom: "1px solid var(--hairline)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>

          {/* Section header */}
          <div style={{ marginBottom: 52, maxWidth: 620 }}>
            <div className="eyebrow eyebrow-accent" style={{ marginBottom: 10 }}>
              {TX.features.eyebrow[lang]}
            </div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: px("28px", "38px"), fontWeight: 400, letterSpacing: "-0.022em", color: "var(--ink)", margin: 0 }}>
              {TX.features.heading[lang]}
            </h2>
            <p style={{ marginTop: 14, color: "var(--ink-3)", fontSize: 15, lineHeight: 1.6, maxWidth: 520 }}>
              {TX.features.sub[lang]}
            </p>
          </div>

          {/* 2×2 feature cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: 16,
          }}>
            {features.map((f, i) => {
              const pal = FEAT_PAL[i];
              return (
                <div
                  key={i}
                  onClick={() => navigate(f.to)}
                  style={{
                    padding: "28px 28px 24px",
                    background: "var(--paper)",
                    border: "1px solid var(--hairline)",
                    borderRadius: "var(--r-xl)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    transition: "box-shadow .18s ease, transform .18s ease",
                    boxShadow: "var(--shadow-sm)",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Icon badge */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "var(--r)",
                      background: pal.soft, display: "grid", placeItems: "center",
                      fontSize: 18, color: pal.accent, fontFamily: "var(--mono)", fontWeight: 600,
                    }}>
                      {FEAT_SYMBOL[i]}
                    </div>
                    <span className="eyebrow" style={{ paddingTop: 4 }}>0{i + 1}</span>
                  </div>

                  {/* Text */}
                  <div>
                    <h3 style={{
                      fontFamily: "var(--serif)", fontSize: 22, fontWeight: 400,
                      color: "var(--ink)", margin: 0, letterSpacing: "-0.015em",
                    }}>
                      {f.title}
                    </h3>
                    <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-3)", lineHeight: 1.65 }}>
                      {f.body}
                    </p>
                  </div>

                  {/* CTA link */}
                  <span style={{
                    marginTop: "auto",
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontSize: 13, fontWeight: 500, color: pal.accent,
                  }}>
                    {TX.features.open[lang]} <Icon.arrow style={{ color: pal.accent }} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════ WHO IT'S FOR ════════════════════ */}
      <section style={{ padding: px("56px 20px", "88px 64px"), background: "var(--paper-tint)", borderBottom: "1px solid var(--hairline)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>

          {/* Section header */}
          <div style={{ marginBottom: 48, maxWidth: 680 }}>
            <div className="eyebrow eyebrow-accent" style={{ marginBottom: 10 }}>
              {TX.userTypes.eyebrow[lang]}
            </div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: px("28px", "38px"), fontWeight: 400, letterSpacing: "-0.022em", color: "var(--ink)", margin: 0 }}>
              {TX.userTypes.heading[lang]}
            </h2>
            <p style={{ marginTop: 14, color: "var(--ink-3)", fontSize: 15, lineHeight: 1.6 }}>
              {TX.userTypes.sub[lang]}
            </p>
          </div>

          {/* 4 user-type cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 16,
          }}>
            {cards.map((card, i) => {
              const color = USER_PAL[i];
              return (
                <div key={i} style={{
                  background: "var(--paper)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--r-xl)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "var(--shadow-sm)",
                }}>
                  {/* Coloured top accent bar */}
                  <div style={{ height: 4, background: color }} />

                  <div style={{ padding: isMobile ? "16px 14px 20px" : "20px 20px 24px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    {/* Label */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "var(--r-sm)",
                        background: `${color}18`,
                        display: "grid", placeItems: "center",
                        fontSize: 12, fontWeight: 700, color, fontFamily: "var(--mono)",
                      }}>
                        {card.label.slice(0, 3)}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>{card.label}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-4)" }}>{card.sub}</div>
                      </div>
                    </div>

                    {/* Feature bullets */}
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                      {card.items.map((item, j) => (
                        <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
                          <span style={{ marginTop: 3, flexShrink: 0, color }}>
                            <Icon.check style={{ width: 12, height: 12 }} />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════ FOOTER CTA ════════════════════ */}
      <section style={{
        padding: px("64px 20px", "96px 64px"),
        background: "var(--sage-900)",
        color: "white",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontFamily: "var(--serif)",
            fontSize: px("var(--text-3xl)", "var(--text-5xl)"),
            fontWeight: 400,
            color: "oklch(0.93 0.030 115)",
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            margin: 0,
          }}>
            {TX.cta.heading[lang]}
          </h2>
          <p style={{ marginTop: 16, fontSize: 16, color: "oklch(0.72 0.020 115)", lineHeight: 1.6 }}>
            {TX.cta.sub[lang]}
          </p>
          <div style={{ marginTop: 36, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <button
              className="btn btn-lg"
              style={{ background: "white", color: "var(--sage-800)", border: "none", fontWeight: 600 }}
              onClick={() => navigate("/register")}
            >
              {TX.cta.btn1[lang]}
            </button>
            <button
              className="btn btn-ghost btn-lg"
              style={{ borderColor: "oklch(0.40 0.030 118)", color: "oklch(0.80 0.030 115)" }}
              onClick={() => navigate("/chat")}
            >
              {TX.cta.btn2[lang]}
            </button>
          </div>
          <p style={{ marginTop: 32, fontSize: 11.5, color: "oklch(0.48 0.018 118)", lineHeight: 1.7 }}>
            {t("chat.disclaimer")}
          </p>
        </div>
      </section>
    </main>
  );
}
