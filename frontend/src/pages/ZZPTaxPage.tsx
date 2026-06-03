import { useNavigate } from "react-router-dom";
import { useMobile } from "../hooks/useMobile";

const SECTIONS = [
  {
    id: "what-taxes",
    title: "What taxes does a ZZP pay?",
    body: `As a ZZP (zelfstandige zonder personeel) in the Netherlands, you pay income tax on your profit through Box 1 of the Dutch income tax system. Unlike employees, your tax is not withheld at source — you are responsible for calculating and paying it yourself.

The main taxes that apply to ZZP workers:
• **Income tax (inkomstenbelasting)** — Box 1 tax on your taxable profit
• **ZVW health insurance contribution** — 4.85% on your profit (up to €79,409)
• **BTW (VAT)** — 21% on most services (you collect this from clients and pay it quarterly)

Many ZZP workers forget the ZVW contribution, which can add up to €3,851/year on top of income tax.`,
    source: "belastingdienst.nl/inkomstenbelasting",
  },
  {
    id: "box1-brackets",
    title: "Box 1 tax brackets 2026",
    body: `Your taxable profit falls into one of three brackets:

| Income range | Rate | Includes social insurance |
|---|---|---|
| €0 – €38,883 | **35.75%** | Yes (27.65% premie volksverzekeringen) |
| €38,883 – €78,426 | **37.56%** | Only for AOW-age workers |
| Above €78,426 | **49.50%** | No social insurance above this |

Important: Your taxable profit is your revenue minus expenses minus ZZP deductions (zelfstandigenaftrek, MKB-winstvrijstelling). Most ZZP workers pay significantly less than the headline rate after applying deductions and tax credits.`,
    source: "belastingdienst.nl/tarieven",
  },
  {
    id: "zelfstandigenaftrek",
    title: "Zelfstandigenaftrek: the self-employed deduction",
    body: `The zelfstandigenaftrek is a flat deduction of **€1,200** (2026) from your taxable profit. It is only available if you meet the **urencriterium**: you must work at least **1,225 hours per year** for your business.

Key rules:
• Track your hours throughout the year — a log is essential if the tax authority audits you
• The 1,225 hours include all business activities (client work, administration, marketing)
• If you have a part-time employer job alongside ZZP, only count ZZP hours
• The deduction reduces your profit before the MKB-winstvrijstelling is applied

⚠️ The zelfstandigenaftrek has been declining annually. It was €2,470 in 2025, €1,200 in 2026. Future years will continue to decrease.`,
    source: "belastingdienst.nl/zelfstandigenaftrek",
  },
  {
    id: "mkb",
    title: "MKB-winstvrijstelling: 12.7% profit exemption",
    body: `The MKB-winstvrijstelling reduces your taxable profit by **12.7%** after all deductions. Unlike the zelfstandigenaftrek, there is **no hours requirement** for MKB.

How it works:
1. Start with gross profit
2. Subtract business expenses
3. Subtract zelfstandigenaftrek (if you qualify)
4. Apply 12.7% MKB exemption to the remaining amount
5. The result is your taxable income for Box 1

Example: €60,000 profit → minus €1,200 ZA → minus 12.7% MKB on €58,800 = minus €7,468 → taxable income: €51,332

The MKB applies even if you do NOT meet the urencriterium for zelfstandigenaftrek.`,
    source: "belastingdienst.nl/mkb-winstvrijstelling",
  },
  {
    id: "btw",
    title: "BTW obligations and the KOR exemption",
    body: `Most ZZP workers charge **21% BTW** on their services and pay it to the Belastingdienst quarterly.

**Quarterly deadlines 2026:**
• Q1 (Jan–Mar): due 30 April 2026
• Q2 (Apr–Jun): due 31 July 2026
• Q3 (Jul–Sep): due 31 October 2026
• Q4 (Oct–Dec): due 31 January 2027

Missing a deadline results in an automatic fine, even on a zero return.

**KOR (Kleineondernemersregeling):** If your annual turnover is below **€20,000**, you may opt for BTW exemption. You no longer charge BTW, cannot reclaim BTW on purchases, but have no quarterly filing obligation. Useful for small part-time freelancers.

Note: If you work in the accommodation sector, the BTW rate changed from 9% to 21% in 2026.`,
    source: "belastingdienst.nl/btw",
  },
  {
    id: "zvw",
    title: "ZVW health contribution — the tax most ZZP forget",
    body: `The ZVW-bijdrage is a health insurance contribution paid by ZZP workers. In 2026:
• Rate: **4.85%**
• Maximum income: **€79,409**
• Maximum annual contribution: **€3,851**

This is separate from the health insurance premium you pay your insurer (zorgverzekering). It is paid through your income tax return and is calculated on your ZZP profit after ondernemersaftrek (ZA/SA/KIA), before MKB-winstvrijstelling.

**Why ZZP workers miss it:** it does not appear on a separate bill. It is included in your total tax assessment. Budget for it!

Example: ZZP profit €50,000 → ZVW contribution ≈ €2,425/year on top of Box 1 income tax.`,
    source: "belastingdienst.nl/zvw",
  },
  {
    id: "deadlines",
    title: "Key 2026 deadlines for ZZP",
    body: `Mark these in your calendar:

| Date | Obligation |
|---|---|
| 30 April 2026 | BTW Q1 2026 return + payment |
| **1 May 2026** | **IB tax return for year 2025** |
| 31 July 2026 | BTW Q2 2026 return + payment |
| 31 October 2026 | BTW Q3 2026 return + payment |
| 31 January 2027 | BTW Q4 2026 return + payment |

Missing the IB deadline (1 May) without requesting an extension (uitstel) results in a penalty. You can request a 5-month extension if you need more time.`,
    source: "belastingdienst.nl/deadlines",
  },
];

