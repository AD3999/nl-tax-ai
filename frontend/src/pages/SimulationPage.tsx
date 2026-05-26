import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMobile } from "../hooks/useMobile";
import {
  SIMULATION_STEPS,
  answersToCalcProfile,
  type Answers,
  type SimField,
  type SimStep,
  type Lang,
} from "../data/simulationSteps";
import { calculateTax, type CalcResult } from "../api/calculator";
import { Icon } from "../components/Icon";

function t3(field: { nl: string; en: string; fa: string }, lang: Lang) {
  return field[lang] || field.nl;
}

function visibleSteps(answers: Answers): SimStep[] {
  return SIMULATION_STEPS.filter(s => !s.condition || s.condition(answers));
}

// ─── Field renderer ──────────────────────────────────────────────────────────

function FieldRow({
  field, lang, value, onChange, onAskClaude,
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
      <div style={{
        padding: 16, background: "var(--accent-soft)", border: "1px solid var(--accent-line)",
        borderRadius: "var(--r-sm)", display: "flex", gap: 12, alignItems: "flex-start", gridColumn: "1 / -1",
      }}>
        <span style={{ width: 26, height: 26, borderRadius: 999, background: "var(--sage-600)", color: "white", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2 }}>
          <Icon.info style={{ width: 14, height: 14 }} />
        </span>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--sage-800)", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 13, color: "var(--sage-800)", lineHeight: 1.55 }}>{help}</div>
          <button
            type="button"
            className="btn btn-soft btn-sm"
            onClick={() => onAskClaude(t3(field.claudeQ, lang))}
            style={{ marginTop: 10 }}
          >
            <Icon.spark style={{ width: 11, height: 11 }} /> Ask TaxWijs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span className="tw-label">{label}</span>
        <button
          type="button"
          onClick={() => onAskClaude(t3(field.claudeQ, lang))}
          style={{ background: "transparent", border: "none", color: "var(--sage-700)", fontSize: 11, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, padding: 0 }}
        >
          <Icon.spark style={{ width: 10, height: 10 }} /> Ask
        </button>
      </div>

      {field.type === "boolean" && (
        <div style={{ display: "flex", gap: 6 }}>
          {([true, false] as const).map(opt => {
            const on = value === opt;
            return (
              <button key={String(opt)} type="button" onClick={() => onChange(field.id, opt)} style={{
                padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: "pointer",
                border: `1px solid ${on ? "var(--sage-600)" : "var(--hairline-2)"}`,
                background: on ? "var(--accent-soft)" : "var(--paper)",
                color: on ? "var(--sage-700)" : "var(--ink-3)",
              }}>
                {lang === "nl" ? (opt ? "Ja" : "Nee") : lang === "fa" ? (opt ? "بله" : "خیر") : (opt ? "Yes" : "No")}
              </button>
            );
          })}
        </div>
      )}

      {field.type === "number" && (
        <div style={{ position: "relative" }}>
          {field.unit && (
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", fontSize: 13 }}>
              {field.unit}
            </span>
          )}
          <input
            className="tw-input"
            type="number"
            min={0}
            placeholder="0"
            value={value === undefined ? "" : String(value)}
            onChange={e => onChange(field.id, e.target.value === "" ? undefined : Number(e.target.value))}
            style={{ paddingLeft: field.unit ? 28 : 12 }}
            dir="ltr"
          />
        </div>
      )}

      {field.type === "text" && (
        <input
          className="tw-input"
          type="text"
          value={String(value ?? "")}
          onChange={e => onChange(field.id, e.target.value)}
          placeholder="—"
        />
      )}

      {field.type === "select" && field.options && (
        <select
          className="tw-input"
          value={String(value ?? "")}
          onChange={e => onChange(field.id, e.target.value)}
        >
          <option value="">
            {lang === "nl" ? "— kies —" : lang === "fa" ? "— انتخاب کنید —" : "— choose —"}
          </option>
          {field.options.map(opt => (
            <option key={opt.value} value={opt.value}>{t3(opt.label, lang)}</option>
          ))}
        </select>
      )}

      {field.sourceUrl && (
        <a href={field.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 4, fontSize: 11, color: "var(--ink-4)", textDecoration: "none" }}>
          Belastingdienst ↗
        </a>
      )}
    </div>
  );
}

// ─── Overview step (step 11) ─────────────────────────────────────────────────

