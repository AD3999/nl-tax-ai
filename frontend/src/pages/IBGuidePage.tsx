import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchIBFields } from "../api/ib";
import { authHeader } from "../api/client";
import type { IBField } from "../api/ib";
import { Icon } from "../components/Icon";
import { useMobile } from "../hooks/useMobile";

type Lang = "nl" | "en" | "fa";
type FieldValues = Record<string, string | boolean>;

function q(f: IBField, lang: Lang) {
  return (f[`plain_question_${lang}` as keyof IBField] as string) || f.plain_question_en;
}
function h(f: IBField, lang: Lang) {
  return (f[`help_text_${lang}` as keyof IBField] as string) || f.help_text_en;
}

/** A value is "answered" only when it carries meaningful content — never for empty strings. */
function isAnswered(val: string | boolean | undefined): boolean {
  if (val === undefined || val === null) return false;
  if (val === "yes" || val === "no") return true;
  return String(val).trim() !== "";
}

const BOX_COLORS: Record<number, { bg: string; fg: string }> = {
  1: { bg: "var(--sage-100)",      fg: "var(--sage-800)" },
  2: { bg: "oklch(0.94 0.05 230)", fg: "oklch(0.40 0.13 230)" },
  3: { bg: "oklch(0.94 0.06 150)", fg: "oklch(0.40 0.14 150)" },
};

const CARD_TX: Record<Lang, {
  headline_1: string;
  headline_2: string;
  common_mistakes: string;
  ask: string;
  open_in_chat: string;
  progress: string;
  fields_answered: (n: number, total: number) => string;
  autosaved: string;
  summary_title: string;
  summary_empty: string;
  when_to_file: string;
  when_to_file_body: ReactNode;
  profile_label: string;
  open_intro: string;
  open_outro: string;
}> = {
  nl: {
    headline_1: "De velden die tellen,",
    headline_2: "in gewone taal",
    common_mistakes: "Veelgemaakte fouten",
    ask: "Vraag TaxWijs",
    open_in_chat: "Open in chat",
    progress: "Voortgang",
    fields_answered: (n, t) => `${n} van ${t} velden ingevuld`,
    autosaved: "✓ Opgeslagen",
    summary_title: "Live aangifte-overzicht",
    summary_empty: "Vul velden in om uw overzicht te zien",
    when_to_file: "Wanneer aangifte doen",
    when_to_file_body: (
      <>Aangifte 2026 opent <strong style={{ color: "var(--ink)" }}>1 maart 2027</strong> · deadline <strong style={{ color: "var(--ink)" }}>1 mei 2027</strong></>
    ),
    profile_label: "profiel",
    open_intro: "Mijn ingevulde IB-aangifte velden:",
    open_outro: "Kunt u mij helpen mijn belastingsituatie te begrijpen op basis van deze gegevens?",
  },
  en: {
    headline_1: "The fields that matter,",
    headline_2: "in plain language",
    common_mistakes: "Common mistakes",
    ask: "Ask TaxWijs",
    open_in_chat: "Open in chat",
    progress: "Progress",
    fields_answered: (n, t) => `${n} of ${t} fields answered`,
    autosaved: "✓ Autosaved",
    summary_title: "Live return summary",
    summary_empty: "Fill in fields to see your summary",
    when_to_file: "When to file",
    when_to_file_body: (
      <>Aangifte 2026 opens <strong style={{ color: "var(--ink)" }}>1 March 2027</strong> · deadline <strong style={{ color: "var(--ink)" }}>1 May 2027</strong></>
    ),
    profile_label: "profile",
    open_intro: "My completed IB return fields:",
    open_outro: "Can you help me understand my tax situation based on these answers?",
  },
  fa: {
    headline_1: "فیلدهایی که اهمیت دارند،",
    headline_2: "به زبان ساده",
    common_mistakes: "اشتباهات رایج",
    ask: "از TaxWijs بپرسید",
    open_in_chat: "باز کردن در چت",
    progress: "پیشرفت",
    fields_answered: (n, t) => `${n} از ${t} فیلد پر شده`,
    autosaved: "✓ ذخیره شد",
    summary_title: "خلاصه اظهارنامه زنده",
    summary_empty: "فیلدها را پر کنید تا خلاصه را ببینید",
    when_to_file: "زمان تسلیم اظهارنامه",
    when_to_file_body: (
      <>اظهارنامه ۲۰۲۶ از <strong style={{ color: "var(--ink)" }}>۱ مارس ۲۰۲۷</strong> باز می‌شود · مهلت: <strong style={{ color: "var(--ink)" }}>۱ مه ۲۰۲۷</strong></>
    ),
    profile_label: "پروفایل",
    open_intro: "پاسخ‌های اظهارنامه مالیاتی من:",
    open_outro: "آیا می‌توانید بر اساس این اطلاعات به من کمک کنید وضعیت مالیاتی‌ام را بفهمم؟",
  },
};

