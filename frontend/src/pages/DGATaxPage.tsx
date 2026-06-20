import { useNavigate } from "react-router-dom";
import { useMobile } from "../hooks/useMobile";
import SEOHead from "../components/SEOHead";

const SECTIONS = [
  {
    id: "what-is-dga",
    title: "What is a DGA and how are you taxed?",
    body: `A DGA (directeur-grootaandeelhouder) is a director who holds ≥5% of shares in a BV (besloten vennootschap — private limited company). As a DGA, you operate through your BV, which creates a two-layer tax structure:

1. **Vennootschapsbelasting (VPB)** — the BV pays corporate tax on its profit
   • 19% on the first €200,000 profit
   • 25.8% on profit above €200,000

2. **Income tax (IB)** — you pay personal income tax when you take money out:
   • Via **salary** (loon) → Box 1 income tax (35.75%–49.50%)
   • Via **dividend** (dividenduitkering) → Box 2 tax (24.5% or 31%)

The DGA structure is efficient when your BV earns substantial profit — the BV retains after-tax earnings at the lower VPB rate, and you only pay personal tax when you extract money.`,
    source: "belastingdienst.nl/dga",
  },
  {
    id: "gebruikelijk-loon",
    title: "Gebruikelijk loon — the mandatory minimum DGA salary",
    body: `The Belastingdienst requires every DGA to pay themselves a **gebruikelijk loon** (customary salary). In 2026, the minimum is **€56,000 gross per year**.

The exact rules:
• The salary must equal the highest of: (a) €56,000, (b) 75% of the salary of the most comparable employee in the same business, or (c) the highest salary of any employee in the BV
• You cannot avoid Box 1 tax by taking only dividend — the gebruikelijk loon rule forces a minimum income tax base
• If the BV genuinely cannot afford €56,000 (e.g. low-profit startup), you can request a lower salary from the Belastingdienst with supporting evidence
• The salary is processed through payroll — your BV must file a loonaangifte (payroll return) monthly or quarterly

**Practical implication:** On a €56,000 salary, Box 1 tax after credits is approximately €12,000–€15,000/year. This is your unavoidable personal income tax floor as a DGA.`,
    source: "belastingdienst.nl/gebruikelijk-loon",
  },
  {
    id: "box2-dividend",
    title: "Box 2 — dividend tax rates in 2026",
    body: `When you take dividend from your BV, it is taxed in Box 2 of your personal IB return. In 2026:

| Dividend amount | Box 2 rate |
|---|---|
| Up to €68,843 | **24.5%** |
| Above €68,843 | **31.0%** |

The threshold applies per person — with a tax partner (fiscaal partner), you can each take €68,843 at 24.5%, effectively doubling the lower-rate threshold to €137,686 combined.

**Total tax on dividend (BV perspective):**
1. BV pays VPB: 19% on profit (assuming <€200k BV profit)
2. After-tax BV profit distributed as dividend
3. Personal Box 2 on dividend received

Combined effective rate example:
• BV profit: €100,000
• After 19% VPB: €81,000 available for dividend
• Box 2 at 24.5%: €81,000 × 24.5% = €19,845
• Net in your pocket: €61,155
• **Total effective rate: ~38.8%** on BV pre-tax profit

Compare to ZZP: a ZZP in the same position would pay ~35%–45% directly depending on deductions. The BV is most advantageous when you retain profits in the BV rather than immediately distributing them.`,
    source: "belastingdienst.nl/box-2",
  },
  {
    id: "salary-dividend-split",
    title: "Optimising your salary + dividend split",
    body: `The central DGA tax planning question is: how much salary vs. how much dividend?

**The trade-off:**
• Higher salary → more Box 1 tax (up to 49.5%), but also builds pension rights and qualifies for arbeidskorting (up to €5,685/year)
• Higher dividend → Box 2 tax (24.5%/31%), but no social insurance or credits apply

**General 2026 optimisation logic:**
1. Take the minimum gebruikelijk loon (€56,000) — this is often near-optimal for the Box 1/Box 2 crossover
2. Maximise the arbeidskorting — it applies to your salary and is worth up to €5,685/year
3. For additional income above the salary: compare marginal Box 1 rate (37.56% at €38k–€78k) vs. Box 2 rate (24.5% up to €68,843). Dividend at 24.5% is usually cheaper.
4. If you have a tax partner who has no or low income: dividend can be shifted — consult a belastingadviseur for this

**Key constraint:** The gebruikelijk loon must reflect market reality. Taking a €56k salary when comparable directors earn €120k can trigger a Belastingdienst audit.

Always run the exact numbers through our calculator — optimal split varies by profit level, partner situation and other income.`,
    source: "belastingdienst.nl/dga-salaris",
  },
  {
    id: "vb-corporate-tax",
    title: "Vennootschapsbelasting (VPB) — corporate tax on BV profit",
    body: `Your BV pays vennootschapsbelasting (corporate tax) on its annual profit before you can take dividend.

**2026 VPB rates:**
| BV profit | Rate |
|---|---|
| First €200,000 | **19%** |
| Above €200,000 | **25.8%** |

The VPB is calculated on: revenue minus all business expenses, including your gebruikelijk loon, depreciation, and other deductible costs.

**Useful VPB deductions:**
• Your DGA salary (gebruikelijk loon) reduces BV profit
• Business expenses: equipment, office rent, travel, subscriptions
• Pension reserve (FOR — fiscale oudedagsreserve) is no longer available for BVs — use lijfrente instead
• R&D credits (WBSO) if the BV engages in qualifying innovation work

**Filing:** The BV files a VPB return (aangifte vennootschapsbelasting) annually, typically within 6 months of the financial year end. For calendar-year BVs, the deadline is 1 June of the following year (extensions available).`,
    source: "belastingdienst.nl/vennootschapsbelasting",
  },
  {
    id: "dga-ib-return",
    title: "The DGA income tax return — what to file",
    body: `As a DGA, you file both a personal IB return AND your BV files a VPB return. They are separate filings.

**Your personal IB return includes:**
• Box 1: your gebruikelijk loon salary (from the BV's loonaangifte)
• Box 2: any dividend received from the BV during the year
• Box 3: personal assets (savings, investments, second home) above €59,357
• Heffingskortingen: algemene heffingskorting, arbeidskorting (on your salary)

**What DGAs often miss:**
• **Box 2 loss reclaim:** If the BV makes a loss in a year, you cannot deduct it personally — losses stay in the BV and carry forward to future VPB years
• **TBS (terbeschikkingstelling):** If you lend money or rent property to your own BV, the income is taxed in Box 1 at the higher rate (not Box 2)
• **Excessive loan rule (excessief lenen):** From 2023, if you borrow more than €700,000 from your own BV, the excess is treated as dividend and taxed in Box 2 immediately

**Deadline:** 1 May 2026 (for tax year 2025). Extension available via DigiD.`,
    source: "belastingdienst.nl/aangifte-ib-dga",
  },
  {
    id: "dga-zvw",
    title: "ZVW and health insurance for DGA",
    body: `As a DGA, your ZVW (zorgverzekeringswet) health insurance contribution works differently from ZZP workers:

• The **BV pays the employer contribution** to the health fund through the payroll process
• You do NOT pay the additional ZVW bijdrage that ZZP workers pay (the 4.85% on profit)
• Instead, your BV withholds the werknemerspremie as part of normal payroll

This is one of the BV advantages over ZZP: as an employee of your own BV, the health contribution is handled through payroll rather than via your personal tax return.

You still pay the standard health insurance premium (zorgverzekeringspremie) to your insurer separately — this is the same for everyone.`,
    source: "belastingdienst.nl/zvw-werkgever",
  },
  {
    id: "deadlines-dga",
    title: "Key 2026 deadlines for DGA and BV",
    body: `| Date | Obligation |
|---|---|
| Monthly/quarterly | Loonaangifte (payroll return) — DGA salary |
| 31 March 2026 | Annual accounts (jaarrekening) must be adopted by the AVA |
| 31 July 2026 | Jaarrekening deposition at KVK (within 8 months of year end for calendar year) |
| **1 May 2026** | **Personal IB return (tax year 2025)** |
| 1 June 2026 | BV's VPB return (with standard extension) |
| Rolling | Excessive loan threshold — monitor total loans from BV (must stay under €700,000) |

The VPB return deadline is 1 June if no extension is requested. With a belastingadviseur filing on your behalf, extensions through the uitstelregeling can push this to May of the following year.`,
    source: "belastingdienst.nl/deadlines-bv",
  },
];

