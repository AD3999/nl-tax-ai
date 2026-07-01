import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { calculateTax } from "../api/calculator";
import type { CalcInput, CalcResult } from "../api/calculator";
import { Icon } from "../components/Icon";
import { useMobile } from "../hooks/useMobile";

type Lang = "nl" | "en" | "fa";
const T = (tx: Record<Lang, string>, l: Lang) => tx[l] ?? tx.en;

import { formatEUR, formatPct } from "../lib/format";
import TrustStrip from "../components/TrustStrip";

const EUR = (n: number) => formatEUR(n);
const PCT = (n: number) => formatPct(n);


const DBA_TONE: Record<string, string> = {
  high: "var(--danger)", medium: "var(--warn)", low: "var(--ok)",
};

type FormState = Record<string, string | boolean>;
const DEFAULT_FORM: FormState = {
  annual_revenue_zzp: "", business_expenses: "",
  hours_per_year: "", is_starter: false, has_partner: false, partner_income: "",
  children_under_12: "0", net_assets_box3: "", savings_fraction: "0",
  pension_contribution: "", kia_investments: "",
  single_client_percentage: "",
};

function CalcField({ label, k, form, set, placeholder, unit, hint }: {
  label: string; k: string; form: FormState; set: (k: string, v: string) => void;
  placeholder?: string; unit?: string; hint?: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span className="tw-label">{label}</span>
        {hint && <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>{hint}</span>}
      </div>
      <div style={{ position: "relative" }}>
        {unit && <span style={{ position: "absolute", insetInlineStart: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", fontSize: "var(--text-sm)" }}>{unit}</span>}
        <input className="tw-input" type="number" min="0"
          value={form[k] as string} onChange={e => set(k, e.target.value)}
          placeholder={placeholder}
          style={{ paddingInlineStart: unit ? 28 : undefined }} />
      </div>
    </div>
  );
}

function Toggle({ label, k, form, set, yesNo = ["Yes", "No"] }: {
  label: string; k: string; form: FormState; set: (k: string, v: boolean) => void;
  lang?: string; yesNo?: [string, string];
}) {
  const v = form[k] as boolean;
  return (
    <div>
      <div className="tw-label" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", border: "1px solid var(--hairline-2)", borderRadius: "var(--r-sm)", overflow: "hidden" }}>
        {([[yesNo[0], true], [yesNo[1], false]] as [string, boolean][]).map(([lbl, val]) => (
          <button key={lbl} type="button" onClick={() => set(k, val)} style={{
            flex: 1, padding: "9px 0", fontSize: "var(--text-sm)", border: "none", cursor: "pointer",
            background: v === val ? "var(--accent-soft)" : "var(--paper)",
            color: v === val ? "var(--sage-700)" : "var(--ink-3)",
            fontWeight: v === val ? 600 : 400,
          }}>{lbl}</button>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, kind }: { label: string; value: string; kind?: "primary" | "ink" | "warn" | "ok" }) {
  const bg = kind === "ink" ? "var(--bg-4)" : kind === "primary" ? "var(--blue-subtle)" : kind === "warn" ? "var(--warn-subtle)" : kind === "ok" ? "var(--ok-subtle)" : "var(--bg-2)";
  const fg = kind === "ink" ? "var(--text)" : kind === "primary" ? "var(--blue-text)" : kind === "warn" ? "var(--warn-text)" : kind === "ok" ? "var(--ok-text)" : "var(--text)";
  const sub = kind === "ink" ? "var(--text-2)" : kind === "primary" ? "var(--blue-text)" : kind === "warn" ? "var(--warn-text)" : kind === "ok" ? "var(--ok-text)" : "var(--text-3)";
  return (
    <div style={{ padding: 18, background: bg, borderRadius: "var(--r-lg)", border: kind ? "none" : "1px solid var(--hairline)" }}>
      <div className="eyebrow" style={{ color: sub }}>{label}</div>
      <div className="font-serif" style={{ marginTop: 8, fontSize: 38, color: fg, lineHeight: 1, letterSpacing: "-0.025em" }}>{value}</div>
    </div>
  );
}

const CALC_TX = {
  eyebrow:     { nl: "Rekenmachine 2026",      en: "2026 Calculator",       fa: "محاسبه‌گر ۲۰۲۶" },
  heading:     { nl: "Elk euro, per schijf",    en: "See every euro, by bracket", fa: "هر یورو، به تفکیک دهک" },
  subtext:     { nl: "Geen AI — pure deterministische motor. Dezelfde cijfers als uw accountant", en: "No AI — pure deterministic engine. Same numbers your accountant would get", fa: "بدون هوش مصنوعی — موتور قطعی خالص. همان اعداد حسابدار شما" },
  discuss:     { nl: "Bespreek met TaxWijs",    en: "Discuss with TaxWijs",  fa: "گفتگو با TaxWijs" },
  inputsLabel: { nl: "Invoer",                  en: "Inputs",                fa: "ورودی‌ها" },
  yourSit:     { nl: "Uw situatie",             en: "Your situation",        fa: "وضعیت شما" },
  household:   { nl: "Huishouden",              en: "Household",             fa: "اطلاعات خانوار" },
  calcBtn:     { nl: "Berekenen",               en: "Calculate",             fa: "محاسبه" },
  calcLoading: { nl: "Berekenen…",              en: "Calculating…",          fa: "در حال محاسبه…" },
  yesNo:       { nl: ["Ja", "Nee"],             en: ["Yes", "No"],           fa: ["بله", "خیر"] },
  // Form field labels
  fAnnualRev:  { nl: "Jaarlijkse omzet",        en: "Annual revenue",        fa: "درآمد سالانه" },
  fBizExp:     { nl: "Zakelijke kosten",         en: "Business expenses",     fa: "هزینه‌های کسب‌وکار" },
  fHours:      { nl: "Uren per jaar",            en: "Hours per year",        fa: "ساعات در سال" },
  fKia:        { nl: "KIA-investeringen",        en: "KIA investments",       fa: "سرمایه‌گذاری‌های KIA" },
  fSingleClient:{ nl: "Klantconcentratie %",     en: "Single client %",       fa: "سهم مشتری واحد %" },
  fStarter:    { nl: "Starterjaar?",             en: "Starter year?",         fa: "سال اول کارآفرینی؟" },
  fPension:    { nl: "Pensioenaftrek",           en: "Pension contribution",  fa: "حق بیمه بازنشستگی" },
  fBox3:       { nl: "Nettovermogen Box 3",      en: "Net assets Box 3",      fa: "دارایی خالص باکس ۳" },
  fSavings:    { nl: "Spaarspaardeel %",         en: "Savings fraction %",    fa: "سهم پس‌انداز %" },
  fChildren:   { nl: "Kinderen onder 12",        en: "Children under 12",     fa: "فرزندان زیر ۱۲ سال" },
  fHasPartner: { nl: "Heeft u een partner?",     en: "Has partner?",          fa: "شریک مالیاتی دارید؟" },
  fPartnerInc: { nl: "Inkomen partner",          en: "Partner income",        fa: "درآمد شریک" },
  // Summary card labels
  sTotalTax:   { nl: "Totale belasting 2026",    en: "Total tax due 2026",    fa: "مجموع مالیات ۲۰۲۶" },
  sEffRate:    { nl: "Effectief tarief",         en: "Effective rate",        fa: "نرخ مؤثر مالیاتی" },
  sMonthly:    { nl: "Maandelijkse reserve",     en: "Monthly reserve",       fa: "ذخیره ماهانه" },
  sWetDBA:     { nl: "Wet DBA-risico",           en: "Wet DBA risk",          fa: "ریسک Wet DBA" },
  // Breakdown table
  bBrackets:   { nl: "Box 1 schijven 2026",      en: "2026 Box 1 brackets",   fa: "دهک‌های باکس ۱ سال ۲۰۲۶" },
  bFullBreak:  { nl: "Volledig overzicht",       en: "Full breakdown",        fa: "تفکیک کامل" },
  bIncTax:     { nl: "2026 inkomen → belasting", en: "2026 income → total tax", fa: "درآمد ۲۰۲۶ → مجموع مالیات" },
  bGrossRev:   { nl: "Bruto-omzet / -inkomen",   en: "Gross revenue / income", fa: "درآمد ناخالص" },
  bBizExp:     { nl: "Zakelijke kosten",         en: "Business expenses",     fa: "هزینه‌های کسب‌وکار" },
  bGrossProfit:{ nl: "Brutowinstmarge",          en: "Gross profit",          fa: "سود ناخالص" },
  bKia:        { nl: "KIA-aftrek",               en: "KIA deduction",         fa: "کسر KIA" },
  bPension:    { nl: "Pensioenaftrek",           en: "Pension deduction",     fa: "کسر بازنشستگی" },
  bTaxableInc: { nl: "Belastbaar inkomen (Box 1)", en: "Taxable income (Box 1)", fa: "درآمد مشمول مالیات (باکس ۱)" },
  bIncTaxCred: { nl: "IB na kortingen",          en: "Income tax after credits", fa: "مالیات بر درآمد پس از اعتبارات" },
  bZvw:        { nl: "ZVW-bijdrage (4.85%)",     en: "ZVW contribution (4.85%)", fa: "مشارکت ZVW (۴.۸۵٪)" },
  bBox2:       { nl: "Box 2-belasting (dividend)", en: "Box 2 tax (dividend)", fa: "مالیات باکس ۲ (سود سهام)" },
  bBox3:       { nl: "Box 3-belasting (vermogen)", en: "Box 3 tax (wealth)",  fa: "مالیات باکس ۳ (دارایی)" },
  bTotal:      { nl: "Totale belasting 2026",    en: "Total tax due 2026",    fa: "مجموع مالیات ۲۰۲۶" },
  // Empty state placeholders
  ePlaceholders: { nl: ["Totale belasting", "Effectief tarief", "Maandelijkse reserve"], en: ["Total tax due", "Effective rate", "Monthly reserve"], fa: ["مجموع مالیات", "نرخ مؤثر", "ذخیره ماهانه"] },
};

export default function CalculatorPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language as Lang;
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [form, setForm]         = useState<FormState>(DEFAULT_FORM);
  const [result, setResult]     = useState<CalcResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  const num = (k: string): number | undefined => form[k] ? parseFloat(form[k] as string) : undefined;
  const int = (k: string): number | undefined => form[k] ? parseInt(form[k] as string) : undefined;

  const INCOME_REQUIRED: Record<Lang, string> = {
    nl: "Voer uw inkomen in om te kunnen berekenen",
    en: "Enter your income to calculate",
    fa: "لطفاً درآمد خود را وارد کنید",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required income field
    const incomeEmpty = !form.annual_revenue_zzp || parseFloat(form.annual_revenue_zzp as string) <= 0;
    if (incomeEmpty) { setError(INCOME_REQUIRED[lang]); return; }
    setLoading(true);
    setError(null);
    try {
      const input: CalcInput = {
        user_type: "zzp", year: 2026,
        annual_revenue_zzp: num("annual_revenue_zzp") ?? null,
        business_expenses: num("business_expenses") ?? 0,
        hours_per_year: int("hours_per_year") ?? null,
        is_starter: form.is_starter as boolean,
        has_partner: form.has_partner as boolean,
        partner_income: num("partner_income") ?? null,
        children_under_12: int("children_under_12") ?? 0,
        net_assets_box3: num("net_assets_box3") ?? 0,
        savings_fraction: parseFloat((form.savings_fraction as string) || "0") / 100,
        pension_contribution: num("pension_contribution") ?? 0,
        kia_investments: num("kia_investments") ?? 0,
        single_client_percentage: num("single_client_percentage") ?? null,
      };
      const data = await calculateTax(input);
      setResult(data);
      localStorage.setItem("taxwijs_calc_input", JSON.stringify(input));
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: unknown } };
      const d = e2.response?.data;
      setError(typeof d === "string" ? d : JSON.stringify(d, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const c = result?.calculation;
  const r = result?.result;

  return (
    <div style={{ flex: 1, background: "var(--paper)", display: "flex", flexDirection: "column" }}>
      <TrustStrip />
      <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "44px 40px 64px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div className="eyebrow eyebrow-accent">{T(CALC_TX.eyebrow, lang)}</div>
            <h1 style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: 42, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              {T(CALC_TX.heading, lang)}
            </h1>
            <p style={{ marginTop: 6, color: "var(--ink-3)", fontSize: 14 }}>
              {T(CALC_TX.subtext, lang)}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate("/chat")}>
            <Icon.spark /> {T(CALC_TX.discuss, lang)}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.05fr", gap: isMobile ? 16 : 24, alignItems: "flex-start" }}>
            {/* Form card */}
            <div className="card" style={{ padding: 26 }}>
              <div className="eyebrow eyebrow-accent">{T(CALC_TX.inputsLabel, lang)}</div>
              <h2 style={{ marginTop: 4, fontSize: 18, color: "var(--ink)", fontWeight: 500 }}>{T(CALC_TX.yourSit, lang)}</h2>

              <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                <CalcField label={T(CALC_TX.fAnnualRev, lang)} k="annual_revenue_zzp" form={form} set={set} unit="€" placeholder="72000" />
                <CalcField label={T(CALC_TX.fBizExp, lang)} k="business_expenses" form={form} set={set} unit="€" placeholder="9500" />
                <CalcField label={T(CALC_TX.fHours, lang)} k="hours_per_year" form={form} set={set} unit="h" placeholder="1380" hint="≥ 1,225 h" />
                <CalcField label={T(CALC_TX.fKia, lang)} k="kia_investments" form={form} set={set} unit="€" placeholder="0" />
                <CalcField label={T(CALC_TX.fSingleClient, lang)} k="single_client_percentage" form={form} set={set} unit="%" placeholder="0" hint="Wet DBA test" />
                <Toggle label={T(CALC_TX.fStarter, lang)} k="is_starter" form={form} set={(k, v) => set(k, v)} lang={lang} yesNo={CALC_TX.yesNo[lang] as [string, string]} />
              </div>

              <div className="dots" style={{ margin: "22px 0" }} />
              <div className="eyebrow">{T(CALC_TX.household, lang)}</div>
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                <CalcField label={T(CALC_TX.fPension, lang)} k="pension_contribution" form={form} set={set} unit="€" placeholder="0" />
                <CalcField label={T(CALC_TX.fBox3, lang)} k="net_assets_box3" form={form} set={set} unit="€" placeholder="0" />
                <CalcField label={T(CALC_TX.fSavings, lang)} k="savings_fraction" form={form} set={set} unit="%" placeholder="50" />
                <CalcField label={T(CALC_TX.fChildren, lang)} k="children_under_12" form={form} set={set} placeholder="0" />
                <Toggle label={T(CALC_TX.fHasPartner, lang)} k="has_partner" form={form} set={(k, v) => set(k, v)} lang={lang} yesNo={CALC_TX.yesNo[lang] as [string, string]} />
                {form.has_partner && <CalcField label={T(CALC_TX.fPartnerInc, lang)} k="partner_income" form={form} set={set} unit="€" placeholder="0" />}
              </div>

              {error && (
                <div style={{ marginTop: 14, padding: 12, background: "var(--danger-soft)", borderRadius: "var(--r-sm)", fontSize: "var(--text-sm)", color: "var(--danger)" }}>
                  {error}
                </div>
              )}

              <button className="btn btn-accent btn-lg" type="submit" disabled={loading} style={{ width: "100%", marginTop: 22 }}>
                {loading ? T(CALC_TX.calcLoading, lang) : <>{T(CALC_TX.calcBtn, lang)} <Icon.arrow /></>}
              </button>
            </div>

            {/* Results */}
            {result && c && r ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                  <SummaryCard kind="primary" label={T(CALC_TX.sTotalTax, lang)} value={EUR(r.total_tax_due)} />
                  <SummaryCard kind="ink" label={T(CALC_TX.sEffRate, lang)} value={PCT(r.effective_rate)} />
                  {r.monthly_reserve_needed > 0 && <SummaryCard label={T(CALC_TX.sMonthly, lang)} value={EUR(r.monthly_reserve_needed)} />}
                  {r.wet_dba_risk !== "n/a" && (
                    <div style={{ padding: 18, background: r.wet_dba_risk === "high" ? "var(--danger-soft)" : r.wet_dba_risk === "medium" ? "var(--warn-soft)" : "var(--ok-soft)", borderRadius: "var(--r-lg)" }}>
                      <div className="eyebrow" style={{ color: DBA_TONE[r.wet_dba_risk] ?? "var(--ink-3)" }}>{T(CALC_TX.sWetDBA, lang)}</div>
                      <div className="font-serif" style={{ marginTop: 8, fontSize: 30, color: DBA_TONE[r.wet_dba_risk], lineHeight: 1 }}>{r.wet_dba_risk.toUpperCase()}</div>
                    </div>
                  )}
                </div>

                {/* Bracket bar */}
                <div className="card" style={{ padding: 20 }}>
                  <div className="eyebrow eyebrow-accent">{T(CALC_TX.bBrackets, lang)}</div>
                  <div style={{ marginTop: 14, height: 10, borderRadius: 999, background: "var(--paper-3)", overflow: "hidden", display: "flex" }}>
                    <div style={{ width: "60%", background: "var(--sage-400)" }} />
                    <div style={{ width: "35%", background: "var(--sage-600)" }} />
                    <div style={{ width: "5%", background: "var(--ink)" }} />
                  </div>
                  <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 4, fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
                    <span>35.75% · up to €38,883</span>
                    <span style={{ textAlign: "center" }}>37.56% · €38,883–€78,426</span>
                    <span style={{ textAlign: "end" }}>49.50% · €78,426+</span>
                  </div>
                </div>

                {/* Breakdown table */}
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--hairline)" }}>
                    <div>
                      <div className="eyebrow eyebrow-accent">{T(CALC_TX.bFullBreak, lang)}</div>
                      <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>{T(CALC_TX.bIncTax, lang)}</div>
                    </div>
                  </div>
                  <div>
                    {[
                      { label: T(CALC_TX.bGrossRev, lang), value: EUR(c.gross_revenue), bold: true },
                      c.business_expenses > 0 && { label: T(CALC_TX.bBizExp, lang), value: `− ${EUR(c.business_expenses)}`, muted: true },
                      { label: T(CALC_TX.bGrossProfit, lang), value: EUR(c.gross_profit), bold: true, line: true },
                      c.zelfstandigenaftrek > 0 && { label: "Zelfstandigenaftrek", value: `− ${EUR(c.zelfstandigenaftrek)}`, muted: true },
                      c.startersaftrek > 0 && { label: lang === "nl" ? "Startersaftrek (laatste jaar!)" : lang === "fa" ? "Startersaftrek (آخرین سال!)" : "Startersaftrek (last year!)", value: `− ${EUR(c.startersaftrek)}`, muted: true },
                      c.kia_deduction > 0 && { label: T(CALC_TX.bKia, lang), value: `− ${EUR(c.kia_deduction)}`, muted: true },
                      c.mkb_winstvrijstelling > 0 && { label: "MKB-winstvrijstelling (12.7%)", value: `− ${EUR(c.mkb_winstvrijstelling)}`, muted: true },
                      c.pension_deduction > 0 && { label: T(CALC_TX.bPension, lang), value: `− ${EUR(c.pension_deduction)}`, muted: true },
                      { label: T(CALC_TX.bTaxableInc, lang), value: EUR(c.taxable_income_box1), bold: true, line: true },
                      { label: lang === "fa" ? "دهک ۱ باکس ۱ (۳۵.۷۵٪)" : "Box 1 bracket 1 (35.75%)", value: EUR(c.box1_tax_bracket1) },
                      c.box1_tax_bracket2 > 0 && { label: lang === "fa" ? "دهک ۲ باکس ۱ (۳۷.۵۶٪)" : "Box 1 bracket 2 (37.56%)", value: EUR(c.box1_tax_bracket2) },
                      c.box1_tax_bracket3 > 0 && { label: lang === "fa" ? "دهک ۳ باکس ۱ (۴۹.۵۰٪)" : "Box 1 bracket 3 (49.50%)", value: EUR(c.box1_tax_bracket3) },
                      c.algemene_heffingskorting > 0 && { label: "− Algemene heffingskorting", value: `− ${EUR(c.algemene_heffingskorting)}`, muted: true },
                      c.arbeidskorting > 0 && { label: "− Arbeidskorting", value: `− ${EUR(c.arbeidskorting)}`, muted: true },
                      c.iack > 0 && { label: lang === "nl" ? "− IACK (werkende ouders)" : lang === "fa" ? "− IACK (والدین شاغل)" : "− IACK (working parents)", value: `− ${EUR(c.iack)}`, muted: true },
                      { label: T(CALC_TX.bIncTaxCred, lang), value: EUR(c.income_tax_after_credits), bold: true, line: true },
                      c.zvw_contribution > 0 && { label: T(CALC_TX.bZvw, lang), value: EUR(c.zvw_contribution) },
                      c.box2_tax > 0 && { label: T(CALC_TX.bBox2, lang), value: EUR(c.box2_tax) },
                      c.box3_tax > 0 && { label: T(CALC_TX.bBox3, lang), value: EUR(c.box3_tax) },
                      { label: T(CALC_TX.bTotal, lang), value: EUR(c.total_tax_due), bold: true, accent: true, line: true, big: true },
                    ].filter(Boolean).map((row, i) => {
                      const ro = row as { label: string; value: string; bold?: boolean; muted?: boolean; line?: boolean; accent?: boolean; big?: boolean };
                      return (
                        <div key={i} style={{
                          padding: "11px 20px",
                          display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center",
                          background: ro.accent ? "var(--accent-soft)" : "transparent",
                          borderTop: ro.line ? "1px solid var(--hairline)" : "none",
                        }}>
                          <span style={{ fontSize: "var(--text-sm)", color: ro.muted ? "var(--ink-3)" : "var(--ink)", fontWeight: ro.bold ? 600 : 400 }}>{ro.label}</span>
                          <span className="num" style={{
                            fontSize: ro.big ? 22 : "var(--text-sm)",
                            fontFamily: ro.big ? "var(--serif)" : "var(--mono)",
                            color: ro.accent ? "var(--sage-700)" : ro.muted ? "var(--ink-3)" : "var(--ink)",
                            fontWeight: ro.bold ? 600 : 400,
                          }}>{ro.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty results placeholder */
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {CALC_TX.ePlaceholders[lang].map(l => (
                  <div key={l} style={{ height: 96, background: "var(--paper-3)", borderRadius: "var(--r-lg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="eyebrow">{l}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
