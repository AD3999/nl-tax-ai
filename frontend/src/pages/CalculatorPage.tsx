import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateTax } from "../api/calculator";
import type { CalcInput, CalcResult } from "../api/calculator";
import { Icon } from "../components/Icon";
import { useMobile } from "../hooks/useMobile";

type UserType = "zzp" | "employee" | "expat" | "dga";

const EUR = (n: number) => "€ " + n.toLocaleString("nl-NL");
const PCT = (n: number) => (n * 100).toFixed(1) + "%";

const USER_TYPES = {
  zzp:      { label: "ZZP",      color: "var(--sage-600)",      dot: "var(--sage-600)" },
  employee: { label: "Employee", color: "oklch(0.55 0.12 230)", dot: "oklch(0.55 0.12 230)" },
  expat:    { label: "Expat",    color: "oklch(0.62 0.13 50)",  dot: "oklch(0.62 0.13 50)" },
  dga:      { label: "DGA",      color: "oklch(0.55 0.10 290)", dot: "oklch(0.55 0.10 290)" },
} as const;

const DBA_TONE: Record<string, string> = {
  high: "var(--danger)", medium: "oklch(0.45 0.15 75)", low: "var(--ok)",
};

type FormState = Record<string, string | boolean>;
const DEFAULT_FORM: FormState = {
  annual_revenue_zzp: "", employment_income: "", business_expenses: "",
  hours_per_year: "", is_starter: false, has_partner: false, partner_income: "",
  children_under_12: "0", net_assets_box3: "", savings_fraction: "0",
  box2_dividend: "", pension_contribution: "", kia_investments: "",
  uses_30pct_ruling: false, ruling_year: "1", single_client_percentage: "",
};

