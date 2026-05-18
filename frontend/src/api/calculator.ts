import { client } from "./client";

export interface CalcInput {
  user_type: "zzp" | "employee" | "expat" | "dga";
  year?: number;
  annual_revenue_zzp?: number | null;
  employment_income?: number | null;
  business_expenses?: number;
  hours_per_year?: number | null;
  is_starter?: boolean;
  has_partner?: boolean;
  children_under_12?: number;
  net_assets_box3?: number;
  savings_fraction?: number;
  box2_dividend?: number;
  pension_contribution?: number;
  kia_investments?: number;
  uses_30pct_ruling?: boolean;
  ruling_year?: number;
  single_client_percentage?: number | null;
}

export interface CalcResult {
  calculation: {
    gross_revenue: number;
    business_expenses: number;
    gross_profit: number;
    zelfstandigenaftrek: number;
    startersaftrek: number;
    kia_deduction: number;
    pension_deduction: number;
    ondernemersaftrek_total: number;
    profit_after_ondernemers: number;
    mkb_winstvrijstelling: number;
    taxable_income_box1: number;
    box1_tax_bracket1: number;
    box1_tax_bracket2: number;
    box1_tax_bracket3: number;
    box1_tax_raw: number;
    algemene_heffingskorting: number;
    arbeidskorting: number;
    iack: number;
    income_tax_after_credits: number;
    zvw_contribution: number;
    box2_tax: number;
    box3_tax: number;
    total_tax_due: number;
    effective_rate: number;
  };
  result: {
    total_tax_due: number;
    effective_rate: number;
    monthly_reserve_needed: number;
    wet_dba_risk: string;
  };
}

export const calculateTax = (input: CalcInput) =>
  client.post<CalcResult>("/calculator/calculate/", input).then((r) => r.data);
