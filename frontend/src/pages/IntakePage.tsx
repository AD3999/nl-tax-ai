import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { calculateTax } from "../api/calculator";
import type { CalcInput } from "../api/calculator";
import { Icon } from "../components/Icon";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useMobile } from "../hooks/useMobile";

type UserType = "zzp" | "employee" | "expat" | "dga";

const USER_TYPES = {
  zzp:      { label: "ZZP",      glyph: "ZZ", desc: "Freelance · self-employed",   color: "var(--blue)",   tags: ["Wet DBA", "Zelfstandigenaftrek", "MKB"] },
  employee: { label: "Employee", glyph: "EM", desc: "Salaried · payslip",          color: "var(--info)",   tags: ["Loonheffing", "IACK"] },
  expat:    { label: "Expat",    glyph: "EX", desc: "30% ruling · foreign income", color: "var(--warn)",   tags: ["30% ruling", "Foreign income"] },
  dga:      { label: "DGA",      glyph: "DG", desc: "Director · own BV",           color: "var(--purple)", tags: ["Box 2", "Salary + dividend"] },
} as const;

const WHY_TEXT: Record<number, string> = {
  1: "Your tax type changes everything — deductions, credits, even what questions the chat shows you",
  2: "Income drives every Box 1 calculation — we round to the cent on the official 2026 brackets",
  3: "Partner, kids, and Box 3 assets unlock IACK, heffingskorting transfers and the savings threshold",
};

function StepDots({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 4, borderRadius: 2, width: i === step ? 36 : 18, background: i <= step ? "var(--sage-600)" : "var(--hairline-2)", transition: "width .2s" }} />
      ))}
    </div>
  );
}

let _uid = 0;
function UnitInput({ label, unit, value, onChange, placeholder, hint }: { label: string; unit: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string }) {
  const [id] = useState(() => `unit-input-${++_uid}`);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--sp-2)" }}>
        <label htmlFor={id} className="tw-label" style={{ marginBottom: 0 }}>{label}</label>
        {hint && <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>{hint}</span>}
      </div>
      <div style={{ position: "relative" }}>
        <span aria-hidden="true" style={{ position: "absolute", insetInlineStart: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", fontSize: "var(--text-base)" }}>{unit}</span>
        <input
          id={id}
          className="tw-input"
          type="number"
          inputMode="decimal"
          min="0"
          autoComplete="off"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ paddingInlineStart: 32, fontSize: 16 }}
        />
      </div>
    </div>
  );
}

