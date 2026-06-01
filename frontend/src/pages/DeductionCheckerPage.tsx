import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMobile } from "../hooks/useMobile";

type Lang = "nl" | "en" | "fa";

const T = {
  nl: {
    badge: "Gratis tool",
    title: "Welke aftrekposten mis ik?",
    subtitle: "Beantwoord 6 vragen en ontdek welke belastingaftrekken u mogelijk misloopt",
    step: "Vraag {{n}} van 6",
    yes: "Ja",
    no: "Nee",
    next: "Volgende",
    back: "Terug",
    see_results: "Bekijk mijn aftrekposten",
    result_title: "Uw aftrekposten in 2026",
    result_sub: "Op basis van uw antwoorden kunt u in aanmerking komen voor:",
    result_none: "Op basis van uw antwoorden zijn er geen aanvullende ZZP-aftrekposten van toepassing",
    cta_calc: "Bereken de exacte bedragen →",
    cta_chat: "Vraag de belasting-AI →",
    start_over: "Opnieuw beginnen",
    q1: "Bent u ZZP'er of freelancer?",
    q1_hint: "Heeft u een eenmanszaak of werkt u als zelfstandige?",
    q2: "Heeft u 1.225 uur of meer gewerkt voor uw bedrijf in 2026?",
    q2_hint: "Dit is het urencriterium dat vereist is voor de zelfstandigenaftrek",
    q3: "Heeft u zakelijke apparatuur, software of gereedschap gekocht?",
    q3_hint: "Laptop, telefoon, software-abonnementen, professioneel gereedschap",
    q4: "Werkt u vanuit een kantoor aan huis?",
    q4_hint: "Een aparte ruimte die uitsluitend zakelijk wordt gebruikt",
    q5: "Heeft u zakelijke reiskosten gemaakt?",
    q5_hint: "Kilometers met de auto, ov-kosten voor klantbezoeken",
    q6: "Heeft u opleidingen of cursussen gevolgd voor uw werk?",
    q6_hint: "Vakopleidingen, vakliteratuur, conferentiekosten",
    ded_zelfstandigen: "Zelfstandigenaftrek",
    ded_zelfstandigen_desc: "€1.200 aftrek als u ≥1.225 uur per jaar werkt als ondernemer",
    ded_starter: "Startersaftrek (laatste jaar!)",
    ded_starter_desc: "Nog €2.123 extra als u in uw eerste 3 jaar zit — na 2026 vervalt dit",
    ded_mkb: "MKB-winstvrijstelling",
    ded_mkb_desc: "12,7% van uw winst na aftrekken — geen uren vereist",
    ded_kia: "Kleinschaligheidsinvesteringsaftrek (KIA)",
    ded_kia_desc: "28% aftrek op zakelijke investeringen van €2.901–€70.602",
    ded_home: "Thuiswerkaftrek",
    ded_home_desc: "Kosten voor een exclusieve werkruimte thuis kunnen aftrekbaar zijn",
    ded_travel: "Reiskosten zakelijk",
    ded_travel_desc: "€0,23/km voor auto-zakelijk of werkelijke ov-kosten",
    ded_edu: "Scholingsaftrek",
    ded_edu_desc: "Opleiding en cursuskosten direct voor uw onderneming",
    ded_zvw: "ZVW-bijdrage",
    ded_zvw_desc: "5,32% over uw winst — dit verlaagt uw netto inkomen aanzienlijk",
    not_zzp_msg: "De meeste ZZP-aftrekposten zijn alleen van toepassing als u zelfstandige bent",
    not_zzp_sub: "Als werknemer, expat of DGA gelden andere belastingregels",
  },
  en: {
    badge: "Free tool",
    title: "Which deductions am I missing?",
    subtitle: "Answer 6 questions to find out which Dutch tax deductions you may be missing",
    step: "Question {{n}} of 6",
    yes: "Yes",
    no: "No",
    next: "Next",
    back: "Back",
    see_results: "See my deductions",
    result_title: "Your 2026 deductions",
    result_sub: "Based on your answers, you may qualify for:",
    result_none: "Based on your answers, no additional ZZP deductions apply",
    cta_calc: "Calculate exact amounts →",
    cta_chat: "Ask the tax AI →",
    start_over: "Start over",
    q1: "Are you self-employed (ZZP / freelancer)?",
    q1_hint: "Do you have a sole trader business or work as an independent contractor?",
    q2: "Did you work 1,225 hours or more on your business in 2026?",
    q2_hint: "This is the hour requirement (urencriterium) for the self-employed deduction",
    q3: "Did you buy business equipment, software or tools?",
    q3_hint: "Laptop, phone, software subscriptions, professional tools",
    q4: "Do you work from a home office?",
    q4_hint: "A separate room used exclusively for business",
    q5: "Did you have business travel costs?",
    q5_hint: "Car kilometres, public transport for client visits",
    q6: "Did you follow training or courses for your work?",
    q6_hint: "Professional training, trade books, conference costs",
    ded_zelfstandigen: "Zelfstandigenaftrek",
    ded_zelfstandigen_desc: "€1,200 deduction if you work ≥1,225 hours/year as entrepreneur",
    ded_starter: "Startersaftrek (last year!)",
    ded_starter_desc: "Extra €2,123 if you're in your first 3 years — abolished after 2026",
    ded_mkb: "MKB-winstvrijstelling",
    ded_mkb_desc: "12.7% of your profit after deductions — no hour requirement",
    ded_kia: "Small investment deduction (KIA)",
    ded_kia_desc: "28% deduction on business investments of €2,901–€70,602",
    ded_home: "Home office deduction",
    ded_home_desc: "Costs for an exclusive home workspace may be deductible",
    ded_travel: "Business travel costs",
    ded_travel_desc: "€0.23/km for car business trips or actual public transport costs",
    ded_edu: "Education deduction",
    ded_edu_desc: "Training and course costs directly for your business",
    ded_zvw: "ZVW health contribution",
    ded_zvw_desc: "5.32% on your profit — this significantly reduces your net income",
    not_zzp_msg: "Most ZZP deductions only apply if you are self-employed",
    not_zzp_sub: "Different tax rules apply to employees, expats and DGA directors",
  },
  fa: {
    badge: "ابزار رایگان",
    title: "کدام کسورات مالیاتی را از دست می‌دهم؟",
    subtitle: "۶ سوال بپرسید تا بدانید کدام کسورات مالیاتی هلند را ممکن است از دست بدهید",
    step: "سوال {{n}} از ۶",
    yes: "بله",
    no: "خیر",
    next: "بعدی",
    back: "قبلی",
    see_results: "نتایج کسوراتم را ببینم",
    result_title: "کسورات مالیاتی شما در ۲۰۲۶",
    result_sub: "بر اساس پاسخ‌های شما، ممکن است واجد شرایط باشید:",
    result_none: "بر اساس پاسخ‌های شما، کسورات اضافی ZZP اعمال نمی‌شود",
    cta_calc: "مبالغ دقیق را محاسبه کن ←",
    cta_chat: "از هوش مصنوعی بپرس ←",
    start_over: "شروع دوباره",
    q1: "آیا فریلنسر یا ZZP هستید؟",
    q1_hint: "آیا کسب‌وکار شخصی دارید یا به‌عنوان پیمانکار مستقل کار می‌کنید؟",
    q2: "آیا در سال ۲۰۲۶ بیش از ۱٬۲۲۵ ساعت برای کسب‌وکارتان کار کردید؟",
    q2_hint: "این شرط ساعتی (urencriterium) برای کسر zelfstandigenaftrek لازم است",
    q3: "آیا تجهیزات، نرم‌افزار یا ابزار تجاری خریدید؟",
    q3_hint: "لپ‌تاپ، موبایل، اشتراک نرم‌افزار، ابزار حرفه‌ای",
    q4: "آیا از دفتر خانگی استفاده می‌کنید؟",
    q4_hint: "یک اتاق جداگانه که فقط برای کار استفاده می‌شود",
    q5: "آیا هزینه‌های سفر تجاری داشتید؟",
    q5_hint: "کیلومتر ماشین، هزینه حمل‌ونقل عمومی برای ملاقات مشتریان",
    q6: "آیا برای کارتان دوره آموزشی گذراندید؟",
    q6_hint: "آموزش حرفه‌ای، کتاب‌های تخصصی، هزینه‌های کنفرانس",
    ded_zelfstandigen: "Zelfstandigenaftrek",
    ded_zelfstandigen_desc: "کسر €۱٬۲۰۰ اگر ≥۱٬۲۲۵ ساعت در سال به عنوان کارآفرین کار کنید",
    ded_starter: "Startersaftrek (آخرین سال!)",
    ded_starter_desc: "€۲٬۱۲۳ اضافه در سه سال اول — پس از ۲۰۲۶ حذف می‌شود",
    ded_mkb: "MKB-winstvrijstelling",
    ded_mkb_desc: "۱۲٫۷٪ از سود پس از کسورات — بدون نیاز به شرط ساعتی",
    ded_kia: "کسر سرمایه‌گذاری کوچک (KIA)",
    ded_kia_desc: "کسر ۲۸٪ برای سرمایه‌گذاری‌های تجاری €۲٬۹۰۱–€۷۰٬۶۰۲",
    ded_home: "کسر دفتر خانگی",
    ded_home_desc: "هزینه‌های فضای کاری خانگی می‌توانند کسر شوند",
    ded_travel: "هزینه‌های سفر تجاری",
    ded_travel_desc: "€۰٫۲۳/کیلومتر برای ماشین یا هزینه واقعی حمل‌ونقل عمومی",
    ded_edu: "کسر آموزش",
    ded_edu_desc: "هزینه‌های آموزشی مستقیم برای کسب‌وکار شما",
    ded_zvw: "مشارکت ZVW بهداشت",
    ded_zvw_desc: "۵٫۳۲٪ از سود — این درآمد خالص شما را به‌طور قابل توجهی کاهش می‌دهد",
    not_zzp_msg: "اکثر کسورات ZZP فقط برای خوداشتغالان اعمال می‌شود",
    not_zzp_sub: "برای کارمندان، اکسپت‌ها و مدیران DGA قوانین مالیاتی متفاوتی وجود دارد",
  },
};

