# Domain Glossary

> Dutch tax and TaxWijs product terms defined in English.
> Dutch terms are shown in *italics* on first use.
> Updated: 2026-06-13

---

## Dutch Tax Terms

| Term (NL) | English | Definition |
|-----------|---------|------------|
| *Aangifte inkomstenbelasting* | Income tax return | The annual tax return filed with the Belastingdienst covering all income and deductions for a calendar year. Deadline: 1 May following the tax year. |
| *Aanmerkelijk belang* | Substantial interest | Owning ≥5% of shares in a company (BV). Triggers Box 2 taxation on dividends and capital gains. |
| *Algemene heffingskorting* | General tax credit | A tax credit available to all Dutch tax residents. In 2026: max €3,115, phasing out to €0 at €78,426 aggregate income. |
| *Arbeidskorting* | Employment tax credit | A tax credit for income from work (employment or business). In 2026: max €5,685, phasing out above €45,592. |
| *Belastingdienst* | Dutch Tax Authority | The Dutch government tax collection agency. Official source for all tax rates, rules, and deadlines. |
| *Box 1* | Box 1 | Taxable income from work and home. Includes employment income, ZZP profit, and owner-occupied home income (eigenwoningforfait). |
| *Box 2* | Box 2 | Taxable income from substantial interest (≥5% shareholding in a BV). Taxed at 24.5% up to €68,843, then 31% above. |
| *Box 3* | Box 3 | Taxable income from savings and investments. Based on a fictitious return (1.28% on savings, 6% on investments) taxed at 36%. Exemption: €59,357/person. |
| *BTW* (Belasting Toegevoegde Waarde) | VAT (Value Added Tax) | Dutch consumption tax. Standard rate 21%; reduced rate 9% (food, books, medicine). Accommodation moved from 9% to 21% in 2026. |
| *DGA* (Directeur-grootaandeelhouder) | Director-major shareholder | A company director who owns ≥5% of the company shares. Subject to a minimum salary requirement (*gebruikelijk loon*) of €56,000 in 2026. |
| *Eigenwoningforfait* | Deemed rental value | A fictitious income added to Box 1 for owner-occupied homes, based on WOZ value. |
| *Gebruikelijk loon* | Customary salary / notional salary | The minimum salary a DGA must pay themselves from their BV. €56,000 in 2026. |
| *Heffingskorting* | Tax credit | A deduction applied directly against tax owed (not taxable income). More valuable than a deduction because it reduces tax euro-for-euro. |
| *Huurtoeslag* | Rent benefit / Housing benefit | A government subsidy for renters with low income. Reformed in 2026: the rent ceiling was abolished, meaning any rent amount now qualifies. |
| *IB-aangifte* | Income tax return | Short form of *aangifte inkomstenbelasting*. |
| *IACK* (Inkomensafhankelijke combinatiekorting) | Income-dependent combination credit | A tax credit for working parents with a child under 12 registered at their address. Max €3,032 in 2026. |
| *Inkomstenbelasting* | Income tax | The Dutch personal income tax, divided into three boxes (Box 1/2/3). |
| *Investeringsaftrek* | Investment deduction | Collective term for KIA and other investment-based deductions. |
| *KIA* (Kleinschaligheidsinvesteringsaftrek) | Small-scale investment deduction | A deduction for ZZP and small business investments between €2,901 and €70,602 in a single year. Rate: 28% on qualifying investments. |
| *KOR* (Kleineondernemersregeling) | Small business VAT exemption | An optional VAT exemption for businesses with annual turnover under €20,000. Exempt from filing VAT returns. |
| *KVK* (Kamer van Koophandel) | Dutch Chamber of Commerce | The business registry where all Dutch companies must register. KVK number is the unique business identifier. |
| *Lijfrente* | Annuity / Pension annuity | A tax-advantaged pension savings product. Contributions are deductible via *jaarruimte* (annual space) calculation. |
| *Jaarruimte* | Annual pension space | The maximum deductible pension contribution per year. Formula: 30% × (income − €19,172). |
| *MKB-winstvrijstelling* | SME profit exemption | A 12.7% exemption on ZZP/small business profit after other deductions. No hours requirement. Applied after *ondernemersaftrek*. |
| *Ondernemersaftrek* | Entrepreneur's deduction | The collective deduction for self-employed: *zelfstandigenaftrek* + *startersaftrek* + other deductions. |
| *Startersaftrek* | Starter's deduction | An additional deduction of €2,123 for new entrepreneurs in their first 3 years. 2026 is the LAST YEAR — abolished from 2027. |
| *Toeslag* | Benefit / Allowance | Government means-tested subsidies: *zorgtoeslag* (healthcare), *huurtoeslag* (rent), *kinderopvangtoeslag* (childcare). |
| *Urencriterium* | Hours criterion | The requirement to work at least 1,225 hours per year in one's own business to qualify for *zelfstandigenaftrek* and *startersaftrek*. |
| *Wet DBA* (Wet Deregulering Beoordeling Arbeidsrelaties) | Bogus self-employment legislation | Dutch law governing the relationship between freelancers and clients. Active enforcement since January 2025. Key risk indicator: earning 65%+ revenue from a single client. |
| *Zelfstandigenaftrek* | Self-employed deduction | A deduction of €1,200 (2026) for ZZP workers who meet the *urencriterium*. Reduced from €2,470 in 2025. |
| *Zorgtoeslag* | Healthcare benefit | A government subsidy toward health insurance premiums. Max €129/month in 2026. Hard income cutoff at €40,857 (single) — €1 above means €0 benefit. |
| *ZVW* (Zorgverzekeringswet) | Health Insurance Act contribution | An income-related health contribution paid by the self-employed on ZZP profit (after *ondernemersaftrek*). Rate: 4.85%, ceiling €79,409 income, max contribution €3,851/year. Often overlooked in tax estimates. |
| *ZZP* (Zelfstandige Zonder Personeel) | Self-employed without employees | A freelancer or independent contractor in the Netherlands. The primary target persona for TaxWijs. |
| *30%-regeling* | 30% ruling | An expatriate tax benefit allowing 30% of salary to be paid tax-free. Phase-down from 2024: years 1-3: 30%, year 4: 20%, year 5: 10%. |

