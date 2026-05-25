import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchIBFields } from "../api/ib";
import type { IBField } from "../api/ib";

type Lang = "nl" | "en" | "fa";
type FieldValues = Record<string, string | boolean>;

function q(f: IBField, lang: Lang) {
  return f[`plain_question_${lang}` as keyof IBField] as string || f.plain_question_en;
}
function h(f: IBField, lang: Lang) {
  return f[`help_text_${lang}` as keyof IBField] as string || f.help_text_en;
}

const BOX_COLORS: Record<number, string> = { 1: "#7c3aed", 2: "#0891b2", 3: "#059669" };

function field_input_type_is_currency(f: IBField) {
  return f.input_type === "currency_amount" || f.input_type === "percentage";
}

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
      .then(setFields).catch(() => setFields([])).finally(() => setLoading(false));
  }, [userType]);

  const setValue = (code: string, val: string | boolean) => setValues((v) => ({ ...v, [code]: val }));
  const toggleMistakes = (code: string) => setOpenMistakes((o) => ({ ...o, [code]: !o[code] }));
  const askClaude = (field: IBField) => {
    navigate("/chat", { state: { question: `${q(field, lang)}\n\n${h(field, lang)}` } });
  };

  const answeredCount = fields.filter((f) => values[f.field_code] !== undefined).length;

  if (loading) {
    return <div className="p-20 text-center text-[var(--text)] opacity-50">{t("ib.loading")}</div>;
  }

  const boolBtn = (active: boolean) =>
    `px-5 py-2 rounded-lg border font-[inherit] text-sm cursor-pointer transition-all ${
      active
        ? "bg-[var(--accent-bg)] border-[var(--accent)] text-[var(--accent)] font-semibold"
        : "bg-[var(--bg)] border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)]"
    }`;

  return (
    <div className="max-w-[760px] mx-auto px-12 py-12 pb-24 flex flex-col gap-8" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--accent)]">{t("ib.badge")}</span>
        <h1 className="text-[32px] font-semibold text-[var(--text-h)] m-0 -tracking-wide">{t("ib.title")}</h1>
        <p className="text-[15px] text-[var(--text)] opacity-70 m-0 leading-relaxed">{t("ib.subtitle")}</p>
        {userType && (
          <span className="inline-block self-start bg-[var(--accent-bg)] text-[var(--accent)] text-xs font-bold px-2.5 py-1 rounded-full border border-[var(--accent)]">
            {userType.toUpperCase()}
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
            style={{ width: fields.length ? `${(answeredCount / fields.length) * 100}%` : "0%" }}
          />
        </div>
        <span className="text-[13px] text-[var(--text)] opacity-60 whitespace-nowrap">
          {t("ib.progress", { done: answeredCount, total: fields.length })}
        </span>
      </div>

      {/* Field cards */}
      <div className="flex flex-col gap-5">
        {fields.map((field) => (
          <div key={field.field_code} className="bg-[var(--card-bg,#f9f9f9)] border border-[var(--border)] rounded-xl p-6 flex flex-col gap-3">
            {/* Card header */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className="text-[11px] font-bold text-white px-2 py-0.5 rounded tracking-wide"
                style={{ background: BOX_COLORS[field.box] ?? "#6b7280" }}
              >
                {t("ib.box", { n: field.box })}
              </span>
              <span className="text-xs font-semibold text-[var(--text)] opacity-50 font-mono">{field.field_code}</span>
              <span className="text-[13px] font-semibold text-[var(--text-h)]">{field.official_label_nl}</span>
            </div>

            <p className="text-[15px] font-medium text-[var(--text-h)] m-0 leading-relaxed">{q(field, lang)}</p>
            <p className="text-[13px] text-[var(--text)] opacity-75 m-0 leading-relaxed border-l-[3px] border-[var(--accent)] pl-2.5">{h(field, lang)}</p>

            {/* Input */}
            <div>
              {field.input_type === "boolean" ? (
                <div className="flex gap-2">
                  {(["yes", "no"] as const).map((opt) => (
                    <button key={opt} className={boolBtn(values[field.field_code] === opt)} onClick={() => setValue(field.field_code, opt)}>
                      {t(`ib.${opt}`)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--bg)] focus-within:border-[var(--accent)] transition-colors">
                  <span className="px-2.5 py-2.5 bg-[var(--border)] text-[13px] text-[var(--text)] opacity-70">€</span>
                  <input
                    className="border-none bg-transparent px-3 py-2.5 font-[inherit] text-sm text-[var(--text)] w-44 outline-none"
                    type="number" min="0" placeholder="0"
                    value={(values[field.field_code] as string) ?? ""}
                    onChange={(e) => setValue(field.field_code, e.target.value)}
                    dir="ltr"
                  />
                </div>
              )}
            </div>

            {/* Common mistakes */}
            {field.common_mistakes.length > 0 && (
              <div className="flex flex-col gap-2">
                <button
                  className="bg-none border-none font-[inherit] text-[13px] text-[var(--text)] opacity-65 cursor-pointer text-left p-0 hover:opacity-100 transition-opacity"
                  onClick={() => toggleMistakes(field.field_code)}
                >
                  ⚠️ {t("ib.common_mistakes")} {openMistakes[field.field_code] ? "▲" : "▼"}
                </button>
                {openMistakes[field.field_code] && (
                  <ul className="m-0 pl-4 flex flex-col gap-1">
                    {field.common_mistakes.map((m, i) => (
                      <li key={i} className="text-[13px] text-[var(--text)] opacity-80 leading-snug">{m}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-center mt-1 pt-3 border-t border-[var(--border)]">
              <a href={field.source_url} target="_blank" rel="noreferrer" className="text-xs text-[var(--text)] opacity-45 no-underline hover:opacity-80 transition-opacity">
                {t("ib.source")} ↗
              </a>
              <button
                className="px-4 py-1.5 rounded-lg border border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)] font-[inherit] text-[13px] font-medium cursor-pointer hover:bg-[var(--accent)] hover:text-white transition-all"
                onClick={() => askClaude(field)}
              >
                {t("ib.ask_claude")} →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {answeredCount > 0 && (
        <div className="border border-[var(--border)] rounded-xl p-6 flex flex-col gap-4">
          <h2 className="text-[18px] font-semibold text-[var(--text-h)] m-0">{t("ib.summary_title")}</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {fields
                .filter((f) => values[f.field_code] !== undefined)
                .map((f) => (
                  <tr key={f.field_code} className="border-b border-[var(--border)]">
                    <td className="py-2 pr-2 font-mono text-xs text-[var(--text)] opacity-55 w-12">{f.field_code}</td>
                    <td className="py-2 text-[var(--text)]">{f.official_label_nl}</td>
                    <td className="py-2 text-right font-semibold text-[var(--text-h)]">
                      {field_input_type_is_currency(f)
                        ? `€ ${Number(values[f.field_code]).toLocaleString("nl-NL")}`
                        : String(values[f.field_code])}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <button
            className="self-start px-6 py-2.5 rounded-lg border-none bg-[var(--accent)] text-white font-[inherit] text-sm font-medium cursor-pointer hover:opacity-85 transition-opacity"
            onClick={() => navigate("/chat")}
          >
            {t("ib.go_to_chat")} →
          </button>
        </div>
      )}
    </div>
  );
}
