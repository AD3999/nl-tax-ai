import { useNavigate } from "react-router-dom";
import { useMobile } from "../hooks/useMobile";

const SECTIONS = [
  {
    id: "kvk-as-foreigner",
    title: "Registering as a ZZP freelancer as a foreigner",
    body: `Starting as a ZZP freelancer in the Netherlands as a foreign national is fully possible. Here is what you need before you can operate legally:

**1. BSN (Burgerservicenummer)**
Your BSN is your Dutch citizen service number — required for almost everything: bank accounts, taxes, healthcare, and KVK registration. You get your BSN when you register at your local municipality (gemeente). Bring your passport and proof of address.

**2. KVK registration (Kamer van Koophandel)**
Register your business at the Dutch Chamber of Commerce (KVK). You can do this online or in person. The registration costs €75 (one-time fee). After registration you receive your KVK number, which you put on all invoices.

**3. BTW (VAT) number**
After KVK registration, the Dutch tax authority (Belastingdienst) automatically assigns you a BTW number. You use this to charge and file VAT on your services. If your annual turnover is below €20,000, you may qualify for the KOR (small business VAT exemption).

**4. DigiD**
DigiD is the Dutch digital identity system — you need it to access the Belastingdienst online, file your tax return, and check toeslagen. Apply at digid.nl with your BSN. Non-residents can apply via a special procedure.`,
    source: "kvk.nl/starten · belastingdienst.nl/btw",
  },
  {
    id: "bsn-digid",
    title: "BSN and DigiD: the basics for internationals",
    body: `**Getting your BSN**
Register at your gemeente (city hall) as soon as you arrive. Bring:
• Valid passport or EU ID card
• Proof of address in the Netherlands (rental contract, or a declaration from the address owner)

You get your BSN on the spot or within a few days. Without a BSN you cannot open a Dutch bank account, receive toeslagen, or register a business.

**DigiD for non-Dutch nationals**
You can apply for DigiD even if you are not a Dutch citizen, as long as you have a BSN. The application is at digid.nl. Processing takes 5–7 business days. DigiD gives you access to all Dutch government services including your Belastingdienst account.

**Non-residents**
If you work in the Netherlands but live abroad, a special procedure exists (Registratie Niet-Ingezetenen / RNI). Contact the nearest RNI desk to get a BSN without a full residence registration.`,
    source: "government.nl/bsn · digid.nl",
  },
  {
    id: "income-tax-zzp",
    title: "Income tax for ZZP freelancers with an international background",
    body: `As a ZZP freelancer in the Netherlands, you pay income tax (inkomstenbelasting) on your profit, not on your gross revenue.

**Key 2026 tax facts for ZZP:**
• Box 1 bracket 1: 35.75% on profit up to €38,883
• Box 1 bracket 3: 49.50% on profit above €78,426
• Zelfstandigenaftrek: €1,200 deduction (requires 1,225 hours/year working in your business)
• MKB-winstvrijstelling: 12.7% profit exemption (no hours requirement)
• ZVW contribution: 4.85% health insurance contribution on your profit (often missed!)

**Important: the 30% ruling does NOT apply to ZZP freelancers**
The 30% ruling is an employee benefit — it requires a Dutch employer who withholds payroll tax. Self-employed ZZP workers cannot use it. If you were previously an employee with the 30% ruling and switched to ZZP, the ruling period stops.

**Filing your tax return**
As a ZZP freelancer, you file an annual income tax return (aangifte inkomstenbelasting) by 1 May each year (for the previous tax year). You can file online via Mijn Belastingdienst using your DigiD.`,
    source: "belastingdienst.nl/winst-uit-onderneming",
  },
  {
    id: "toeslagen",
    title: "Toeslagen (allowances) for ZZP internationals",
    body: `Dutch toeslagen (government allowances) are available to ZZP freelancers — including those with foreign nationality — as long as you live in the Netherlands and have a valid BSN.

**Zorgtoeslag (healthcare allowance)**
A monthly contribution towards your health insurance premium. In 2026, the maximum is €129/month. You must be insured under a Dutch health insurance policy (verplichte zorgverzekering). The income cutoff is €40,857 per year (single) — one euro over means zero allowance for the whole year.

**Huurtoeslag (rent allowance)**
Available if you rent a home in the Netherlands. In 2026, the rent ceiling was abolished — any rent now qualifies. Income limits still apply.

**Kinderopvangtoeslag (childcare allowance)**
Available if you have children in registered childcare. Income and hours-worked conditions apply.

To check and request toeslagen, log in at toeslagen.nl with your DigiD.`,
    source: "belastingdienst.nl/toeslagen",
  },
  {
    id: "find-accountant",
    title: "Finding an accountant who understands your background",
    body: `As a ZZP freelancer with an international background, finding the right accountant matters. Look for an advisor who:

• Speaks your language (English, Persian/Farsi, or other)
• Has experience with ZZP tax returns and knows the urencriterium (hours requirement)
• Understands cross-border tax situations (if you have income or assets outside the Netherlands)
• Is registered with a Dutch professional body (NBA, RB, or NOAB)

**Our accountant marketplace** lists verified Dutch tax advisors who work with international ZZP clients. You can filter by specialization including "International-background ZZP" and by language spoken.`,
    source: "taxwijs.nl/vind-adviseur",
  },
  {
    id: "key-deadlines",
    title: "Key 2026 tax deadlines for ZZP freelancers",
    body: `| Date | Obligation |
|---|---|
| **30 April 2026** | BTW Q1 2026 return deadline |
| **1 May 2026** | Annual IB return deadline (for tax year 2025) |
| **31 July 2026** | BTW Q2 2026 return deadline |
| **31 October 2026** | BTW Q3 2026 return deadline |
| **31 January 2027** | BTW Q4 2026 return deadline |

You can request a 5-month extension for the annual IB return. Contact the Belastingdienst or use a registered tax advisor to file for an extension.

**Note:** Late BTW returns attract automatic penalties (verzuimboete) even if the amount due is zero. Always file on time, even a nil return.`,
    source: "belastingdienst.nl/aangifte-termijnen",
  },
];

