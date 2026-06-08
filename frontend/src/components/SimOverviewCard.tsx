import { useEffect, useState } from "react";
import { answersToCalcProfile, type Answers, type Lang } from "../data/simulationSteps";
import { calculateTax, type CalcResult } from "../api/calculator";
import { Icon } from "./Icon";

export interface SimOverviewCardProps {
  answers: Answers;
  lang: Lang;
  isMobile: boolean;
  onGoToChat: (q: string) => void;
}

export function SimOverviewCard({ answers, lang, isMobile, onGoToChat }: SimOverviewCardProps) {
  const [result, setResult]   = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    const profile = answersToCalcProfile(answers);
    calculateTax(profile as Parameters<typeof calculateTax>[0])
      .then(setResult)
      .catch(() => setError(
        lang === "nl" ? "Berekening niet beschikbaar — controleer uw gegevens"
        : lang === "fa" ? "محاسبه در دسترس نیست — اطلاعات خود را بررسی کنید"
        : "Calculation unavailable — check your data"
      ))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const profile       = answersToCalcProfile(answers) as Record<string, unknown>;
  const voorlopige    = (profile._voorlopige_amount as number) ?? 0;
  const hadVoorlopige = profile._had_voorlopige as boolean;

  if (loading) {
    return (
      <div className="card" style={{ padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "var(--ink-3)" }}>
          {lang === "nl" ? "Berekening…" : lang === "fa" ? "در حال محاسبه…" : "Calculating…"}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: 20, background: "var(--danger-soft)", color: "var(--danger)", fontSize: 14 }}>
        {error}
      </div>
    );
  }

  if (!result) return null;

  const netToPay = result.result.total_tax_due - (hadVoorlopige ? voorlopige : 0);

  const metricRows: [string, string][] = [
    [
      lang === "nl" ? "Totale belasting" : lang === "fa" ? "کل مالیات" : "Total tax",
      `€ ${result.result.total_tax_due.toLocaleString("nl-NL")}`,
    ],
    [
      lang === "nl" ? "Effectief tarief" : lang === "fa" ? "نرخ مؤثر" : "Effective rate",
      `${(result.result.effective_rate * 100).toFixed(1)}%`,
    ],
    ...(result.result.monthly_reserve_needed > 0
      ? [[
          lang === "nl" ? "Per maand reserveren" : lang === "fa" ? "ذخیره ماهانه" : "Monthly reserve",
          `€ ${result.result.monthly_reserve_needed.toLocaleString("nl-NL")}`,
        ] as [string, string]]
      : []),
  ];

  const breakdownRows: [string, number][] = [
    [lang === "nl" ? "Box 1 — belasting (bruto)" : "Box 1 (raw)", result.calculation.box1_tax_raw],
    [lang === "nl" ? "Algemene heffingskorting" : "General tax credit", -result.calculation.algemene_heffingskorting],
    [lang === "nl" ? "Arbeidskorting" : "Labour tax credit", -result.calculation.arbeidskorting],
    ...(result.calculation.iack > 0
      ? [[lang === "nl" ? "IACK (kinderopvang)" : "IACK", -result.calculation.iack] as [string, number]]
      : []),
    [lang === "nl" ? "Box 1 na kortingen" : "Box 1 after credits", result.calculation.income_tax_after_credits],
    ...(result.calculation.zvw_contribution > 0
      ? [["ZVW-bijdrage (4.85%)", result.calculation.zvw_contribution] as [string, number]]
      : []),
    ...(result.calculation.box2_tax > 0
      ? [["Box 2", result.calculation.box2_tax] as [string, number]]
      : []),
    ...(result.calculation.box3_tax > 0
      ? [["Box 3", result.calculation.box3_tax] as [string, number]]
      : []),
  ];

  const discussQ =
    lang === "nl"
      ? `Ik heb de belastingsimulatie ingevuld. Mijn geschatte belasting is €${result.result.total_tax_due.toLocaleString("nl-NL")} voor 2026. Kunt u dit uitleggen en tips geven om minder belasting te betalen?`
      : lang === "fa"
      ? `شبیه‌سازی مالیاتی را تکمیل کردم. مالیات تخمینی من €${result.result.total_tax_due.toLocaleString("nl-NL")} است. توضیح دهید و نکاتی برای کاهش مالیات ارائه دهید.`
      : `I completed the tax simulation. My estimated tax is €${result.result.total_tax_due.toLocaleString("nl-NL")} for 2026. Can you explain this and give tips to reduce it?`;

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Dark header */}
      <div style={{
        padding: isMobile ? "20px 18px" : "28px 28px 24px",
        background: "var(--ink)", color: "var(--paper)",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        alignItems: "center",
        gap: isMobile ? 16 : 24,
      }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--sage-300)" }}>
            {hadVoorlopige && voorlopige > 0
              ? (lang === "nl" ? "Nog te betalen / terug" : lang === "fa" ? "مبلغ باقیمانده / استرداد" : "Net to pay / refund")
              : (lang === "nl" ? "Geschatte belasting 2026" : lang === "fa" ? "مالیات تخمینی ۲۰۲۶" : "Estimated tax 2026")}
          </div>
          <div style={{
            fontFamily: "var(--serif)", fontSize: isMobile ? 52 : 64, color: "white",
            letterSpacing: "-0.03em", lineHeight: 1, marginTop: 4,
          }}>
            {netToPay >= 0
              ? `€ ${netToPay.toLocaleString("nl-NL")}`
              : `−€ ${Math.abs(netToPay).toLocaleString("nl-NL")}`}
          </div>
          {hadVoorlopige && voorlopige > 0 && (
            <div style={{ marginTop: 6, fontSize: 12, color: "oklch(0.82 0.01 95)" }}>
              {lang === "nl" ? `na €${voorlopige.toLocaleString("nl-NL")} voorlopige aanslag`
                : `after €${voorlopige.toLocaleString("nl-NL")} provisional assessment`}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {metricRows.map(([k, v]) => (
            <div key={k} style={{ padding: 10, background: "rgba(255,255,255,0.07)", borderRadius: "var(--r)" }}>
              <div className="eyebrow" style={{ color: "var(--sage-300)", fontSize: 9 }}>{k}</div>
              <div className="font-mono" style={{ marginTop: 3, fontSize: 15, color: "white" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div className="eyebrow eyebrow-accent">
          {lang === "nl" ? "Hoe we hieraan komen" : lang === "fa" ? "نحوه محاسبه" : "How we got here"}
        </div>

        <div style={{ marginTop: 10 }}>
          {breakdownRows.map(([label, val], i) => (
            <div key={label} style={{
              padding: "8px 0", display: "flex", justifyContent: "space-between",
              borderBottom: i < breakdownRows.length - 1 ? "1px solid var(--hairline)" : "none",
            }}>
              <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{label}</span>
              <span className="num" style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                {val < 0
                  ? `−€ ${Math.abs(val).toLocaleString("nl-NL")}`
                  : `€ ${val.toLocaleString("nl-NL")}`}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <button
            className="btn btn-soft"
            type="button"
            onClick={() => onGoToChat(discussQ)}
            style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}
          >
            <Icon.spark style={{ width: 12, height: 12 }} />
            {lang === "nl" ? "Bespreek met TaxWijs"
              : lang === "fa" ? "بحث با TaxWijs"
              : "Discuss with TaxWijs"}
          </button>
        </div>

        <p style={{ marginTop: 14, fontSize: 11, color: "var(--ink-4)", margin: "14px 0 0" }}>
          {lang === "nl"
            ? "Dit is een simulatie — geen officiële aangifte. Gebruik mijn.belastingdienst.nl voor de echte aangifte"
            : lang === "fa"
            ? "این یک شبیه‌سازی است — اظهارنامه رسمی نیست"
            : "This is a simulation — not an official return. Use mijn.belastingdienst.nl for the real filing"}
        </p>
      </div>
    </div>
  );
}
