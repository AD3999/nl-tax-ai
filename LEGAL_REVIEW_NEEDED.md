# LEGAL_REVIEW_NEEDED.md

> This file contains copy and decisions that require review by a qualified Dutch privacy lawyer
> before being shown to production users. DO NOT ship any item in this file without sign-off.
> Last updated: 2026-06-18

---

## Item 1 — BSN in-app notice copy (ClientProfilePage.tsx)

**Status:** PROVISIONAL — not yet reviewed by legal counsel  
**Location:** `frontend/src/pages/ClientProfilePage.tsx` ~line 263 (search for `bsnLegal`)  
**Blocker for:** The BSN field notice that appears below the BSN input  

### Background

BSN (Burger Service Nummer) is a "bijzonder persoonsgegeven" under Article 87 UAVG (Dutch
implementation of GDPR Article 87). Processing requires an explicit statutory basis — general
consent is not sufficient. An accountancy platform may only process BSN if it falls under one
of the UAVG-recognised grounds, typically:

- **Article 87(1) UAVG** — processing by or on behalf of competent authorities (government)
- **Article 87(2) UAVG** — processing under a specific statutory obligation (e.g. BTW,
  loonheffing, IB return filing) where BSN is legally required to identify the taxpayer

The most defensible ground for a tax advisory SaaS is that the accountant is acting on behalf
of the client for the purpose of submitting a statutory tax filing (aangifte IB / BTW) where
Belastingdienst mandates BSN identification. This is sometimes called "wettelijke verplichting"
but it is the client's obligation, not TaxWijs's — so the legal basis needs careful framing.

### Three candidate notice texts for legal review

**Option A — Conservative (preferred starting point):**
> NL: "TaxWijs verwerkt uw BSN uitsluitend ten behoeve van belastingaangiften en
> fiscale dienstverlening waarbij het BSN wettelijk vereist is (art. 87 UAVG).
> Uw BSN wordt versleuteld opgeslagen en nooit gelogd of gedeeld met derden."
>
> EN: "TaxWijs processes your BSN solely for tax filings and advisory services
> where BSN identification is required by law (Article 87 UAVG). Your BSN is
> stored encrypted and is never logged or shared with third parties."
>
> FA: "TaxWijs شماره BSN شما را فقط برای تکمیل اظهارنامه‌های مالیاتی که قانوناً
> نیاز به BSN دارند پردازش می‌کند (ماده ۸۷ UAVG). BSN شما رمزگذاری‌شده ذخیره
> می‌شود و هرگز ثبت یا با اشخاص ثالث به اشتراک گذاشته نمی‌شود."

**Option B — More explicit about the wettelijke grondslag:**
> NL: "Uw BSN is een bijzonder persoonsgegeven (UAVG art. 87). TaxWijs verwerkt
> dit alleen met een wettelijke grondslag: het faciliteren van belastingaangiften
> waarbij de Belastingdienst BSN-identificatie verplicht stelt. Opslag is
> AES-256-GCM versleuteld."
>
> EN: "Your BSN is a specially protected identifier under Dutch law (UAVG Art. 87).
> TaxWijs processes it only where required by statute — specifically for tax
> filings where Belastingdienst mandates BSN identification. Stored with
> AES-256-GCM encryption."
>
> FA: "BSN یک شناسه حساس تحت قانون هلند (UAVG ماده ۸۷) است. TaxWijs آن را
> فقط در مواردی پردازش می‌کند که قانوناً الزامی است — برای اظهارنامه‌هایی که
> Belastingdienst شناسایی BSN را اجباری می‌کند. ذخیره‌سازی با رمزگذاری
> AES-256-GCM انجام می‌شود."

**Option C — Minimal (shortest visible text, detail in privacy policy):**
> NL: "BSN is een bijzonder persoonsgegeven. TaxWijs verwerkt dit alleen op basis
> van een wettelijke grondslag (art. 87 UAVG). Zie ons privacybeleid."
>
> EN: "BSN is a specially protected identifier. TaxWijs processes it only on a
> lawful statutory basis (Art. 87 UAVG). See our privacy policy."
>
> FA: "BSN یک شناسه حساس است. TaxWijs آن را فقط بر اساس مبنای قانونی (ماده ۸۷
> UAVG) پردازش می‌کند. سیاست حریم خصوصی ما را ببینید."

### Questions for legal counsel

1. Does TaxWijs's current business model (SaaS accountancy platform, not a fiduciaire) qualify
   for the Article 87(2) UAVG ground, or do we need a separate DPA/verwerkersovereenkomst
   that names the accountant as the controller and TaxWijs as processor?

2. If TaxWijs is a processor (not controller) for BSN, the in-app notice should reference
   the accountant's privacy statement, not TaxWijs's own. Please advise on the notice structure.

3. Is it sufficient to encrypt BSN at rest (AES-256-GCM as currently implemented), or does
   Article 87 require additional safeguards (e.g. pseudonymisation, separate key storage)?

4. Which of Option A/B/C is the most defensible wording given current AP enforcement posture?

5. Do we need an explicit retention period statement in this notice (e.g. "retained for 7 years
   per Article 52 AWR fiscal record-keeping obligation")?

---

## Code comment locations (for engineer reference)

The provisional BSN notice currently in production is at:
- `frontend/src/pages/ClientProfilePage.tsx` — search for `bsnLegal` comment
- The field is rendered between the BSN input and the KvK input
- The current provisional text is marked with `// PROVISIONAL — see LEGAL_REVIEW_NEEDED.md`

---

> This document must be deleted or archived once legal sign-off is obtained and
> the approved copy is deployed. Remove the `// PROVISIONAL` code comment at the same time.
