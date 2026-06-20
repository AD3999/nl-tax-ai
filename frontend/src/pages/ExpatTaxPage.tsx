import { useNavigate } from "react-router-dom";
import { useMobile } from "../hooks/useMobile";
import SEOHead from "../components/SEOHead";

const SECTIONS = [
  {
    id: "30pct-ruling",
    title: "The 30% ruling explained",
    body: `The 30% ruling (30%-regeling) is a Dutch tax benefit for workers recruited from abroad who have specific expertise that is scarce in the Dutch labour market. It allows your employer to pay you a tax-free allowance of up to 30% of your salary for the first years you work in the Netherlands.

**What the 30% ruling does:**
• Your employer pays up to 30% of your salary as a tax-free expense reimbursement
• You pay income tax only on the remaining 70% (the "taxable base")
• This reduces your effective tax rate significantly — a €90,000 salary is taxed as if it were €63,000

**Phase-down from 2024 (new rules):**
From 2024 onwards, the ruling has a 5-year phase-down:
• Years 1–3: 30% tax-free
• Year 4: 20% tax-free
• Year 5: 10% tax-free
• After 5 years: 0% — the ruling expires

If you started your ruling before 2024, transitional rules may apply — check your start date carefully.`,
    source: "belastingdienst.nl/30-procent-regeling",
  },
  {
    id: "who-qualifies",
    title: "Who qualifies for the 30% ruling?",
    body: `To qualify for the 30% ruling you must meet all of these conditions:

1. **Recruited from abroad** — you must have been living outside the Netherlands (or within 150km of the Dutch border) in the 24 months before your first Dutch employment day
2. **Specific expertise** — your income must meet the minimum salary threshold (€46,107 gross in 2026, or €35,048 for workers under 30 with a master's degree)
3. **Dutch employer** — your employer must withhold payroll tax in the Netherlands
4. **Application within 4 months** — you and your employer must apply within 4 months of your first Dutch working day to get the ruling from day one. Late applications can still be granted but only from the application date.

The ruling is granted per employment — if you change jobs, your new employer must re-apply.`,
    source: "belastingdienst.nl/30-procent-regeling-voorwaarden",
  },
  {
    id: "ib-return-expat",
    title: "IB return for expats — the M-form",
    body: `If you moved to or from the Netherlands during a tax year, you are a **partial-year resident (partieel belastingplichtige)**. You must file the special **M-form (M-biljet)** instead of the standard IB return.

The M-form covers:
• The months you were a Dutch tax resident (and your worldwide income)
• The months you were a non-resident (only Dutch-source income)

**When you become resident:** the day you register at a Dutch municipality (gemeente). Keep this date — it determines your tax residency.

**Deadlines:** M-form is typically filed by 1 July of the following year (different from the standard 1 May deadline). You can request an extension.

From your second full year onwards, you file the standard IB return (P-form) like any other Dutch resident.`,
    source: "belastingdienst.nl/m-biljet",
  },
  {
    id: "box1-expat",
    title: "Box 1 income tax for expats",
    body: `With the 30% ruling active, your income tax calculation changes:

1. Your salary splits into: **taxable base (70%)** + **tax-free allowance (30%)**
2. Box 1 tax brackets apply to the 70% taxable base only
3. Tax credits (heffingskortingen) still apply in full

**Without 30% ruling:** normal Box 1 rates apply to your full gross salary.

Example — €90,000 salary with 30% ruling (year 1):
• Taxable base: €63,000
• Box 1 tax on €63,000: approx €21,000 (after credits)
• Net tax benefit vs. no ruling: approx €7,000–€9,000/year

The ruling also exempts you from paying Box 2 and Box 3 tax on foreign assets (partial non-resident status) if you elect this option. Consult a belastingadviseur before electing — it is irrevocable for the year.`,
    source: "belastingdienst.nl/expat-box1",
  },
  {
    id: "box3-foreign",
    title: "Box 3 and foreign assets",
    body: `Box 3 taxes savings, investments and other assets above the exemption threshold (€59,357 per person in 2026).

**Expat-specific option:** While the 30% ruling is active, you can elect to be treated as a **partial non-resident (partieel buitenlandse belastingplichtige)**. Under this status:
• Foreign Box 3 assets (bank accounts, investments outside NL) are exempt
• Only Dutch real estate falls into Box 3

This election must be made on your IB return each year. Once elected for a year, it cannot be changed. If you have significant savings outside the Netherlands, this election can save thousands per year.

**Important:** This only applies to Box 3. Box 1 (employment income) is always taxed in full.`,
    source: "belastingdienst.nl/buitenlandse-belastingplicht",
  },
  {
    id: "zorgtoeslag",
    title: "Zorgtoeslag and toeslagen eligibility",
    body: `Zorgtoeslag is a monthly allowance towards your health insurance premium. In 2026, the maximum is **€129/month** (€1,548/year).

**Eligibility for expats:**
• You must be insured under a Dutch healthcare policy (zorgverzekering)
• Your income must not exceed **€40,857** (single) or €51,641 (with partner)
• The hard cutoff is strict — €1 over = €0 zorgtoeslag for the whole year
• You must have Dutch residency (BSN + municipality registration)

Most expats with 30% ruling and mid-to-high salaries earn above €40,857 and do not qualify.

**Huurtoeslag (rent allowance):** In 2026, the rent ceiling was abolished — any rent now qualifies. Income limits still apply. Worth checking if your salary is below ~€35,000 including partner income.`,
    source: "belastingdienst.nl/toeslagen",
  },
  {
    id: "deadlines-expat",
    title: "Key 2026 deadlines for expats",
    body: `| Date | Obligation |
|---|---|
| **1 May 2026** | Standard IB return deadline (for full-year residents, tax year 2025) |
| 1 July 2026 | M-form deadline (partial-year residents 2025) |
| Within 4 months of start | 30% ruling application (to get backdated to start date) |
| 31 January 2027 | Check your 30% ruling phase-down year — year 4 drops to 20% |

You can request a 5-month extension for the standard IB return. M-form extensions are also available but must be requested from the Belastingdienst directly.`,
    source: "belastingdienst.nl/aangifte-termijnen",
  },
];

