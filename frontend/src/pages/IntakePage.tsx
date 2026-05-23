import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { calculateTax } from "../api/calculator";
import type { CalcInput } from "../api/calculator";
import s from "./IntakePage.module.css";

type UserType = "zzp" | "employee" | "expat" | "dga";

const TYPES: Array<{ key: UserType; icon: string; i18nDesc: string }> = [
  { key: "zzp",      icon: "💼", i18nDesc: "intake.zzp_desc" },
  { key: "employee", icon: "🏢", i18nDesc: "intake.employee_desc" },
  { key: "expat",    icon: "🌍", i18nDesc: "intake.expat_desc" },
  { key: "dga",      icon: "🏛️", i18nDesc: "intake.dga_desc" },
];

export default function IntakePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === "fa";

  const [step, setStep]           = useState<1 | 2 | 3>(1);
  const [userType, setUserType]   = useState<UserType>("zzp");
  const [loading, setLoading]     = useState(false);

  // Step 2
  const [revenue, setRevenue]       = useState("");
  const [expenses, setExpenses]     = useState("");
  const [salary, setSalary]         = useState("");
  const [dividend, setDividend]     = useState("");
  const [rulingYear, setRulingYear] = useState("1");
  const [isStarter, setIsStarter]   = useState(false);

  // Step 3
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
    try {
      await calculateTax(input);
    } catch {
      // save anyway — chat works without a validated calc result
    }
    localStorage.setItem("taxwijs_calc_input", JSON.stringify(input));
    setLoading(false);
    navigate("/chat");
  };

  return (
    <div className={s.page} dir={isRtl ? "rtl" : "ltr"}>
      <div className={s.card}>

        <div className={s.progress}>
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className={n <= step ? s.dotActive : s.dot} />
          ))}
        </div>

        {/* ── Step 1: Who are you? ── */}
        {step === 1 && (
          <>
            <h2 className={s.title}>{t("intake.step1_title")}</h2>
            <p className={s.subtitle}>{t("intake.step1_subtitle")}</p>
            <div className={s.typeGrid}>
              {TYPES.map(({ key, icon, i18nDesc }) => (
                <button
                  key={key}
                  className={userType === key ? s.typeCardActive : s.typeCard}
                  onClick={() => setUserType(key)}
                >
                  <span className={s.typeIcon}>{icon}</span>
                  <strong>{t(`user_types.${key}`)}</strong>
                  <span className={s.typeDesc}>{t(i18nDesc)}</span>
                </button>
              ))}
            </div>
            <div className={s.navRight}>
              <button className={s.next} onClick={() => setStep(2)}>
                {t("intake.next")} →
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Your numbers ── */}
        {step === 2 && (
          <>
            <h2 className={s.title}>{t("intake.step2_title")}</h2>
            <p className={s.subtitle}>{t("intake.step2_subtitle")}</p>
            <div className={s.fields}>
              {userType === "zzp" && <>
                <label className={s.label}>{t("intake.revenue")}</label>
                <input className={s.input} type="number" min="0" value={revenue}
                  onChange={e => setRevenue(e.target.value)} placeholder="72000" />
                <label className={s.label}>{t("intake.expenses")}</label>
                <input className={s.input} type="number" min="0" value={expenses}
                  onChange={e => setExpenses(e.target.value)} placeholder="5000" />
                <label className={s.checkLabel}>
                  <input type="checkbox" checked={isStarter} onChange={e => setIsStarter(e.target.checked)} />
                  {t("intake.is_starter")}
                </label>
              </>}

              {(userType === "employee" || userType === "dga") && <>
                <label className={s.label}>{t("intake.salary")}</label>
                <input className={s.input} type="number" min="0" value={salary}
                  onChange={e => setSalary(e.target.value)}
                  placeholder={userType === "dga" ? "56000" : "48000"} />
              </>}

              {userType === "dga" && <>
                <label className={s.label}>{t("intake.dividend")}</label>
                <input className={s.input} type="number" min="0" value={dividend}
                  onChange={e => setDividend(e.target.value)} placeholder="24000" />
              </>}

              {userType === "expat" && <>
                <label className={s.label}>{t("intake.salary")}</label>
                <input className={s.input} type="number" min="0" value={salary}
                  onChange={e => setSalary(e.target.value)} placeholder="90000" />
                <label className={s.label}>{t("intake.ruling_year")}</label>
                <select className={s.input} value={rulingYear} onChange={e => setRulingYear(e.target.value)}>
                  {[1, 2, 3, 4, 5].map(y => (
                    <option key={y} value={y}>{t("intake.year_n", { n: y })}</option>
                  ))}
                </select>
              </>}
            </div>
            <div className={s.nav}>
              <button className={s.back} onClick={() => setStep(1)}>← {t("intake.back")}</button>
              <button className={s.next} onClick={() => setStep(3)}>{t("intake.next")} →</button>
            </div>
          </>
        )}

        {/* ── Step 3: Your situation ── */}
        {step === 3 && (
          <>
            <h2 className={s.title}>{t("intake.step3_title")}</h2>
            <p className={s.subtitle}>{t("intake.step3_subtitle")}</p>
            <div className={s.fields}>
              <label className={s.checkLabel}>
                <input type="checkbox" checked={hasPartner} onChange={e => setHasPartner(e.target.checked)} />
                {t("intake.has_partner")}
              </label>
              {hasPartner && <>
                <label className={s.label}>{t("intake.partner_income")}</label>
                <input className={s.input} type="number" min="0" value={partnerIncome}
                  onChange={e => setPartnerIncome(e.target.value)} placeholder="0" />
              </>}
              <label className={s.label}>{t("intake.children")}</label>
              <select className={s.input} value={children} onChange={e => setChildren(e.target.value)}>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3+</option>
              </select>
              <label className={s.label}>{t("intake.assets")} <span className={s.optional}>({t("intake.optional")})</span></label>
              <input className={s.input} type="number" min="0" value={assets}
                onChange={e => setAssets(e.target.value)} placeholder="0" />
              <label className={s.label}>{t("intake.pension")} <span className={s.optional}>({t("intake.optional")})</span></label>
              <input className={s.input} type="number" min="0" value={pension}
                onChange={e => setPension(e.target.value)} placeholder="0" />
            </div>
            <div className={s.nav}>
              <button className={s.back} onClick={() => setStep(2)}>← {t("intake.back")}</button>
              <button className={s.finish} onClick={handleFinish} disabled={loading}>
                {loading ? t("intake.calculating") : t("intake.finish")}
              </button>
            </div>
          </>
        )}

        <button className={s.skip} onClick={() => navigate("/chat")}>
          {t("intake.skip")}
        </button>
      </div>
    </div>
  );
}