export default function IntakePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const lang = i18n.language as "nl" | "en" | "fa";
  const isRtl = lang === "fa";

  const isMobile = useMobile();
  const [step, setStep]         = useState<1 | 2 | 3>(1);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading]   = useState(false);
  const [incomeError, setIncomeError] = useState(false);

  const [revenue, setRevenue]         = useState("");
  const [expenses, setExpenses]       = useState("");
  const [hours, setHours]             = useState("1300");
  const [salary, setSalary]           = useState("");
  const [dividend, setDividend]       = useState("");
  const [rulingYear, setRulingYear]   = useState("1");
  const [isStarter, setIsStarter]     = useState(false);

  const [hasPartner, setHasPartner]       = useState(false);
  const [partnerIncome, setPartnerIncome] = useState("");
  const [children, setChildren]           = useState("0");
  const [assets, setAssets]               = useState("");
  const [pension, setPension]             = useState("");

  const handleFinish = async () => {
    if (!userType) return;
    const primaryIncome = userType === "zzp" ? revenue : salary;
    if (!primaryIncome || parseFloat(primaryIncome) <= 0) { setIncomeError(true); return; }
    setIncomeError(false);
    setLoading(true);
    const input: CalcInput = {
      user_type: userType,
      year: 2026,
      annual_revenue_zzp:   userType === "zzp" ? (parseFloat(revenue) || null) : null,
      employment_income:    userType !== "zzp" ? (parseFloat(salary) || null) : null,
      business_expenses:    parseFloat(expenses) || 0,
      hours_per_year:       userType === "zzp" ? (parseInt(hours) || 1300) : null,
      is_starter:           isStarter,
      has_partner:          hasPartner,
      partner_income:       hasPartner ? (parseFloat(partnerIncome) || null) : null,
      children_under_12:    parseInt(children) || 0,
      net_assets_box3:      parseFloat(assets) || 0,
      savings_fraction:     0.5,
      pension_contribution: parseFloat(pension) || 0,
      box2_dividend:        userType === "dga" ? (parseFloat(dividend) || 0) : 0,
      uses_30pct_ruling:    userType === "expat",
      ruling_year:          userType === "expat" ? (parseInt(rulingYear) || 1) : 1,
      single_client_percentage: null,
      kia_investments: 0,
    };
    try { await calculateTax(input); } catch { /* save anyway */ }
    localStorage.setItem("taxwijs_calc_input", JSON.stringify(input));

    // Sync to server for authenticated users
    if (user) {
      const token = localStorage.getItem("access_token");
      fetch("/api/users/profile/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ intake_profile: input }),
      }).catch(() => null);
    }

    showToast(
      lang === "nl" ? "Profiel opgeslagen — u kunt nu vragen stellen" : lang === "fa" ? "پروفایل ذخیره شد — اکنون می‌توانید سؤال بپرسید" : "Profile saved — you can now ask questions",
      "success",
    );
    setLoading(false);
    navigate("/chat");
  };

  return (
    <div className="grain" style={{ flex: 1 }} dir={isRtl ? "rtl" : "ltr"}>
      {/* Mobile step indicator strip */}
      {isMobile && (
        <div style={{ padding: "var(--sp-4) var(--sp-4) 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <StepDots step={step} />
          <span className="eyebrow">
            {lang === "nl" ? `Stap ${step} van 3` : lang === "fa" ? `مرحله ${step} از ۳` : `Step ${step} of 3`}
          </span>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "300px 1fr 300px",
        maxWidth: 1160,
        margin: "0 auto",
        padding: isMobile ? "var(--sp-4) var(--sp-4) var(--sp-12)" : "var(--sp-8) var(--sp-10) var(--sp-16)",
        gap: isMobile ? "var(--sp-5)" : "var(--sp-10)",
        alignItems: "flex-start",
      }}>

        {/* Left rail — hidden on mobile */}
        {!isMobile && <aside style={{ position: "sticky", top: 92 }}>
          <div className="eyebrow eyebrow-accent">Profile intake</div>
          <h2 style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: 30, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Two minutes —<br />one tax brain
          </h2>
          <p style={{ marginTop: 12, fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.55 }}>
            Your answers personalise the assistant. They never leave your browser unless you create an account.
          </p>

          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { i: 1, t: t("intake.step1_title"), d: "Profession & tax type" },
              { i: 2, t: t("intake.step2_title"), d: "Annual figures" },
              { i: 3, t: t("intake.step3_title"), d: "Partner · kids · assets" },
            ].map(s => {
              const done = s.i < step, active = s.i === step;
              return (
                <button key={s.i} onClick={() => setStep(s.i as 1|2|3)} style={{
                  textAlign: "start", padding: "12px 14px", border: "none",
                  background: active ? "var(--accent-soft)" : "transparent",
                  borderRadius: "var(--r)", display: "flex", gap: 12, alignItems: "center", cursor: "pointer",
                }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: 999, display: "grid", placeItems: "center",
                    background: done ? "var(--sage-600)" : active ? "var(--ink)" : "var(--paper-3)",
                    color: done || active ? "white" : "var(--ink-3)",
                    fontSize: "var(--text-xs)", fontWeight: 600, flexShrink: 0,
                  }}>
                    {done ? <Icon.check style={{ width: 12, height: 12 }} /> : s.i}
                  </span>
                  <div>
                    <div style={{ fontSize: "var(--text-sm)", color: active || done ? "var(--ink)" : "var(--ink-3)", fontWeight: 500 }}>{s.t}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>{s.d}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 24, padding: 14, border: "1px dashed var(--hairline-2)", borderRadius: "var(--r)" }}>
            <div className="eyebrow">{t("intake.estimate_label", { defaultValue: "Estimate so far" })}</div>
            <div className="font-mono" style={{ marginTop: 6, fontSize: "var(--text-xl)", color: "var(--ink)", letterSpacing: "-0.01em" }}>€ —</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
              {lang === "nl" ? "bijgewerkt na afronden" : lang === "fa" ? "بعد از پایان به‌روز می‌شود" : "updates on finish"}
            </div>
          </div>
        </aside>}

        {/* Center card */}
        <main className="card" style={{ padding: isMobile ? "var(--sp-5)" : "var(--sp-8)", borderRadius: "var(--r-xl)", boxShadow: isMobile ? "none" : "var(--shadow)" }}>
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <StepDots step={step} />
              <span className="eyebrow">
                {lang === "nl" ? `Stap ${step} van 3` : lang === "fa" ? `مرحله ${step} از ۳` : `Step ${step} of 3`}
              </span>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ marginTop: "var(--sp-6)" }}>
              <h1 style={{ fontFamily: "var(--serif)", fontSize: isMobile ? "var(--text-3xl)" : "var(--text-4xl)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                {t("intake.step1_title")}
              </h1>
              <p style={{ marginTop: "var(--sp-2)", color: "var(--ink-3)", fontSize: "var(--text-base)" }}>{t("intake.step1_subtitle")}</p>
              {!userType && (
                <div style={{ marginTop: "var(--sp-3)", fontSize: 12, color: "var(--sage-700)", fontWeight: 600 }}>
                  {lang === "nl" ? "✱ Kies een profiel om door te gaan" : lang === "fa" ? "✱ برای ادامه یک نوع را انتخاب کنید" : "✱ Select a profile to continue"}
                </div>
              )}
              <div style={{ marginTop: "var(--sp-6)", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                {(Object.entries(USER_TYPES) as [UserType, typeof USER_TYPES[UserType]][]).map(([k, v]) => {
                  const on = userType === k;
                  return (
                    <button key={k} onClick={() => setUserType(k)} style={{
                      textAlign: "start", padding: "18px 20px", borderRadius: "var(--r)",
                      border: `1px solid ${on ? "var(--sage-600)" : "var(--hairline-2)"}`,
                      background: on ? "var(--accent-soft)" : "var(--paper)",
                      display: "flex", flexDirection: "column", gap: 12, cursor: "pointer", minHeight: 150, position: "relative",
                    }}>
                      {on && (
                        <span style={{ position: "absolute", top: 14, insetInlineEnd: 14, width: 18, height: 18, borderRadius: 999, background: "var(--sage-600)", color: "white", display: "grid", placeItems: "center" }}>
                          <Icon.check style={{ width: 10, height: 10 }} />
                        </span>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 38, height: 38, borderRadius: 10, background: v.color, color: "white", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}>
                          {v.glyph}
                        </span>
                        <div>
                          <div style={{ fontFamily: "var(--serif)", fontSize: 22, color: "var(--ink)" }}>{v.label}</div>
                          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{v.desc}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {v.tags.map(tag => (
                          <span key={tag} className="eyebrow" style={{ padding: "3px 7px", background: "var(--paper-3)", borderRadius: 999 }}>{tag}</span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && userType && (
            <div style={{ marginTop: "var(--sp-6)" }}>
              <h1 style={{ fontFamily: "var(--serif)", fontSize: isMobile ? "var(--text-3xl)" : "var(--text-4xl)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                {lang === "nl" ? "Uw " : lang === "fa" ? "درآمد " : "Your "}
                <span style={{ color: "var(--sage-700)", fontWeight: 600 }}>{USER_TYPES[userType].label}</span>
                {lang === "nl" ? " inkomen" : lang === "fa" ? "" : " income"}
              </h1>
              <p style={{ marginTop: "var(--sp-2)", color: "var(--ink-3)", fontSize: "var(--text-base)" }}>
                {lang === "nl" ? "Getallen blijven op uw apparaat tot u een account aanmaakt" : lang === "fa" ? "اعداد روی دستگاه شما می‌مانند تا زمانی که حساب کاربری ایجاد کنید" : "Numbers stay on your device until you create an account"}
              </p>
              <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                {userType === "zzp" && <>
                  <UnitInput label={t("intake.revenue")} unit="€" value={revenue} onChange={setRevenue} placeholder="72000" hint="Gross before expenses" />
                  <UnitInput label={t("intake.expenses")} unit="€" value={expenses} onChange={setExpenses} placeholder="8000" hint="Software, travel, materials" />
                  <UnitInput label="Hours per year" unit="h" value={hours} onChange={setHours} placeholder="1500" hint="Need 1,225 h for zelfstandigenaftrek" />
                  <label style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 14px", background: "var(--paper-3)", borderRadius: "var(--r-sm)", fontSize: 13.5, cursor: "pointer" }}>
                    <input type="checkbox" checked={isStarter} onChange={e => setIsStarter(e.target.checked)} />
                    <span><strong style={{ color: "var(--ink)" }}>Starter year?</strong> {t("intake.is_starter")} (€2,123 — last year 2026)</span>
                  </label>
                </>}
                {(userType === "employee" || userType === "dga") && (
                  <UnitInput label={t("intake.salary")} unit="€" value={salary} onChange={setSalary} placeholder={userType === "dga" ? "56000" : "48000"} />
                )}
                {userType === "dga" && (
                  <UnitInput label={t("intake.dividend")} unit="€" value={dividend} onChange={setDividend} placeholder="12000" />
                )}
                {userType === "expat" && <>
                  <UnitInput label={t("intake.salary")} unit="€" value={salary} onChange={setSalary} placeholder="90000" />
                  <div>
                    <label htmlFor="intake-ruling-year" className="tw-label">{t("intake.ruling_year")}</label>
                    <select id="intake-ruling-year" className="tw-input" autoComplete="off" value={rulingYear} onChange={e => setRulingYear(e.target.value)} style={{ fontSize: 16 }}>
                      {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{t("intake.year_n", { n: y })}</option>)}
                    </select>
                  </div>
                </>}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div style={{ marginTop: "var(--sp-6)" }}>
              <h1 style={{ fontFamily: "var(--serif)", fontSize: isMobile ? "var(--text-3xl)" : "var(--text-4xl)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                {t("intake.step3_title")}
              </h1>
              <p style={{ marginTop: "var(--sp-2)", color: "var(--ink-3)", fontSize: "var(--text-base)" }}>{t("intake.step3_subtitle")}</p>
              <div style={{ marginTop: "var(--sp-6)", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div className="tw-label" style={{ marginBottom: 6 }}>{t("intake.has_partner")}</div>
                  <div style={{ display: "flex", border: "1px solid var(--hairline-2)", borderRadius: "var(--r-sm)", overflow: "hidden" }}>
                    {[["Yes", true], ["No", false]].map(([lbl, val]) => (
                      <button key={String(lbl)} onClick={() => setHasPartner(Boolean(val))} style={{
                        flex: 1, padding: "9px 0", fontSize: 13.5, border: "none", cursor: "pointer",
                        background: hasPartner === Boolean(val) ? "var(--accent-soft)" : "var(--paper)",
                        color: hasPartner === Boolean(val) ? "var(--sage-700)" : "var(--ink-3)",
                        fontWeight: hasPartner === Boolean(val) ? 600 : 400,
                      }}>{String(lbl)}</button>
                    ))}
                  </div>
                </div>
                {hasPartner && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <UnitInput label={t("intake.partner_income")} unit="€" value={partnerIncome} onChange={setPartnerIncome} placeholder="0" />
                  </div>
                )}
                <div>
                  <label htmlFor="intake-children" className="tw-label">{t("intake.children")}</label>
                  <select id="intake-children" className="tw-input" autoComplete="off" value={children} onChange={e => setChildren(e.target.value)} style={{ fontSize: 16 }}>
                    <option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3+</option>
                  </select>
                </div>
                <UnitInput label={t("intake.assets")} unit="€" value={assets} onChange={setAssets} placeholder="0" />
                <UnitInput label={t("intake.pension")} unit="€" value={pension} onChange={setPension} placeholder="0" />
              </div>
            </div>
          )}

          {/* Nav buttons */}
          {incomeError && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--danger-soft)", borderRadius: "var(--r-sm)", fontSize: 13, color: "var(--danger)", border: "1px solid var(--danger-soft)" }}>
              {lang === "nl" ? "Voer uw inkomen in om verder te gaan" : lang === "fa" ? "لطفاً درآمد خود را وارد کنید" : "Please enter your income to continue"}
            </div>
          )}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button className="btn btn-ghost" onClick={() => setStep(Math.max(1, step - 1) as 1|2|3)} disabled={step === 1}>
              ← {t("intake.back")}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button style={{ background: "none", border: "none", fontSize: 12.5, color: "var(--ink-4)", cursor: "pointer" }} onClick={() => navigate("/chat")}>
                {t("intake.skip")}
              </button>
              {step < 3 ? (
                <button
                  className="btn btn-accent"
                  disabled={step === 1 && !userType}
                  onClick={() => {
                    if (step === 2) {
                      const val = userType === "zzp" ? revenue : salary;
                      if (!val || parseFloat(val) <= 0) { setIncomeError(true); return; }
                      setIncomeError(false);
                    }
                    setStep((step + 1) as 2|3);
                  }}
                >
                  {t("intake.next")} <Icon.arrow />
                </button>
              ) : (
                <button className="btn btn-accent" onClick={handleFinish} disabled={loading}>
                  {loading ? t("intake.calculating") : <>{t("intake.finish")} <Icon.arrow /></>}
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Right tip — hidden on mobile */}
        {!isMobile && (
          <aside style={{ position: "sticky", top: 92 }}>
            <div className="card" style={{ padding: "var(--sp-5)", background: "var(--ink)", color: "var(--paper)", border: "none" }}>
              <span className="eyebrow" style={{ color: "var(--sage-300)" }}>
                {lang === "nl" ? "Waarom vragen we dit" : lang === "fa" ? "چرا می‌پرسیم" : "Why we ask"}
              </span>
              <p style={{ marginTop: "var(--sp-3)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)", color: "var(--text-3)" }}>
                {WHY_TEXT[step]}
              </p>
            </div>
            <div style={{ marginTop: 14, padding: 14, color: "var(--ink-3)", border: "1px solid var(--hairline)", borderRadius: "var(--r)" }}>
              <span className="eyebrow eyebrow-accent">{lang === "nl" ? "Wist u dat" : lang === "fa" ? "آیا می‌دانستید" : "Did you know"}</span>
              <p style={{ marginTop: "var(--sp-2)", color: "var(--ink-2)", fontSize: "var(--text-xs)", lineHeight: "var(--leading-relaxed)" }}>
                {lang === "nl"
                  ? "2026 is het laatste jaar van de startersaftrek (€2.123) — de chat geeft aan of u hiervoor in aanmerking komt"
                  : lang === "fa"
                  ? "۲۰۲۶ آخرین سال startersaftrek (€۲,۱۲۳) است — چت اطلاع می‌دهد اگر واجد شرایط باشید"
                  : "2026 is the last year of startersaftrek (€2,123) — the chat will flag if you qualify"}
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
