import { useState } from "react";
import {
  type SimStep,
  type SimField,
  type Answers,
  type Lang,
} from "../data/simulationSteps";
import { Icon } from "./Icon";

function t3(field: { nl: string; en: string; fa: string }, lang: Lang): string {
  return field[lang] ?? field.nl;
}

// ── Inline field renderer ────────────────────────────────────────────────────

function FieldRow({
  field, lang, value, onChange, onAskClaude, error,
}: {
  field: SimField;
  lang: Lang;
  value: unknown;
  onChange: (id: string, val: unknown) => void;
  onAskClaude: (q: string) => void;
  error?: string;
}) {
  const label = t3(field.label, lang);
  const help  = t3(field.help, lang);
  const askLabel = lang === "nl" ? "Vraag" : lang === "fa" ? "بپرس" : "Ask";

  if (field.type === "info") {
    return (
      <div style={{
        padding: 13, background: "var(--accent-soft)", border: "1px solid var(--accent-line)",
        borderRadius: "var(--r-sm)", display: "flex", gap: 10, alignItems: "flex-start",
        gridColumn: "1 / -1",
      }}>
        <span style={{
          width: 20, height: 20, borderRadius: 999, background: "var(--sage-600)", color: "white",
          display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2,
        }}>
          <Icon.info style={{ width: 10, height: 10 }} />
        </span>
        <div>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--sage-800)", marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--sage-800)", lineHeight: 1.5 }}>{help}</div>
          <button
            type="button"
            className="btn btn-soft btn-sm"
            onClick={() => onAskClaude(t3(field.claudeQ, lang))}
            style={{ marginTop: 8, fontSize: "var(--text-xs)" }}
          >
            <Icon.spark style={{ width: 9, height: 9 }} />{" "}
            {lang === "nl" ? "Vraag TaxWijs" : lang === "fa" ? "از TaxWijs بپرسید" : "Ask TaxWijs"}
          </button>
        </div>
      </div>
    );
  }

  const hasError = !!error;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span className="tw-label" style={{ fontSize: "var(--text-xs)" }}>
          {label}
          {field.required && (
            <span style={{ color: "var(--danger)", marginInlineStart: 3 }} title="Required">*</span>
          )}
        </span>
        <button
          type="button"
          onClick={() => onAskClaude(t3(field.claudeQ, lang))}
          style={{
            background: "transparent", border: "none", color: "var(--sage-700)",
            fontSize: "var(--text-xs)", cursor: "pointer", display: "inline-flex", alignItems: "center",
            gap: 3, padding: 0,
          }}
        >
          <Icon.spark style={{ width: 9, height: 9 }} /> {askLabel}
        </button>
      </div>

      {field.type === "boolean" && (
        <div style={{ display: "flex", gap: 6 }}>
          {([true, false] as const).map(opt => {
            const on = value === opt;
            return (
              <button
                key={String(opt)}
                type="button"
                onClick={() => onChange(field.id, opt)}
                style={{
                  padding: "7px 16px", borderRadius: 999, fontSize: "var(--text-sm)", fontWeight: 500, cursor: "pointer",
                  border: `1px solid ${on ? "var(--sage-600)" : "var(--hairline-2)"}`,
                  background: on ? "var(--accent-soft)" : "var(--paper)",
                  color: on ? "var(--sage-700)" : "var(--ink-3)",
                  transition: "all .12s",
                }}
              >
                {lang === "nl" ? (opt ? "Ja" : "Nee") : lang === "fa" ? (opt ? "بله" : "خیر") : (opt ? "Yes" : "No")}
              </button>
            );
          })}
        </div>
      )}

      {field.type === "number" && (
        <div style={{ position: "relative" }}>
          {field.unit && (
            <span style={{
              position: "absolute", insetInlineStart: 10, top: "50%", transform: "translateY(-50%)",
              color: "var(--ink-4)", fontSize: "var(--text-sm)", pointerEvents: "none",
            }}>
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
            style={{
              paddingInlineStart: field.unit ? 28 : 12, fontSize: 16,
              borderColor: hasError ? "var(--danger)" : undefined,
            }}
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
          style={{ fontSize: 16, borderColor: hasError ? "var(--danger)" : undefined }}
        />
      )}

      {field.type === "select" && field.options && (
        <select
          className="tw-input"
          value={String(value ?? "")}
          onChange={e => onChange(field.id, e.target.value)}
          style={{ fontSize: 16, borderColor: hasError ? "var(--danger)" : undefined }}
        >
          <option value="">
            {lang === "nl" ? "— kies —" : lang === "fa" ? "— انتخاب کنید —" : "— choose —"}
          </option>
          {field.options.map(opt => (
            <option key={opt.value} value={opt.value}>{t3(opt.label, lang)}</option>
          ))}
        </select>
      )}

      {hasError ? (
        <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)", color: "var(--danger)", fontWeight: 500, lineHeight: 1.4 }}>
          ⚠ {error}
        </p>
      ) : (
        field.type !== "boolean" && help && (
          <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)", color: "var(--ink-4)", lineHeight: 1.4 }}>{help}</p>
        )
      )}

      {field.sourceUrl && (
        <a
          href={field.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-block", marginTop: 3, fontSize: "var(--text-xs)", color: "var(--ink-4)", textDecoration: "none" }}
        >
          Belastingdienst ↗
        </a>
      )}
    </div>
  );
}