function OverviewStep({ answers, lang, onGoToChat }: {
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
      .catch(() => setError(
        lang === "nl" ? "Berekening niet beschikbaar — controleer uw gegevens."
        : lang === "fa" ? "محاسبه در دسترس نیست — اطلاعات خود را بررسی کنید."
        : "Calculation unavailable — check your data."
      ))
      .finally(() => setLoading(false));
  }, [answers, lang]);

  const profile = answersToCalcProfile(answers);
  const voorlopige = (profile as Record<string, unknown>)._voorlopige_amount as number ?? 0;
  const hadVoorlopige = (profile as Record<string, unknown>)._had_voorlopige as boolean;
  const netToPay = result ? result.result.total_tax_due - (hadVoorlopige ? voorlopige : 0) : 0;

  return (
    <div style={{ textAlign: "center" }}>
      <div className="eyebrow eyebrow-accent">Step 11 of 11 · The reveal</div>
      <h1 style={{ marginTop: 8, fontFamily: "var(--serif)", fontSize: 52, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1.05 }}>
        Your 2026 assessment<br /><em style={{ color: "var(--sage-700)" }}>is ready.</em>
      </h1>

      {loading && (
        <div style={{ marginTop: 40, fontSize: 14, color: "var(--ink-3)" }}>
          {lang === "nl" ? "Berekening…" : lang === "fa" ? "در حال محاسبه…" : "Calculating…"}
        </div>
      )}

      {error && (
        <div style={{ marginTop: 24, padding: 16, background: "var(--danger-soft)", borderRadius: "var(--r)", fontSize: 14, color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {result && (
        <div className="card" style={{ marginTop: 36, padding: 0, overflow: "hidden", textAlign: "left" }}>
          {/* Dark header */}
          <div style={{ padding: "32px 32px 28px", background: "var(--ink)", color: "var(--paper)", display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", gap: 24 }}>
            <div>
              <div className="eyebrow" style={{ color: "var(--sage-300)" }}>
                {hadVoorlopige && voorlopige > 0 ? "Net to pay / refund" : "Total tax due"}
              </div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 72, color: "white", letterSpacing: "-0.03em", lineHeight: 1, marginTop: 4 }}>
                {netToPay >= 0
                  ? `€ ${netToPay.toLocaleString("nl-NL")}`
                  : `−€ ${Math.abs(netToPay).toLocaleString("nl-NL")}`}
              </div>
              {hadVoorlopige && voorlopige > 0 && (
                <div style={{ marginTop: 8, fontSize: 13, color: "oklch(0.82 0.01 95)" }}>
                  after €{voorlopige.toLocaleString("nl-NL")} voorlopige aanslag already paid
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                [lang === "nl" ? "Totale belasting" : lang === "fa" ? "کل مالیات" : "Total tax due",
                  `€ ${result.result.total_tax_due.toLocaleString("nl-NL")}`],
                [lang === "nl" ? "Effectief tarief" : lang === "fa" ? "نرخ مؤثر" : "Effective rate",
                  `${(result.result.effective_rate * 100).toFixed(1)}%`],
                ...(result.result.monthly_reserve_needed > 0
                  ? [[lang === "nl" ? "Maandelijks" : lang === "fa" ? "ماهانه" : "Per month",
                      `€ ${result.result.monthly_reserve_needed.toLocaleString("nl-NL")}`]]
                  : []),
              ].map(([k, v]) => (
                <div key={k} style={{ padding: 12, background: "rgba(255,255,255,0.06)", borderRadius: "var(--r)" }}>
                  <div className="eyebrow" style={{ color: "var(--sage-300)" }}>{k}</div>
                  <div className="font-mono" style={{ marginTop: 4, fontSize: 17, color: "white" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ padding: 28 }}>
            <div className="eyebrow eyebrow-accent">How we got here</div>
            <div style={{ marginTop: 12 }}>
              {[
                ["Box 1 — belasting (raw)", result.calculation.box1_tax_raw],
                ["Algemene heffingskorting", -result.calculation.algemene_heffingskorting],
                ["Arbeidskorting", -result.calculation.arbeidskorting],
                ...(result.calculation.iack > 0 ? [["IACK", -result.calculation.iack]] : []),
                ["Box 1 na kortingen", result.calculation.income_tax_after_credits],
                ...(result.calculation.zvw_contribution > 0 ? [["ZVW-bijdrage (5.32%)", result.calculation.zvw_contribution]] : []),
                ...(result.calculation.box2_tax > 0 ? [["Box 2 belasting", result.calculation.box2_tax]] : []),
                ...(result.calculation.box3_tax > 0 ? [["Box 3 belasting", result.calculation.box3_tax]] : []),
              ].map(([label, val], i, arr) => (
                <div key={String(label)} style={{ padding: "9px 0", display: "flex", justifyContent: "space-between", borderBottom: i < arr.length - 1 ? "1px solid var(--hairline)" : "none" }}>
                  <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{label}</span>
                  <span className="num" style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
                    {Number(val) < 0
                      ? `−€ ${Math.abs(Number(val)).toLocaleString("nl-NL")}`
                      : `€ ${Number(val).toLocaleString("nl-NL")}`}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
              <button
                className="btn btn-soft"
                type="button"
                onClick={() => onGoToChat(
                  lang === "nl"
                    ? `Ik heb de simulatie ingevuld en mijn geschatte belasting is €${result.result.total_tax_due} voor 2026. Kunt u dit uitleggen en tips geven?`
                    : lang === "fa"
                    ? `شبیه‌سازی را تکمیل کردم و مالیات تخمینی من €${result.result.total_tax_due} برای 2026 است. آیا می‌توانید توضیح دهید و نکاتی بدهید؟`
                    : `I completed the simulation and my estimated tax is €${result.result.total_tax_due} for 2026. Can you explain this and give tips?`
                )}
                style={{ flex: 1 }}
              >
                <Icon.spark style={{ width: 12, height: 12 }} />
                {lang === "nl" ? "Bespreek met TaxWijs" : lang === "fa" ? "بحث با TaxWijs" : "Discuss with TaxWijs"}
              </button>
              <button className="btn btn-ghost" type="button" style={{ flex: 1 }}>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <p style={{ marginTop: 24, fontSize: 11.5, color: "var(--ink-4)" }}>
        {lang === "nl"
          ? "Dit is een simulatie — geen officiële aangifte. Gebruik de echte aangifte op mijn.belastingdienst.nl."
          : lang === "fa"
          ? "این یک شبیه‌سازی است — اظهارنامه رسمی نیست. از mijn.belastingdienst.nl استفاده کنید."
          : "This is a simulation — not an official return. Use the real return at mijn.belastingdienst.nl."}
      </p>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function SimulationPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMobile();
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
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", background: "var(--paper)" }}>
      {/* Progress bar */}
      <div style={{ height: 4, background: "var(--paper-3)", flexShrink: 0 }}>
        <div style={{ width: `${progress}%`, height: "100%", background: "var(--sage-600)", transition: "width .25s" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "280px 1fr", flex: 1, minHeight: 0 }}>
        {/* Sidebar — hidden on mobile (progress bar replaces it) */}
        {!isMobile && <aside style={{ borderRight: "1px solid var(--hairline)", padding: "26px 18px", overflowY: "auto", background: "var(--paper)", display: "flex", flexDirection: "column" }}>
          <div className="eyebrow eyebrow-accent">Aangifte 2026</div>
          <div style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: 22, color: "var(--ink)" }}>Simulation</div>

          <nav style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
            {steps.map((s, idx) => {
              const done   = idx < stepIdx;
              const active = idx === stepIdx;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStepIdx(idx)}
                  style={{
                    textAlign: "left", padding: "10px 12px", borderRadius: "var(--r-sm)", border: "none",
                    background: active ? "var(--accent-soft)" : "transparent", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <span style={{
                    width: 24, height: 24, borderRadius: 6, display: "grid", placeItems: "center", fontSize: 10,
                    fontFamily: "var(--mono)", fontWeight: 600, flexShrink: 0,
                    background: done ? "var(--sage-600)" : active ? "var(--ink)" : "var(--paper-3)",
                    color: done || active ? "white" : "var(--ink-3)",
                  }}>
                    {done ? <Icon.check style={{ width: 11, height: 11 }} /> : String(s.number ?? idx + 1).padStart(2, "0")}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: active || done ? "var(--ink)" : "var(--ink-3)", fontWeight: active ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t3(s.title, lang)}
                    </div>
                    {s.condition && <div style={{ fontSize: 10.5, color: "var(--ink-4)" }}>conditional</div>}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Running estimate */}
          <div style={{ marginTop: 18, padding: 14, border: "1px dashed var(--hairline-2)", borderRadius: "var(--r)" }}>
            <div className="eyebrow">Running estimate</div>
            <div className="font-mono" style={{ marginTop: 4, fontSize: 20, color: "var(--ink)" }}>—</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>complete step 11 to see</div>
          </div>
        </aside>}

        {/* Main content */}
        <main style={{ overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "32px 48px 24px", maxWidth: isOverview ? 960 : 720, margin: "0 auto", width: "100%" }}>
            {!isOverview && (
              <>
                <div className="eyebrow eyebrow-accent">Step {currentStep.number ?? stepIdx + 1} of {totalSteps}</div>
                <h1 style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: 38, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                  {t3(currentStep.title, lang)}
                </h1>
                <p style={{ marginTop: 6, color: "var(--ink-3)", fontSize: 14.5 }}>
                  {t3(currentStep.subtitle, lang)}
                </p>
              </>
            )}

            {/* Step content */}
            <div style={{ marginTop: isOverview ? 0 : 28 }}>
              {isOverview ? (
                <OverviewStep answers={answers} lang={lang} onGoToChat={handleAskClaude} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {currentStep.sections.map(section => {
                    if (section.condition && !section.condition(answers)) return null;
                    return (
                      <div key={section.id}>
                        <div className="eyebrow" style={{ marginBottom: 12 }}>{t3(section.title, lang)}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Navigation */}
            {!isOverview && (
              <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 48 }}>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={goPrev}
                  disabled={stepIdx === 0}
                >
                  ← {lang === "nl" ? "Vorige" : lang === "fa" ? "قبلی" : "Previous"}
                </button>
                <div style={{ fontSize: 12.5, color: "var(--ink-4)" }}>
                  {stepIdx} of {totalSteps} completed
                </div>
                <button className="btn btn-accent" type="button" onClick={goNext}>
                  {isLast
                    ? (lang === "nl" ? "Overzicht" : lang === "fa" ? "خلاصه" : "Overview")
                    : (lang === "nl" ? "Volgende" : lang === "fa" ? "بعدی" : "Continue")}
                  {" "}<Icon.arrow />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
