import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { calculateTax } from "../api/calculator";
import type { CalcInput } from "../api/calculator";

type UserType = "zzp" | "employee" | "expat" | "dga";

const TYPES: Array<{ key: UserType; icon: string; i18nDesc: string }> = [
  { key: "zzp",      icon: "💼", i18nDesc: "intake.zzp_desc" },
  { key: "employee", icon: "🏢", i18nDesc: "intake.employee_desc" },
  { key: "expat",    icon: "🌍", i18nDesc: "intake.expat_desc" },
  { key: "dga",      icon: "🏛️", i18nDesc: "intake.dga_desc" },
];

const inputCls = "w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text)] font-[inherit] text-sm outline-none transition-colors focus:border-[var(--accent)] box-border";

export default function IntakePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === "fa";

  const [step, setStep]           = useState<1 | 2 | 3>(1);
  const [userType, setUserType]   = useState<UserType>("zzp");
  const [loading, setLoading]     = useState(false);

  const [revenue, setRevenue]       = useState("");
  const [expenses, setExpenses]     = useState("");
  const [salary, setSalary]         = useState("");
  const [dividend, setDividend]     = useState("");
  const [rulingYear, setRulingYear] = useState("1");
  const [isStarter, setIsStarter]   = useState(false);

  const [hasPartner, setHasPartner]       = useState(false);
  const [partnerIncome, setPartnerIncome] = useState("");
  const [children, setChildren]           = useState("0");
  const [assets, setAssets]               = useState("");
  const [pension, setPension]             = useState("");

  const handleFinish = async () => {
    setLoading(true);
    const input: CalcInput = {
      user_type: userType,
      year: 2026,
      annual_revenue_zzp:  userType === "zzp"  ? (parseFloat(revenue) || null)  : null,
      employment_income:   userType !== "zzp"  ? (parseFloat(salary)  || null)  : null,
      business_expenses:   parseFloat(expenses) || 0,
      hours_per_year:      userType === "zzp"  ? 1300 : null,
      is_starter:          isStarter,
      has_partner:         hasPartner,
      partner_income:      hasPartner ? (parseFloat(partnerIncome) || null) : null,
      children_under_12:   parseInt(children) || 0,
      net_assets_box3:     parseFloat(assets) || 0,
      savings_fraction:    0.5,
      pension_contribution: parseFloat(pension) || 0,
      box2_dividend:       userType === "dga"  ? (parseFloat(dividend) || 0) : 0,
      uses_30pct_ruling:   userType === "expat",
      ruling_year:         userType === "expat" ? (parseInt(rulingYear) || 1) : 1,
      single_client_percentage: null,
      kia_investments:     0,
    };
    try { await calculateTax(input); } catch { /* save anyway */ }
    localStorage.setItem("taxwijs_calc_input", JSON.stringify(input));
    setLoading(false);
    navigate("/chat");
  };

  const labelCls = "text-[13px] font-medium text-[var(--text)]";
  const checkCls = "flex items-center gap-2 text-sm text-[var(--text)] cursor-pointer mt-0.5";
  const btnPrimary = "px-6 py-2.5 rounded-lg border-none bg-[var(--accent)] text-white font-[inherit] text-sm font-medium cursor-pointer hover:opacity-85 disabled:opacity-45 disabled:cursor-not-allowed transition-opacity";
  const btnBack = "px-5 py-2.5 rounded-lg border border-[var(--border)] bg-transparent font-[inherit] text-sm text-[var(--text)] cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors";

  return (
    <div className="min-h-[calc(100vh-52px)] flex items-center justify-center px-6 py-10 bg-[var(--bg)]" dir={isRtl ? "rtl" : "ltr"}>
      <div className="w-full max-w-[540px] bg-[var(--card-bg,#f9f9f9)] border border-[var(--border)] rounded-2xl px-12 py-10 flex flex-col gap-5">

        {/* Progress dots */}
        <div className="flex gap-2 justify-center">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className={`w-2 h-2 rounded-full ${n <= step ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`} />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <>
            <h2 className="text-[22px] font-semibold text-[var(--text-h)] m-0 text-center">{t("intake.step1_title")}</h2>
            <p className="text-sm text-[var(--text)] opacity-70 m-0 -mt-3 text-center leading-relaxed">{t("intake.step1_subtitle")}</p>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map(({ key, icon, i18nDesc }) => (
                <button
                  key={key}
                  className={`flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl border-2 cursor-pointer text-center transition-all ${
                    userType === key
                      ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]"
                      : "border-[var(--border)] bg-[var(--bg)] text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--accent-bg)]"
                  }`}
                  onClick={() => setUserType(key)}
                >
                  <span className="text-2xl">{icon}</span>
                  <strong className="text-sm">{t(`user_types.${key}`)}</strong>
                  <span className="text-[11px] opacity-65 leading-tight font-normal text-[var(--text)]">{t(i18nDesc)}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-1">
              <button className={btnPrimary} onClick={() => setStep(2)}>{t("intake.next")} →</button>
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <h2 className="text-[22px] font-semibold text-[var(--text-h)] m-0 text-center">{t("intake.step2_title")}</h2>
            <p className="text-sm text-[var(--text)] opacity-70 m-0 -mt-3 text-center leading-relaxed">{t("intake.step2_subtitle")}</p>
            <div className="flex flex-col gap-2.5">
              {userType === "zzp" && <>
                <label className={labelCls}>{t("intake.revenue")}</label>
                <input className={inputCls} type="number" min="0" value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="72000" />
                <label className={labelCls}>{t("intake.expenses")}</label>
                <input className={inputCls} type="number" min="0" value={expenses} onChange={e => setExpenses(e.target.value)} placeholder="5000" />
                <label className={checkCls}><input type="checkbox" checked={isStarter} onChange={e => setIsStarter(e.target.checked)} />{t("intake.is_starter")}</label>
              </>}
              {(userType === "employee" || userType === "dga") && <>
                <label className={labelCls}>{t("intake.salary")}</label>
                <input className={inputCls} type="number" min="0" value={salary} onChange={e => setSalary(e.target.value)} placeholder={userType === "dga" ? "56000" : "48000"} />
              </>}
              {userType === "dga" && <>
                <label className={labelCls}>{t("intake.dividend")}</label>
                <input className={inputCls} type="number" min="0" value={dividend} onChange={e => setDividend(e.target.value)} placeholder="24000" />
              </>}
              {userType === "expat" && <>
                <label className={labelCls}>{t("intake.salary")}</label>
                <input className={inputCls} type="number" min="0" value={salary} onChange={e => setSalary(e.target.value)} placeholder="90000" />
                <label className={labelCls}>{t("intake.ruling_year")}</label>
                <select className={inputCls} value={rulingYear} onChange={e => setRulingYear(e.target.value)}>
                  {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{t("intake.year_n", { n: y })}</option>)}
                </select>
              </>}
            </div>
            <div className="flex justify-between items-center mt-1">
              <button className={btnBack} onClick={() => setStep(1)}>← {t("intake.back")}</button>
              <button className={btnPrimary} onClick={() => setStep(3)}>{t("intake.next")} →</button>
            </div>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <h2 className="text-[22px] font-semibold text-[var(--text-h)] m-0 text-center">{t("intake.step3_title")}</h2>
            <p className="text-sm text-[var(--text)] opacity-70 m-0 -mt-3 text-center leading-relaxed">{t("intake.step3_subtitle")}</p>
            <div className="flex flex-col gap-2.5">
              <label className={checkCls}><input type="checkbox" checked={hasPartner} onChange={e => setHasPartner(e.target.checked)} />{t("intake.has_partner")}</label>
              {hasPartner && <>
                <label className={labelCls}>{t("intake.partner_income")}</label>
                <input className={inputCls} type="number" min="0" value={partnerIncome} onChange={e => setPartnerIncome(e.target.value)} placeholder="0" />
              </>}
              <label className={labelCls}>{t("intake.children")}</label>
              <select className={inputCls} value={children} onChange={e => setChildren(e.target.value)}>
                <option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3+</option>
              </select>
              <label className={labelCls}>{t("intake.assets")} <span className="font-normal opacity-55">({t("intake.optional")})</span></label>
              <input className={inputCls} type="number" min="0" value={assets} onChange={e => setAssets(e.target.value)} placeholder="0" />
              <label className={labelCls}>{t("intake.pension")} <span className="font-normal opacity-55">({t("intake.optional")})</span></label>
              <input className={inputCls} type="number" min="0" value={pension} onChange={e => setPension(e.target.value)} placeholder="0" />
            </div>
            <div className="flex justify-between items-center mt-1">
              <button className={btnBack} onClick={() => setStep(2)}>← {t("intake.back")}</button>
              <button className={btnPrimary} onClick={handleFinish} disabled={loading}>
                {loading ? t("intake.calculating") : t("intake.finish")}
              </button>
            </div>
          </>
        )}

        <button
          className="bg-none border-none text-xs text-[var(--text)] opacity-40 cursor-pointer text-center p-0 -mt-2 hover:opacity-70 transition-opacity"
          onClick={() => navigate("/chat")}
        >
          {t("intake.skip")}
        </button>
      </div>
    </div>
  );
}