const FAQ = [
  { q: "Can I start a ZZP business in the Netherlands without Dutch nationality?", a: "Yes. EU/EEA citizens can register immediately. Non-EU nationals need a valid residence permit that allows self-employment. Check your permit conditions — some residence permits restrict work types. Contact the IND (immigration authority) if unsure." },
  { q: "Do I need a Dutch bank account to be a ZZP freelancer?", a: "Not legally, but in practice most Dutch clients require a Dutch IBAN for invoicing and payments. You can open a Dutch business account with your BSN. Several banks (Bunq, Revolut Business, ING) offer streamlined onboarding for international residents." },
  { q: "What is the urencriterium and do I have to track hours?", a: "The urencriterium (hours criterion) is the 1,225 hours/year threshold you must meet to claim the zelfstandigenaftrek (€1,200 deduction in 2026). Keep a simple hours log — date, client, hours worked. It does not need to be submitted but you must be able to show it if audited." },
  { q: "I came to the Netherlands on a work visa with the 30% ruling — can I keep it if I go ZZP?", a: "No. The 30% ruling is tied to employment. If you leave your employer and register as ZZP, the ruling stops from the day your employment ends. There is no ZZP equivalent of the 30% ruling." },
  { q: "How do I file my first Dutch tax return as ZZP?", a: "Log in to Mijn Belastingdienst (belastingdienst.nl) with your DigiD. Choose 'Aangifte inkomstenbelasting' for the relevant year. If your Dutch is limited, the portal offers some English guidance. For your first year, many international ZZP workers use an accountant to avoid mistakes." },
];

export default function ExpatTaxPage() {
  const navigate = useNavigate();
  const isMobile = useMobile();

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: isMobile ? "var(--sp-8) var(--sp-4)" : "var(--sp-12) var(--sp-8)" }}>

        {/* Header */}
        <div style={{ marginBottom: "var(--sp-10)" }}>
          <span className="pill pill-accent" style={{ marginBottom: "var(--sp-3)", display: "inline-block" }}>2026 Guide</span>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: isMobile ? "var(--text-4xl)" : "var(--text-5xl)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: "var(--leading-tight)" }}>
            ZZP Freelancing in the Netherlands — Guide for Internationals
          </h1>
          <p style={{ marginTop: "var(--sp-3)", fontSize: "var(--text-lg)", color: "var(--ink-2)", maxWidth: 680 }}>
            KVK registration, BSN, DigiD, income tax, toeslagen and key deadlines — explained for foreign-background ZZP freelancers.
          </p>
          <div style={{ marginTop: "var(--sp-5)", display: "flex", flexWrap: "wrap", gap: "var(--sp-3)" }}>
            <button className="btn btn-accent" onClick={() => navigate("/chat")}>
              Ask the ZZP tax AI →
            </button>
            <button className="btn btn-ghost" onClick={() => navigate("/find-accountant?specialization=international")}>
              Find an international ZZP advisor →
            </button>
          </div>
          <p style={{ marginTop: "var(--sp-3)", fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>
            Sources: KVK.nl · Belastingdienst.nl · All figures verified for tax year 2026
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
            Calculate your ZZP tax as an international
          </h2>
          <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", marginBottom: "var(--sp-5)" }}>
            Our calculator handles ZZP deductions, urencriterium, ZVW contribution, Box 3 and all 2026 tax credits.
          </p>
          <div style={{ display: "flex", gap: "var(--sp-3)", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-accent btn-lg" onClick={() => navigate("/calculator")}>
              Calculate my ZZP tax →
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate("/find-accountant?specialization=international")}>
              Find an international ZZP advisor
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
