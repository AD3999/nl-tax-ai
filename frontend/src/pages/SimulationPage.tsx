import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  SIMULATION_STEPS,
  answersToCalcProfile,
  type Answers,
  type SimField,
  type SimStep,
  type Lang,
} from "../data/simulationSteps";
import { calculateTax, type CalcResult } from "../api/calculator";
import styles from "./SimulationPage.module.css";

// ─── helpers ────────────────────────────────────────────────────────────────

function t3(field: { nl: string; en: string; fa: string }, lang: Lang) {
  return field[lang] || field.nl;
}

function visibleSteps(answers: Answers): SimStep[] {
  return SIMULATION_STEPS.filter(s => !s.condition || s.condition(answers));
}

// ─── Field renderer ──────────────────────────────────────────────────────────

function FieldRow({
  field,
  lang,
  value,
  onChange,
  onAskClaude,
}: {
  field: SimField;
  lang: Lang;
  value: unknown;
  onChange: (id: string, val: unknown) => void;
  onAskClaude: (q: string) => void;
}) {
  const label = t3(field.label, lang);
  const help  = t3(field.help, lang);

  if (field.type === "info") {
    return (
      <div className={styles.infoBox}>
        <p className={styles.infoLabel}>{label}</p>
        <pre className={styles.infoBody}>{help}</pre>
        <button className={styles.claudeBtn} onClick={() => onAskClaude(t3(field.claudeQ, lang))}>
          💬 Ask Claude
        </button>
      </div>
    );
  }

  return (
    <div className={styles.fieldRow}>
      <div className={styles.fieldLeft}>
        <label className={styles.fieldLabel}>{label}</label>
        <p className={styles.fieldHelp}>{help}</p>
        {field.sourceUrl && (
          <a href={field.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
            Belastingdienst ↗
          </a>
        )}
      </div>

      <div className={styles.fieldRight}>
        {field.type === "boolean" && (
          <div className={styles.boolRow}>
            <button
              className={`${styles.boolBtn} ${value === true ? styles.boolActive : ""}`}
              onClick={() => onChange(field.id, true)}
            >Ja / Yes</button>
            <button
              className={`${styles.boolBtn} ${value === false ? styles.boolActive : ""}`}
              onClick={() => onChange(field.id, false)}
            >Nee / No</button>
          </div>
        )}

        {field.type === "number" && (
          <div className={styles.numRow}>
            {field.unit === "€" && <span className={styles.unit}>€</span>}
            <input
              type="number"
              className={styles.numInput}
              value={value === undefined ? "" : String(value)}
              min={0}
              onChange={e => onChange(field.id, e.target.value === "" ? undefined : Number(e.target.value))}
              placeholder="0"
            />
            {field.unit && field.unit !== "€" && (
              <span className={styles.unit}>{field.unit}</span>
            )}
          </div>
        )}

        {field.type === "text" && (
          <input
            type="text"
            className={styles.textInput}
            value={String(value ?? "")}
            onChange={e => onChange(field.id, e.target.value)}
            placeholder="—"
          />
        )}

        {field.type === "select" && field.options && (
          <select
            className={styles.selectInput}
            value={String(value ?? "")}
            onChange={e => onChange(field.id, e.target.value)}
          >
            <option value="">— kies / choose —</option>
            {field.options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {t3(opt.label, lang)}
              </option>
            ))}
          </select>
        )}

        <button className={styles.claudeBtn} onClick={() => onAskClaude(t3(field.claudeQ, lang))}>
          💬 Ask Claude
        </button>
      </div>
    </div>
  );
}

// ─── Overview step ───────────────────────────────────────────────────────────

