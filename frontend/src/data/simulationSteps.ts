/**
 * Full branching simulation of the Belastingdienst aangifte IB 2026 process.
 * Steps and fields mirror the real mijn.belastingdienst.nl flow.
 */

export type Lang = "nl" | "en" | "fa";
export type T3 = Record<Lang, string>;
export type Answers = Record<string, unknown>;

export interface SimOption {
  value: string;
  label: T3;
}

export interface SimField {
  id: string;
  type: "number" | "boolean" | "select" | "info" | "text";
  label: T3;
  help: T3;
  condition?: (a: Answers) => boolean;
  options?: SimOption[];
  unit?: string;
  required?: boolean;
  sourceUrl?: string;
  claudeQ: T3; // pre-filled question sent to Claude
}

export interface SimSection {
  id: string;
  title: T3;
  condition?: (a: Answers) => boolean;
  fields: SimField[];
}

export interface SimStep {
  id: string;
  number: number;
  title: T3;
  subtitle: T3;
  icon: string;
  condition?: (a: Answers) => boolean;
  sections: SimSection[];
}

// ─── helpers ────────────────────────────────────────────────────────────────

const bool = (a: Answers, k: string) => !!a[k];
const num  = (a: Answers, k: string) => Number(a[k] ?? 0);

// ─── STEPS ──────────────────────────────────────────────────────────────────

