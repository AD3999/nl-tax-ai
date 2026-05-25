import { useState } from "react";
import { calculateTax } from "../api/calculator";
import type { CalcInput, CalcResult } from "../api/calculator";

type UserType = "zzp" | "employee" | "expat" | "dga";

const EUR = (n: number) => "€ " + n.toLocaleString("nl-NL");
const PCT = (n: number) => (n * 100).toFixed(1) + "%";

const DBA_COLOR: Record<string, string> = {
  high: "#dc2626", medium: "#ca8a04", low: "#16a34a", "n/a": "#6b7280",
};

const inputCls = "px-3 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] font-[inherit] text-sm w-full outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-bg)] box-border placeholder:opacity-45";
const labelCls = "text-[13px] font-semibold text-[var(--text-h)]";

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls}>{label}</label>
      <input type="number" className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} min="0" />
    </div>
  );
}

function Check({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 pt-6">
      <input type="checkbox" id={label} checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 cursor-pointer accent-[var(--accent)]" />
      <label htmlFor={label} className={labelCls}>{label}</label>
    </div>
  );
}

function Row({ label, value, bold, sep }: { label?: string; value?: string; bold?: boolean; sep?: boolean }) {
  if (sep) return <tr><td colSpan={2} className="py-1 border-t border-[var(--border)]" /></tr>;
  return (
    <tr className={bold ? "text-[var(--text-h)] font-semibold" : undefined}>
      <td className="py-1.5 text-sm text-[var(--text)] align-top">{label}</td>
      <td className="py-1.5 text-[13px] text-right font-mono whitespace-nowrap align-top">{value}</td>
    </tr>
  );
}

type FormState = Record<string, string | boolean>;

const DEFAULT_FORM: FormState = {
  annual_revenue_zzp: "", employment_income: "", business_expenses: "",
  hours_per_year: "", is_starter: false, has_partner: false, partner_income: "",
  children_under_12: "0", net_assets_box3: "", savings_fraction: "0",
  box2_dividend: "", pension_contribution: "", kia_investments: "",
  uses_30pct_ruling: false, ruling_year: "1", single_client_percentage: "",
};