const QUESTIONS = [
  { key: "is_zzp",     tKey: "q1",  hintKey: "q1_hint" },
  { key: "hours_ok",   tKey: "q2",  hintKey: "q2_hint" },
  { key: "equipment",  tKey: "q3",  hintKey: "q3_hint" },
  { key: "home_office",tKey: "q4",  hintKey: "q4_hint" },
  { key: "travel",     tKey: "q5",  hintKey: "q5_hint" },
  { key: "education",  tKey: "q6",  hintKey: "q6_hint" },
] as const;

type Answers = Partial<Record<typeof QUESTIONS[number]["key"], boolean>>;

function computeDeductions(answers: Answers, lang: Lang) {
  const tx = T[lang];
  const deds: Array<{ title: string; desc: string; highlight?: boolean }> = [];

  if (!answers.is_zzp) return { deds, notZzp: true };

  if (answers.hours_ok) {
    deds.push({ title: tx.ded_zelfstandigen, desc: tx.ded_zelfstandigen_desc, highlight: true });
    deds.push({ title: tx.ded_starter, desc: tx.ded_starter_desc, highlight: true });
  }
  deds.push({ title: tx.ded_mkb, desc: tx.ded_mkb_desc });
  if (answers.equipment) deds.push({ title: tx.ded_kia, desc: tx.ded_kia_desc });
  if (answers.home_office) deds.push({ title: tx.ded_home, desc: tx.ded_home_desc });
  if (answers.travel) deds.push({ title: tx.ded_travel, desc: tx.ded_travel_desc });
  if (answers.education) deds.push({ title: tx.ded_edu, desc: tx.ded_edu_desc });
  deds.push({ title: tx.ded_zvw, desc: tx.ded_zvw_desc });

  return { deds, notZzp: false };
}

