# Dutch Tax Rule Source Register

> One row per rule area, per tax year. Every rule must have a verified official source before it can be marked `verified` and served to users.
> Rules without a confirmed source are marked UNSPECIFIED — must be reviewed by a qualified Dutch tax advisor before production use.
> Updated: 2026-06-13

---

## Provenance Fields

| Field | Description |
|-------|-------------|
| `rule_id` | TaxWijs rule identifier (e.g., ZA-2026-001) |
| `natural_language_rule` | Plain English summary of what the rule says |
| `legal_reference` | Dutch law or regulation name |
| `source_url` | Official Belastingdienst or legislation URL |
| `source_type` | government / legislation / caselaw / interpretation |
| `source_status` | VERIFIED / PENDING / UNSPECIFIED |
| `jurisdiction` | Netherlands (NL) |
| `tax_year` | 2026 |
| `effective_from` | Date the rule takes effect |
| `effective_to` | Expiry date (null = indefinite) |
| `owner` | Who is responsible for this rule in TaxWijs |
| `review_status` | approved / pending-review / flagged |

---

## Box Income Rules

| rule_id | natural_language_rule | legal_reference | source_url | source_type | source_status | effective_from | effective_to | review_status |
|---------|----------------------|-----------------|------------|-------------|---------------|----------------|--------------|---------------|
| BOX-2026-001 | Employment income, self-employment profit, and home income are taxed in Box 1 | Wet IB 2001, art. 2.3 | https://wetten.overheid.nl/BWBR0011353 | legislation | VERIFIED | 2026-01-01 | null | approved |
| BOX-2026-002 | Income from ≥5% shareholding in a BV is taxed in Box 2 | Wet IB 2001, art. 4.1 | https://wetten.overheid.nl/BWBR0011353 | legislation | VERIFIED | 2026-01-01 | null | approved |
| BOX-2026-003 | Net wealth above €59,357/person is subject to Box 3 fictitious return taxation | Wet IB 2001, art. 5.1 | https://wetten.overheid.nl/BWBR0011353 | legislation | VERIFIED | 2026-01-01 | null | approved |

---

## Box 1 Tax Brackets

| rule_id | natural_language_rule | legal_reference | source_url | source_type | source_status | effective_from | effective_to | review_status |
|---------|----------------------|-----------------|------------|-------------|---------------|----------------|--------------|---------------|
| BR1-2026-001 | Box 1 bracket 1: 35.75% on income €0–€38,883 (includes 27.65% social insurance) | Wet IB 2001, art. 2.10; Besluit 2025-11-28 | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/tarieven_voor_loon_en_inkomstenbelasting | government | VERIFIED | 2026-01-01 | null | approved |
| BR1-2026-002 | Box 1 bracket 2: 37.56% on income €0–€38,883 for AOW-age taxpayers (no social insurance component) | Wet IB 2001, art. 2.10a | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/tarieven_voor_loon_en_inkomstenbelasting | government | VERIFIED | 2026-01-01 | null | approved |
| BR1-2026-003 | Box 1 bracket 3: 49.50% on income above €78,426 | Wet IB 2001, art. 2.10 | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/tarieven_voor_loon_en_inkomstenbelasting | government | VERIFIED | 2026-01-01 | null | approved |

---

## Self-Employed Deductions

| rule_id | natural_language_rule | legal_reference | source_url | source_type | source_status | effective_from | effective_to | review_status |
|---------|----------------------|-----------------|------------|-------------|---------------|----------------|--------------|---------------|
| ZA-2026-001 | Zelfstandigenaftrek: €1,200 deduction for ZZP workers with ≥1,225 hours/year in their business | Wet IB 2001, art. 3.76 | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/zelfstandigenaftrek | government | VERIFIED | 2026-01-01 | null | approved |
| SA-2026-001 | Startersaftrek: additional €2,123 deduction for new entrepreneurs in their first 3 years. 2026 is the LAST YEAR — abolished from 2027 | Wet IB 2001, art. 3.76 (amended by Belastingplan 2027) | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/startersaftrek | government | VERIFIED | 2026-01-01 | 2026-12-31 | approved |
| MKB-2026-001 | MKB-winstvrijstelling: 12.7% exemption on ZZP/small business profit after ondernemersaftrek. No hours requirement | Wet IB 2001, art. 3.79a | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/mkb-winstvrijstelling | government | VERIFIED | 2026-01-01 | null | approved |
| KIA-2026-001 | KIA: 28% investment deduction on qualifying business investments between €2,901 and €70,602 | Wet IB 2001, art. 3.41 | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/investeringsaftrek | government | VERIFIED | 2026-01-01 | null | approved |
| LR-2026-001 | Lijfrente jaarruimte: annual pension deduction space = 30% × (income − €19,172) | Wet IB 2001, art. 3.127 | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/pensioen_en_lijfrente/lijfrente | government | VERIFIED | 2026-01-01 | null | approved |