export default function CalculatorPage() {
  const [userType, setUserType] = useState<UserType>("zzp");
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const num = (k: string): number | undefined => (form[k] ? parseFloat(form[k] as string) : undefined);
  const int = (k: string): number | undefined => (form[k] ? parseInt(form[k] as string) : undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const input: CalcInput = {
        user_type: userType, year: 2026,
        annual_revenue_zzp: userType === "zzp" ? num("annual_revenue_zzp") ?? null : null,
        employment_income: userType !== "zzp" ? num("employment_income") ?? null : null,
        business_expenses: num("business_expenses") ?? 0,
        hours_per_year: int("hours_per_year") ?? null,
        is_starter: form.is_starter as boolean,
        has_partner: form.has_partner as boolean,
        partner_income: num("partner_income") ?? null,
        children_under_12: int("children_under_12") ?? 0,
        net_assets_box3: num("net_assets_box3") ?? 0,
        savings_fraction: (parseFloat((form.savings_fraction as string) || "0")) / 100,
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
      const axiosErr = err as { response?: { data?: unknown } };
      const detail = axiosErr.response?.data;
      setError(typeof detail === "string" ? detail : JSON.stringify(detail, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const c = result?.calculation;
  const r = result?.result;

  return (
    <div className="max-w-[860px] mx-auto px-12 py-12 pb-24 flex flex-col gap-8">
      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--accent)]">Phase 3</span>
        <h1 className="text-4xl font-semibold text-[var(--text-h)] m-0 -tracking-wide leading-tight">Tax Calculator 2026</h1>
        <p className="text-[15px] text-[var(--text)] leading-relaxed max-w-[620px] m-0">
          Deterministic Dutch income tax — all values from verified 2026 rules. Try it with your own numbers.
        </p>
      </div>

      <form className="flex flex-col gap-5 p-7 bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-[var(--shadow)]" onSubmit={handleSubmit}>
        {/* User type pills */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>User type</label>
          <div className="flex gap-2 flex-wrap">
            {(["zzp", "employee", "expat", "dga"] as UserType[]).map((t) => (
              <button
                key={t} type="button"
                className={`px-[18px] py-1.5 border rounded-3xl font-[inherit] text-[13px] font-semibold cursor-pointer transition-all tracking-wide ${
                  userType === t
                    ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                    : "bg-transparent border-[var(--border)] text-[var(--text)] hover:border-[var(--accent-border)] hover:text-[var(--text-h)]"
                }`}
                onClick={() => setUserType(t)}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {userType === "zzp" ? (
            <>
              <Field label="Annual revenue (€)" value={form.annual_revenue_zzp as string} onChange={(v) => set("annual_revenue_zzp", v)} placeholder="72000" />
              <Field label="Business expenses (€)" value={form.business_expenses as string} onChange={(v) => set("business_expenses", v)} placeholder="9500" />
              <Field label="Hours per year" value={form.hours_per_year as string} onChange={(v) => set("hours_per_year", v)} placeholder="1380" />
              <Field label="KIA investments (€)" value={form.kia_investments as string} onChange={(v) => set("kia_investments", v)} placeholder="0" />
              <Field label="Single client %" value={form.single_client_percentage as string} onChange={(v) => set("single_client_percentage", v)} placeholder="0" />
              <Check label="Starter year (startersaftrek)" checked={form.is_starter as boolean} onChange={(v) => set("is_starter", v)} />
            </>
          ) : (
            <Field label="Employment income (€)" value={form.employment_income as string} onChange={(v) => set("employment_income", v)} placeholder="48000" />
          )}

          {userType === "expat" && (
            <>
              <Check label="30% ruling active" checked={form.uses_30pct_ruling as boolean} onChange={(v) => set("uses_30pct_ruling", v)} />
              {form.uses_30pct_ruling && (
                <Field label="Ruling year (1–5)" value={form.ruling_year as string} onChange={(v) => set("ruling_year", v)} placeholder="1" />
              )}
            </>
          )}

          {userType === "dga" && (
            <Field label="Box 2 dividend (€)" value={form.box2_dividend as string} onChange={(v) => set("box2_dividend", v)} placeholder="24000" />
          )}

          <Field label="Pension contribution (€)" value={form.pension_contribution as string} onChange={(v) => set("pension_contribution", v)} placeholder="0" />
          <Field label="Net assets Box 3 (€)" value={form.net_assets_box3 as string} onChange={(v) => set("net_assets_box3", v)} placeholder="0" />
          <Field label="Savings fraction (%)" value={form.savings_fraction as string} onChange={(v) => set("savings_fraction", v)} placeholder="0" />
          <Field label="Children under 12" value={form.children_under_12 as string} onChange={(v) => set("children_under_12", v)} placeholder="0" />
          <Check label="Has partner" checked={form.has_partner as boolean} onChange={(v) => set("has_partner", v)} />
          {form.has_partner && (
            <Field label="Partner income (€)" value={form.partner_income as string} onChange={(v) => set("partner_income", v)} placeholder="0" />
          )}
        </div>

        {error && <pre className="p-3 px-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[13px] font-mono whitespace-pre-wrap m-0">{error}</pre>}

        <button type="submit" className="inline-flex items-center gap-2.5 px-7 py-3 bg-[var(--accent)] text-white border-none rounded-lg font-[inherit] text-[15px] font-medium cursor-pointer self-start hover:opacity-85 disabled:opacity-45 disabled:cursor-not-allowed transition-opacity" disabled={loading}>
          {loading && (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full flex-shrink-0 animate-spin" />
          )}
          {loading ? "Calculating…" : "Calculate"}
        </button>
      </form>

      {result && c && r && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {[
              { label: "Total tax due", value: EUR(r.total_tax_due), color: undefined },
              { label: "Effective rate", value: PCT(r.effective_rate), color: undefined },
              ...(r.monthly_reserve_needed > 0 ? [{ label: "Monthly reserve", value: EUR(r.monthly_reserve_needed), color: undefined }] : []),
              ...(r.wet_dba_risk !== "n/a" ? [{ label: "Wet DBA risk", value: r.wet_dba_risk.toUpperCase(), color: DBA_COLOR[r.wet_dba_risk] ?? "#6b7280" }] : []),
            ].map((card) => (
              <div key={card.label} className="p-4 px-5 border border-[var(--border)] rounded-xl bg-[var(--bg)] flex flex-col gap-1.5">
                <div className="text-[11px] font-bold tracking-widest uppercase text-[var(--text)]">{card.label}</div>
                <div className="text-3xl font-bold text-[var(--text-h)] -tracking-wide" style={card.color ? { color: card.color } : undefined}>{card.value}</div>
              </div>
            ))}
          </div>

          <div className="p-5 px-6 border border-[var(--border)] rounded-xl bg-[var(--bg)]">
            <div className="text-[13px] font-bold tracking-widest uppercase text-[var(--text)] mb-4">Breakdown</div>
            <table className="w-full border-collapse">
              <tbody>
                <Row label="Gross revenue / income" value={EUR(c.gross_revenue)} />
                {c.business_expenses > 0 && <Row label="Business expenses" value={`− ${EUR(c.business_expenses)}`} />}
                <Row label="Gross profit" value={EUR(c.gross_profit)} bold />
                {c.zelfstandigenaftrek > 0 && <Row label="Zelfstandigenaftrek" value={`− ${EUR(c.zelfstandigenaftrek)}`} />}
                {c.startersaftrek > 0 && <Row label="Startersaftrek (last year 2026!)" value={`− ${EUR(c.startersaftrek)}`} />}
                {c.kia_deduction > 0 && <Row label="KIA deduction" value={`− ${EUR(c.kia_deduction)}`} />}
                {c.mkb_winstvrijstelling > 0 && <Row label="MKB-winstvrijstelling (12.7%)" value={`− ${EUR(c.mkb_winstvrijstelling)}`} />}
                {c.pension_deduction > 0 && <Row label="Pension deduction" value={`− ${EUR(c.pension_deduction)}`} />}
                <Row sep />
                <Row label="Taxable income (Box 1)" value={EUR(c.taxable_income_box1)} bold />
                <Row sep />
                <Row label="Box 1 — bracket 1 (35.75%)" value={EUR(c.box1_tax_bracket1)} />
                {c.box1_tax_bracket2 > 0 && <Row label="Box 1 — bracket 2 (37.07%)" value={EUR(c.box1_tax_bracket2)} />}
                {c.box1_tax_bracket3 > 0 && <Row label="Box 1 — bracket 3 (49.50%)" value={EUR(c.box1_tax_bracket3)} />}
                <Row label="Box 1 raw tax" value={EUR(c.box1_tax_raw)} />
                {c.algemene_heffingskorting > 0 && <Row label="Algemene heffingskorting" value={`− ${EUR(c.algemene_heffingskorting)}`} />}
                {c.arbeidskorting > 0 && <Row label="Arbeidskorting" value={`− ${EUR(c.arbeidskorting)}`} />}
                {c.iack > 0 && <Row label="IACK (working parents credit)" value={`− ${EUR(c.iack)}`} />}
                <Row label="Income tax after credits" value={EUR(c.income_tax_after_credits)} bold />
                {c.zvw_contribution > 0 && <Row label="ZVW contribution (4.85%)" value={EUR(c.zvw_contribution)} />}
                {c.box2_tax > 0 && <Row label="Box 2 tax (dividend)" value={EUR(c.box2_tax)} />}
                {c.box3_tax > 0 && <Row label="Box 3 tax (wealth)" value={EUR(c.box3_tax)} />}
                <Row sep />
                <Row label="TOTAL TAX DUE" value={EUR(c.total_tax_due)} bold />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
