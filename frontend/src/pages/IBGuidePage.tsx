import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchIBFields } from "../api/ib";
import type { IBField } from "../api/ib";
import s from "./IBGuidePage.module.css";

type Lang = "nl" | "en" | "fa";
type FieldValues = Record<string, string | boolean>;

function q(f: IBField, lang: Lang) {
  return f[`plain_question_${lang}` as keyof IBField] as string || f.plain_question_en;
}
function h(f: IBField, lang: Lang) {
  return f[`help_text_${lang}` as keyof IBField] as string || f.help_text_en;
}

const BOX_COLORS: Record<number, string> = { 1: "#7c3aed", 2: "#0891b2", 3: "#059669" };

export default function IBGuidePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language as Lang;
  const isRtl = lang === "fa";

  const [fields, setFields]         = useState<IBField[]>([]);
  const [loading, setLoading]       = useState(true);
  const [values, setValues]         = useState<FieldValues>({});
  const [openMistakes, setOpenMistakes] = useState<Record<string, boolean>>({});

  const userType = (() => {
    try {
      const raw = localStorage.getItem("taxwijs_calc_input");
      return raw ? (JSON.parse(raw).user_type as string) : undefined;
    } catch { return undefined; }
  })();

  useEffect(() => {
    fetchIBFields(userType)
      .then(setFields)
      .catch(() => setFields([]))
      .finally(() => setLoading(false));
  }, [userType]);

  const setValue = (code: string, val: string | boolean) =>
    setValues((v) => ({ ...v, [code]: val }));

  const toggleMistakes = (code: string) =>
    setOpenMistakes((o) => ({ ...o, [code]: !o[code] }));

  const askClaude = (field: IBField) => {
    const question = `${q(field, lang)}\n\n${h(field, lang)}`;
    navigate("/chat", { state: { question } });
  };

  const answeredCount = fields.filter((f) => values[f.field_code] !== undefined).length;

  if (loading) {
    return <div className={s.loading}>{t("ib.loading")}</div>;
  }

  return (
    <div className={s.page} dir={isRtl ? "rtl" : "ltr"}>
      <div className={s.header}>
        <span className={s.badge}>{t("ib.badge")}</span>
        <h1 className={s.title}>{t("ib.title")}</h1>
        <p className={s.subtitle}>{t("ib.subtitle")}</p>
        {userType && (
          <span className={s.profileChip}>
            {userType.toUpperCase()}
          </span>
        )}
      </div>

      <div className={s.progress}>
        <div className={s.progressBar}>
          <div
            className={s.progressFill}
            style={{ width: fields.length ? `${(answeredCount / fields.length) * 100}%` : "0%" }}
          />
        </div>
        <span className={s.progressLabel}>
          {t("ib.progress", { done: answeredCount, total: fields.length })}
        </span>
      </div>

      <div className={s.fields}>
        {fields.map((field) => (
          <div key={field.field_code} className={s.card}>
            <div className={s.cardHeader}>
              <span
                className={s.boxBadge}
                style={{ background: BOX_COLORS[field.box] ?? "#6b7280" }}
              >
                {t("ib.box", { n: field.box })}
              </span>
              <span className={s.fieldCode}>{field.field_code}</span>
              <span className={s.officialLabel}>{field.official_label_nl}</span>
            </div>

            <p className={s.question}>{q(field, lang)}</p>
            <p className={s.helpText}>{h(field, lang)}</p>

            <div className={s.inputRow}>
              {field.input_type === "boolean" ? (
                <div className={s.boolRow}>
                  {(["yes", "no"] as const).map((opt) => (
                    <button
                      key={opt}
                      className={values[field.field_code] === opt ? s.boolActive : s.boolBtn}
                      onClick={() => setValue(field.field_code, opt)}
                    >
                      {t(`ib.${opt}`)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={s.currencyWrap}>
                  <span className={s.currencySymbol}>€</span>
                  <input
                    className={s.currencyInput}
                    type="number"
                    min="0"
                    placeholder="0"
                    value={(values[field.field_code] as string) ?? ""}
                    onChange={(e) => setValue(field.field_code, e.target.value)}
                    dir="ltr"
                  />
                </div>
              )}
            </div>

            {field.common_mistakes.length > 0 && (
              <div className={s.mistakesSection}>
                <button
                  className={s.mistakesToggle}
                  onClick={() => toggleMistakes(field.field_code)}
                >
                  ⚠️ {t("ib.common_mistakes")} {openMistakes[field.field_code] ? "▲" : "▼"}
                </button>
                {openMistakes[field.field_code] && (
                  <ul className={s.mistakesList}>
                    {field.common_mistakes.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div className={s.cardFooter}>
              <a href={field.source_url} target="_blank" rel="noreferrer" className={s.sourceLink}>
                {t("ib.source")} ↗
              </a>
              <button className={s.askBtn} onClick={() => askClaude(field)}>
                {t("ib.ask_claude")} →
              </button>
            </div>
          </div>
        ))}
      </div>

      {answeredCount > 0 && (
        <div className={s.summary}>
          <h2 className={s.summaryTitle}>{t("ib.summary_title")}</h2>
          <table className={s.summaryTable}>
            <tbody>
              {fields
                .filter((f) => values[f.field_code] !== undefined)
                .map((f) => (
                  <tr key={f.field_code}>
                    <td className={s.summaryCode}>{f.field_code}</td>
                    <td>{f.official_label_nl}</td>
                    <td className={s.summaryValue}>
                      {field_input_type_is_currency(f)
                        ? `€ ${Number(values[f.field_code]).toLocaleString("nl-NL")}`
                        : String(values[f.field_code])}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <button className={s.chatBtn} onClick={() => navigate("/chat")}>
            {t("ib.go_to_chat")} →
          </button>
        </div>
      )}
    </div>
  );
}

function field_input_type_is_currency(f: IBField) {
  return f.input_type === "currency_amount" || f.input_type === "percentage";
}