export const SIMULATION_STEPS: SimStep[] = [

  // ── STEP 1 ── Persoonlijke gegevens ────────────────────────────────────
  {
    id: "personal",
    number: 1,
    icon: "👤",
    title: { nl: "Persoonlijke gegevens", en: "Personal details", fa: "اطلاعات شخصی" },
    subtitle: {
      nl: "Net als op de echte aangifte controleren we eerst wie u bent en of u een fiscale partner heeft",
      en: "Just like the real return, we first check who you are and whether you have a fiscal partner",
      fa: "مانند اظهارنامه واقعی، ابتدا بررسی می‌کنیم شما کی هستید و آیا شریک مالی دارید",
    },
    sections: [
      {
        id: "identity",
        title: { nl: "Uw situatie", en: "Your situation", fa: "وضعیت شما" },
        fields: [
          {
            id: "birth_year",
            type: "number",
            label: { nl: "Geboortejaar", en: "Year of birth", fa: "سال تولد" },
            help: {
              nl: "Beïnvloedt of u de ouderenkorting en AOW-leeftijdskorting ontvangt (67+ in 2026)",
              en: "Affects whether you receive the elderly tax credit (AOW age is 67 in 2026)",
              fa: "تأثیر می‌گذارد که آیا تخفیف مالیاتی سالمندان دریافت می‌کنید (سن AOW در 2026 برابر 67 است)",
            },
            claudeQ: {
              nl: "Wat is de ouderenkorting in 2026 en wanneer heb ik er recht op?",
              en: "What is the elderly tax credit in 2026 and when do I qualify?",
              fa: "تخفیف مالیاتی سالمندان در 2026 چیست و چه زمانی واجد شرایط هستم؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarief/heffingskortingen/ouderenkorting/",
          },
          {
            id: "has_partner",
            type: "boolean",
            label: { nl: "Heeft u een fiscale partner?", en: "Do you have a fiscal partner?", fa: "آیا شریک مالیاتی دارید؟" },
            help: {
              nl: "Een fiscale partner is uw echtgenoot/echtgenote of geregistreerd partner, of uw samenwonende partner die aan bepaalde voorwaarden voldoet",
              en: "A fiscal partner is your spouse, registered partner, or cohabiting partner meeting specific conditions",
              fa: "شریک مالیاتی همسر، شریک ثبت‌شده یا شریک همزیستی شماست که شرایط خاصی را دارد",
            },
            claudeQ: {
              nl: "Wie telt als fiscale partner voor de belastingaangifte 2026?",
              en: "Who counts as a fiscal partner for the 2026 tax return?",
              fa: "چه کسی به عنوان شریک مالیاتی برای اظهارنامه مالیاتی 2026 محسوب می‌شود؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/aangifte_doen/fiscale_partner/",
          },
          {
            id: "partner_income",
            type: "number",
            unit: "€",
            label: { nl: "Inkomen fiscale partner (€)", en: "Fiscal partner income (€)", fa: "درآمد شریک مالیاتی (€)" },
            condition: (a) => bool(a, "has_partner"),
            help: {
              nl: "Het totale belastbare inkomen van uw partner. Relevant voor het verdelen van aftrekposten",
              en: "Your partner's total taxable income. Relevant for allocating deductions",
              fa: "درآمد مشمول مالیات کل شریک شما. برای تخصیص کسورات مرتبط است",
            },
            claudeQ: {
              nl: "Hoe werkt het verdelen van aftrekposten tussen fiscale partners?",
              en: "How does allocating deductions between fiscal partners work?",
              fa: "چگونه تقسیم کسورات بین شرکای مالیاتی کار می‌کند؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/aangifte_doen/fiscale_partner/",
          },
          {
            id: "children_under_12",
            type: "number",
            label: { nl: "Kinderen jonger dan 12 jaar", en: "Children under 12", fa: "فرزندان زیر ۱۲ سال" },
            help: {
              nl: "Relevant voor de Inkomensafhankelijke Combinatiekorting (IACK) — max €3.032 in 2026",
              en: "Relevant for the Income-dependent Combination Credit (IACK) — max €3,032 in 2026",
              fa: "مرتبط با تخفیف ترکیبی وابسته به درآمد (IACK) — حداکثر €3.032 در 2026",
            },
            claudeQ: {
              nl: "Wat is de IACK (inkomensafhankelijke combinatiekorting) in 2026?",
              en: "What is the IACK (income-dependent combination credit) in 2026?",
              fa: "IACK (تخفیف ترکیبی وابسته به درآمد) در 2026 چیست؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarief/heffingskortingen/inkomensafhankelijke_combinatiekorting/",
          },
        ],
      },
    ],
  },

  // ── STEP 2 ── Soort inkomen ─────────────────────────────────────────────
  {
    id: "income_sources",
    number: 2,
    icon: "💼",
    title: { nl: "Soort inkomen", en: "Type of income", fa: "نوع درآمد" },
    subtitle: {
      nl: "Geef aan welke soorten inkomen u in 2026 had. Alle relevante velden worden daarna getoond",
      en: "Indicate which types of income you had in 2026. All relevant fields will be shown next",
      fa: "مشخص کنید چه نوع درآمدهایی در 2026 داشتید. تمام فیلدهای مرتبط بعداً نمایش داده می‌شوند",
    },
    sections: [
      {
        id: "sources",
        title: { nl: "Inkomstenbronnen", en: "Income sources", fa: "منابع درآمد" },
        fields: [
          {
            id: "is_employee",
            type: "boolean",
            label: { nl: "Ik was in loondienst (werkgever)", en: "I was employed (employer)", fa: "من کارمند بودم (کارفرما)" },
            help: {
              nl: "U heeft een jaaropgave ontvangen van uw werkgever",
              en: "You received an annual income statement (jaaropgave) from your employer",
              fa: "یک صورت درآمد سالانه (jaaropgave) از کارفرمای خود دریافت کرده‌اید",
            },
            claudeQ: {
              nl: "Wat moet ik invullen als ik in loondienst ben geweest in 2026?",
              en: "What do I fill in as an employee in 2026?",
              fa: "به عنوان کارمند در 2026 چه چیزی باید وارد کنم؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/wat_is_inkomen/loon_en_andere_inkomsten_uit_tegenwoordige_dienstbetrekking/",
          },
          {
            id: "is_zzp",
            type: "boolean",
            label: { nl: "Ik was ondernemer / ZZP'er", en: "I was self-employed / ZZP", fa: "من کارآفرین / آزادکار بودم" },
            help: {
              nl: "U werkte als zelfstandige en maakte winst uit onderneming",
              en: "You worked as a freelancer and earned profit from your business",
              fa: "به عنوان مستقل کار کردید و از کسب‌وکارتان سود کسب کردید",
            },
            claudeQ: {
              nl: "Wat zijn de belastingvoordelen voor ZZP'ers in 2026?",
              en: "What are the tax benefits for ZZP freelancers in 2026?",
              fa: "مزایای مالیاتی برای ZZP (آزادکاران) در 2026 چیست؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/",
          },
          {
            id: "has_benefits",
            type: "boolean",
            label: { nl: "Ik ontving een uitkering (WW, WIA, AOW, bijstand)", en: "I received benefits (WW, WIA, AOW, welfare)", fa: "من مقرری دریافت کردم (WW، WIA، AOW، کمک اجتماعی)" },
            help: {
              nl: "Uitkeringen zijn belastbaar inkomen en moeten worden opgegeven",
              en: "Benefits are taxable income and must be declared",
              fa: "مقرری‌ها درآمد مشمول مالیات هستند و باید اعلام شوند",
            },
            claudeQ: {
              nl: "Zijn WW en WIA uitkeringen belastbaar in 2026?",
              en: "Are WW and WIA benefits taxable in 2026?",
              fa: "آیا مقرری‌های WW و WIA در 2026 مشمول مالیات هستند؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/wat_is_inkomen/uitkeringen/",
          },
          {
            id: "has_foreign_income",
            type: "boolean",
            label: { nl: "Ik had inkomen uit het buitenland", en: "I had income from abroad", fa: "من درآمد از خارج از کشور داشتم" },
            help: {
              nl: "Werkte u voor een buitenlandse werkgever, of had u buitenlandse huurinkomsten of pensioen?",
              en: "Did you work for a foreign employer, or have foreign rental income or pension?",
              fa: "آیا برای کارفرمای خارجی کار کردید، یا درآمد اجاره یا بازنشستگی خارجی داشتید؟",
            },
            claudeQ: {
              nl: "Hoe geef ik buitenlands inkomen op in de Nederlandse aangifte?",
              en: "How do I declare foreign income in the Dutch tax return?",
              fa: "چگونه درآمد خارجی را در اظهارنامه مالیاتی هلند اعلام کنم؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/wat_is_inkomen/inkomen_uit_het_buitenland/",
          },
          {
            id: "has_substantial_interest",
            type: "boolean",
            label: { nl: "Ik heb een aanmerkelijk belang (≥5% in een BV)", en: "I have a substantial interest (≥5% in a BV)", fa: "من سهم قابل توجه دارم (≥5٪ در BV)" },
            help: {
              nl: "Als u minstens 5% van de aandelen of winstbewijzen in een BV bezit, valt dit in Box 2",
              en: "If you own at least 5% of shares or profit certificates in a BV, this falls in Box 2",
              fa: "اگر حداقل 5٪ سهام یا گواهی سود در BV دارید، این در Box 2 قرار می‌گیرد",
            },
            claudeQ: {
              nl: "Wat is aanmerkelijk belang (Box 2) en welk tarief geldt in 2026?",
              en: "What is substantial interest (Box 2) and what rate applies in 2026?",
              fa: "سهم قابل توجه (Box 2) چیست و چه نرخی در 2026 اعمال می‌شود؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/aanmerkelijk_belang/",
          },
        ],
      },
    ],
  },

  // ── STEP 3 ── Loon & uitkeringen ───────────────────────────────────────
  {
    id: "employment",
    number: 3,
    icon: "🏢",
    title: { nl: "Loon & uitkeringen", en: "Salary & benefits", fa: "حقوق و مقرری" },
    subtitle: {
      nl: "Vul de gegevens in van uw jaaropgave. U vindt deze op MijnBelastingdienst of van uw werkgever",
      en: "Fill in the details from your annual income statement (jaaropgave) from your employer",
      fa: "اطلاعات را از صورت درآمد سالانه (jaaropgave) کارفرمای خود وارد کنید",
    },
    condition: (a) => bool(a, "is_employee") || bool(a, "has_benefits"),
    sections: [
      {
        id: "jaaropgave",
        title: { nl: "Jaaropgave werkgever", en: "Employer annual statement", fa: "صورت سالانه کارفرما" },
        condition: (a) => bool(a, "is_employee"),
        fields: [
          {
            id: "employment_income",
            type: "number",
            unit: "€",
            required: true,
            label: { nl: "Loon (Kolom 1 jaaropgave) (€)", en: "Salary (Column 1 jaaropgave) (€)", fa: "حقوق (ستون 1 jaaropgave) (€)" },
            help: {
              nl: "Het bruto loon inclusief vakantiegeld en eventuele bonussen. Staat op uw jaaropgave in kolom 1",
              en: "Gross salary including holiday allowance and bonuses. Found on column 1 of your jaaropgave",
              fa: "حقوق ناخالص شامل حق تعطیلات و پاداش. در ستون 1 jaaropgave آمده است",
            },
            claudeQ: {
              nl: "Wat staat er in kolom 1 van de jaaropgave en waarom is het mijn bruto loon?",
              en: "What is in column 1 of the jaaropgave and why is it my gross salary?",
              fa: "ستون 1 jaaropgave چه چیزی دارد و چرا حقوق ناخالص من است؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/aangifte_doen/aangifte_ib_2026/",
          },
          {
            id: "withheld_tax",
            type: "number",
            unit: "€",
            label: { nl: "Ingehouden loonbelasting (€)", en: "Withheld wage tax (€)", fa: "مالیات دستمزد کسر شده (€)" },
            help: {
              nl: "De loonheffing die uw werkgever al heeft afgedragen. Dit vermindert uw nog te betalen belasting",
              en: "The wage tax already paid by your employer. This reduces your remaining tax bill",
              fa: "مالیات دستمزدی که کارفرمایتان قبلاً پرداخت کرده. این مبلغ از مالیات باقی‌مانده شما کسر می‌شود",
            },
            claudeQ: {
              nl: "Hoe vermindert ingehouden loonbelasting mijn aanslag?",
              en: "How does withheld wage tax reduce my tax assessment?",
              fa: "چگونه مالیات دستمزد کسر شده، برگ تشخیص مالیات مرا کاهش می‌دهد؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/aangifte_doen/",
          },
          {
            id: "uses_30pct_ruling",
            type: "boolean",
            label: { nl: "Maakt u gebruik van de 30%-regeling?", en: "Do you use the 30% ruling?", fa: "آیا از قانون ۳۰٪ استفاده می‌کنید؟" },
            help: {
              nl: "De 30%-regeling is voor werknemers van buiten Nederland die aangeworven zijn vanwege specifieke expertise",
              en: "The 30% ruling is for employees from outside the Netherlands recruited for specific expertise",
              fa: "قانون ۳۰٪ برای کارمندانی از خارج از هلند است که برای تخصص خاص استخدام شده‌اند",
            },
            claudeQ: {
              nl: "Hoe werkt de 30%-regeling in 2026 en hoeveel belasting bespaar ik?",
              en: "How does the 30% ruling work in 2026 and how much tax do I save?",
              fa: "قانون ۳۰٪ در 2026 چگونه کار می‌کند و چقدر مالیات صرفه‌جویی می‌کنم؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/internationale_aspecten/u_komt_naar_nederland_om_te_werken/30_procent_regeling/",
          },
          {
            id: "ruling_year",
            type: "select",
            label: { nl: "In welk jaar van de 30%-regeling bent u?", en: "Which year of the 30% ruling are you in?", fa: "در چه سالی از قانون ۳۰٪ هستید؟" },
            condition: (a) => bool(a, "uses_30pct_ruling"),
            options: [
              { value: "1", label: { nl: "Jaar 1-3 (30%)", en: "Year 1-3 (30%)", fa: "سال ۱-۳ (۳۰٪)" } },
              { value: "4", label: { nl: "Jaar 4 (20%)", en: "Year 4 (20%)", fa: "سال ۴ (۲۰٪)" } },
              { value: "5", label: { nl: "Jaar 5 (10%)", en: "Year 5 (10%)", fa: "سال ۵ (۱۰٪)" } },
            ],
            help: {
              nl: "De regeling loopt max 5 jaar. Vanaf jaar 4 daalt het percentage",
              en: "The ruling runs max 5 years. From year 4 the percentage decreases",
              fa: "این قانون حداکثر ۵ سال اجرا می‌شود. از سال ۴ درصد کاهش می‌یابد",
            },
            claudeQ: {
              nl: "Wanneer eindigt mijn 30%-regeling en wat zijn de nieuwe percentages?",
              en: "When does my 30% ruling end and what are the new percentages?",
              fa: "قانون ۳۰٪ من چه زمانی پایان می‌یابد و درصدهای جدید چیست؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/internationale_aspecten/u_komt_naar_nederland_om_te_werken/30_procent_regeling/",
          },
        ],
      },
      {
        id: "benefits",
        title: { nl: "Uitkeringen", en: "Benefits / allowances", fa: "مقرری‌ها" },
        condition: (a) => bool(a, "has_benefits"),
        fields: [
          {
            id: "benefit_type",
            type: "select",
            label: { nl: "Soort uitkering", en: "Type of benefit", fa: "نوع مقرری" },
            options: [
              { value: "ww",  label: { nl: "WW (Werkloosheid)", en: "WW (Unemployment)", fa: "WW (بیکاری)" } },
              { value: "wia", label: { nl: "WIA / WGA (Arbeidsongeschiktheid)", en: "WIA / WGA (Disability)", fa: "WIA / WGA (ناتوانی)" } },
              { value: "aow", label: { nl: "AOW (Staatspensioen)", en: "AOW (State pension)", fa: "AOW (بازنشستگی دولتی)" } },
              { value: "bijstand", label: { nl: "Bijstand", en: "Welfare (Bijstand)", fa: "کمک اجتماعی (Bijstand)" } },
              { value: "other", label: { nl: "Anders", en: "Other", fa: "سایر" } },
            ],
            help: {
              nl: "Alle uitkeringen zijn belastbaar. U ontvangt een jaaropgave van het uitkeringsorgaan",
              en: "All benefits are taxable. You receive an annual statement from the benefit authority",
              fa: "تمام مقرری‌ها مشمول مالیات هستند. یک صورت سالانه از مرجع مقرری دریافت می‌کنید",
            },
            claudeQ: {
              nl: "Welke uitkeringen zijn belastbaar en welke zijn vrijgesteld?",
              en: "Which benefits are taxable and which are exempt?",
              fa: "کدام مقرری‌ها مشمول مالیات و کدام معاف هستند؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/wat_is_inkomen/uitkeringen/",
          },
          {
            id: "benefit_amount",
            type: "number",
            unit: "€",
            label: { nl: "Totale uitkering in 2026 (€)", en: "Total benefit in 2026 (€)", fa: "کل مقرری در 2026 (€)" },
            help: {
              nl: "Het bruto bedrag van de uitkering over heel 2026",
              en: "The gross benefit amount over all of 2026",
              fa: "مبلغ ناخالص مقرری در تمام سال 2026",
            },
            claudeQ: {
              nl: "Hoe wordt mijn WW-uitkering belast in de aangifte?",
              en: "How is my WW benefit taxed in the tax return?",
              fa: "مقرری WW من چگونه در اظهارنامه مالیاتی محاسبه می‌شود؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/wat_is_inkomen/uitkeringen/",
          },
        ],
      },
    ],
  },

  // ── STEP 4 ── Winst uit onderneming ────────────────────────────────────
  {
    id: "entrepreneurship",
    number: 4,
    icon: "🏗️",
    title: { nl: "Winst uit onderneming", en: "Business profit", fa: "سود کسب‌وکار" },
    subtitle: {
      nl: "Als ondernemer geeft u uw winst op en claimt u de ondernemersaftrekken waarvoor u in aanmerking komt",
      en: "As a self-employed person you declare your profit and claim the entrepreneur deductions you qualify for",
      fa: "به عنوان کارآفرین، سود خود را اعلام می‌کنید و کسورات کارآفرینی را که واجد شرایط آن هستید مطالبه می‌کنید",
    },
    condition: (a) => bool(a, "is_zzp"),
    sections: [
      {
        id: "revenue",
        title: { nl: "Omzet & kosten", en: "Revenue & costs", fa: "درآمد و هزینه" },
        fields: [
          {
            id: "annual_revenue_zzp",
            type: "number",
            unit: "€",
            required: true,
            label: { nl: "Jaaromzet (€)", en: "Annual revenue (€)", fa: "درآمد سالانه (€)" },
            help: {
              nl: "Uw totale omzet inclusief BTW-vrijgestelde omzet, exclusief BTW",
              en: "Your total revenue including VAT-exempt turnover, excluding VAT",
              fa: "درآمد کل شما شامل درآمد معاف از BTW، بدون BTW",
            },
            claudeQ: {
              nl: "Wat reken ik tot mijn omzet als ZZP'er voor de IB-aangifte?",
              en: "What counts as my revenue as a ZZP for the income tax return?",
              fa: "چه چیزی به عنوان درآمد من به عنوان ZZP برای اظهارنامه مالیات بر درآمد محسوب می‌شود؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/",
          },
          {
            id: "business_expenses",
            type: "number",
            unit: "€",
            label: { nl: "Bedrijfskosten (€)", en: "Business expenses (€)", fa: "هزینه‌های کسب‌وکار (€)" },
            help: {
              nl: "Aftrekbare kosten: kantoormateriaal, reiskosten zakelijk, abonnementen, opleidingen, etc",
              en: "Deductible costs: office supplies, business travel, subscriptions, training, etc",
              fa: "هزینه‌های کسر‌پذیر: لوازم اداری، سفر تجاری، اشتراک‌ها، آموزش و غیره",
            },
            claudeQ: {
              nl: "Welke kosten zijn aftrekbaar als ZZP'er in 2026?",
              en: "Which costs are deductible as a ZZP freelancer in 2026?",
              fa: "کدام هزینه‌ها به عنوان ZZP در 2026 قابل کسر هستند؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/kosten/",
          },
        ],
      },
      {
        id: "entrepreneur_deductions",
        title: { nl: "Ondernemersaftrekken", en: "Entrepreneur deductions", fa: "کسورات کارآفرینی" },
        fields: [
          {
            id: "hours_per_year",
            type: "number",
            unit: "uur",
            label: { nl: "Aantal uren besteed aan onderneming", en: "Hours worked in business", fa: "ساعات صرف شده در کسب‌وکار" },
            help: {
              nl: "Minimaal 1.225 uur nodig voor de zelfstandigenaftrek (€1.200) en startersaftrek. Bewaar uw urenstaten!",
              en: "Minimum 1,225 hours required for the zelfstandigenaftrek (€1,200) and starter deduction. Keep your time records!",
              fa: "حداقل ۱۲۲۵ ساعت برای zelfstandigenaftrek (€1200) و کسر استارتر لازم است. سوابق زمانی را نگه دارید!",
            },
            claudeQ: {
              nl: "Hoe werkt het urencriterium van 1.225 uur voor de zelfstandigenaftrek?",
              en: "How does the 1,225 hour criterion work for the self-employed deduction?",
              fa: "معیار ۱۲۲۵ ساعت برای کسر خوداشتغالی چگونه کار می‌کند؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/ondernemersaftrek/zelfstandigenaftrek/",
          },
          {
            id: "is_starter",
            type: "boolean",
            label: { nl: "Ik ben starter (eerste 3 jaar als ondernemer)", en: "I am a starter (first 3 years as entrepreneur)", fa: "من استارتر هستم (اولین ۳ سال به عنوان کارآفرین)" },
            help: {
              nl: "⚠️ Startersaftrek (€2.123) is 2026 het LAATSTE JAAR. Wordt afgeschaft per 2027",
              en: "⚠️ Starter deduction (€2,123) is 2026 the LAST YEAR. Abolished from 2027",
              fa: "⚠️ کسر استارتر (€2.123) سال 2026 آخرین سال است. از 2027 لغو می‌شود",
            },
            claudeQ: {
              nl: "Wat is de startersaftrek en waarom is 2026 het laatste jaar?",
              en: "What is the starter deduction and why is 2026 the last year?",
              fa: "کسر استارتر چیست و چرا 2026 آخرین سال است؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/ondernemersaftrek/startersaftrek/",
          },
          {
            id: "kia_investments",
            type: "number",
            unit: "€",
            label: { nl: "Investeringen voor KIA (€)", en: "KIA-eligible investments (€)", fa: "سرمایه‌گذاری‌های واجد شرایط KIA (€)" },
            help: {
              nl: "Kleinschaligheidsinvesteringsaftrek: 28% aftrek op investeringen tussen €2.901 en €70.602",
              en: "Small-scale investment allowance: 28% deduction on investments between €2,901 and €70,602",
              fa: "کمک هزینه سرمایه‌گذاری کوچک: کسر ۲۸٪ برای سرمایه‌گذاری‌های بین €2.901 و €70.602",
            },
            claudeQ: {
              nl: "Hoe werkt de KIA (kleinschaligheidsinvesteringsaftrek) in 2026?",
              en: "How does the KIA (small-scale investment allowance) work in 2026?",
              fa: "KIA (کمک هزینه سرمایه‌گذاری کوچک) در 2026 چگونه کار می‌کند؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/ondernemersaftrek/investeringsaftrek/kleinschaligheidsinvesteringsaftrek/",
          },
          {
            id: "single_client_percentage",
            type: "number",
            unit: "%",
            label: { nl: "% inkomen van één opdrachtgever", en: "% income from one client", fa: "٪ درآمد از یک مشتری" },
            help: {
              nl: "Wet DBA: bij 65%+ van één opdrachtgever is er een verhoogd risico op schijnzelfstandigheid",
              en: "Wet DBA: at 65%+ from one client there is increased risk of false self-employment",
              fa: "Wet DBA: در ۶۵٪+ از یک مشتری، خطر بیشتر خوداشتغالی کاذب وجود دارد",
            },
            claudeQ: {
              nl: "Wat is het risico op schijnzelfstandigheid (Wet DBA) als ik maar één opdrachtgever heb?",
              en: "What is the risk of false self-employment (Wet DBA) if I have just one client?",
              fa: "اگر فقط یک مشتری دارم، خطر خوداشتغالی کاذب (Wet DBA) چیست؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/bijzondere_situaties/dga/",
          },
        ],
      },
      {
        id: "pension_zzp",
        title: { nl: "Pensioen / lijfrente", en: "Pension / annuity", fa: "بازنشستگی / مستمری" },
        fields: [
          {
            id: "pension_contribution",
            type: "number",
            unit: "€",
            label: { nl: "Lijfrentepremie betaald in 2026 (€)", en: "Annuity premium paid in 2026 (€)", fa: "حق بیمه مستمری پرداخت شده در 2026 (€)" },
            help: {
              nl: "Aftrekbaar via jaarruimte: 30% × (inkomen − €19.172). Max per jaar afhankelijk van inkomen",
              en: "Deductible via annual space: 30% × (income − €19,172). Max per year depends on income",
              fa: "قابل کسر از طریق فضای سالانه: ۳۰٪ × (درآمد − €19.172). حداکثر در سال به درآمد بستگی دارد",
            },
            claudeQ: {
              nl: "Hoeveel lijfrentepremie kan ik aftrekken als ZZP'er in 2026?",
              en: "How much annuity premium can I deduct as a ZZP freelancer in 2026?",
              fa: "چقدر حق بیمه مستمری می‌توانم به عنوان ZZP در 2026 کسر کنم؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/wat_vermindert_uw_belasting/lijfrentepremies/",
          },
        ],
      },
    ],
  },

  // ── STEP 5 ── Eigen woning ─────────────────────────────────────────────
  {
    id: "own_home",
    number: 5,
    icon: "🏠",
    title: { nl: "Woning", en: "Your home", fa: "مسکن" },
    subtitle: {
      nl: "Of u nu huurt of een eigen woning heeft — beide situaties hebben gevolgen voor uw aangifte",
      en: "Whether you rent or own — both situations affect your tax return",
      fa: "چه اجاره کنید چه خانه داشته باشید — هر دو وضعیت بر اظهارنامه مالیاتی شما تأثیر می‌گذارند",
    },
    sections: [
      {
        id: "housing_type",
        title: { nl: "Woonsituatie", en: "Housing situation", fa: "وضعیت مسکن" },
        fields: [
          {
            id: "home_type",
            type: "select",
            label: { nl: "Uw woonsituatie", en: "Your housing situation", fa: "وضعیت مسکن شما" },
            options: [
              { value: "own", label: { nl: "Eigen woning (koopwoning)", en: "Own home (owner-occupied)", fa: "خانه شخصی (خریداری شده)" } },
              { value: "rent", label: { nl: "Huurwoning", en: "Rental property", fa: "خانه اجاری" } },
              { value: "other", label: { nl: "Anders (inwonen, onderhuur)", en: "Other (living with family, subletting)", fa: "سایر (ساکن با خانواده، اجاره فرعی)" } },
            ],
            help: {
              nl: "Een eigen woning leidt tot het eigenwoningforfait (bijtelling) én mogelijke renteaftrek",
              en: "An own home leads to imputed rental income (eigenwoningforfait) and possible interest deduction",
              fa: "خانه شخصی منجر به درآمد اجاره فرضی (eigenwoningforfait) و احتمال کسر بهره می‌شود",
            },
            claudeQ: {
              nl: "Wat zijn de fiscale gevolgen van een eigen woning in 2026?",
              en: "What are the tax consequences of owning a home in 2026?",
              fa: "پیامدهای مالیاتی داشتن خانه شخصی در 2026 چیست؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/woning/",
          },
        ],
      },
      {
        id: "own_home_details",
        title: { nl: "Eigen woning details", en: "Own home details", fa: "جزئیات خانه شخصی" },
        condition: (a) => a["home_type"] === "own",
        fields: [
          {
            id: "woz_value",
            type: "number",
            unit: "€",
            label: { nl: "WOZ-waarde (€)", en: "WOZ value (€)", fa: "ارزش WOZ (€)" },
            help: {
              nl: "De WOZ-waarde staat op uw aanslagbiljet gemeentebelasting. Het eigenwoningforfait is 0,35% van de WOZ-waarde",
              en: "The WOZ value is on your municipal tax assessment. The imputed income is 0.35% of the WOZ value",
              fa: "ارزش WOZ روی برگ تشخیص مالیات شهرداری آمده است. درآمد فرضی ۰.۳۵٪ ارزش WOZ است",
            },
            claudeQ: {
              nl: "Wat is het eigenwoningforfait en hoe bereken ik het?",
              en: "What is the eigenwoningforfait and how do I calculate it?",
              fa: "eigenwoningforfait چیست و چگونه آن را محاسبه کنم؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/woning/eigenwoningforfait/",
          },
          {
            id: "has_mortgage",
            type: "boolean",
            label: { nl: "Heeft u een hypotheek op deze woning?", en: "Do you have a mortgage on this home?", fa: "آیا برای این خانه وام مسکن دارید؟" },
            help: {
              nl: "De hypotheekrente is aftrekbaar als de hypotheek voldoet aan de aflossingseis (annuïtair of lineair)",
              en: "Mortgage interest is deductible if the mortgage meets the repayment requirement (annuity or linear)",
              fa: "بهره وام مسکن قابل کسر است اگر وام الزامات بازپرداخت را داشته باشد (مستمری یا خطی)",
            },
            claudeQ: {
              nl: "Is mijn hypotheekrente nog aftrekbaar in 2026?",
              en: "Is my mortgage interest still deductible in 2026?",
              fa: "آیا بهره وام مسکن من در 2026 هنوز قابل کسر است؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/woning/rente_en_kosten_eigen_woning/",
          },
          {
            id: "mortgage_interest",
            type: "number",
            unit: "€",
            label: { nl: "Betaalde hypotheekrente in 2026 (€)", en: "Mortgage interest paid in 2026 (€)", fa: "بهره وام مسکن پرداخت شده در 2026 (€)" },
            condition: (a) => bool(a, "has_mortgage"),
            help: {
              nl: "Het totale bedrag hypotheekrente betaald in 2026. Staat op uw jaaropgave van de geldverstrekker",
              en: "Total mortgage interest paid in 2026. Found on your annual statement from the lender",
              fa: "کل بهره وام مسکن پرداخت شده در 2026. روی صورت سالانه از وام‌دهنده آمده است",
            },
            claudeQ: {
              nl: "Hoe vul ik de hypotheekrente in op de aangifte 2026?",
              en: "How do I fill in mortgage interest on the 2026 tax return?",
              fa: "چگونه بهره وام مسکن را در اظهارنامه 2026 وارد کنم؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/woning/rente_en_kosten_eigen_woning/",
          },
          {
            id: "mortgage_type",
            type: "select",
            label: { nl: "Type hypotheek", en: "Mortgage type", fa: "نوع وام مسکن" },
            condition: (a) => bool(a, "has_mortgage"),
            options: [
              { value: "annuitair", label: { nl: "Annuïtair", en: "Annuity", fa: "مستمری" } },
              { value: "lineair", label: { nl: "Lineair", en: "Linear", fa: "خطی" } },
              { value: "aflossingsvrij", label: { nl: "Aflossingsvrij (voor 2013)", en: "Interest-only (pre-2013)", fa: "فقط بهره (قبل از 2013)" } },
              { value: "mixed", label: { nl: "Gemengd", en: "Mixed", fa: "ترکیبی" } },
            ],
            help: {
              nl: "Hypotheken afgesloten na 2013 moeten annuïtair of lineair zijn voor renteaftrek",
              en: "Mortgages taken out after 2013 must be annuity or linear for interest deduction",
              fa: "وام‌های مسکن گرفته شده بعد از 2013 باید مستمری یا خطی باشند تا بهره قابل کسر باشد",
            },
            claudeQ: {
              nl: "Welk type hypotheek geeft recht op renteaftrek in 2026?",
              en: "Which type of mortgage gives the right to interest deduction in 2026?",
              fa: "کدام نوع وام مسکن حق کسر بهره را در 2026 می‌دهد؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/woning/rente_en_kosten_eigen_woning/",
          },
        ],
      },
    ],
  },

  // ── STEP 6 ── Aftrekposten ─────────────────────────────────────────────
  {
    id: "deductions",
    number: 6,
    icon: "✂️",
    title: { nl: "Aftrekposten", en: "Deductions", fa: "کسورات" },
    subtitle: {
      nl: "Persoonlijke aftrekposten verminderen uw belastbaar inkomen. Controleer goed of u er recht op heeft",
      en: "Personal deductions reduce your taxable income. Check carefully which ones you qualify for",
      fa: "کسورات شخصی درآمد مشمول مالیات شما را کاهش می‌دهند. به دقت بررسی کنید که آیا واجد شرایط هستید",
    },
    sections: [
      {
        id: "alimony",
        title: { nl: "Alimentatie", en: "Alimony", fa: "نفقه" },
        fields: [
          {
            id: "has_alimony_paid",
            type: "boolean",
            label: { nl: "Betaalde u partneralimentatie?", en: "Did you pay partner alimony?", fa: "آیا نفقه شریک پرداختید؟" },
            help: {
              nl: "Betaalde alimentatie aan uw ex-partner is aftrekbaar. Kinderalimentatie is NIET aftrekbaar",
              en: "Alimony paid to your ex-partner is deductible. Child support is NOT deductible",
              fa: "نفقه پرداخت شده به شریک سابق قابل کسر است. نفقه فرزند قابل کسر نیست",
            },
            claudeQ: {
              nl: "Is alimentatie aftrekbaar en zo ja, hoeveel?",
              en: "Is alimony deductible and if so, how much?",
              fa: "آیا نفقه قابل کسر است و اگر بله، چقدر؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/wat_vermindert_uw_belasting/alimentatie/",
          },
          {
            id: "alimony_paid",
            type: "number",
            unit: "€",
            label: { nl: "Betaalde alimentatie in 2026 (€)", en: "Alimony paid in 2026 (€)", fa: "نفقه پرداخت شده در 2026 (€)" },
            condition: (a) => bool(a, "has_alimony_paid"),
            help: {
              nl: "Alleen partneralimentatie — niet kinderalimentatie of levensonderhoud",
              en: "Only partner alimony — not child support or maintenance payments",
              fa: "فقط نفقه شریک — نه نفقه فرزند یا پرداخت‌های نگهداری",
            },
            claudeQ: {
              nl: "Hoe vul ik alimentatie in op mijn aangifte?",
              en: "How do I fill in alimony on my tax return?",
              fa: "چگونه نفقه را در اظهارنامه مالیاتی وارد کنم؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/wat_vermindert_uw_belasting/alimentatie/",
          },
        ],
      },
      {
        id: "medical",
        title: { nl: "Specifieke zorgkosten", en: "Specific healthcare costs", fa: "هزینه‌های درمانی خاص" },
        fields: [
          {
            id: "has_medical_expenses",
            type: "boolean",
            label: { nl: "Heeft u hoge, niet-vergoede zorgkosten?", en: "Did you have high, unreimbursed healthcare costs?", fa: "آیا هزینه‌های درمانی بالایی داشتید که جبران نشده؟" },
            help: {
              nl: "Denk aan: hulpmiddelen, dieetkosten, vervoer naar arts. Er geldt een drempelbedrag (ca. 1,65% van inkomen)",
              en: "Think: aids, diet costs, transport to doctor. A threshold applies (~1.65% of income)",
              fa: "مانند: وسایل کمکی، هزینه رژیم غذایی، حمل‌ونقل به پزشک. آستانه‌ای اعمال می‌شود (~۱.۶۵٪ درآمد)",
            },
            claudeQ: {
              nl: "Welke zorgkosten kan ik aftrekken en hoeveel is de drempel in 2026?",
              en: "Which healthcare costs can I deduct and what is the threshold in 2026?",
              fa: "کدام هزینه‌های درمانی قابل کسر هستند و آستانه در 2026 چقدر است؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/wat_vermindert_uw_belasting/zorgkosten/",
          },
          {
            id: "medical_expenses",
            type: "number",
            unit: "€",
            label: { nl: "Totale eigen zorgkosten (€)", en: "Total own healthcare costs (€)", fa: "کل هزینه‌های درمانی شخصی (€)" },
            condition: (a) => bool(a, "has_medical_expenses"),
            help: {
              nl: "Vul het totaal in voor de drempelberekening. Alleen het bedrag boven de drempel is aftrekbaar",
              en: "Enter the total for the threshold calculation. Only the amount above the threshold is deductible",
              fa: "کل را برای محاسبه آستانه وارد کنید. فقط مبلغ بالاتر از آستانه قابل کسر است",
            },
            claudeQ: {
              nl: "Hoe bereken ik de aftrekbare zorgkosten boven de drempel?",
              en: "How do I calculate the deductible healthcare costs above the threshold?",
              fa: "چگونه هزینه‌های درمانی قابل کسر بالاتر از آستانه را محاسبه کنم؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/wat_vermindert_uw_belasting/zorgkosten/",
          },
        ],
      },
      {
        id: "gifts",
        title: { nl: "Giften aan goede doelen", en: "Charitable donations", fa: "کمک‌های خیریه" },
        fields: [
          {
            id: "has_gifts",
            type: "boolean",
            label: { nl: "Deed u giften aan erkende goede doelen (ANBI)?", en: "Did you make donations to recognised charities (ANBI)?", fa: "آیا به خیریه‌های مجاز (ANBI) کمک کردید؟" },
            help: {
              nl: "Giften aan ANBI-instellingen zijn aftrekbaar. Periodieke giften (notarieel vastgelegd) zijn onbeperkt aftrekbaar",
              en: "Donations to ANBI institutions are deductible. Periodic donations (notarised) are unlimited deductible",
              fa: "کمک‌ها به مؤسسات ANBI قابل کسر هستند. کمک‌های دوره‌ای (تأیید شده توسط دفتر اسناد) به‌طور نامحدود قابل کسر هستند",
            },
            claudeQ: {
              nl: "Hoeveel van mijn giften aan goede doelen kan ik aftrekken in 2026?",
              en: "How much of my charitable donations can I deduct in 2026?",
              fa: "چقدر از کمک‌های خیریه‌ام می‌توانم در 2026 کسر کنم؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/wat_vermindert_uw_belasting/giftenaftrek/",
          },
          {
            id: "periodic_gifts",
            type: "number",
            unit: "€",
            label: { nl: "Periodieke giften — notarieel (€)", en: "Periodic donations — notarised (€)", fa: "کمک‌های دوره‌ای — تأیید شده توسط دفتر اسناد (€)" },
            condition: (a) => bool(a, "has_gifts"),
            help: {
              nl: "Volledig aftrekbaar — geen drempel, geen maximum. Moeten minimaal 5 jaar doorlopen",
              en: "Fully deductible — no threshold, no maximum. Must run for at least 5 years",
              fa: "به‌طور کامل قابل کسر — بدون آستانه، بدون حداکثر. باید حداقل ۵ سال ادامه داشته باشند",
            },
            claudeQ: {
              nl: "Wat is het verschil tussen periodieke en eenmalige giften voor de belasting?",
              en: "What is the difference between periodic and one-time donations for tax purposes?",
              fa: "تفاوت بین کمک‌های دوره‌ای و یک‌باره برای اهداف مالیاتی چیست؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/wat_vermindert_uw_belasting/giftenaftrek/",
          },
          {
            id: "one_time_gifts",
            type: "number",
            unit: "€",
            label: { nl: "Eenmalige giften (€)", en: "One-time donations (€)", fa: "کمک‌های یک‌باره (€)" },
            condition: (a) => bool(a, "has_gifts"),
            help: {
              nl: "Aftrekbaar boven 1% van drempelinkomen (min €60). Maximum: 10% van inkomen",
              en: "Deductible above 1% of threshold income (min €60). Maximum: 10% of income",
              fa: "بالاتر از ۱٪ درآمد آستانه (حداقل €60) قابل کسر است. حداکثر: ۱۰٪ درآمد",
            },
            claudeQ: {
              nl: "Hoe bereken ik de drempel voor eenmalige giftenaftrek?",
              en: "How do I calculate the threshold for one-time donation deduction?",
              fa: "چگونه آستانه کسر کمک‌های یک‌باره را محاسبه کنم؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/wat_vermindert_uw_belasting/giftenaftrek/",
          },
        ],
      },
    ],
  },

  // ── STEP 7 ── Buitenlands inkomen ──────────────────────────────────────
  {
    id: "foreign_income",
    number: 7,
    icon: "✈️",
    title: { nl: "Inkomen uit buitenland", en: "Foreign income", fa: "درآمد از خارج" },
    subtitle: {
      nl: "Nederland belast wereldwijd inkomen. Belastingverdragen voorkomen dubbele belasting",
      en: "The Netherlands taxes worldwide income. Tax treaties prevent double taxation",
      fa: "هلند درآمد جهانی را مشمول مالیات می‌کند. معاهدات مالیاتی از مالیات مضاعف جلوگیری می‌کنند",
    },
    condition: (a) => bool(a, "has_foreign_income"),
    sections: [
      {
        id: "foreign_details",
        title: { nl: "Buitenlands inkomen details", en: "Foreign income details", fa: "جزئیات درآمد خارجی" },
        fields: [
          {
            id: "foreign_country",
            type: "text",
            label: { nl: "Land van herkomst inkomen", en: "Country of income source", fa: "کشور منشأ درآمد" },
            help: {
              nl: "Vul het land in waar u het inkomen verdiende. Nederland heeft met de meeste landen een belastingverdrag",
              en: "Enter the country where you earned the income. The Netherlands has tax treaties with most countries",
              fa: "کشوری را که در آن درآمد کسب کردید وارد کنید. هلند با اکثر کشورها معاهده مالیاتی دارد",
            },
            claudeQ: {
              nl: "Heeft Nederland een belastingverdrag met Iran / mijn land?",
              en: "Does the Netherlands have a tax treaty with my country?",
              fa: "آیا هلند با ایران / کشور من معاهده مالیاتی دارد؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/internationale_aspecten/",
          },
          {
            id: "foreign_income_amount",
            type: "number",
            unit: "€",
            label: { nl: "Bedrag buitenlands inkomen (€)", en: "Foreign income amount (€)", fa: "مبلغ درآمد خارجی (€)" },
            help: {
              nl: "Omreken naar euro's op de datum van ontvangst (of jaargemiddelde wisselkoers)",
              en: "Convert to euros at the date of receipt (or annual average exchange rate)",
              fa: "به نرخ تاریخ دریافت (یا میانگین سالانه نرخ ارز) به یورو تبدیل کنید",
            },
            claudeQ: {
              nl: "Tegen welke wisselkoers moet ik buitenlands inkomen omrekenen naar euro's?",
              en: "At what exchange rate should I convert foreign income to euros?",
              fa: "با چه نرخ ارزی باید درآمد خارجی را به یورو تبدیل کنم؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/internationale_aspecten/",
          },
          {
            id: "foreign_tax_paid",
            type: "number",
            unit: "€",
            label: { nl: "Belasting betaald in het buitenland (€)", en: "Tax paid abroad (€)", fa: "مالیات پرداخت شده در خارج (€)" },
            help: {
              nl: "Dit kan worden verrekend met uw Nederlandse belasting via het verdrag of de voorkoming van dubbele belasting",
              en: "This can be offset against your Dutch tax via the treaty or double taxation prevention",
              fa: "این مبلغ می‌تواند از طریق معاهده یا پیشگیری از مالیات مضاعف با مالیات هلند شما تهاتر شود",
            },
            claudeQ: {
              nl: "Hoe voorkom ik dubbele belasting op mijn buitenlandse inkomen?",
              en: "How do I prevent double taxation on my foreign income?",
              fa: "چگونه از مالیات مضاعف بر درآمد خارجی خود جلوگیری کنم؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/internationale_aspecten/",
          },
        ],
      },
    ],
  },

  // ── STEP 8 ── Sparen & beleggen (Box 3) ────────────────────────────────
  {
    id: "box3",
    number: 8,
    icon: "🏦",
    title: { nl: "Sparen & beleggen (Box 3)", en: "Savings & investments (Box 3)", fa: "پس‌انداز و سرمایه‌گذاری (Box 3)" },
    subtitle: {
      nl: "Box 3 belast vermogen boven de vrijstelling (€59.357 per persoon) op basis van een fictief rendement",
      en: "Box 3 taxes assets above the exemption (€59,357 per person) based on a fictitious return",
      fa: "Box 3 دارایی‌های بالاتر از معافیت (€59.357 در هر نفر) را بر اساس بازده فرضی مشمول مالیات می‌کند",
    },
    sections: [
      {
        id: "assets",
        title: { nl: "Bezittingen op 1 januari 2026", en: "Assets on 1 January 2026", fa: "دارایی‌ها در ۱ ژانویه ۲۰۲۶" },
        fields: [
          {
            id: "savings_balance",
            type: "number",
            unit: "€",
            label: { nl: "Saldo bankrekeningen (€)", en: "Bank account balance (€)", fa: "موجودی حساب بانکی (€)" },
            help: {
              nl: "Het totale saldo van al uw Nederlandse en buitenlandse bankrekeningen op 1 januari 2026",
              en: "Total balance of all your Dutch and foreign bank accounts on 1 January 2026",
              fa: "موجودی کل تمام حساب‌های بانکی هلندی و خارجی شما در ۱ ژانویه ۲۰۲۶",
            },
            claudeQ: {
              nl: "Welke spaartegoed moet ik opgeven in Box 3 en wat is het fictief rendement?",
              en: "Which savings must I declare in Box 3 and what is the fictitious return?",
              fa: "کدام پس‌اندازها را باید در Box 3 اعلام کنم و بازده فرضی چقدر است؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/vermogen/",
          },
          {
            id: "investments_value",
            type: "number",
            unit: "€",
            label: { nl: "Waarde beleggingen (aandelen, obligaties) (€)", en: "Value of investments (shares, bonds) (€)", fa: "ارزش سرمایه‌گذاری‌ها (سهام، اوراق) (€)" },
            help: {
              nl: "Marktwaarde van aandelen, obligaties, fondsen op 1 januari 2026. Fictief rendement: 6,04%",
              en: "Market value of shares, bonds, funds on 1 January 2026. Fictitious return: 6.04%",
              fa: "ارزش بازار سهام، اوراق قرضه، صندوق‌ها در ۱ ژانویه ۲۰۲۶. بازده فرضی: ۶.۰۴٪",
            },
            claudeQ: {
              nl: "Hoeveel belasting betaal ik over mijn beleggingen in Box 3 in 2026?",
              en: "How much tax do I pay on my investments in Box 3 in 2026?",
              fa: "چقدر مالیات بر سرمایه‌گذاری‌هایم در Box 3 در 2026 پرداخت می‌کنم؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/vermogen/",
          },
          {
            id: "other_assets",
            type: "number",
            unit: "€",
            label: { nl: "Overige bezittingen (tweede huis, etc.) (€)", en: "Other assets (second home, etc.) (€)", fa: "سایر دارایی‌ها (خانه دوم و غیره) (€)" },
            help: {
              nl: "Vakantiewoning, verhuurd vastgoed, kunst, boot. Waarde op 1 januari 2026",
              en: "Holiday home, rental property, art, boat. Value on 1 January 2026",
              fa: "خانه تعطیلات، ملک اجاری، هنر، قایق. ارزش در ۱ ژانویه ۲۰۲۶",
            },
            claudeQ: {
              nl: "Moet ik mijn tweede huis of vakantiewoning opgeven in Box 3?",
              en: "Do I need to declare my second home or holiday house in Box 3?",
              fa: "آیا باید خانه دوم یا خانه تعطیلاتم را در Box 3 اعلام کنم؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/vermogen/",
          },
          {
            id: "green_investments",
            type: "number",
            unit: "€",
            label: { nl: "Groene beleggingen (€)", en: "Green investments (€)", fa: "سرمایه‌گذاری‌های سبز (€)" },
            help: {
              nl: "Erkende groene beleggingen zijn vrijgesteld tot €71.251 (per persoon) in Box 3",
              en: "Recognised green investments are exempt up to €71,251 (per person) in Box 3",
              fa: "سرمایه‌گذاری‌های سبز مجاز تا €71.251 (در هر نفر) در Box 3 معاف هستند",
            },
            claudeQ: {
              nl: "Wat zijn groene beleggingen en welke zijn erkend voor de belastingvrijstelling?",
              en: "What are green investments and which are recognised for the tax exemption?",
              fa: "سرمایه‌گذاری‌های سبز چیست و کدام‌ها برای معافیت مالیاتی مجاز هستند؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/vermogen/",
          },
          {
            id: "debts",
            type: "number",
            unit: "€",
            label: { nl: "Schulden (niet hypotheek) (€)", en: "Debts (excluding mortgage) (€)", fa: "بدهی‌ها (به جز وام مسکن) (€)" },
            help: {
              nl: "Consumptieve schulden, studieschuld. Drempel: €3.400 per persoon (schulden onder drempel tellen niet mee)",
              en: "Consumer debts, student loans. Threshold: €3,400 per person (debts below threshold don't count)",
              fa: "بدهی‌های مصرفی، وام دانشجویی. آستانه: €3.400 در هر نفر (بدهی‌های زیر آستانه محاسبه نمی‌شوند)",
            },
            claudeQ: {
              nl: "Welke schulden mag ik aftrekken van mijn Box 3 vermogen?",
              en: "Which debts can I deduct from my Box 3 assets?",
              fa: "کدام بدهی‌ها را می‌توانم از دارایی Box 3 خود کسر کنم؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/vermogen/",
          },
        ],
      },
    ],
  },

  // ── STEP 9 ── Aanmerkelijk belang (Box 2) ─────────────────────────────
  {
    id: "box2",
    number: 9,
    icon: "🏢",
    title: { nl: "Aanmerkelijk belang (Box 2)", en: "Substantial interest (Box 2)", fa: "سهم قابل توجه (Box 2)" },
    subtitle: {
      nl: "Box 2 belast dividend en verkoopwinst op aandelen als u minstens 5% bezit in een BV",
      en: "Box 2 taxes dividends and sale profit on shares if you own at least 5% in a BV",
      fa: "Box 2 سود سهام و سود فروش سهام را مشمول مالیات می‌کند اگر حداقل ۵٪ از BV را داشته باشید",
    },
    condition: (a) => bool(a, "has_substantial_interest"),
    sections: [
      {
        id: "box2_details",
        title: { nl: "Box 2 inkomen", en: "Box 2 income", fa: "درآمد Box 2" },
        fields: [
          {
            id: "box2_dividend",
            type: "number",
            unit: "€",
            label: { nl: "Ontvangen dividend uit BV (€)", en: "Dividend received from BV (€)", fa: "سود دریافتی از BV (€)" },
            help: {
              nl: "Laag tarief: 24,5% over eerste €68.843. Hoog tarief: 31% daarboven. DGA gebruikelijk loon: min €56.000",
              en: "Low rate: 24.5% on first €68,843. High rate: 31% above. DGA customary salary: min €56,000",
              fa: "نرخ پایین: ۲۴.۵٪ بر اولین €68.843. نرخ بالا: ۳۱٪ بالاتر. حقوق معمول DGA: حداقل €56.000",
            },
            claudeQ: {
              nl: "Hoeveel dividend kan ik uitkeren als DGA zonder teveel belasting te betalen?",
              en: "How much dividend can I pay myself as DGA without paying too much tax?",
              fa: "چقدر سود می‌توانم به عنوان DGA بپردازم بدون اینکه مالیات زیادی پرداخت کنم؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/aanmerkelijk_belang/",
          },
          {
            id: "share_disposal_gain",
            type: "number",
            unit: "€",
            label: { nl: "Vervreemdingsvoordeel aandelen (€)", en: "Share disposal gain (€)", fa: "سود فروش سهام (€)" },
            help: {
              nl: "De verkoopprijs min de verkrijgingsprijs van uw aandelen. Valt ook in Box 2",
              en: "The sale price minus the acquisition price of your shares. Also falls in Box 2",
              fa: "قیمت فروش منهای قیمت تملک سهام شما. این هم در Box 2 قرار می‌گیرد",
            },
            claudeQ: {
              nl: "Hoe wordt de winst op verkoop van aandelen in mijn BV belast?",
              en: "How is the gain on selling shares in my BV taxed?",
              fa: "سود فروش سهام در BV من چگونه مشمول مالیات می‌شود؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/aanmerkelijk_belang/",
          },
        ],
      },
    ],
  },

  // ── STEP 10 ── Heffingskortingen info ──────────────────────────────────
  {
    id: "credits",
    number: 10,
    icon: "💳",
    title: { nl: "Heffingskortingen", en: "Tax credits", fa: "اعتبارات مالیاتی" },
    subtitle: {
      nl: "Heffingskortingen worden automatisch toegepast. Hier ziet u welke op u van toepassing zijn",
      en: "Tax credits are applied automatically. Here you see which ones apply to you",
      fa: "اعتبارات مالیاتی به‌طور خودکار اعمال می‌شوند. اینجا می‌بینید کدام‌ها برای شما اعمال می‌شود",
    },
    sections: [
      {
        id: "credits_overview",
        title: { nl: "Automatische kortingen", en: "Automatic credits", fa: "اعتبارات خودکار" },
        fields: [
          {
            id: "credits_info",
            type: "info",
            label: {
              nl: "De volgende kortingen worden automatisch berekend op basis van uw inkomen:",
              en: "The following credits are calculated automatically based on your income:",
              fa: "اعتبارات زیر به‌طور خودکار بر اساس درآمد شما محاسبه می‌شوند:",
            },
            help: {
              nl: "• Algemene heffingskorting (max €3.115)\n• Arbeidskorting (max €5.685)\n• IACK (max €3.032, als u kinderen < 12 heeft)\n• Ouderenkorting (als u 67+ bent)",
              en: "• General tax credit (max €3,115)\n• Labour tax credit (max €5,685)\n• IACK (max €3,032, if you have children < 12)\n• Elderly tax credit (if you are 67+)",
              fa: "• اعتبار مالیاتی عمومی (حداکثر €3.115)\n• اعتبار مالیاتی کار (حداکثر €5.685)\n• IACK (حداکثر €3.032، اگر فرزند زیر ۱۲ دارید)\n• اعتبار مالیاتی سالمندان (اگر ۶۷+ ساله هستید)",
            },
            claudeQ: {
              nl: "Welke heffingskortingen krijg ik automatisch en hoeveel zijn ze waard?",
              en: "Which tax credits do I automatically receive and how much are they worth?",
              fa: "کدام اعتبارات مالیاتی را به‌طور خودکار دریافت می‌کنم و ارزش آن‌ها چقدر است؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarief/heffingskortingen/",
          },
          {
            id: "had_voorlopige_aanslag",
            type: "boolean",
            label: { nl: "Ontving u een voorlopige aanslag in 2026?", en: "Did you receive a provisional assessment in 2026?", fa: "آیا در 2026 برگ ارزیابی موقت دریافت کردید؟" },
            help: {
              nl: "De voorlopige aanslag is een schatting die u maandelijks betaalt of terugkrijgt. Wordt verrekend in de definitieve aanslag",
              en: "The provisional assessment is an estimate paid or refunded monthly. Settled in the final assessment",
              fa: "برگ ارزیابی موقت یک تخمین است که ماهانه پرداخت یا بازپرداخت می‌شود. در ارزیابی نهایی تسویه می‌شود",
            },
            claudeQ: {
              nl: "Wat is een voorlopige aanslag en hoe wordt die verrekend met mijn definitieve aanslag?",
              en: "What is a provisional assessment and how is it settled with my final assessment?",
              fa: "برگ ارزیابی موقت چیست و چگونه با ارزیابی نهایی من تسویه می‌شود؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/aangifte_doen/",
          },
          {
            id: "voorlopige_aanslag_amount",
            type: "number",
            unit: "€",
            label: { nl: "Bedrag voorlopige aanslag (€)", en: "Provisional assessment amount (€)", fa: "مبلغ برگ ارزیابی موقت (€)" },
            condition: (a) => bool(a, "had_voorlopige_aanslag"),
            help: {
              nl: "Het totale bedrag dat u al heeft betaald of ontvangen via de voorlopige aanslag in 2026",
              en: "The total amount already paid or received via the provisional assessment in 2026",
              fa: "مبلغ کل که قبلاً از طریق برگ ارزیابی موقت در 2026 پرداخت یا دریافت شده است",
            },
            claudeQ: {
              nl: "Hoe kan ik mijn voorlopige aanslag aanpassen als mijn inkomen verandert?",
              en: "How can I adjust my provisional assessment if my income changes?",
              fa: "چگونه می‌توانم برگ ارزیابی موقت را تنظیم کنم اگر درآمدم تغییر کند؟",
            },
            sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/aangifte_doen/",
          },
        ],
      },
    ],
  },

  // ── STEP 11 ── Overzicht & berekening ──────────────────────────────────
  {
    id: "overview",
    number: 11,
    icon: "✅",
    title: { nl: "Overzicht & berekening", en: "Overview & calculation", fa: "خلاصه و محاسبه" },
    subtitle: {
      nl: "Uw ingevulde aangifte. De calculator berekent uw geschatte belastingaanslag voor 2026",
      en: "Your completed return. The calculator estimates your 2026 tax assessment",
      fa: "اظهارنامه تکمیل‌شده شما. ماشین‌حساب برآورد ارزیابی مالیاتی 2026 شما را محاسبه می‌کند",
    },
    sections: [],
  },
];

// ── Visible step filter (conditions applied against current answers) ─────────

export function visibleSteps(answers: Answers): SimStep[] {
  return SIMULATION_STEPS.filter(s => !s.condition || s.condition(answers));
}

// ── Answer → Calculator profile mapper ─────────────────────────────────────

export function answersToCalcProfile(a: Answers) {
  const netAssets = Math.max(0,
    num(a, "savings_balance") +
    num(a, "investments_value") +
    num(a, "other_assets") -
    num(a, "debts")
  );

  const revenue = num(a, "annual_revenue_zzp") || num(a, "employment_income") || 0;
  const totalIncome = revenue - num(a, "business_expenses");

  const savingsFrac = netAssets > 0
    ? Math.min(1, num(a, "savings_balance") / netAssets)
    : 1;

  return {
    user_type:                "zzp" as const,
    annual_revenue_zzp:       revenue || null,
    business_expenses:        num(a, "business_expenses"),
    hours_per_year:           num(a, "hours_per_year"),
    is_starter:               bool(a, "is_starter"),
    has_partner:              bool(a, "has_partner"),
    partner_income:           num(a, "partner_income"),
    children_under_12:        num(a, "children_under_12"),
    net_assets_box3:          netAssets,
    savings_fraction:         savingsFrac,
    pension_contribution:     num(a, "pension_contribution"),
    kia_investments:          num(a, "kia_investments"),
    single_client_percentage: num(a, "single_client_percentage"),
    _total_income:            totalIncome,
    _had_voorlopige:          bool(a, "had_voorlopige_aanslag"),
    _voorlopige_amount:       num(a, "voorlopige_aanslag_amount"),
  } as const;
}