const FAQ = [
  { q: "How much tax does an expat pay in the Netherlands with the 30% ruling?", a: "With the 30% ruling, your effective tax rate on a €90,000 salary is typically 20–25%. Without the ruling, it would be around 30–35%. The exact amount depends on credits, Box 3 assets and your situation. Use our calculator for precise figures." },
  { q: "When does the 30% ruling expire?", a: "The 30% ruling lasts a maximum of 5 years from your first Dutch working day. Under the 2024 phase-down, years 4 and 5 give you only 20% and 10% tax-free allowance. After 5 years, the ruling expires entirely." },
  { q: "Do I need to file a Dutch tax return if I have the 30% ruling?", a: "Yes. You must file a standard IB return (P-form) for full years, or an M-form for the year you arrived or left the Netherlands. Your employer handles payroll tax separately, but the IB return accounts for all income and credits." },
  { q: "What is the 150km rule for the 30% ruling?", a: "To qualify, you must have lived more than 150km from the Dutch border in at least 16 of the 24 months before your first Dutch working day. Living in Belgium, Luxembourg, or parts of Germany too close to the border may disqualify you." },
  { q: "Can I use the 30% ruling as a freelancer (ZZP)?", a: "No. The 30% ruling requires a Dutch employer who withholds payroll tax. Self-employed ZZP workers cannot use it. However, if you were an employee under the ruling and later become ZZP, the ruling period simply stops." },
];

const EXPAT_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Expat Tax in the Netherlands — Complete 2026 Guide",
    "description": "30% ruling phase-down, M-form, Box 3 foreign assets and toeslagen eligibility for expats in the Netherlands 2026.",
    "author": { "@type": "Organization", "name": "TaxWijs" },
    "publisher": { "@type": "Organization", "name": "TaxWijs", "url": "https://taxwijs.nl" },
    "datePublished": "2026-01-01",
    "dateModified": "2026-06-20",
    "url": "https://taxwijs.nl/expat-tax-netherlands",
    "inLanguage": "en",
    "about": { "@type": "Thing", "name": "Dutch Expat Tax 30% Ruling 2026" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "TaxWijs", "item": "https://taxwijs.nl" },
      { "@type": "ListItem", "position": 2, "name": "Expat Tax Netherlands 2026", "item": "https://taxwijs.nl/expat-tax-netherlands" },
    ],
  },
];

export default function ExpatTaxPage() {
  const navigate = useNavigate();
  const isMobile = useMobile();

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>
      <SEOHead
        title="Expat Tax Netherlands 2026 — 30% Ruling, M-Form & Box 3 Guide"
        description="Complete expat tax guide for the Netherlands 2026. 30% ruling phase-down (30/20/10%), M-form filing, Box 3 foreign assets, zorgtoeslag eligibility. All figures verified."
        canonical="/expat-tax-netherlands"
        lang="en"
        ogType="article"
        jsonLd={EXPAT_JSON_LD}
      />

      <div style={{ maxWidth: 820, margin: "0 auto", padding: isMobile ? "var(--sp-8) var(--sp-4)" : "var(--sp-12) var(--sp-8)" }}>

        {/* Header */}
        <div style={{ marginBottom: "var(--sp-10)" }}>
          <span className="pill pill-accent" style={{ marginBottom: "var(--sp-3)", display: "inline-block" }}>2026 Guide</span>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: isMobile ? "var(--text-4xl)" : "var(--text-5xl)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: "var(--leading-tight)" }}>
            Expat Tax in the Netherlands — 2026 Guide
          </h1>
          <p style={{ marginTop: "var(--sp-3)", fontSize: "var(--text-lg)", color: "var(--ink-2)", maxWidth: 680 }}>
            The 30% ruling, M-form, Box 3 foreign assets, toeslagen eligibility and key deadlines — explained in plain English.
          </p>
          <div style={{ marginTop: "var(--sp-5)", display: "flex", flexWrap: "wrap", gap: "var(--sp-3)" }}>
            <button className="btn btn-accent" onClick={() => navigate("/chat")}>
              Ask the expat tax AI →
            </button>
            <button className="btn btn-ghost" onClick={() => navigate("/intake")}>
              Calculate my 2026 expat tax →
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
                <button className="btn btn-ghost btn-sm" style={{ marginInlineStart: "auto" }} onClick={() => navigate("/chat")}>
                  Ask the AI →
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
            Calculate your expat tax with the 30% ruling
          </h2>
          <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", marginBottom: "var(--sp-5)" }}>
            Our calculator handles the 30% phase-down, M-form scenarios, Box 3 foreign assets and all 2026 tax credits.
          </p>
          <div style={{ display: "flex", gap: "var(--sp-3)", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-accent btn-lg" onClick={() => navigate("/intake")}>
              Calculate my expat tax →
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate("/chat")}>
              Ask the AI a question
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