export default function DeductionCheckerPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const lang = (i18n.language === "nl" || i18n.language === "fa") ? i18n.language as Lang : "en";
  const tx = T[lang];

  const [step, setStep] = useState(0); // 0..5 = questions, 6 = results
  const [answers, setAnswers] = useState<Answers>({});

  const currentQ = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  function answer(val: boolean) {
    const newAnswers = { ...answers, [currentQ.key]: val };
    setAnswers(newAnswers);
    if (isLast) { setStep(QUESTIONS.length); return; }
    // If not ZZP, skip to results immediately
    if (currentQ.key === "is_zzp" && !val) { setStep(QUESTIONS.length); return; }
    setStep(s => s + 1);
  }

  function reset() { setStep(0); setAnswers({}); }

  const { deds, notZzp } = computeDeductions(answers, lang);

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: isMobile ? "var(--sp-8) var(--sp-4)" : "var(--sp-12) var(--sp-6)" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "var(--sp-8)" }}>
          <span className="pill pill-accent" style={{ marginBottom: "var(--sp-3)", display: "inline-block" }}>{tx.badge}</span>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-4xl)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em" }}>
            {tx.title}
          </h1>
          <p style={{ marginTop: "var(--sp-2)", color: "var(--ink-3)", fontSize: "var(--text-md)" }}>
            {tx.subtitle}
          </p>
        </div>

        {step < QUESTIONS.length ? (
          /* Question card */
          <div className="card" style={{ padding: "var(--sp-8)", textAlign: "center" }}>
            {/* Progress */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: "var(--sp-6)" }}>
              {QUESTIONS.map((_, i) => (
                <span key={i} style={{ width: 28, height: 4, borderRadius: 2, background: i <= step ? "var(--sage-600)" : "var(--hairline-2)", transition: "background .2s" }} />
              ))}
            </div>
            <div className="eyebrow" style={{ marginBottom: "var(--sp-3)" }}>
              {tx.step.replace("{{n}}", String(step + 1))}
            </div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-3xl)", fontWeight: 400, color: "var(--ink)", marginBottom: "var(--sp-2)" }}>
              {(tx as Record<string, string>)[currentQ.tKey]}
            </h2>
            <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", marginBottom: "var(--sp-7)" }}>
              {(tx as Record<string, string>)[currentQ.hintKey]}
            </p>
            <div style={{ display: "flex", gap: "var(--sp-3)", justifyContent: "center" }}>
              <button className="btn btn-accent btn-lg" style={{ minWidth: 120 }} onClick={() => answer(true)}>
                {tx.yes}
              </button>
              <button className="btn btn-ghost btn-lg" style={{ minWidth: 120 }} onClick={() => answer(false)}>
                {tx.no}
              </button>
            </div>
            {step > 0 && (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: "var(--sp-4)", color: "var(--ink-4)" }} onClick={() => setStep(s => s - 1)}>
                ← {tx.back}
              </button>
            )}
          </div>
        ) : (
          /* Results */
          <div>
            <div className="card" style={{ padding: "var(--sp-8)" }}>
              {notZzp ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: "var(--sp-3)" }}>ℹ️</div>
                  <h2 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-2xl)", fontWeight: 400, color: "var(--ink)", marginBottom: "var(--sp-2)" }}>
                    {tx.not_zzp_msg}
                  </h2>
                  <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)" }}>{tx.not_zzp_sub}</p>
                </div>
              ) : (
                <>
                  <h2 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-2xl)", fontWeight: 400, color: "var(--ink)", marginBottom: "var(--sp-1)" }}>
                    {tx.result_title}
                  </h2>
                  <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", marginBottom: "var(--sp-5)" }}>{tx.result_sub}</p>
                  {deds.length === 0 ? (
                    <p style={{ color: "var(--ink-3)" }}>{tx.result_none}</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                      {deds.map(d => (
                        <div key={d.title} style={{ padding: "var(--sp-4) var(--sp-5)", borderRadius: "var(--r)", border: `1px solid ${d.highlight ? "var(--accent-line)" : "var(--hairline)"}`, background: d.highlight ? "var(--accent-soft)" : "var(--paper)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: 4 }}>
                            {d.highlight && <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--sage-600)", flexShrink: 0 }} />}
                            <span style={{ fontWeight: 600, color: "var(--ink)", fontSize: "var(--text-sm)" }}>{d.title}</span>
                          </div>
                          <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", margin: 0 }}>{d.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* CTA bar */}
            <div style={{ marginTop: "var(--sp-5)", display: "flex", flexDirection: isMobile ? "column" : "row", gap: "var(--sp-3)" }}>
              <button className="btn btn-accent btn-lg" style={{ flex: 1 }} onClick={() => navigate("/intake")}>
                {tx.cta_calc}
              </button>
              <button className="btn btn-ghost btn-lg" style={{ flex: 1 }} onClick={() => navigate("/chat")}>
                {tx.cta_chat}
              </button>
            </div>
            <div style={{ textAlign: "center", marginTop: "var(--sp-4)" }}>
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--ink-4)" }} onClick={reset}>
                {tx.start_over}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
