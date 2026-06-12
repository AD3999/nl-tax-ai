import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMobile } from "../hooks/useMobile";
import type { ZZPSummary, RevenueEntry, ExpenseEntry, HoursEntry, MileageEntry, HoursResponse, MileageResponse } from "../api/zzp";
import {
  fetchZZPSummary, fetchRevenue, fetchExpenses, fetchHours, fetchMileage,
  createRevenue, createExpense, createHours, createMileage,
  deleteRevenue, deleteExpense, deleteHours, deleteMileage,
} from "../api/zzp";

const YEAR = new Date().getFullYear();

const TX = {
  nl: {
    title: "ZZP Werkplek",
    subtitle: "Bijhoud uw omzet, kosten, uren en kilometers",
    tabs: ["Overzicht", "Omzet", "Kosten", "Uren", "Kilometers", "BTW"],
    addRevenue: "Omzet toevoegen",
    addExpense: "Kosten toevoegen",
    addHours: "Uren toevoegen",
    addMileage: "Kilometer registreren",
    revenue: "Omzet", expenses: "Kosten", profit: "Winst",
    hours: "Uren", km: "Kilometers", vat: "BTW",
    hoursProgress: "Voortgang urencriterium",
    vatPayable: "Te betalen BTW",
    quarterlyVat: "Kwartaal BTW-overzicht",
    description: "Omschrijving", date: "Datum", amount: "Bedrag",
    client: "Klant", vatRate: "BTW %", payment: "Betaalstatus",
    category: "Categorie", from: "Van", to: "Naar", purpose: "Doel",
    delete: "Verwijder", save: "Opslaan", cancel: "Annuleer",
    paid: "Betaald", unpaid: "Onbetaald", overdue: "Verlopen",
    q: "K", of: "van",
  },
  en: {
    title: "ZZP Workspace",
    subtitle: "Track your revenue, expenses, hours and mileage year-round",
    tabs: ["Overview", "Revenue", "Expenses", "Hours", "Mileage", "VAT"],
    addRevenue: "Add Revenue",
    addExpense: "Add Expense",
    addHours: "Log Hours",
    addMileage: "Log Mileage",
    revenue: "Revenue", expenses: "Expenses", profit: "Profit",
    hours: "Hours", km: "Kilometers", vat: "VAT",
    hoursProgress: "Hours criterion progress",
    vatPayable: "VAT payable",
    quarterlyVat: "Quarterly VAT overview",
    description: "Description", date: "Date", amount: "Amount",
    client: "Client", vatRate: "VAT %", payment: "Payment status",
    category: "Category", from: "From", to: "To", purpose: "Purpose",
    delete: "Delete", save: "Save", cancel: "Cancel",
    paid: "Paid", unpaid: "Unpaid", overdue: "Overdue",
    q: "Q", of: "of",
  },
  fa: {
    title: "فضای کار ZZP",
    subtitle: "درآمد، هزینه، ساعات و کیلومتر خود را در طول سال ثبت کنید",
    tabs: ["نمای کلی", "درآمد", "هزینه‌ها", "ساعات", "کیلومتر", "BTW"],
    addRevenue: "افزودن درآمد",
    addExpense: "افزودن هزینه",
    addHours: "ثبت ساعت",
    addMileage: "ثبت کیلومتر",
    revenue: "درآمد", expenses: "هزینه‌ها", profit: "سود",
    hours: "ساعات", km: "کیلومتر", vat: "BTW",
    hoursProgress: "پیشرفت معیار ساعت",
    vatPayable: "BTW قابل پرداخت",
    quarterlyVat: "نمای کلی BTW فصلی",
    description: "توضیحات", date: "تاریخ", amount: "مبلغ",
    client: "مشتری", vatRate: "درصد BTW", payment: "وضعیت پرداخت",
    category: "دسته‌بندی", from: "از", to: "به", purpose: "هدف",
    delete: "حذف", save: "ذخیره", cancel: "لغو",
    paid: "پرداخت شده", unpaid: "پرداخت نشده", overdue: "گذشته",
    q: "فصل", of: "از",
  },
} as const;

type Lang = keyof typeof TX;

