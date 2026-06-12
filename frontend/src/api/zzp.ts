import { client as apiClient } from "./client";

export interface RevenueEntry {
  id: number;
  date: string;
  description: string;
  client_name: string;
  invoice_number: string;
  amount_excl_vat: string;
  vat_rate: number;
  vat_amount: string;
  amount_incl_vat: string;
  payment_status: "unpaid" | "paid" | "overdue" | "partial";
  payment_date: string | null;
  invoice_file: string | null;
  year: number;
  quarter: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseEntry {
  id: number;
  date: string;
  description: string;
  category: string;
  supplier_name: string;
  amount_gross: string;
  vat_rate: number;
  vat_amount: string;
  amount_net: string;
  business_use_pct: number;
  deductible_amount: string;
  receipt_file: string | null;
  year: number;
  quarter: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface HoursEntry {
  id: number;
  date: string;
  hours: string;
  description: string;
  client_name: string;
  year: number;
  week: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface MileageEntry {
  id: number;
  date: string;
  from_location: string;
  to_location: string;
  km: string;
  purpose: string;
  is_business: boolean;
  deductible_amount: number;
  year: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface HoursResponse {
  entries: HoursEntry[];
  total_hours: number;
  urencriterium: number;
  progress_pct: number;
}

export interface MileageResponse {
  entries: MileageEntry[];
  total_km: number;
  business_km: number;
  deductible_amount: number;
}

export interface QuarterSummary {
  quarter: number;
  revenue: number;
  expenses: number;
  profit: number;
  vat_payable: number;
}

export interface ZZPSummary {
  year: number;
  total_revenue: number;
  total_expenses: number;
  gross_profit: number;
  vat_payable: number;
  total_hours: number;
  urencriterium: number;
  hours_progress: number;
  total_km_business: number;
  mileage_deductible: number;
  quarters: QuarterSummary[];
}

export const fetchRevenue = (year?: number) =>
  apiClient.get<RevenueEntry[]>(`/zzp/revenue/`, { params: { year } }).then(r => r.data);

export const createRevenue = (data: FormData | Partial<RevenueEntry>) =>
  apiClient.post<RevenueEntry>(`/zzp/revenue/`, data).then(r => r.data);

export const updateRevenue = (id: number, data: Partial<RevenueEntry>) =>
  apiClient.patch<RevenueEntry>(`/zzp/revenue/${id}/`, data).then(r => r.data);

export const deleteRevenue = (id: number) =>
  apiClient.delete(`/zzp/revenue/${id}/`);

export const fetchExpenses = (year?: number) =>
  apiClient.get<ExpenseEntry[]>(`/zzp/expenses/`, { params: { year } }).then(r => r.data);

export const createExpense = (data: FormData | Partial<ExpenseEntry>) =>
  apiClient.post<ExpenseEntry>(`/zzp/expenses/`, data).then(r => r.data);

export const updateExpense = (id: number, data: Partial<ExpenseEntry>) =>
  apiClient.patch<ExpenseEntry>(`/zzp/expenses/${id}/`, data).then(r => r.data);

export const deleteExpense = (id: number) =>
  apiClient.delete(`/zzp/expenses/${id}/`);

export const fetchHours = (year?: number) =>
  apiClient.get<HoursResponse>(`/zzp/hours/`, { params: { year } }).then(r => r.data);

export const createHours = (data: Partial<HoursEntry>) =>
  apiClient.post<HoursEntry>(`/zzp/hours/`, data).then(r => r.data);

export const deleteHours = (id: number) =>
  apiClient.delete(`/zzp/hours/${id}/`);

export const fetchMileage = (year?: number) =>
  apiClient.get<MileageResponse>(`/zzp/mileage/`, { params: { year } }).then(r => r.data);

export const createMileage = (data: Partial<MileageEntry>) =>
  apiClient.post<MileageEntry>(`/zzp/mileage/`, data).then(r => r.data);

export const deleteMileage = (id: number) =>
  apiClient.delete(`/zzp/mileage/${id}/`);

export const fetchZZPSummary = (year?: number) =>
  apiClient.get<ZZPSummary>(`/zzp/summary/`, { params: { year } }).then(r => r.data);