---

## Health Contributions

| rule_id | natural_language_rule | legal_reference | source_url | source_type | source_status | effective_from | effective_to | review_status |
|---------|----------------------|-----------------|------------|-------------|---------------|----------------|--------------|---------------|
| ZVW-2026-001 | ZVW bijdrage: 4.85% on ZZP profit after ondernemersaftrek (not after MKB), ceiling €79,409 income, max contribution €3,851/year | Wet financiering sociale verzekeringen, art. 43 | https://wetten.overheid.nl/BWBR0017745 | legislation | VERIFIED | 2026-01-01 | null | approved |

---

## Tax Credits (Heffingskortingen)

| rule_id | natural_language_rule | legal_reference | source_url | source_type | source_status | effective_from | effective_to | review_status |
|---------|----------------------|-----------------|------------|-------------|---------------|----------------|--------------|---------------|
| AHK-2026-001 | Algemene heffingskorting: max €3,115, phasing out to €0 at aggregate income of €78,426 | Wet IB 2001, art. 8.10 | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/algemene_heffingskorting | government | VERIFIED | 2026-01-01 | null | approved |
| AK-2026-001 | Arbeidskorting: max €5,685, phasing out above €45,592 work income | Wet IB 2001, art. 8.11 | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/arbeidskorting | government | VERIFIED | 2026-01-01 | null | approved |
| IACK-2026-001 | IACK: max €3,032 for working parents with child under 12 registered at their address | Wet IB 2001, art. 8.14a | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/inkomensafhankelijke_combinatiekorting | government | VERIFIED | 2026-01-01 | null | approved |

---

## Box 2 Rules

| rule_id | natural_language_rule | legal_reference | source_url | source_type | source_status | effective_from | effective_to | review_status |
|---------|----------------------|-----------------|------------|-------------|---------------|----------------|--------------|---------------|
| B2R-2026-001 | Box 2 low rate: 24.5% on dividend/share income up to €68,843 | Wet IB 2001, art. 2.12 | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/aanmerkelijk_belang | government | VERIFIED | 2026-01-01 | null | approved |
| B2R-2026-002 | Box 2 high rate: 31% on dividend/share income above €68,843 | Wet IB 2001, art. 2.12 | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/aanmerkelijk_belang | government | VERIFIED | 2026-01-01 | null | approved |

---

## Box 3 Rules

| rule_id | natural_language_rule | legal_reference | source_url | source_type | source_status | effective_from | effective_to | review_status |
|---------|----------------------|-----------------|------------|-------------|---------------|----------------|--------------|---------------|
| B3R-2026-001 | Box 3: fictitious return of 1.28% on savings and 6% on investments, taxed at 36%. Exemption €59,357/person. Reference date: 1 January | Wet IB 2001, art. 5.2; Besluit Box 3 | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/vermogen/box_3 | government | VERIFIED | 2026-01-01 | null | approved |

---

## VAT Rules

| rule_id | natural_language_rule | legal_reference | source_url | source_type | source_status | effective_from | effective_to | review_status |
|---------|----------------------|-----------------|------------|-------------|---------------|----------------|--------------|---------------|
| BTW-2026-001 | BTW standard rate: 21% on most professional services | Wet OB 1968, art. 9 | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/tarieven_en_vrijstellingen | government | VERIFIED | 2026-01-01 | null | approved |
| BTW-2026-002 | BTW reduced rate: 9% (food, medicine, books). Accommodation moved from 9% to 21% in 2026 | Wet OB 1968, Tabel I; Belastingplan 2026 | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/tarieven_en_vrijstellingen | government | VERIFIED | 2026-01-01 | null | approved |
| KOR-2026-001 | KOR: VAT exemption for businesses with annual turnover under €20,000 | Wet OB 1968, art. 25 | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/kleineondernemersregeling | government | VERIFIED | 2026-01-01 | null | approved |