function CalcField({ label, k, form, set, placeholder, unit, hint }: {
  label: string; k: string; form: FormState; set: (k: string, v: string) => void;
  placeholder?: string; unit?: string; hint?: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span className="tw-label">{label}</span>
        {hint && <span style={{ fontSize: 10.5, color: "var(--ink-4)" }}>{hint}</span>}
      </div>
      <div style={{ position: "relative" }}>
        {unit && <span style={{ position: "absolute", insetInlineStart: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", fontSize: 13 }}>{unit}</span>}
        <input className="tw-input" type="number" min="0"
          value={form[k] as string} onChange={e => set(k, e.target.value)}
          placeholder={placeholder}
          style={{ paddingInlineStart: unit ? 28 : undefined }} />
      </div>
    </div>
  );
}

function Toggle({ label, k, form, set }: { label: string; k: string; form: FormState; set: (k: string, v: boolean) => void }) {
  const v = form[k] as boolean;
  return (
    <div>
      <div className="tw-label" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", border: "1px solid var(--hairline-2)", borderRadius: "var(--r-sm)", overflow: "hidden" }}>
        {[["Yes", true], ["No", false]].map(([lbl, val]) => (
          <button key={String(lbl)} type="button" onClick={() => set(k, Boolean(val))} style={{
            flex: 1, padding: "9px 0", fontSize: 13, border: "none", cursor: "pointer",
            background: v === Boolean(val) ? "var(--accent-soft)" : "var(--paper)",
            color: v === Boolean(val) ? "var(--sage-700)" : "var(--ink-3)",
            fontWeight: v === Boolean(val) ? 600 : 400,
          }}>{String(lbl)}</button>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, kind }: { label: string; value: string; kind?: "primary" | "ink" | "warn" | "ok" }) {
  const bg = kind === "ink" ? "var(--ink)" : kind === "primary" ? "var(--sage-100)" : kind === "warn" ? "oklch(0.96 0.06 75)" : kind === "ok" ? "oklch(0.96 0.05 150)" : "var(--paper-2)";
  const fg = kind === "ink" ? "var(--paper)" : kind === "primary" ? "var(--sage-800)" : kind === "warn" ? "oklch(0.42 0.16 75)" : kind === "ok" ? "oklch(0.40 0.15 150)" : "var(--ink)";
  const sub = kind === "ink" ? "oklch(0.82 0.01 95)" : kind === "primary" ? "var(--sage-700)" : kind === "warn" ? "oklch(0.55 0.17 75)" : kind === "ok" ? "oklch(0.55 0.14 150)" : "var(--ink-3)";
  return (
    <div style={{ padding: 18, background: bg, borderRadius: "var(--r-lg)", border: kind ? "none" : "1px solid var(--hairline)" }}>
      <div className="eyebrow" style={{ color: sub }}>{label}</div>
      <div className="font-serif" style={{ marginTop: 8, fontSize: 38, color: fg, lineHeight: 1, letterSpacing: "-0.025em" }}>{value}</div>
    </div>
  );
}

export default function CalculatorPage() {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [userType, setUserType] = useState<UserType>("zzp");
  const [form, setForm]         = useState<FormState>(DEFAULT_FORM);
  const [result, setResult]     = useState<CalcResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  const num = (k: string): number | undefined => form[k] ? parseFloat(form[k] as string) : undefined;
  const int = (k: string): number | undefined => form[k] ? parseInt(form[k] as string) : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const input: CalcInput = {
        user_type: userType, year: 2026,
        annual_revenue_zzp: userType === "zzp" ? num("annual_revenue_zzp") ?? null : null,
        employment_income:  userType !== "zzp" ? num("employment_income") ?? null : null,
        business_expenses: num("business_expenses") ?? 0,
        hours_per_year: int("hours_per_year") ?? null,
        is_starter: form.is_starter as boolean,
        has_partner: form.has_partner as boolean,
        partner_income: num("partner_income") ?? null,
        children_under_12: int("children_under_12") ?? 0,
        net_assets_box3: num("net_assets_box3") ?? 0,
        savings_fraction: parseFloat((form.savings_fraction as string) || "0") / 100,
        box2_dividend: num("box2_dividend") ?? 0,
        pension_contribution: num("pension_contribution") ?? 0,
        kia_investments: num("kia_investments") ?? 0,
        uses_30pct_ruling: form.uses_30pct_ruling as boolean,
        ruling_year: int("ruling_year") ?? 1,
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
    <div style={{ flex: 1, background: "var(--paper)", overflowY: "auto" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "44px 40px 64px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div className="eyebrow eyebrow-accent">2026 Calculator</div>
            <h1 style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: 42, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              See every euro, by bracket.
            </h1>
            <p style={{ marginTop: 6, color: "var(--ink-3)", fontSize: 14 }}>
              No AI — pure deterministic engine. Same numbers your accountant would get.
            </p>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate("/chat")}>
            <Icon.spark /> Discuss with TaxWijs
          </button>
        </div>

        {/* Type selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {(Object.entries(USER_TYPES) as [UserType, typeof USER_TYPES[UserType]][]).map(([k, v]) => (
            <button key={k} type="button" onClick={() => setUserType(k)} style={{
              padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: "pointer",
              border: `1px solid ${userType === k ? "transparent" : "var(--hairline-2)"}`,
              background: userType === k ? "var(--ink)" : "var(--paper)",
              color: userType === k ? "var(--paper)" : "var(--ink-3)",
              display: "inline-flex", alignItems: "center", gap: 8, transition: "all .15s",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: userType === k ? v.dot : "var(--hairline-2)" }} />
              {v.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.05fr", gap: isMobile ? 16 : 24, alignItems: "flex-start" }}>
            {/* Form card */}
            <div className="card" style={{ padding: 26 }}>
              <div className="eyebrow eyebrow-accent">Inputs</div>
              <h2 style={{ marginTop: 4, fontSize: 18, color: "var(--ink)", fontWeight: 500 }}>Your situation</h2>

              <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                {userType === "zzp" && <>
                  <CalcField label="Annual revenue" k="annual_revenue_zzp" form={form} set={set} unit="€" placeholder="72000" />
                  <CalcField label="Business expenses" k="business_expenses" form={form} set={set} unit="€" placeholder="9500" />
                  <CalcField label="Hours per year" k="hours_per_year" form={form} set={set} unit="h" placeholder="1380" hint="≥ 1,225 h" />
                  <CalcField label="KIA investments" k="kia_investments" form={form} set={set} unit="€" placeholder="0" />
                  <CalcField label="Single client %" k="single_client_percentage" form={form} set={set} unit="%" placeholder="0" hint="Wet DBA test" />
                  <Toggle label="Starter year?" k="is_starter" form={form} set={(k, v) => set(k, v)} />
                </>}
                {userType !== "zzp" && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <CalcField label="Employment income" k="employment_income" form={form} set={set} unit="€" placeholder="48000" />
                  </div>
                )}
                {userType === "expat" && <>
                  <Toggle label="30% ruling active" k="uses_30pct_ruling" form={form} set={(k, v) => set(k, v)} />
                  {form.uses_30pct_ruling && <CalcField label="Ruling year (1–5)" k="ruling_year" form={form} set={set} placeholder="1" />}
                </>}
                {userType === "dga" && (
                  <CalcField label="Box 2 dividend" k="box2_dividend" form={form} set={set} unit="€" placeholder="24000" />
                )}
              </div>

              <div className="dots" style={{ margin: "22px 0" }} />
              <div className="eyebrow">Household</div>
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                <CalcField label="Pension contribution" k="pension_contribution" form={form} set={set} unit="€" placeholder="0" />
                <CalcField label="Net assets Box 3" k="net_assets_box3" form={form} set={set} unit="€" placeholder="0" />
                <CalcField label="Savings fraction %" k="savings_fraction" form={form} set={set} unit="%" placeholder="50" />
                <CalcField label="Children under 12" k="children_under_12" form={form} set={set} placeholder="0" />
                <Toggle label="Has partner?" k="has_partner" form={form} set={(k, v) => set(k, v)} />
                {form.has_partner && <CalcField label="Partner income" k="partner_income" form={form} set={set} unit="€" placeholder="0" />}
              </div>

              {error && (
                <div style={{ marginTop: 14, padding: 12, background: "var(--danger-soft)", borderRadius: "var(--r-sm)", fontSize: 13, color: "var(--danger)" }}>
                  {error}
                </div>
              )}

              <button className="btn btn-accent btn-lg" type="submit" disabled={loading} style={{ width: "100%", marginTop: 22 }}>
                {loading ? "Calculating…" : <>Calculate <Icon.arrow /></>}
              </button>
            </div>

            {/* Results */}
            {result && c && r ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                  <SummaryCard kind="primary" label="Total tax due 2026" value={EUR(r.total_tax_due)} />
                  <SummaryCard kind="ink" label="Effective rate" value={PCT(r.effective_rate)} />
                  {r.monthly_reserve_needed > 0 && <SummaryCard label="Monthly reserve" value={EUR(r.monthly_reserve_needed)} />}
                  {r.wet_dba_risk !== "n/a" && (
                    <div style={{ padding: 18, background: r.wet_dba_risk === "high" ? "var(--danger-soft)" : r.wet_dba_risk === "medium" ? "var(--warn-soft)" : "var(--ok-soft)", borderRadius: "var(--r-lg)" }}>
                      <div className="eyebrow" style={{ color: DBA_TONE[r.wet_dba_risk] ?? "var(--ink-3)" }}>Wet DBA risk</div>
                      <div className="font-serif" style={{ marginTop: 8, fontSize: 30, color: DBA_TONE[r.wet_dba_risk], lineHeight: 1 }}>{r.wet_dba_risk.toUpperCase()}</div>
                    </div>
                  )}
                </div>

                {/* Bracket bar */}
                <div className="card" style={{ padding: 20 }}>
                  <div className="eyebrow eyebrow-accent">2026 Box 1 brackets</div>
                  <div style={{ marginTop: 14, height: 10, borderRadius: 999, background: "var(--paper-3)", overflow: "hidden", display: "flex" }}>
                    <div style={{ width: "60%", background: "var(--sage-400)" }} />
                    <div style={{ width: "35%", background: "var(--sage-600)" }} />
                    <div style={{ width: "5%", background: "var(--ink)" }} />
                  </div>
                  <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 4, fontSize: 11.5, color: "var(--ink-3)" }}>
                    <span>35.75% · up to €38,883</span>
                    <span style={{ textAlign: "center" }}>37.07% · AOW only</span>
                    <span style={{ textAlign: "end" }}>49.50% · €78,426+</span>
                  </div>
                </div>

                {/* Breakdown table */}
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--hairline)" }}>
                    <div>
                      <div className="eyebrow eyebrow-accent">Full breakdown</div>
                      <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>2026 income → total tax</div>
                    </div>
                  </div>
                  <div>
                    {[
                      { label: "Gross revenue / income", value: EUR(c.gross_revenue), bold: true },
                      c.business_expenses > 0 && { label: "Business expenses", value: `− ${EUR(c.business_expenses)}`, muted: true },
                      { label: "Gross profit", value: EUR(c.gross_profit), bold: true, line: true },
                      c.zelfstandigenaftrek > 0 && { label: "Zelfstandigenaftrek", value: `− ${EUR(c.zelfstandigenaftrek)}`, muted: true },
                      c.startersaftrek > 0 && { label: "Startersaftrek (last year!)", value: `− ${EUR(c.startersaftrek)}`, muted: true },
                      c.kia_deduction > 0 && { label: "KIA deduction", value: `− ${EUR(c.kia_deduction)}`, muted: true },
                      c.mkb_winstvrijstelling > 0 && { label: "MKB-winstvrijstelling (12.7%)", value: `− ${EUR(c.mkb_winstvrijstelling)}`, muted: true },
                      c.pension_deduction > 0 && { label: "Pension deduction", value: `− ${EUR(c.pension_deduction)}`, muted: true },
                      { label: "Taxable income (Box 1)", value: EUR(c.taxable_income_box1), bold: true, line: true },
                      { label: "Box 1 bracket 1 (35.75%)", value: EUR(c.box1_tax_bracket1) },
                      c.box1_tax_bracket2 > 0 && { label: "Box 1 bracket 2 (37.07%)", value: EUR(c.box1_tax_bracket2) },
                      c.box1_tax_bracket3 > 0 && { label: "Box 1 bracket 3 (49.50%)", value: EUR(c.box1_tax_bracket3) },
                      c.algemene_heffingskorting > 0 && { label: "− Algemene heffingskorting", value: `− ${EUR(c.algemene_heffingskorting)}`, muted: true },
                      c.arbeidskorting > 0 && { label: "− Arbeidskorting", value: `− ${EUR(c.arbeidskorting)}`, muted: true },
                      c.iack > 0 && { label: "− IACK (working parents)", value: `− ${EUR(c.iack)}`, muted: true },
                      { label: "Income tax after credits", value: EUR(c.income_tax_after_credits), bold: true, line: true },
                      c.zvw_contribution > 0 && { label: "ZVW contribution (4.85%)", value: EUR(c.zvw_contribution) },
                      c.box2_tax > 0 && { label: "Box 2 tax (dividend)", value: EUR(c.box2_tax) },
                      c.box3_tax > 0 && { label: "Box 3 tax (wealth)", value: EUR(c.box3_tax) },
                      { label: "Total tax due 2026", value: EUR(c.total_tax_due), bold: true, accent: true, line: true, big: true },
                    ].filter(Boolean).map((row, i) => {
                      const ro = row as { label: string; value: string; bold?: boolean; muted?: boolean; line?: boolean; accent?: boolean; big?: boolean };
                      return (
                        <div key={i} style={{
                          padding: "11px 20px",
                          display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center",
                          background: ro.accent ? "var(--accent-soft)" : "transparent",
                          borderTop: ro.line ? "1px solid var(--hairline)" : "none",
                        }}>
                          <span style={{ fontSize: 13.5, color: ro.muted ? "var(--ink-3)" : "var(--ink)", fontWeight: ro.bold ? 600 : 400 }}>{ro.label}</span>
                          <span className="num" style={{
                            fontSize: ro.big ? 22 : 13.5,
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
                {["Total tax due", "Effective rate", "Monthly reserve"].map(l => (
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
  );
}