const FAQ = [
  {
    q: "What is the minimum DGA salary in 2026?",
    a: "The gebruikelijk loon minimum is €56,000 gross in 2026. Your actual required salary may be higher if employees in your BV earn more, or if the market salary for your role exceeds this. The Belastingdienst can challenge salaries they consider too low.",
  },
  {
    q: "Is it better to be DGA or ZZP?",
    a: "DGA (BV) is generally advantageous when your annual profit exceeds €100,000–€120,000. Below that level, ZZP deductions (zelfstandigenaftrek, MKB) often result in a lower effective tax rate than the DGA/BV structure. Above that level, retaining profits in the BV at the 19% VPB rate and extracting via dividend at 24.5% beats ZZP Box 1 rates. Run both scenarios through our calculator.",
  },
  {
    q: "How much dividend tax do I pay as a DGA in 2026?",
    a: "Dividend from your BV is taxed in Box 2: 24.5% on the first €68,843 and 31% above that. This is your personal tax — the BV has already paid 19%–25.8% VPB on the same profit before distributing it.",
  },
  {
    q: "Can I avoid the gebruikelijk loon?",
    a: "No. The Belastingdienst requires DGAs to pay at least the gebruikelijk loon (€56,000 in 2026). If your BV cannot afford it because it genuinely lacks profit, you can request a lower norm from the Belastingdienst — but you must document why. Simply choosing to take no salary and only dividend will trigger penalties.",
  },
  {
    q: "What happens if I borrow more than €700,000 from my BV?",
    a: "Under the excessief lenen rule (in force since 2023), the amount above €700,000 is treated as Box 2 dividend and taxed at 24.5% or 31% in your personal IB return, even if you haven't received a cash distribution. This was introduced to prevent DGAs from indefinitely delaying Box 2 taxation by using BV loans instead of dividends.",
  },
];

