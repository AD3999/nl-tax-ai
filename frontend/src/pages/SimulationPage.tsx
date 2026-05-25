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

function t3(field: { nl: string; en: string; fa: string }, lang: Lang) {
  return field[lang] || field.nl;
}

function visibleSteps(answers: Answers): SimStep[] {
  return SIMULATION_STEPS.filter(s => !s.condition || s.condition(answers));
}

const inputCls = "px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text)] font-[inherit] text-sm outline-none transition-colors focus:border-[var(--accent)] w-full";

const boolBtn = (active: boolean) =>
  `px-5 py-2 rounded-lg border font-[inherit] text-sm cursor-pointer transition-all ${
    active
      ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)] font-semibold"
      : "border-[var(--border)] bg-[var(--bg)] text-[var(--text)] hover:border-[var(--accent)]"
  }`;

const claudeBtn = "px-3 py-1.5 rounded-lg border border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)] font-[inherit] text-[13px] cursor-pointer hover:bg-[var(--accent)] hover:text-white transition-all";

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
      <div className="p-4 bg-[var(--accent-bg)] border border-[var(--accent)] rounded-xl flex flex-col gap-2 my-1">
        <p className="text-[15px] font-semibold text-[var(--accent)] m-0">{label}</p>
        <pre className="text-[13px] text-[var(--text)] leading-relaxed m-0 font-[inherit] whitespace-pre-wrap">{help}</pre>
        <button className={claudeBtn} onClick={() => onAskClaude(t3(field.claudeQ, lang))}>
          💬 Ask Claude
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-6 py-4 border-b border-[var(--border)] last:border-0">
      <div className="flex-1 min-w-0">
        <label className="text-[15px] font-semibold text-[var(--text-h)] block mb-1">{label}</label>
        <p className="text-[13px] text-[var(--text)] opacity-70 leading-relaxed m-0">{help}</p>
        {field.sourceUrl && (
          <a href={field.sourceUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-[var(--text)] opacity-40 no-underline hover:opacity-70 transition-opacity mt-1.5 inline-block">
            Belastingdienst ↗
          </a>
        )}
      </div>

      <div className="flex flex-col gap-2 items-start shrink-0 w-48">
        {field.type === "boolean" && (
          <div className="flex gap-2">
            <button className={boolBtn(value === true)} onClick={() => onChange(field.id, true)}>Ja / Yes</button>
            <button className={boolBtn(value === false)} onClick={() => onChange(field.id, false)}>Nee / No</button>
          </div>
        )}

        {field.type === "number" && (
          <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--bg)] focus-within:border-[var(--accent)] transition-colors">
            {field.unit === "€" && (
              <span className="px-2.5 py-2 bg-[var(--border)] text-[13px] text-[var(--text)] opacity-70">€</span>
            )}
            <input
              type="number"
              className="border-none bg-transparent px-3 py-2 font-[inherit] text-sm text-[var(--text)] w-28 outline-none"
              value={value === undefined ? "" : String(value)}
              min={0}
              onChange={e => onChange(field.id, e.target.value === "" ? undefined : Number(e.target.value))}
              placeholder="0"
            />
            {field.unit && field.unit !== "€" && (
              <span className="px-2.5 py-2 text-[13px] text-[var(--text)] opacity-70">{field.unit}</span>
            )}
          </div>
        )}

        {field.type === "text" && (
          <input type="text" className={inputCls} value={String(value ?? "")}
            onChange={e => onChange(field.id, e.target.value)} placeholder="—" />
        )}

        {field.type === "select" && field.options && (
          <select className={inputCls} value={String(value ?? "")}
            onChange={e => onChange(field.id, e.target.value)}>
            <option value="">— kies / choose —</option>
            {field.options.map(opt => (
              <option key={opt.value} value={opt.value}>{t3(opt.label, lang)}</option>
            ))}
          </select>
        )}

        <button className={claudeBtn} onClick={() => onAskClaude(t3(field.claudeQ, lang))}>
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
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold text-[var(--text-h)] m-0">
        {lang === "nl" ? "Uw geschatte aanslag 2026" :
         lang === "fa" ? "برآورد ارزیابی مالیاتی 2026 شما" :
         "Your estimated 2026 tax assessment"}
      </h2>

      {loading && (
        <p className="text-[var(--text)] opacity-60">
          {lang === "nl" ? "Berekening…" : lang === "fa" ? "در حال محاسبه…" : "Calculating…"}
        </p>
      )}

      {error && <p className="text-sm text-red-500 m-0">{error}</p>}

      {result && (
        <>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <div className="p-4 px-5 border border-[var(--border)] rounded-xl bg-[var(--bg)] flex flex-col gap-1.5">
              <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--text)]">
                {lang === "nl" ? "Totale belasting" : lang === "fa" ? "کل مالیات" : "Total tax due"}
              </span>
              <span className="text-3xl font-bold text-[var(--text-h)] -tracking-wide">
                €{result.result.total_tax_due.toLocaleString("nl-NL")}
              </span>
            </div>
            <div className="p-4 px-5 border border-[var(--border)] rounded-xl bg-[var(--bg)] flex flex-col gap-1.5">
              <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--text)]">
                {lang === "nl" ? "Effectief tarief" : lang === "fa" ? "نرخ مؤثر" : "Effective rate"}
              </span>
              <span className="text-3xl font-bold text-[var(--text-h)] -tracking-wide">
                {(result.result.effective_rate * 100).toFixed(1)}%
              </span>
            </div>
            {result.result.monthly_reserve_needed > 0 && (
              <div className="p-4 px-5 border border-[var(--border)] rounded-xl bg-[var(--bg)] flex flex-col gap-1.5">
                <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--text)]">
                  {lang === "nl" ? "Maandelijks reserveren" : lang === "fa" ? "ذخیره ماهانه" : "Monthly reserve"}
                </span>
                <span className="text-3xl font-bold text-[var(--text-h)] -tracking-wide">
                  €{result.result.monthly_reserve_needed.toLocaleString("nl-NL")}
                </span>
              </div>
            )}
            {hadVoorlopige && voorlopige > 0 && (
              <div className="p-4 px-5 border border-[var(--border)] rounded-xl bg-[var(--bg)] flex flex-col gap-1.5">
                <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--text)]">
                  {lang === "nl" ? "Al betaald (voorlopige)" : lang === "fa" ? "قبلاً پرداخت شده" : "Already paid"}
                </span>
                <span className="text-3xl font-bold text-[var(--text-h)] -tracking-wide">
                  −€{voorlopige.toLocaleString("nl-NL")}
                </span>
              </div>
            )}
            {hadVoorlopige && voorlopige > 0 && (
              <div className="p-4 px-5 border border-[var(--accent)] rounded-xl bg-[var(--accent-bg)] flex flex-col gap-1.5">
                <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--accent)]">
                  {lang === "nl" ? "Nog te betalen / terug" : lang === "fa" ? "باقی‌مانده" : "Still to pay / refund"}
                </span>
                <span className="text-3xl font-bold text-[var(--accent)] -tracking-wide">
                  {result.result.total_tax_due - voorlopige >= 0
                    ? `€${(result.result.total_tax_due - voorlopige).toLocaleString("nl-NL")}`
                    : `−€${Math.abs(result.result.total_tax_due - voorlopige).toLocaleString("nl-NL")} (terug)`}
                </span>
              </div>
            )}
          </div>

          <div className="p-5 px-6 border border-[var(--border)] rounded-xl bg-[var(--bg)]">
            <div className="text-[13px] font-bold tracking-widest uppercase text-[var(--text)] mb-4">
              {lang === "nl" ? "Berekening stap voor stap" : lang === "fa" ? "محاسبه گام به گام" : "Step-by-step breakdown"}
            </div>
            <table className="w-full border-collapse text-sm">
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
                  <tr key={String(label)} className="border-b border-[var(--border)]">
                    <td className="py-1.5 text-[var(--text)]">{label}</td>
                    <td className="py-1.5 text-right font-mono font-semibold text-[var(--text-h)] whitespace-nowrap">
                      {Number(val) < 0
                        ? `−€${Math.abs(Number(val)).toLocaleString("nl-NL")}`
                        : `€${Number(val).toLocaleString("nl-NL")}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex flex-col gap-3">
        <button
          className="self-start px-6 py-2.5 rounded-lg border-none bg-[var(--accent)] text-white font-[inherit] text-sm font-medium cursor-pointer hover:opacity-85 transition-opacity"
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
        <p className="text-xs text-[var(--text)] opacity-50 leading-relaxed m-0">
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
    <div className="flex h-[calc(100vh-52px)]">
      {/* Sidebar */}
      <aside className="w-60 border-r border-[var(--border)] flex flex-col bg-[var(--bg)] overflow-y-auto shrink-0">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--accent)]">
            {lang === "nl" ? "Simulatie Aangifte IB 2026" :
             lang === "fa" ? "شبیه‌سازی اظهارنامه IB 2026" :
             "IB Return Simulation 2026"}
          </span>
        </div>
        <nav className="flex flex-col py-2">
          {steps.map((step, idx) => (
            <button
              key={step.id}
              className={`flex items-center gap-2.5 px-5 py-3 border-none bg-transparent cursor-pointer text-left w-full transition-colors font-[inherit] ${
                idx === stepIdx
                  ? "bg-[var(--accent-bg)] text-[var(--accent)]"
                  : idx < stepIdx
                  ? "text-[var(--text)] opacity-60 hover:bg-[var(--accent-bg)] hover:opacity-100"
                  : "text-[var(--text)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)]"
              }`}
              onClick={() => setStepIdx(idx)}
            >
              <span className="text-sm w-5 text-center shrink-0">
                {idx < stepIdx ? "✓" : step.icon}
              </span>
              <span className={`text-[13px] ${idx === stepIdx ? "font-semibold" : ""}`}>
                {t3(step.title, lang)}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Progress bar */}
        <div className="h-1 bg-[var(--border)]">
          <div className="h-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="px-10 pt-10 pb-6">
          <span className="text-xs font-bold tracking-widest uppercase text-[var(--text)] opacity-50">
            {lang === "nl" ? `Stap ${currentStep.number} van ${totalSteps}` :
             lang === "fa" ? `مرحله ${currentStep.number} از ${totalSteps}` :
             `Step ${currentStep.number} of ${totalSteps}`}
          </span>
          <h1 className="text-3xl font-semibold text-[var(--text-h)] m-0 mt-1">
            {currentStep.icon} {t3(currentStep.title, lang)}
          </h1>
          <p className="text-[15px] text-[var(--text)] opacity-70 mt-2 leading-relaxed m-0">
            {t3(currentStep.subtitle, lang)}
          </p>
        </div>

        <div className="flex-1 px-10 pb-6">
          {isOverview ? (
            <OverviewStep answers={answers} lang={lang} onGoToChat={handleAskClaude} />
          ) : (
            <div className="flex flex-col gap-8">
              {currentStep.sections.map(section => {
                if (section.condition && !section.condition(answers)) return null;
                return (
                  <div key={section.id}>
                    <h2 className="text-[13px] font-bold tracking-widest uppercase text-[var(--text)] opacity-50 mb-4">
                      {t3(section.title, lang)}
                    </h2>
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
        </div>

        {/* Navigation */}
        {!isOverview && (
          <div className="flex justify-between items-center px-10 py-6 border-t border-[var(--border)]">
            <button
              className="px-5 py-2.5 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text)] font-[inherit] text-sm cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={goPrev} disabled={stepIdx === 0}
            >
              ← {lang === "nl" ? "Vorige" : lang === "fa" ? "قبلی" : "Back"}
            </button>
            <button
              className="px-6 py-2.5 rounded-lg border-none bg-[var(--accent)] text-white font-[inherit] text-sm font-medium cursor-pointer hover:opacity-85 transition-opacity"
              onClick={goNext}
            >
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