---

## Benefits (Toeslagen)

| rule_id | natural_language_rule | legal_reference | source_url | source_type | source_status | effective_from | effective_to | review_status |
|---------|----------------------|-----------------|------------|-------------|---------------|----------------|--------------|---------------|
| ZT-2026-001 | Zorgtoeslag: max €129/month. Hard cutoff at €40,857 income (single) — €1 above means €0 benefit | Wet op de zorgtoeslag | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/toeslagen/zorgtoeslag | government | VERIFIED | 2026-01-01 | null | approved |
| HT-2026-001 | Huurtoeslag: rent ceiling abolished in 2026 — any rent amount now qualifies | Wet op de huurtoeslag (amended 2026) | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/toeslagen/huurtoeslag | government | VERIFIED | 2026-01-01 | null | approved |

---

## Employment Law (Wet DBA)

| rule_id | natural_language_rule | legal_reference | source_url | source_type | source_status | effective_from | effective_to | review_status |
|---------|----------------------|-----------------|------------|-------------|---------------|----------------|--------------|---------------|
| WD-2026-001 | Wet DBA: active enforcement since January 2025. Risk factors include 65%+ revenue from single client, no substitution clause, client direction over work. NOTE: 65% threshold is an interpretation, not a published Belastingdienst percentage — see GAP-L03 | Wet deregulering beoordeling arbeidsrelaties | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/bijzondere_situaties/wet_deregulering_beoordeling_arbeidsrelaties | government | VERIFIED | 2025-01-01 | null | pending-review |

---

## Deadlines

| rule_id | natural_language_rule | legal_reference | source_url | source_type | source_status | effective_from | effective_to | review_status |
|---------|----------------------|-----------------|------------|-------------|---------------|----------------|--------------|---------------|
| DL-2026-001 | BTW quarterly deadline: 30 April 2026 for Q1. Late filing triggers automatic penalty even for zero return | AWR art. 10 | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/aangifte_doen_en_betalen | government | VERIFIED | 2026-01-01 | 2026-12-31 | approved |
| DL-2026-002 | IB return deadline: 1 May 2026 for tax year 2025 | AWR art. 9 | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/aangifte_doen | government | VERIFIED | 2026-01-01 | 2026-12-31 | approved |

---

## Expat Rules

| rule_id | natural_language_rule | legal_reference | source_url | source_type | source_status | effective_from | effective_to | review_status |
|---------|----------------------|-----------------|------------|-------------|---------------|----------------|--------------|---------------|
| EXP-2026-001 | 30% ruling: 5-year phase-down from 2024. Years 1-3: 30% tax-free, Year 4: 20%, Year 5: 10%. Partial-year eligibility for mid-year arrivals — see GAP-L02 | Wet LB 1964, art. 31a | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/internationaal/werken_in_het_buitenland/30_procent_regeling | government | VERIFIED | 2026-01-01 | null | pending-review |

---

## DGA Rules

| rule_id | natural_language_rule | legal_reference | source_url | source_type | source_status | effective_from | effective_to | review_status |
|---------|----------------------|-----------------|------------|-------------|---------------|----------------|--------------|---------------|
| DGA-2026-001 | DGA gebruikelijk loon: minimum salary €56,000 for directors owning ≥5% of their BV. Tax authority can impute higher salary if market rate is higher | Wet LB 1964, art. 12a | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/bv_en_andere_rechtspersonen/directeur_grootaandeelhouder | government | VERIFIED | 2026-01-01 | null | approved |

---

## Review Notes

Rules marked `pending-review` require validation by a qualified Dutch tax advisor (RB or RA designation) before they can be promoted to `approved`. See GAP-L01 through GAP-L06 in the assumptions register for specific open legal questions.