---

## TaxWijs Product Terms

| Term | Definition |
|------|-----------|
| **Engagement** | The core TaxWijs entity. One engagement = one client + one tax year + one preparation workflow. Has states: Draft → Collecting → Review → ReadyToFile → Filed → Archived. |
| **Readiness Score** | A 0–100 score per engagement indicating how complete the tax preparation is. Computed from four weighted dimensions: Documents, Checklist, Verification, Accountant Review. Never exceeds 80 when a mandatory document is missing. |
| **Checklist Item** | A specific task required for an engagement (e.g., "Upload jaaropgaaf", "Confirm bank details"). Each item has a status: todo → waiting_client → uploaded → needs_review → accepted → rejected → waived. |
| **Document Request** | A specific request from an accountant to a client for a required document. |
| **Extracted Field** | A single data field extracted from an uploaded document by OCR/AI. Always has a confidence score. Always candidate until an accountant approves. |
| **Deduction Opportunity** | An AI-identified potential tax deduction for a client, based on their profile and uploaded documents. Always marked with confidence level and required evidence. |
| **Cascade Retrieval** | A RAG technique where retrieving a Q&A pair also pulls its associated rule IDs, even if they didn't rank in the top-5 semantic results. |
| **Chunk** | A single embeddable text unit in the RAG vector store. One per tax rule, one per Q&A variant, one per scenario, one per IB form field. |
| **AI Prompt Hint** | An instruction embedded in a tax rule chunk (e.g., "ALWAYS include ZVW in ZZP estimates"). Surfaced in the assembled context string so the AI follows it. |
| **Expected AI Behavior** | A field on Q&A pairs that tells the AI how confident to be: `answer_directly`, `answer_with_caveat`, `ask_clarifying_question`, `refer_to_advisor`. |
| **Stable Key** | A deterministic hash used to make checklist items, document requests, and accountant actions idempotent. Prevents duplicates when engines run multiple times. |
| **Verification Status** | A field on tax rules and Q&A pairs: `verified`, `pending_review`, or `draft`. Only `verified` records are served to users. |
| **Portal** | The accountant-facing workspace at `/accountant/portal` and the client-facing workspace at `/client`. |
| **Invitation Flow** | The accountant-initiated onboarding flow: accountant sends invite by email → client receives in-app banner → client accepts → `AccountantClient` link created automatically. |
| **Tax Memory** | A per-user JSONField (`User.tax_memory`) that stores cross-session profile data injected into the Claude system prompt for context. |
| **PROFILE_UPDATE** | A structured marker (`[PROFILE_UPDATE: {...}]`) emitted by the AI in chat responses to signal that user-provided data should be saved to their intake profile. |
| **Shadow Mode** | A rule engine mode where a new rule version runs in parallel with the current version, logging differences without affecting users. Used for safe rule updates. |