type T = {
  title: string; subtitle: string; tabs: readonly string[];
  addRevenue: string; addExpense: string; addHours: string; addMileage: string;
  revenue: string; expenses: string; profit: string; hours: string; km: string; vat: string;
  hoursProgress: string; vatPayable: string; quarterlyVat: string;
  description: string; date: string; amount: string; client: string; vatRate: string;
  payment: string; category: string; from: string; to: string; purpose: string;
  delete: string; save: string; cancel: string; paid: string; unpaid: string; overdue: string;
  q: string; of: string;
};

function fmt(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}

// ── Quick action buttons ──────────────────────────────────────────────────────
function QuickActions({ t, onAdd }: { t: T; onAdd: (tab: number) => void }) {
  const actions = [
    { label: t.addRevenue, tab: 1, bg: "var(--ok-subtle)",     accent: "var(--ok)",     icon: "↑" },
    { label: t.addExpense, tab: 2, bg: "var(--danger-subtle)", accent: "var(--danger)", icon: "↓" },
    { label: t.addHours,   tab: 3, bg: "var(--info-subtle)",   accent: "var(--info)",   icon: "⏱" },
    { label: t.addMileage, tab: 4, bg: "var(--purple-subtle)", accent: "var(--purple)", icon: "🛣" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "var(--sp-3)", marginBottom: "var(--sp-6)" }}>
      {actions.map(({ label, tab, bg, accent, icon }) => (
        <button
          key={tab}
          onClick={() => onAdd(tab)}
          style={{
            display: "flex", alignItems: "center", gap: "var(--sp-3)",
            padding: "var(--sp-3) var(--sp-4)",
            background: bg,
            border: `1px solid ${accent}22`,
            borderRadius: 10,
            cursor: "pointer",
            transition: "transform 0.1s, box-shadow 0.1s",
            color: "var(--text)",
          }}
          onMouseOver={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--sh-md)"; }}
          onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
        >
          <span style={{
            width: 28, height: 28, borderRadius: 7,
            background: accent + "22",
            color: accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.9rem", fontWeight: 700, flexShrink: 0,
          }}>
            {icon}
          </span>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-2)", lineHeight: 1.2 }}>
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab({ summary, t }: { summary: ZZPSummary | null; t: T }) {
  if (!summary) return <div className="skel" style={{ height: 300 }} />;

  const kpis = [
    { label: t.revenue,    value: fmt(summary.total_revenue),  accent: "var(--ok)",     icon: "↑", positive: true },
    { label: t.expenses,   value: fmt(summary.total_expenses), accent: "var(--danger)", icon: "↓", positive: false },
    { label: t.profit,     value: fmt(summary.gross_profit),   accent: "var(--blue)",   icon: "=", positive: summary.gross_profit >= 0 },
    { label: t.vatPayable, value: fmt(summary.vat_payable),    accent: "var(--warn)",   icon: "%", positive: false },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: "var(--sp-4)", marginBottom: "var(--sp-6)" }}>
        {kpis.map(({ label, value, accent, icon }) => (
          <div key={label} className="card" style={{ padding: "var(--sp-4) var(--sp-5)", borderTop: `3px solid ${accent}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "var(--sp-2)" }}>
              <span style={{
                width: 22, height: 22, borderRadius: 6,
                background: accent + "22",
                color: accent,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 800, flexShrink: 0,
              }}>{icon}</span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em" }}>{label}</span>
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Hours progress */}
      <div className="card" style={{ marginBottom: "var(--sp-4)" }}>
        <div style={{ fontWeight: 700, marginBottom: "var(--sp-3)" }}>{t.hoursProgress}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
          <div style={{ flex: 1, height: 12, background: "var(--bg-3)", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${summary.hours_progress}%`, background: summary.hours_progress >= 100 ? "var(--green)" : "var(--blue)", transition: "width 0.5s" }} />
          </div>
          <span style={{ fontWeight: 700, minWidth: 100 }}>
            {summary.total_hours.toFixed(1)} {t.of} {summary.urencriterium}h ({summary.hours_progress}%)
          </span>
        </div>
      </div>

      {/* Quarterly VAT */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: "var(--sp-4)" }}>{t.quarterlyVat}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "var(--sp-3)" }}>
          {summary.quarters.map(q => (
            <div key={q.quarter} style={{ textAlign: "center", padding: "var(--sp-3)", background: "var(--bg-2)", borderRadius: 8 }}>
              <div style={{ fontWeight: 700, color: "var(--text-3)", fontSize: "0.8rem" }}>{t.q}{q.quarter}</div>
              <div style={{ fontWeight: 800, color: q.vat_payable > 0 ? "var(--danger)" : "var(--green)", marginTop: 4 }}>
                {fmt(q.vat_payable)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>{fmt(q.revenue)} rev</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Revenue tab ───────────────────────────────────────────────────────────────
function RevenueTab({ t, entries, onRefresh }: { t: T; entries: RevenueEntry[]; onRefresh: () => void }) {
  const isMobile = useMobile();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: "", description: "", client_name: "", amount_excl_vat: "", vat_rate: 21, payment_status: "unpaid" });

  const handleAdd = async () => {
    await createRevenue(form as unknown as Partial<RevenueEntry>);
    setShowForm(false);
    setForm({ date: "", description: "", client_name: "", amount_excl_vat: "", vat_rate: 21, payment_status: "unpaid" });
    onRefresh();
  };

  return (
    <div>
      <button className="btn btn-primary" style={{ marginBottom: "var(--sp-4)" }} onClick={() => setShowForm(true)}>
        + {t.addRevenue}
      </button>

      {showForm && (
        <div className="card" style={{ marginBottom: "var(--sp-4)" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr 1fr", gap: "var(--sp-3)" }}>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.date}</label><input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.description}</label><input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.client}</label><input className="input" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.amount} (excl. BTW)</label><input className="input" type="number" step="0.01" value={form.amount_excl_vat} onChange={e => setForm({ ...form, amount_excl_vat: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.vatRate}</label>
              <select className="input" value={form.vat_rate} onChange={e => setForm({ ...form, vat_rate: +e.target.value })}>
                <option value={0}>0%</option><option value={9}>9%</option><option value={21}>21%</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-4)" }}>
            <button className="btn btn-primary" onClick={handleAdd}>{t.save}</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>{t.cancel}</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
        {entries.map(e => (
          <div key={e.id} className="card" style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
            <div style={{ width: 90, color: "var(--text-3)", fontSize: "0.85rem" }}>{e.date}</div>
            <div style={{ flex: 1, fontWeight: 600 }}>{e.description}</div>
            <div style={{ color: "var(--text-3)", fontSize: "0.85rem" }}>{e.client_name}</div>
            <div style={{ fontWeight: 700 }}>{fmt(+e.amount_excl_vat)}</div>
            <span className="pill-blue" style={{ fontSize: "0.75rem" }}>{e.vat_rate}% BTW</span>
            <span style={{ fontSize: "0.75rem", color: e.payment_status === "paid" ? "var(--green)" : "var(--warn)" }}>
              {e.payment_status === "paid" ? t.paid : e.payment_status === "overdue" ? t.overdue : t.unpaid}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => { deleteRevenue(e.id).then(onRefresh); }}>✕</button>
          </div>
        ))}
        {entries.length === 0 && <div style={{ color: "var(--text-3)", padding: "var(--sp-6)", textAlign: "center" }}>No revenue entries yet.</div>}
      </div>
    </div>
  );
}

// ── Expenses tab ──────────────────────────────────────────────────────────────
function ExpensesTab({ t, entries, onRefresh }: { t: T; entries: ExpenseEntry[]; onRefresh: () => void }) {
  const isMobile = useMobile();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: "", description: "", category: "other", amount_gross: "", vat_rate: 21, business_use_pct: 100 });

  const handleAdd = async () => {
    await createExpense(form as unknown as Partial<ExpenseEntry>);
    setShowForm(false);
    setForm({ date: "", description: "", category: "other", amount_gross: "", vat_rate: 21, business_use_pct: 100 });
    onRefresh();
  };

  return (
    <div>
      <button className="btn btn-primary" style={{ marginBottom: "var(--sp-4)" }} onClick={() => setShowForm(true)}>
        + {t.addExpense}
      </button>

      {showForm && (
        <div className="card" style={{ marginBottom: "var(--sp-4)" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr 1fr 1fr", gap: "var(--sp-3)" }}>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.date}</label><input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.description}</label><input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.category}</label>
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {["laptop","phone","internet","software","travel","car","office","home_office","training","accountant","marketing","insurance","pension","equipment","meal","other"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.amount} (incl. BTW)</label><input className="input" type="number" step="0.01" value={form.amount_gross} onChange={e => setForm({ ...form, amount_gross: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.vatRate}</label>
              <select className="input" value={form.vat_rate} onChange={e => setForm({ ...form, vat_rate: +e.target.value })}>
                <option value={0}>0%</option><option value={9}>9%</option><option value={21}>21%</option>
              </select>
            </div>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>Zakelijk %</label><input className="input" type="number" min={0} max={100} value={form.business_use_pct} onChange={e => setForm({ ...form, business_use_pct: +e.target.value })} /></div>
          </div>
          <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-4)" }}>
            <button className="btn btn-primary" onClick={handleAdd}>{t.save}</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>{t.cancel}</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
        {entries.map(e => (
          <div key={e.id} className="card" style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
            <div style={{ width: 90, color: "var(--text-3)", fontSize: "0.85rem" }}>{e.date}</div>
            <div style={{ flex: 1, fontWeight: 600 }}>{e.description}</div>
            <span className="pill-blue" style={{ fontSize: "0.75rem" }}>{e.category}</span>
            <div style={{ fontWeight: 700 }}>{fmt(+e.amount_gross)}</div>
            <div style={{ color: "var(--text-3)", fontSize: "0.85rem" }}>aft. {fmt(+e.deductible_amount)}</div>
            <button className="btn btn-ghost btn-sm" onClick={() => { deleteExpense(e.id).then(onRefresh); }}>✕</button>
          </div>
        ))}
        {entries.length === 0 && <div style={{ color: "var(--text-3)", padding: "var(--sp-6)", textAlign: "center" }}>No expense entries yet.</div>}
      </div>
    </div>
  );
}

// ── Hours tab ─────────────────────────────────────────────────────────────────
function HoursTab({ t, data, onRefresh }: { t: T; data: HoursResponse | null; onRefresh: () => void }) {
  const isMobile = useMobile();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: "", hours: "", description: "", client_name: "" });

  const handleAdd = async () => {
    await createHours(form as unknown as Partial<HoursEntry>);
    setShowForm(false);
    setForm({ date: "", hours: "", description: "", client_name: "" });
    onRefresh();
  };

  if (!data) return <div className="skel" style={{ height: 200 }} />;

  return (
    <div>
      <div className="card" style={{ marginBottom: "var(--sp-4)" }}>
        <div style={{ fontWeight: 700, marginBottom: "var(--sp-3)" }}>
          {t.hoursProgress}: {data.total_hours.toFixed(1)} / {data.urencriterium}h
        </div>
        <div style={{ height: 16, background: "var(--bg-3)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${data.progress_pct}%`, background: data.progress_pct >= 100 ? "var(--green)" : "var(--blue)", transition: "width 0.5s" }} />
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-3)", marginTop: "var(--sp-2)" }}>
          {data.progress_pct}% — {Math.max(0, data.urencriterium - data.total_hours).toFixed(1)}h remaining
        </div>
      </div>

      <button className="btn btn-primary" style={{ marginBottom: "var(--sp-4)" }} onClick={() => setShowForm(true)}>
        + {t.addHours}
      </button>

      {showForm && (
        <div className="card" style={{ marginBottom: "var(--sp-4)" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 2fr 1fr", gap: "var(--sp-3)" }}>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.date}</label><input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>Uren</label><input className="input" type="number" step="0.5" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.description}</label><input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.client}</label><input className="input" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></div>
          </div>
          <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-4)" }}>
            <button className="btn btn-primary" onClick={handleAdd}>{t.save}</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>{t.cancel}</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
        {data.entries.map(e => (
          <div key={e.id} className="card" style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
            <div style={{ width: 90, color: "var(--text-3)", fontSize: "0.85rem" }}>{e.date}</div>
            <div style={{ fontWeight: 700, minWidth: 60 }}>{e.hours}h</div>
            <div style={{ flex: 1 }}>{e.description}</div>
            <div style={{ color: "var(--text-3)", fontSize: "0.85rem" }}>{e.client_name}</div>
            <button className="btn btn-ghost btn-sm" onClick={() => { deleteHours(e.id).then(onRefresh); }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mileage tab ───────────────────────────────────────────────────────────────
function MileageTab({ t, data, onRefresh }: { t: T; data: MileageResponse | null; onRefresh: () => void }) {
  const isMobile = useMobile();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: "", from_location: "", to_location: "", km: "", purpose: "", is_business: true });

  const handleAdd = async () => {
    await createMileage(form as unknown as Partial<MileageEntry>);
    setShowForm(false);
    setForm({ date: "", from_location: "", to_location: "", km: "", purpose: "", is_business: true });
    onRefresh();
  };

  if (!data) return <div className="skel" style={{ height: 200 }} />;

  return (
    <div>
      <div style={{ display: "flex", gap: "var(--sp-4)", marginBottom: "var(--sp-4)" }}>
        <div className="card" style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>Zakelijk {t.km}</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{data.business_km.toFixed(0)} km</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>Aftrekbaar</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{fmt(data.deductible_amount)}</div>
        </div>
      </div>

      <button className="btn btn-primary" style={{ marginBottom: "var(--sp-4)" }} onClick={() => setShowForm(true)}>
        + {t.addMileage}
      </button>

      {showForm && (
        <div className="card" style={{ marginBottom: "var(--sp-4)" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr 1fr", gap: "var(--sp-3)" }}>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.date}</label><input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.from}</label><input className="input" value={form.from_location} onChange={e => setForm({ ...form, from_location: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.to}</label><input className="input" value={form.to_location} onChange={e => setForm({ ...form, to_location: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>KM</label><input className="input" type="number" step="0.1" value={form.km} onChange={e => setForm({ ...form, km: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.purpose}</label><input className="input" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} /></div>
          </div>
          <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-4)" }}>
            <button className="btn btn-primary" onClick={handleAdd}>{t.save}</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>{t.cancel}</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
        {data.entries.map(e => (
          <div key={e.id} className="card" style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
            <div style={{ width: 90, color: "var(--text-3)", fontSize: "0.85rem" }}>{e.date}</div>
            <div style={{ flex: 1 }}>{e.from_location} → {e.to_location}</div>
            <div style={{ fontWeight: 700 }}>{e.km} km</div>
            <div style={{ color: "var(--text-3)", fontSize: "0.85rem" }}>{e.purpose}</div>
            <span className="pill-blue" style={{ fontSize: "0.75rem" }}>{e.is_business ? "Zakelijk" : "Privé"}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => { deleteMileage(e.id).then(onRefresh); }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── VAT tab ───────────────────────────────────────────────────────────────────
function VATTab({ t, summary }: { t: T; summary: ZZPSummary | null }) {
  if (!summary) return <div className="skel" style={{ height: 300 }} />;
  return (
    <div>
      <div className="card" style={{ marginBottom: "var(--sp-4)" }}>
        <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "var(--sp-4)" }}>{t.quarterlyVat} {summary.year}</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)" }}>
              <th style={{ padding: "var(--sp-3)", textAlign: "left", fontSize: "0.85rem", color: "var(--text-3)" }}>Kwartaal</th>
              <th style={{ padding: "var(--sp-3)", textAlign: "right", fontSize: "0.85rem", color: "var(--text-3)" }}>Omzet</th>
              <th style={{ padding: "var(--sp-3)", textAlign: "right", fontSize: "0.85rem", color: "var(--text-3)" }}>Kosten</th>
              <th style={{ padding: "var(--sp-3)", textAlign: "right", fontSize: "0.85rem", color: "var(--text-3)" }}>Winst</th>
              <th style={{ padding: "var(--sp-3)", textAlign: "right", fontSize: "0.85rem", color: "var(--text-3)" }}>BTW afdracht</th>
              <th style={{ padding: "var(--sp-3)", textAlign: "right", fontSize: "0.85rem", color: "var(--text-3)" }}>Deadline</th>
            </tr>
          </thead>
          <tbody>
            {summary.quarters.map(q => {
              const deadlines = ["30 apr", "31 jul", "31 okt", "31 jan"];
              return (
                <tr key={q.quarter} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "var(--sp-3)", fontWeight: 700 }}>K{q.quarter} {summary.year}</td>
                  <td style={{ padding: "var(--sp-3)", textAlign: "right" }}>{fmt(q.revenue)}</td>
                  <td style={{ padding: "var(--sp-3)", textAlign: "right" }}>{fmt(q.expenses)}</td>
                  <td style={{ padding: "var(--sp-3)", textAlign: "right", fontWeight: 700 }}>{fmt(q.profit)}</td>
                  <td style={{ padding: "var(--sp-3)", textAlign: "right", fontWeight: 700, color: q.vat_payable > 0 ? "var(--danger)" : "var(--green)" }}>
                    {fmt(q.vat_payable)}
                  </td>
                  <td style={{ padding: "var(--sp-3)", textAlign: "right", color: "var(--text-3)", fontSize: "0.85rem" }}>{deadlines[q.quarter - 1]}</td>
                </tr>
              );
            })}
            <tr style={{ borderTop: "2px solid var(--border)", fontWeight: 800 }}>
              <td style={{ padding: "var(--sp-3)" }}>Totaal</td>
              <td style={{ padding: "var(--sp-3)", textAlign: "right" }}>{fmt(summary.total_revenue)}</td>
              <td style={{ padding: "var(--sp-3)", textAlign: "right" }}>{fmt(summary.total_expenses)}</td>
              <td style={{ padding: "var(--sp-3)", textAlign: "right" }}>{fmt(summary.gross_profit)}</td>
              <td style={{ padding: "var(--sp-3)", textAlign: "right", color: summary.vat_payable > 0 ? "var(--danger)" : "var(--green)" }}>{fmt(summary.vat_payable)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ZZPWorkspacePage() {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) as Lang) in TX ? (i18n.language?.substring(0, 2) as Lang) : "en";
  const t = TX[lang] as T;

  const [activeTab, setActiveTab] = useState(0);
  const [summary, setSummary]     = useState<ZZPSummary | null>(null);
  const [revenue, setRevenue]     = useState<RevenueEntry[]>([]);
  const [expenses, setExpenses]   = useState<ExpenseEntry[]>([]);
  const [hours, setHours]         = useState<HoursResponse | null>(null);
  const [mileage, setMileage]     = useState<MileageResponse | null>(null);

  const loadAll = useCallback(async () => {
    const [s, r, e, h, m] = await Promise.allSettled([
      fetchZZPSummary(YEAR),
      fetchRevenue(YEAR),
      fetchExpenses(YEAR),
      fetchHours(YEAR),
      fetchMileage(YEAR),
    ]);
    if (s.status === "fulfilled") setSummary(s.value);
    if (r.status === "fulfilled") setRevenue(r.value);
    if (e.status === "fulfilled") setExpenses(e.value);
    if (h.status === "fulfilled") setHours(h.value);
    if (m.status === "fulfilled") setMileage(m.value);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "var(--sp-6) var(--sp-4)" }}>
      <div style={{ marginBottom: "var(--sp-6)" }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.8rem", margin: 0 }}>{t.title} {YEAR}</h1>
        <p style={{ color: "var(--text-3)", margin: "var(--sp-2) 0 0" }}>{t.subtitle}</p>
      </div>

      <QuickActions t={t} onAdd={setActiveTab} />

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border)", marginBottom: "var(--sp-6)" }}>
        {t.tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              padding: "var(--sp-3) var(--sp-5)",
              border: "none", background: "none", cursor: "pointer",
              fontWeight: activeTab === i ? 700 : 500,
              color: activeTab === i ? "var(--blue)" : "var(--text-2)",
              borderBottom: activeTab === i ? "2px solid var(--blue)" : "2px solid transparent",
              marginBottom: -2,
              fontSize: "0.95rem",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && <OverviewTab summary={summary} t={t} />}
      {activeTab === 1 && <RevenueTab t={t} entries={revenue} onRefresh={loadAll} />}
      {activeTab === 2 && <ExpensesTab t={t} entries={expenses} onRefresh={loadAll} />}
      {activeTab === 3 && <HoursTab t={t} data={hours} onRefresh={loadAll} />}
      {activeTab === 4 && <MileageTab t={t} data={mileage} onRefresh={loadAll} />}
      {activeTab === 5 && <VATTab t={t} summary={summary} />}
    </div>
  );
}