function field_input_type_is_currency(f: IBField) {
  return f.input_type === "currency_amount" || f.input_type === "percentage";
}

function IBFieldCard({
  field, lang, value, onValue, mistakesOpen, onToggleMistakes, onAsk,
}: {
  field: IBField;
  lang: Lang;
  value: string | boolean | undefined;
  onValue: (code: string, val: string | boolean) => void;
  mistakesOpen: boolean;
  onToggleMistakes: (code: string) => void;
  onAsk: (field: IBField) => void;
}) {
  const answered = isAnswered(value);
  const c = BOX_COLORS[field.box] ?? BOX_COLORS[1];
  const isWarn = field.field_code === "1d";
  const tx = CARD_TX[lang];

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", borderColor: answered ? "var(--accent-line)" : "var(--hairline)" }}>
      <div style={{ padding: "18px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, flexWrap: "wrap" }}>
            <span style={{ padding: "3px 8px", borderRadius: 6, background: c.bg, color: c.fg, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.05em", fontFamily: "var(--mono)" }}>
              BOX {field.box}
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-3)" }}>{field.field_code}</span>
            <span style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--ink)" }}>{field.official_label_nl}</span>
            {isWarn && <span className="pill pill-warn">⚠ Last year 2026</span>}
          </div>
          {answered && (
            <span style={{ width: 22, height: 22, borderRadius: 999, background: "var(--sage-600)", color: "white", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon.check style={{ width: 12, height: 12 }} />
            </span>
          )}
        </div>

        <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-2)" }}>{q(field, lang)}</p>

        <div style={{ marginTop: 14 }}>
          {field.input_type === "boolean" ? (
            <div style={{ display: "flex", gap: 6 }}>
              {(["yes", "no"] as const).map(opt => {
                const on = value === opt;
                const label = opt === "yes"
                  ? (lang === "nl" ? "Ja" : lang === "fa" ? "بله" : "Yes")
                  : (lang === "nl" ? "Nee" : lang === "fa" ? "خیر" : "No");
                return (
                  <button key={opt} type="button" onClick={() => onValue(field.field_code, opt)} style={{
                    padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: "pointer",
                    border: `1px solid ${on ? "var(--sage-600)" : "var(--hairline-2)"}`,
                    background: on ? "var(--accent-soft)" : "var(--paper)",
                    color: on ? "var(--sage-700)" : "var(--ink-3)",
                  }}>
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ position: "relative", maxWidth: 280 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", fontSize: 13 }}>€</span>
              <input
                className="tw-input"
                type="number"
                min="0"
                placeholder="0"
                value={(value as string) ?? ""}
                onChange={e => onValue(field.field_code, e.target.value)}
                style={{ paddingInlineStart: 28, width: "100%" }}
                dir="ltr"
              />
            </div>
          )}
        </div>

        {field.common_mistakes.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => onToggleMistakes(field.field_code)}
              style={{ marginTop: 14, background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 12.5, cursor: "pointer", padding: 0 }}
            >
              <span style={{ width: 16, height: 16, borderRadius: 4, background: "oklch(0.95 0.05 75)", color: "oklch(0.50 0.16 75)", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700 }}>!</span>
              {tx.common_mistakes} ({field.common_mistakes.length})
              <Icon.chev style={{ width: 11, height: 11, transform: mistakesOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
            </button>
            {mistakesOpen && (
              <ul style={{ margin: "8px 0 0 0", paddingInlineStart: 28, fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.55 }}>
                {field.common_mistakes.map((m, i) => <li key={i} style={{ marginBottom: 4 }}>{m}</li>)}
              </ul>
            )}
          </>
        )}
      </div>

      <div style={{ padding: "12px 22px", background: "var(--paper-3)", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--hairline)" }}>
        <a
          href={field.source_url}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 11.5, color: "var(--ink-3)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          Belastingdienst <Icon.external style={{ width: 10, height: 10 }} />
        </a>
        <button className="btn btn-soft btn-sm" type="button" onClick={() => onAsk(field)}>
          <Icon.spark style={{ width: 12, height: 12 }} /> {tx.ask}
        </button>
      </div>
    </div>
  );
}

export default function IBGuidePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const lang = i18n.language as Lang;
  const isRtl = lang === "fa";
  const tx = CARD_TX[lang];

  const IB_STORAGE_KEY = "taxwijs_ib_guide_progress";

  const [fields, setFields]             = useState<IBField[]>([]);
  const [loading, setLoading]           = useState(true);
  const [values, setValues]             = useState<FieldValues>(() => {
    try { const r = localStorage.getItem(IB_STORAGE_KEY); return r ? (JSON.parse(r) as FieldValues) : {}; }
    catch { return {}; }
  });
  const [openMistakes, setOpenMistakes] = useState<Record<string, boolean>>({});
  const [savedAt, setSavedAt]           = useState<Date | null>(null);

  const userType = (() => {
    try {
      const raw = localStorage.getItem("taxwijs_calc_input");
      return raw ? (JSON.parse(raw).user_type as string) : undefined;
    } catch { return undefined; }
  })();

  // On mount: if authenticated, restore from server (server wins over localStorage)
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch("/api/users/profile/", { headers: authHeader() })
      .then(r => r.ok ? r.json() as Promise<{ ib_guide_answers?: FieldValues | null }> : null)
      .then(data => {
        if (data?.ib_guide_answers && Object.keys(data.ib_guide_answers).length > 0) {
          setValues(data.ib_guide_answers);
          localStorage.setItem(IB_STORAGE_KEY, JSON.stringify(data.ib_guide_answers));
        }
      })
      .catch(() => null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchIBFields(userType)
      .then(setFields).catch(() => setFields([])).finally(() => setLoading(false));
  }, [userType]);

  // Autosave to localStorage + server (authenticated users) whenever values change
  useEffect(() => {
    if (Object.keys(values).length === 0) return;
    localStorage.setItem(IB_STORAGE_KEY, JSON.stringify(values));
    setSavedAt(new Date());
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch("/api/users/profile/", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ ib_guide_answers: values }),
    }).catch(() => null);
  }, [values]); // eslint-disable-line react-hooks/exhaustive-deps

  const setValue = (code: string, val: string | boolean) =>
    setValues(v => ({ ...v, [code]: val }));
  const toggleMistakes = (code: string) =>
    setOpenMistakes(o => ({ ...o, [code]: !o[code] }));
  const askClaude = (field: IBField) =>
    navigate("/chat", { state: { question: `${q(field, lang)}\n\n${h(field, lang)}` } });

  const answeredCount  = fields.filter(f => isAnswered(values[f.field_code])).length;
  const answeredFields = fields.filter(f => isAnswered(values[f.field_code]));

  // Build a structured context message so the chatbot sees what the user filled in
  const openInChat = () => {
    if (answeredFields.length === 0) {
      navigate("/chat");
      return;
    }
    const lines = answeredFields.map(f => {
      const val = values[f.field_code];
      const display = field_input_type_is_currency(f)
        ? `€${Number(val).toLocaleString("nl-NL")}`
        : String(val);
      return `- ${f.field_code} (${f.official_label_nl}): ${display}`;
    });
    navigate("/chat", {
      state: {
        question: `${tx.open_intro}\n${lines.join("\n")}\n\n${tx.open_outro}`,
      },
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh", color: "var(--ink-3)", fontSize: 14 }}>
        {t("ib.loading")}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", padding: isMobile ? "28px 16px 40px" : "44px 40px 60px" }} dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="eyebrow eyebrow-accent">IB Return · 2026</div>
          <h1 style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: 42, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
            {tx.headline_1}<br />{tx.headline_2}
          </h1>
          <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 14 }}>
            {t("ib.subtitle")}
          </p>
        </div>
        {userType && (
          <span style={{ padding: "8px 14px", borderRadius: 999, background: "var(--accent-soft)", color: "var(--sage-700)", fontSize: 12.5, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--sage-600)" }} />
            {userType.toUpperCase()} {tx.profile_label}
          </span>
        )}
      </div>

      {/* Progress strip */}
      {fields.length > 0 && (
        <div style={{ marginTop: 32, padding: "20px 24px", background: "var(--paper-2)", border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="eyebrow eyebrow-accent">{tx.progress}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {savedAt && (
                <span style={{ fontSize: 11, color: "var(--ok)", display: "flex", alignItems: "center", gap: 4 }}>
                  {tx.autosaved} {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
                {tx.fields_answered(answeredCount, fields.length)}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {fields.map(f => {
              const ans = isAnswered(values[f.field_code]);
              const isWarn = f.field_code === "1d";
              return (
                <div key={f.field_code} style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background: ans
                    ? (isWarn ? "oklch(0.65 0.16 75)" : "var(--sage-600)")
                    : "var(--paper-3)",
                }} />
              );
            })}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 24, alignItems: "flex-start" }}>
        {/* Fields stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {fields.map(f => (
            <IBFieldCard
              key={f.field_code}
              field={f}
              lang={lang}
              value={values[f.field_code]}
              onValue={setValue}
              mistakesOpen={!!openMistakes[f.field_code]}
              onToggleMistakes={toggleMistakes}
              onAsk={askClaude}
            />
          ))}
        </div>

        {/* Sticky sidebar */}
        <aside style={{ position: "sticky", top: 92, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Live summary */}
          <div className="card" style={{ padding: 20, background: "var(--ink)", color: "var(--paper)", border: "none" }}>
            <div className="eyebrow" style={{ color: "var(--sage-300)" }}>{tx.summary_title}</div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {answeredFields.length === 0 ? (
                <div style={{ fontSize: 13, color: "oklch(0.65 0.01 95)" }}>{tx.summary_empty}</div>
              ) : (
                answeredFields.map(f => (
                  <div key={f.field_code} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, color: "oklch(0.85 0.01 95)" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--sage-300)" }}>{f.field_code}</span>
                    <span className="num" style={{ color: "white" }}>
                      {field_input_type_is_currency(f)
                        ? `€ ${Number(values[f.field_code]).toLocaleString("nl-NL")}`
                        : String(values[f.field_code])}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="dots" style={{ marginTop: 14 }} />
            <button
              className="btn"
              type="button"
              onClick={openInChat}
              style={{ marginTop: 16, width: "100%", background: "var(--sage-500)", color: "white" }}
            >
              {tx.open_in_chat} <Icon.arrow />
            </button>
          </div>

          {/* When to file */}
          <div style={{ padding: 14, border: "1px solid var(--hairline)", borderRadius: "var(--r)" }}>
            <div className="eyebrow eyebrow-accent">{tx.when_to_file}</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
              {tx.when_to_file_body}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