const DGA_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "DGA Tax Netherlands 2026 — Gebruikelijk Loon, Box 2 Dividend & BV Tax Guide",
    "description": "Complete tax guide for DGA directors in the Netherlands 2026. Gebruikelijk loon €56,000, Box 2 dividend rates 24.5%/31%, VPB corporate tax, salary-dividend optimisation.",
    "author": { "@type": "Organization", "name": "TaxWijs" },
    "publisher": { "@type": "Organization", "name": "TaxWijs", "url": "https://taxwijs.nl" },
    "datePublished": "2026-01-01",
    "dateModified": "2026-06-20",
    "url": "https://taxwijs.nl/dga-tax-netherlands",
    "inLanguage": "en",
    "about": { "@type": "Thing", "name": "DGA BV Tax Netherlands 2026" },
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
      { "@type": "ListItem", "position": 2, "name": "DGA Tax Netherlands 2026", "item": "https://taxwijs.nl/dga-tax-netherlands" },
    ],
  },
];

export default function DGATaxPage() {
  const navigate = useNavigate();
  const isMobile = useMobile();

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>
      <SEOHead
        title="DGA Belasting 2026 — Gebruikelijk Loon, Box 2 Dividend & BV Gids"
        description="Complete DGA belastinggids Nederland 2026. Gebruikelijk loon €56.000, Box 2 dividend 24.5%/31%, vennootschapsbelasting 19%, salaris-dividend optimalisatie voor directeur-grootaandeelhouder."
        canonical="/dga-tax-netherlands"
        lang="nl"
        ogType="article"
        jsonLd={DGA_JSON_LD}
      />

      <div style={{ maxWidth: 820, margin: "0 auto", padding: isMobile ? "var(--sp-8) var(--sp-4)" : "var(--sp-12) var(--sp-8)" }}>

        {/* Header */}
        <div style={{ marginBottom: "var(--sp-10)" }}>
          <span className="pill pill-accent" style={{ marginBottom: "var(--sp-3)", display: "inline-block" }}>2026 Guide</span>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: isMobile ? "var(--text-4xl)" : "var(--text-5xl)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: "var(--leading-tight)" }}>
            DGA Tax in the Netherlands — Complete 2026 Guide
          </h1>
          <p style={{ marginTop: "var(--sp-3)", fontSize: "var(--text-lg)", color: "var(--ink-2)", maxWidth: 680 }}>
            Gebruikelijk loon, Box 2 dividend rates, salary-dividend optimisation, VPB corporate tax and key deadlines for DGA directors in 2026.
          </p>
          <div style={{ marginTop: "var(--sp-5)", display: "flex", flexWrap: "wrap", gap: "var(--sp-3)" }}>
            <button className="btn btn-accent" onClick={() => navigate("/intake")}>
              Calculate my DGA tax →
            </button>
            <button className="btn btn-ghost" onClick={() => navigate("/chat")}>
              Ask the DGA tax AI →
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
                <button className="btn btn-ghost btn-sm" style={{ marginInlineStart: "auto" }} onClick={() => navigate("/intake")}>
                  Calculate →
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
            Calculate your optimal DGA salary + dividend split
          </h2>
          <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", marginBottom: "var(--sp-5)" }}>
            Our calculator models the full DGA picture — gebruikelijk loon, Box 2 dividend, VPB and all credits — to find the most tax-efficient structure for your situation.
          </p>
          <div style={{ display: "flex", gap: "var(--sp-3)", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-accent btn-lg" onClick={() => navigate("/intake")}>
              Calculate my DGA tax →
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