const FAQ = [
  { q: "How much tax does a ZZP pay in the Netherlands?", a: "It depends on your profit. A ZZP with €50,000 profit typically pays around €10,000–€13,000 in total tax (Box 1 + ZVW) after applying zelfstandigenaftrek and MKB-winstvrijstelling. Use the calculator for your exact figures." },
  { q: "Do I need to register for BTW as a ZZP?", a: "Most ZZP workers must register for BTW unless their annual turnover is below €20,000 (KOR threshold). Register with the KVK and Belastingdienst before you issue your first invoice." },
  { q: "What is the 1,225-hour rule?", a: "The urencriterium requires you to work at least 1,225 hours per year on your business to qualify for the zelfstandigenaftrek. Keep a simple hour log throughout the year." },
  { q: "Can I deduct my home office as a ZZP?", a: "Only if you have a separate, exclusive workspace that you do not use privately. If your home office doubles as a living room or spare bedroom, it is generally not deductible. The rules are strict — check with a belastingadviseur if unsure." },
  { q: "What is startersaftrek and is it still available?", a: "Startersaftrek is an extra €2,123 deduction for ZZP in their first three years as entrepreneur. 2026 is the LAST year this deduction exists — it is abolished from 2027. If you qualify, claim it now." },
];

export default function ZZPTaxPage() {
  const navigate = useNavigate();
  const isMobile = useMobile();

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>
      {/* Meta handled by index.html — for a full solution use react-helmet */}

      <div style={{ maxWidth: 820, margin: "0 auto", padding: isMobile ? "var(--sp-8) var(--sp-4)" : "var(--sp-12) var(--sp-8)" }}>

        {/* Header */}
        <div style={{ marginBottom: "var(--sp-10)" }}>
          <span className="pill pill-accent" style={{ marginBottom: "var(--sp-3)", display: "inline-block" }}>2026 Guide</span>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: isMobile ? "var(--text-4xl)" : "var(--text-5xl)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: "var(--leading-tight)" }}>
            ZZP Tax in the Netherlands — Complete 2026 Guide
          </h1>
          <p style={{ marginTop: "var(--sp-3)", fontSize: "var(--text-lg)", color: "var(--ink-2)", maxWidth: 680 }}>
            Everything a Dutch freelancer needs to know about income tax, BTW, deductions and deadlines in 2026.
          </p>
          <div style={{ marginTop: "var(--sp-5)", display: "flex", flexWrap: "wrap", gap: "var(--sp-3)" }}>
            <button className="btn btn-accent" onClick={() => navigate("/deduction-checker")}>
              Check my deductions — free →
            </button>
            <button className="btn btn-ghost" onClick={() => navigate("/intake")}>
              Calculate my 2026 ZZP tax →
            </button>
          </div>
          <p style={{ marginTop: "var(--sp-3)", fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>
            Sources: Belastingdienst.nl · All figures verified for tax year 2026
          </p>
        </div>

        {/* Table of contents */}
        <nav className="card" style={{ padding: "var(--sp-5)", marginBottom: "var(--sp-8)" }}>
          <div className="eyebrow eyebrow-accent" style={{ marginBottom: "var(--sp-3)" }}>Contents</div>
          <ol style={{ margin: 0, paddingInlineStart: "var(--sp-5)", display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} style={{ color: "var(--sage-700)", fontSize: "var(--text-sm)", textDecoration: "none" }}>
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-10)" }}>
          {SECTIONS.map((s, idx) => (
            <section key={s.id} id={s.id}>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-3xl)", fontWeight: 400, color: "var(--ink)", marginBottom: "var(--sp-4)", letterSpacing: "-0.02em" }}>
                {idx + 1}. {s.title}
              </h2>
              <div style={{ fontSize: "var(--text-base)", color: "var(--ink-2)", lineHeight: "var(--leading-relaxed)", whiteSpace: "pre-line" }}>
                {s.body}
              </div>
              <div style={{ marginTop: "var(--sp-4)", display: "flex", alignItems: "center", gap: "var(--sp-2)", flexWrap: "wrap" }}>
                <span className="eyebrow">Source</span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>{s.source}</span>
                <button className="btn btn-ghost btn-sm" style={{ marginInlineStart: "auto" }} onClick={() => navigate("/deduction-checker")}>
                  Check my deductions →
                </button>
              </div>
              {idx < SECTIONS.length - 1 && <hr style={{ border: "none", borderTop: "1px solid var(--hairline)", marginTop: "var(--sp-6)" }} />}
            </section>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ marginTop: "var(--sp-12)" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-3xl)", fontWeight: 400, color: "var(--ink)", marginBottom: "var(--sp-6)" }}>
            Frequently asked questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
            {FAQ.map(faq => (
              <details key={faq.q} className="card" style={{ padding: "var(--sp-5)" }}>
                <summary style={{ fontWeight: 600, color: "var(--ink)", cursor: "pointer", fontSize: "var(--text-sm)", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {faq.q}
                  <span style={{ color: "var(--ink-4)", fontSize: "var(--text-xs)", marginInlineStart: "var(--sp-4)", flexShrink: 0 }}>▼</span>
                </summary>
                <p style={{ marginTop: "var(--sp-3)", color: "var(--ink-2)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)" }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="card" style={{ marginTop: "var(--sp-12)", padding: "var(--sp-8)", textAlign: "center", background: "var(--accent-soft)", border: "1px solid var(--accent-line)" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-2xl)", fontWeight: 400, color: "var(--ink)", marginBottom: "var(--sp-2)" }}>
            Ready to calculate your exact ZZP tax?
          </h2>
          <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", marginBottom: "var(--sp-5)" }}>
            Our deterministic engine applies all 2026 rules to your specific situation — zelfstandigenaftrek, MKB, ZVW and all credits.
          </p>
          <div style={{ display: "flex", gap: "var(--sp-3)", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-accent btn-lg" onClick={() => navigate("/intake")}>
              Calculate my ZZP tax →
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate("/chat")}>
              Ask the tax AI
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