// ── SimStepCard ──────────────────────────────────────────────────────────────

export interface SimStepCardProps {
  step: SimStep;
  stepIndex: number;
  totalSteps: number;
  answers: Answers;      // global answers accumulated across all steps
  lang: Lang;
  isMobile: boolean;
  done: boolean;
  onSubmit: (stepIndex: number, stepAnswers: Answers) => void;
  onAskClaude: (q: string) => void;
}

export function SimStepCard({
  step, stepIndex, totalSteps, answers, lang, isMobile, done, onSubmit, onAskClaude,
}: SimStepCardProps) {
  // Local state for fields in this step only — initialised from global answers
  const [localAnswers, setLocalAnswers] = useState<Answers>(() => {
    const init: Answers = {};
    step.sections.flatMap(s => s.fields).forEach(f => {
      if (answers[f.id] !== undefined) init[f.id] = answers[f.id];
    });
    return init;
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Combined view used for conditional field/section visibility
  const combined: Answers = { ...answers, ...localAnswers };

  function setField(id: string, val: unknown) {
    setLocalAnswers(prev => ({ ...prev, [id]: val }));
    // Clear field-level error when user edits the field
    if (validationErrors[id]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  function handleContinue() {
    const errors: Record<string, string> = {};

    // Check required visible fields
    for (const section of step.sections) {
      if (section.condition && !section.condition(combined)) continue;
      for (const field of section.fields) {
        if (field.type === "info") continue;
        if (field.condition && !field.condition(combined)) continue;
        if (!field.required) continue;
        const val = localAnswers[field.id] ?? answers[field.id];
        if (val === undefined || val === null || val === "" || (typeof val === "number" && val <= 0)) {
          errors[field.id] = lang === "nl"
            ? "Voer een bedrag in"
            : lang === "fa"
            ? "مبلغ را وارد کنید"
            : "Please enter an amount";
        }
      }
    }

    // income_sources step: at least one income type must be explicitly answered
    if (step.id === "income_sources") {
      const typeBooleans = ["is_employee", "is_zzp", "has_benefits", "has_foreign_income", "has_substantial_interest"];
      const anyAnswered = typeBooleans.some(id => combined[id] !== undefined);
      if (!anyAnswered) {
        errors["_step"] = lang === "nl"
          ? "Selecteer minstens één inkomstenbron om door te gaan"
          : lang === "fa"
          ? "حداقل یک منبع درآمد را برای ادامه انتخاب کنید"
          : "Select at least one income source to continue";
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    onSubmit(stepIndex, localAnswers);
  }

  // ── Done (collapsed) state ──
  if (done) {
    const allFields = step.sections.flatMap(s => s.fields).filter(f => f.type !== "info");
    const answered = allFields.filter(f => answers[f.id] !== undefined && answers[f.id] !== "");
    const parts = answered.slice(0, 4).map(f => {
      const v = answers[f.id];
      if (typeof v === "boolean") {
        return v
          ? (lang === "nl" ? "Ja" : lang === "fa" ? "بله" : "Yes")
          : (lang === "nl" ? "Nee" : lang === "fa" ? "خیر" : "No");
      }
      if (typeof v === "number") return f.unit ? `${f.unit}${(v as number).toLocaleString("nl-NL")}` : String(v);
      return String(v);
    });

    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
        borderRadius: "var(--r)", background: "var(--paper-2)", border: "1px solid var(--hairline)",
        fontSize: "var(--text-sm)",
      }}>
        <span style={{
          width: 18, height: 18, borderRadius: 5, background: "var(--sage-600)", color: "white",
          display: "grid", placeItems: "center", flexShrink: 0,
        }}>
          <Icon.check style={{ width: 9, height: 9 }} />
        </span>
        <span style={{ fontWeight: 500, color: "var(--ink)" }}>{t3(step.title, lang)}</span>
        {parts.length > 0 && (
          <span style={{ color: "var(--ink-4)", fontSize: "var(--text-xs)" }}>— {parts.join(" · ")}</span>
        )}
      </div>
    );
  }

  // ── Active (interactive) state ──
  const isLastStep = stepIndex + 1 >= totalSteps;
  const continueLabel = isLastStep
    ? (lang === "nl" ? "Toon resultaat" : lang === "fa" ? "نمایش نتیجه" : "Show result")
    : (lang === "nl" ? "Volgende →" : lang === "fa" ? "← بعدی" : "Continue →");

  const hasStepError = !!validationErrors["_step"];

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "11px 18px", borderBottom: "1px solid var(--hairline)",
        background: "var(--accent-soft)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
      }}>
        <span className="eyebrow eyebrow-accent" style={{ fontSize: "var(--text-xs)" }}>
          {lang === "nl" ? `Stap ${stepIndex + 1} van ${totalSteps}`
            : lang === "fa" ? `مرحله ${stepIndex + 1} از ${totalSteps}`
            : `Step ${stepIndex + 1} of ${totalSteps}`}
        </span>
        <span style={{
          width: 3, height: 3, borderRadius: "50%", background: "var(--ink-4)", display: "inline-block",
        }} />
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--ink)" }}>
          {t3(step.title, lang)}
        </span>
      </div>

      {/* Fields */}
      <div style={{ padding: isMobile ? 14 : 20, display: "flex", flexDirection: "column", gap: 18 }}>
        {step.sections.map(section => {
          if (section.condition && !section.condition(combined)) return null;
          return (
            <div key={section.id}>
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 14,
              }}>
                {section.fields.map(field => {
                  if (field.condition && !field.condition(combined)) return null;
                  return (
                    <FieldRow
                      key={field.id}
                      field={field}
                      lang={lang}
                      value={localAnswers[field.id] ?? answers[field.id]}
                      onChange={setField}
                      onAskClaude={onAskClaude}
                      error={validationErrors[field.id]}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: "10px 18px", borderTop: "1px solid var(--hairline)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "var(--paper-2)",
      }}>
        <span style={{ fontSize: "var(--text-xs)", color: hasStepError ? "var(--danger)" : "var(--ink-4)", fontWeight: hasStepError ? 500 : 400 }}>
          {hasStepError
            ? `⚠ ${validationErrors["_step"]}`
            : (lang === "nl" ? "Velden overslaan is toegestaan"
               : lang === "fa" ? "می‌توانید فیلدها را رد کنید"
               : "Optional fields may be skipped")}
        </span>
        <button className="btn btn-accent btn-sm" type="button" onClick={handleContinue}>
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