function OverviewStep({
  answers,
  lang,
  onGoToChat,
}: {
  answers: Answers;
  lang: Lang;
  onGoToChat: (q: string) => void;
}) {
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const profile = answersToCalcProfile(answers);
    calculateTax(profile as Parameters<typeof calculateTax>[0])
      .then(setResult)
      .catch(() => setError(lang === "nl"
        ? "Berekening niet beschikbaar — controleer uw gegevens."
        : lang === "fa"
        ? "محاسبه در دسترس نیست — اطلاعات خود را بررسی کنید."
        : "Calculation unavailable — check your data."
      ))
      .finally(() => setLoading(false));
  }, [answers, lang]);

  const profile = answersToCalcProfile(answers);
  const voorlopige = (profile as Record<string, unknown>)._voorlopige_amount as number ?? 0;
  const hadVoorlopige = (profile as Record<string, unknown>)._had_voorlopige as boolean;

  return (
    <div className={styles.overview}>
      <h2 className={styles.overviewTitle}>
        {lang === "nl" ? "Uw geschatte aanslag 2026" :
         lang === "fa" ? "برآورد ارزیابی مالیاتی 2026 شما" :
         "Your estimated 2026 tax assessment"}
      </h2>

      {loading && <p className={styles.loading}>
        {lang === "nl" ? "Berekening…" : lang === "fa" ? "در حال محاسبه…" : "Calculating…"}
      </p>}

      {error && <p className={styles.calcError}>{error}</p>}

      {result && (
        <div className={styles.resultGrid}>
          <div className={styles.resultCard}>
            <span className={styles.resultLabel}>
              {lang === "nl" ? "Totale belasting" : lang === "fa" ? "کل مالیات" : "Total tax due"}
            </span>
            <span className={styles.resultValue}>
              €{result.result.total_tax_due.toLocaleString("nl-NL")}
            </span>
          </div>
          <div className={styles.resultCard}>
            <span className={styles.resultLabel}>
              {lang === "nl" ? "Effectief tarief" : lang === "fa" ? "نرخ مؤثر" : "Effective rate"}
            </span>
            <span className={styles.resultValue}>
              {(result.result.effective_rate * 100).toFixed(1)}%
            </span>
          </div>
          {result.result.monthly_reserve_needed > 0 && (
            <div className={styles.resultCard}>
              <span className={styles.resultLabel}>
                {lang === "nl" ? "Maandelijks reserveren" : lang === "fa" ? "ذخیره ماهانه" : "Monthly reserve"}
              </span>
              <span className={styles.resultValue}>
                €{result.result.monthly_reserve_needed.toLocaleString("nl-NL")}
              </span>
            </div>
          )}
          {hadVoorlopige && voorlopige > 0 && (
            <div className={styles.resultCard}>
              <span className={styles.resultLabel}>
                {lang === "nl" ? "Al betaald (voorlopige aanslag)" : lang === "fa" ? "قبلاً پرداخت شده (برگ موقت)" : "Already paid (provisional)"}
              </span>
              <span className={styles.resultValue}>−€{voorlopige.toLocaleString("nl-NL")}</span>
            </div>
          )}
          {hadVoorlopige && voorlopige > 0 && (
            <div className={`${styles.resultCard} ${styles.resultCardTotal}`}>
              <span className={styles.resultLabel}>
                {lang === "nl" ? "Nog te betalen / terug" : lang === "fa" ? "باقی‌مانده برای پرداخت / بازگشت" : "Still to pay / refund"}
              </span>
              <span className={styles.resultValue}>
                {result.result.total_tax_due - voorlopige >= 0
                  ? `€${(result.result.total_tax_due - voorlopige).toLocaleString("nl-NL")}`
                  : `−€${Math.abs(result.result.total_tax_due - voorlopige).toLocaleString("nl-NL")} (terug)`
                }
              </span>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className={styles.breakdown}>
          <h3 className={styles.breakdownTitle}>
            {lang === "nl" ? "Berekening stap voor stap" : lang === "fa" ? "محاسبه گام به گام" : "Step-by-step breakdown"}
          </h3>
          <table className={styles.bTable}>
            <tbody>
              {[
                ["Box 1 — belasting (raw)", result.calculation.box1_tax_raw],
                ["Algemene heffingskorting", -result.calculation.algemene_heffingskorting],
                ["Arbeidskorting", -result.calculation.arbeidskorting],
                ...(result.calculation.iack > 0 ? [["IACK", -result.calculation.iack]] : []),
                ["Box 1 na kortingen", result.calculation.income_tax_after_credits],
                ...(result.calculation.zvw_contribution > 0 ? [["ZVW-bijdrage (5.32%)", result.calculation.zvw_contribution]] : []),
                ...(result.calculation.box2_tax > 0 ? [["Box 2 belasting", result.calculation.box2_tax]] : []),
                ...(result.calculation.box3_tax > 0 ? [["Box 3 belasting", result.calculation.box3_tax]] : []),
              ].map(([label, val]) => (
                <tr key={String(label)} className={styles.bRow}>
                  <td className={styles.bLabel}>{label}</td>
                  <td className={styles.bVal}>
                    {Number(val) < 0
                      ? `−€${Math.abs(Number(val)).toLocaleString("nl-NL")}`
                      : `€${Number(val).toLocaleString("nl-NL")}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.overviewActions}>
        <button
          className={styles.chatBtn}
          onClick={() => onGoToChat(
            lang === "nl"
              ? `Ik heb de simulatie ingevuld en mijn geschatte belasting is €${result?.result.total_tax_due ?? "?"} voor 2026. Kunt u dit uitleggen en tips geven?`
              : lang === "fa"
              ? `شبیه‌سازی را تکمیل کردم و مالیات تخمینی من €${result?.result.total_tax_due ?? "?"} برای 2026 است. آیا می‌توانید توضیح دهید و نکاتی بدهید؟`
              : `I completed the simulation and my estimated tax is €${result?.result.total_tax_due ?? "?"} for 2026. Can you explain this and give tips?`
          )}
        >
          💬 {lang === "nl" ? "Bespreek met Claude" : lang === "fa" ? "بحث با Claude" : "Discuss with Claude"}
        </button>
        <p className={styles.disclaimer}>
          {lang === "nl"
            ? "Dit is een simulatie — geen officiële aangifte. Gebruik de echte aangifte op mijn.belastingdienst.nl."
            : lang === "fa"
            ? "این یک شبیه‌سازی است — اظهارنامه رسمی نیست. از اظهارنامه واقعی در mijn.belastingdienst.nl استفاده کنید."
            : "This is a simulation — not an official return. Use the real return at mijn.belastingdienst.nl."}
        </p>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function SimulationPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = (i18n.language.startsWith("fa") ? "fa" : i18n.language.startsWith("nl") ? "nl" : "en") as Lang;

  const [answers, setAnswers] = useState<Answers>({});
  const [stepIdx, setStepIdx] = useState(0);

  const steps = visibleSteps(answers);
  const currentStep = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;
  const isOverview = currentStep?.id === "overview";

  const setAnswer = useCallback((id: string, val: unknown) => {
    setAnswers(prev => ({ ...prev, [id]: val }));
  }, []);

  const handleAskClaude = useCallback((question: string) => {
    navigate("/chat", { state: { question } });
  }, [navigate]);

  // Recalculate visible steps when answers change; keep stepIdx valid
  useEffect(() => {
    const newSteps = visibleSteps(answers);
    if (stepIdx >= newSteps.length) setStepIdx(newSteps.length - 1);
  }, [answers, stepIdx]);

  const goNext = () => setStepIdx(i => Math.min(i + 1, steps.length - 1));
  const goPrev = () => setStepIdx(i => Math.max(i - 1, 0));

  const totalSteps = SIMULATION_STEPS.length;
  const progress = Math.round(((currentStep?.number ?? 1) / totalSteps) * 100);

  if (!currentStep) return null;

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarBadge}>
            {lang === "nl" ? "Simulatie Aangifte IB 2026" :
             lang === "fa" ? "شبیه‌سازی اظهارنامه IB 2026" :
             "IB Return Simulation 2026"}
          </span>
        </div>
        <nav className={styles.stepList}>
          {steps.map((step, idx) => (
            <button
              key={step.id}
              className={`${styles.stepItem} ${idx === stepIdx ? styles.stepActive : ""} ${idx < stepIdx ? styles.stepDone : ""}`}
              onClick={() => setStepIdx(idx)}
            >
              <span className={styles.stepIcon}>{idx < stepIdx ? "✓" : step.icon}</span>
              <span className={styles.stepLabel}>{t3(step.title, lang)}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <div className={styles.stepHeader}>
          <span className={styles.stepNum}>
            {lang === "nl" ? `Stap ${currentStep.number} van ${totalSteps}` :
             lang === "fa" ? `مرحله ${currentStep.number} از ${totalSteps}` :
             `Step ${currentStep.number} of ${totalSteps}`}
          </span>
          <h1 className={styles.stepTitle}>{currentStep.icon} {t3(currentStep.title, lang)}</h1>
          <p className={styles.stepSubtitle}>{t3(currentStep.subtitle, lang)}</p>
        </div>

        {isOverview ? (
          <OverviewStep answers={answers} lang={lang} onGoToChat={handleAskClaude} />
        ) : (
          <div className={styles.sections}>
            {currentStep.sections.map(section => {
              if (section.condition && !section.condition(answers)) return null;
              return (
                <div key={section.id} className={styles.section}>
                  <h2 className={styles.sectionTitle}>{t3(section.title, lang)}</h2>
                  {section.fields.map(field => {
                    if (field.condition && !field.condition(answers)) return null;
                    return (
                      <FieldRow
                        key={field.id}
                        field={field}
                        lang={lang}
                        value={answers[field.id]}
                        onChange={setAnswer}
                        onAskClaude={handleAskClaude}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Navigation */}
        {!isOverview && (
          <div className={styles.nav}>
            <button className={styles.navBack} onClick={goPrev} disabled={stepIdx === 0}>
              ← {lang === "nl" ? "Vorige" : lang === "fa" ? "قبلی" : "Back"}
            </button>
            <button className={styles.navNext} onClick={goNext}>
              {isLast
                ? (lang === "nl" ? "Overzicht" : lang === "fa" ? "خلاصه" : "Overview")
                : (lang === "nl" ? "Volgende" : lang === "fa" ? "بعدی" : "Next")}
              →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
