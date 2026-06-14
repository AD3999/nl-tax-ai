import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bot, FileText, Calculator, Shield, Users, CheckCircle,
  Building2, Globe, Zap, ChevronDown, ArrowRight,
  Upload, Search, ClipboardList, Star, Lock, BookOpen,
  BarChart3, AlertCircle, FileCheck, MessageSquare,
} from "lucide-react";
import { useMobile } from "../hooks/useMobile";

type Lang = "nl" | "en" | "fa";

/* ─── Copy ──────────────────────────────────────────────────────── */
const TX = {
  hero: {
    badge: { nl: "Belastingplatform · 2026", en: "Tax platform · 2026", fa: "پلتفرم مالیاتی · ۲۰۲۶" },
    h1a:   { nl: "Bereid uw Nederlandse", en: "Prepare Dutch taxes", fa: "مالیات هلند را" },
    h1b:   { nl: "belasting slimmer voor.", en: "smarter — with AI", fa: "هوشمندتر آماده کنید." },
    h1c:   { nl: "Met AI en uw accountant.", en: "and your accountant.", fa: "با هوش مصنوعی و حسابدار." },
    sub:   {
      nl: "AI-begeleiding, geverifieerde belastingregels, documentupload, gereedheidsscores en accountantsamenwerking — op één beveiligd platform.",
      en: "AI guidance, verified tax rules, document upload, readiness scoring, and accountant collaboration in one secure platform.",
      fa: "راهنمایی هوش مصنوعی، قوانین مالیاتی تأییدشده، آپلود اسناد، امتیاز آمادگی و همکاری با حسابدار — در یک پلتفرم امن.",
    },
    cta1:  { nl: "Gratis starten", en: "Start Free", fa: "شروع رایگان" },
    cta2:  { nl: "Accountant demo boeken", en: "Book Accountant Demo", fa: "رزرو دمو برای حسابداران" },
    trust: { nl: "AI legt uit. Regels berekenen. Accountants keuren goed.", en: "AI explains. Rules calculate. Accountants approve.", fa: "هوش مصنوعی توضیح می‌دهد. قوانین محاسبه می‌کنند. حسابداران تأیید می‌کنند." },
    card: {
      readiness: { nl: "Gereedheid", en: "Readiness", fa: "آمادگی" },
      ready:     { nl: "Bijna klaar", en: "Almost Ready", fa: "تقریباً آماده" },
      docs:      { nl: "Documenten", en: "Documents", fa: "اسناد" },
      missing:   { nl: "2 ontbreekt", en: "2 missing", fa: "۲ مورد ناقص" },
      aiLabel:   { nl: "AI Assistent", en: "AI Assistant", fa: "دستیار هوش مصنوعی" },
      aiQ:       { nl: "Wat is mijn maximale zelfstandigenaftrek?", en: "What is my max self-employed deduction?", fa: "حداکثر کسر کارآفرینی چقدر است؟" },
      aiA:       { nl: "€1.200 in 2026, mits u ≥1.225 uur werkt.", en: "€1,200 in 2026, provided you work ≥1,225 hrs.", fa: "€۱٬۲۰۰ در ۲۰۲۶، مشروط به کار ≥۱٬۲۲۵ ساعت." },
      source:    { nl: "Bron: belastingdienst.nl", en: "Source: belastingdienst.nl", fa: "منبع: belastingdienst.nl" },
      score:     { nl: "Gereedheidspercentage", en: "Readiness score", fa: "امتیاز آمادگی" },
      client:    { nl: "Klantdossier", en: "Client file", fa: "پرونده مشتری" },
    },
  },

  trust: {
    items: {
      nl: ["Gebouwd voor Nederlandse belastingwetgeving", "AVG/GDPR-klare architectuur", "28 geverifieerde belastingregels 2026", "Veilige documentopslag", "Drietalig: NL / EN / FA", "Deterministische berekeningen"],
      en: ["Built for Dutch tax workflows", "GDPR-ready architecture", "28 verified tax rules 2026", "Secure document handling", "Multilingual: NL / EN / FA", "Deterministic calculations"],
      fa: ["ساخته شده برای سیستم مالیاتی هلند", "معماری GDPR-ready", "۲۸ قانون مالیاتی تأییدشده ۲۰۲۶", "ذخیره‌سازی امن اسناد", "سه‌زبانه: NL / EN / FA", "محاسبات قطعی"],
    },
  },

  positioning: {
    eyebrow: { nl: "Wat is TaxWijs?", en: "What is TaxWijs?", fa: "TaxWijs چیست؟" },
    h2:      { nl: "Niet zomaar een chatbot.", en: "Not just a chatbot.", fa: "فقط یک چت‌بات نیست." },
    sub:     { nl: "TaxWijs combineert AI-begeleiding, een rekenmotor en accountantssamenwerking.", en: "TaxWijs combines AI guidance, a calculation engine, and accountant collaboration.", fa: "TaxWijs هوش مصنوعی، موتور محاسبه و همکاری با حسابدار را ترکیب می‌کند." },
    cards:   {
      nl: [
        { icon: "bot",      notLabel: "Geen chatbot",      title: "AI Tax Assistent",       body: "Legt uit, analyseert en begeleidt. Geeft nooit eindcijfers — dat doet de rekenmotor." },
        { icon: "calc",     notLabel: "Geen rekenmachine", title: "Slimme Rekenmotor",       body: "Deterministische berekeningen op basis van geverifieerde belastingregels. Geen schattingen." },
        { icon: "building", notLabel: "Vervangt niet",     title: "Accountantssamenwerking", body: "Versnelt het verzamelen van documenten, verbetert de gereedheid en vermindert handmatige follow-up." },
      ],
      en: [
        { icon: "bot",      notLabel: "Not a chatbot",     title: "AI Tax Assistant",        body: "Explains, analyzes, and guides. Never gives final numbers — the rule engine does that." },
        { icon: "calc",     notLabel: "Not a calculator",  title: "Smart Rule Engine",        body: "Deterministic calculations based on verified tax rules. No estimates. No guessing." },
        { icon: "building", notLabel: "Not a replacement", title: "Accountant Collaboration", body: "Accelerates document collection, improves readiness scores, and reduces manual follow-up." },
      ],
      fa: [
        { icon: "bot",      notLabel: "نه یک چت‌بات",     title: "دستیار مالیاتی هوش مصنوعی", body: "توضیح می‌دهد، تحلیل می‌کند و راهنمایی می‌کند. هرگز اعداد نهایی نمی‌دهد." },
        { icon: "calc",     notLabel: "نه یک ماشین‌حساب", title: "موتور قانون هوشمند",          body: "محاسبات قطعی بر اساس قوانین مالیاتی تأییدشده. بدون تخمین." },
        { icon: "building", notLabel: "جایگزین نمی‌شود",  title: "همکاری با حسابدار",          body: "جمع‌آوری اسناد را تسریع می‌کند، آمادگی را بهبود می‌دهد." },
      ],
    },
  },

  features: {
    eyebrow: { nl: "Platform", en: "Platform", fa: "پلتفرم" },
    h2:      { nl: "Alles in één platform", en: "Everything in one platform", fa: "همه چیز در یک پلتفرم" },
    sub:     { nl: "Van eerste vraag tot goedgekeurde aangifte.", en: "From first question to approved tax filing.", fa: "از اولین سؤال تا اظهارنامه مالیاتی تأییدشده." },
    items:   {
      nl: [
        { icon: "bot",       title: "AI Belastingassistent",      body: "Beantwoordt vragen in gewone taal, in uw taal, geciteerd naar belastingdienst.nl.",    color: "blue"   },
        { icon: "search",    title: "Aftrekposten Ontdekker",     body: "Ontdek in 60 seconden welke aftrekken u kunt claimen voor uw situatie.",               color: "ok"     },
        { icon: "upload",    title: "Documentupload & OCR",        body: "Upload belastingdocumenten. AI extraheert gegevens automatisch en controleert.",       color: "purple" },
        { icon: "users",     title: "Klantportaal",               body: "Clients volgen hun gereedheid, laden documenten op en communiceren met hun accountant.", color: "warn"   },
        { icon: "building",  title: "Accountantsportaal",         body: "Beheer alle klantdossiers, volg gereedheid, bekijk documenten en keur toe.",            color: "blue"   },
        { icon: "bar",       title: "Gereedheidscore",            body: "Realtime score op basis van documenten, checklist, verificatie en accountantsfeedback.", color: "ok"     },
        { icon: "alert",     title: "Ontbrekende Documenten",     body: "Automatische detectie van welke documenten ontbreken voor een volledige aangifte.",      color: "warn"   },
        { icon: "calc",      title: "Deterministische Rekenmotor", body: "Box 1, 2 en 3 exact berekend — nooit geschat. Gebaseerd op geverifieerde regels.",     color: "blue"   },
      ],
      en: [
        { icon: "bot",       title: "AI Tax Assistant",           body: "Answers questions in plain language, in your language, cited to belastingdienst.nl.",    color: "blue"   },
        { icon: "search",    title: "Deduction Discovery",        body: "Find in 60 seconds which deductions you qualify for in your exact situation.",           color: "ok"     },
        { icon: "upload",    title: "Document Upload & OCR",      body: "Upload tax documents. AI automatically extracts and cross-checks data.",                 color: "purple" },
        { icon: "users",     title: "Client Portal",              body: "Clients track their readiness, upload documents, and message their accountant.",         color: "warn"   },
        { icon: "building",  title: "Accountant Portal",          body: "Manage all client files, track readiness, review documents, and approve.",              color: "blue"   },
        { icon: "bar",       title: "Readiness Score",            body: "Real-time score based on documents, checklist, verification, and accountant feedback.",  color: "ok"     },
        { icon: "alert",     title: "Missing Document Detection", body: "Automatic detection of which documents are missing for a complete filing.",              color: "warn"   },
        { icon: "calc",      title: "Deterministic Calculator",   body: "Box 1, 2 and 3 calculated exactly — never estimated. Based on verified rules.",         color: "blue"   },
      ],
      fa: [
        { icon: "bot",       title: "دستیار مالیاتی هوش مصنوعی", body: "پاسخ سؤالات به زبان ساده، در زبان شما، با استناد به belastingdienst.nl.",               color: "blue"   },
        { icon: "search",    title: "کشف کسورات",                body: "در ۶۰ ثانیه بدانید به چه کسوراتی در وضعیت دقیق خود واجد شرایط هستید.",               color: "ok"     },
        { icon: "upload",    title: "آپلود سند و OCR",            body: "اسناد مالیاتی را آپلود کنید. هوش مصنوعی داده‌ها را استخراج می‌کند.",                 color: "purple" },
        { icon: "users",     title: "پورتال مشتری",               body: "مشتریان آمادگی خود را پیگیری می‌کنند، اسناد آپلود می‌کنند و با حسابدار ارتباط می‌گیرند.", color: "warn"   },
        { icon: "building",  title: "پورتال حسابدار",             body: "مدیریت همه پرونده‌های مشتری، پیگیری آمادگی، بررسی و تأیید اسناد.",                  color: "blue"   },
        { icon: "bar",       title: "امتیاز آمادگی",              body: "امتیاز بلادرنگ بر اساس اسناد، چک‌لیست، تأیید و بازخورد حسابدار.",                   color: "ok"     },
        { icon: "alert",     title: "تشخیص اسناد ناقص",           body: "تشخیص خودکار اینکه کدام اسناد برای اظهارنامه کامل ناقص است.",                       color: "warn"   },
        { icon: "calc",      title: "ماشین‌حساب قطعی",            body: "باکس ۱، ۲ و ۳ دقیقاً محاسبه می‌شود — هرگز تخمین زده نمی‌شود.",                     color: "blue"   },
      ],
    },
  },

  howItWorks: {
    eyebrow: { nl: "Hoe het werkt", en: "How it works", fa: "چطور کار می‌کند" },
    h2:      { nl: "Van vraag tot goedgekeurde aangifte", en: "From question to approved filing", fa: "از سؤال تا اظهارنامه تأییدشده" },
    steps:   {
      nl: [
        { n: "01", title: "Vertel uw situatie",    body: "Vul uw profiel in — ZZP, werknemer, expat of DGA. AI stelt de juiste vragen en leidt u door de intake." },
        { n: "02", title: "AI analyseert & regels berekenen", body: "Geverifieerde belastingregels berekenen uw Box 1, 2 en 3. AI legt elke stap uit met een citaat." },
        { n: "03", title: "Accountant keurt goed & dient in", body: "Uw accountant beoordeelt de volledige dossier, keurt documenten goed en dient de aangifte in." },
      ],
      en: [
        { n: "01", title: "Tell us your situation",   body: "Complete your profile — ZZP, employee, expat, or DGA. AI asks the right questions and guides you through intake." },
        { n: "02", title: "AI analyzes & rules calculate", body: "Verified tax rules calculate your Box 1, 2, and 3. AI explains every step with a citation." },
        { n: "03", title: "Accountant approves & files", body: "Your accountant reviews the complete file, approves documents, and submits the tax return." },
      ],
      fa: [
        { n: "01", title: "وضعیت خود را بگویید",        body: "پروفایل خود را تکمیل کنید — ZZP، کارمند، مهاجر یا DGA. هوش مصنوعی سؤالات درست می‌پرسد." },
        { n: "02", title: "هوش مصنوعی تحلیل می‌کند",   body: "قوانین مالیاتی تأییدشده باکس ۱، ۲ و ۳ شما را محاسبه می‌کنند. هوش مصنوعی هر مرحله را توضیح می‌دهد." },
        { n: "03", title: "حسابدار تأیید و ارسال می‌کند", body: "حسابدار شما پرونده کامل را بررسی، اسناد را تأیید و اظهارنامه مالیاتی را ارسال می‌کند." },
      ],
    },
  },

  userTypes: {
    eyebrow: { nl: "Voor wie", en: "Who it's for", fa: "برای چه کسانی" },
    h2:      { nl: "Gebouwd voor uw situatie", en: "Built for your situation", fa: "ساخته شده برای وضعیت شما" },
    tabs:    { nl: ["ZZP", "Werknemer", "Expat", "DGA / BV"], en: ["ZZP", "Employee", "Expat", "DGA / BV"], fa: ["ZZP", "کارمند", "مهاجر", "DGA / BV"] },
    items:   {
      nl: [
        { sub: "Zelfstandig ondernemer", color: "blue",   items: ["Zelfstandigenaftrek €1.200", "MKB-winstvrijstelling 12,7%", "ZVW bijdrage 4,85%", "Wet DBA risicoscore", "Startersaftrek (laatste jaar 2026)", "Maandelijkse belastingreservering"] },
        { sub: "In loondienst",          color: "ok",     items: ["Arbeidskorting €5.685", "IACK werkende ouders €3.032", "Reiskostenvergoeding 2026", "Pensioenjaarruimte", "Zorgtoeslag grens €40.857", "Huurtoeslag (hervormd 2026)"] },
        { sub: "Buitenlandse werker",    color: "warn",   items: ["30%-regeling 5-jaar afbouw", "Eerste IB-aangifte begeleiding", "Zorgtoeslag €129/maand", "Belastingverdrag-analyse", "Box 3 drempel €59.357", "Nalevingsdeadlines"] },
        { sub: "Directeur-aandeelhouder", color: "purple", items: ["Gebruikelijk loon €56.000", "Dividend vs salaris analyse", "Box 2 tarieven 24,5%/31%", "BV-optimalisatietips", "DGA loonheffing 2026", "Pensioen in eigen beheer"] },
      ],
      en: [
        { sub: "Self-employed freelancer", color: "blue",   items: ["Self-employed deduction €1,200", "MKB profit exemption 12.7%", "ZVW health contribution 4.85%", "Wet DBA risk score", "Starter deduction (last year 2026)", "Monthly tax reserve calculation"] },
        { sub: "Salaried employee",        color: "ok",     items: ["Labour tax credit €5,685", "IACK childcare credit €3,032", "Commuting allowance 2026", "Pension contribution space", "Healthcare allowance threshold €40,857", "Rent allowance (2026 reform)"] },
        { sub: "Foreign worker",           color: "warn",   items: ["30% ruling 5-year phase-down", "First IB return guided walkthrough", "Zorgtoeslag €129/month", "Tax treaty analysis", "Box 3 threshold €59,357", "Compliance deadline tracking"] },
        { sub: "Director-shareholder",     color: "purple", items: ["Minimum salary €56,000", "Dividend vs salary analysis", "Box 2 rates 24.5% / 31%", "BV optimisation tips", "DGA payroll tax 2026", "Pension-in-own-management"] },
      ],
      fa: [
        { sub: "کارآفرین مستقل",   color: "blue",   items: ["کسر کارآفرینی €۱٬۲۰۰", "معافیت سود MKB 12.7%", "کمک بهداشت ZVW 4.85%", "امتیاز ریسک Wet DBA", "کسر استارتر (آخرین سال ۲۰۲۶)", "محاسبه ذخیره مالیات ماهانه"] },
        { sub: "کارمند استخدامی",  color: "ok",     items: ["اعتبار مالیاتی کار €۵٬۶۸۵", "اعتبار IACK €۳٬۰۳۲", "کمک هزینه رفت‌وآمد ۲۰۲۶", "فضای مشارکت بازنشستگی", "آستانه zorgtoeslag €۴۰٬۸۵۷", "اصلاحات huurtoeslag ۲۰۲۶"] },
        { sub: "کارگر خارجی",      color: "warn",   items: ["کاهش ۵ ساله قانون ۳۰٪", "راهنمای اولین اظهارنامه IB", "zorgtoeslag €۱۲۹/ماه", "تحلیل معاهده مالیاتی", "آستانه باکس ۳ €۵۹٬۳۵۷", "پیگیری مهلت‌های انطباق"] },
        { sub: "مدیر سهامدار",     color: "purple", items: ["حداقل حقوق €۵۶٬۰۰۰", "تحلیل سود سهام در مقابل حقوق", "نرخ‌های باکس ۲: 24.5% / 31%", "نکات بهینه‌سازی BV", "مالیات حقوق DGA ۲۰۲۶", "بازنشستگی در مدیریت خود"] },
      ],
    },
  },

  accountant: {
    eyebrow: { nl: "Voor accountants", en: "For accountants", fa: "برای حسابداران" },
    h2:      { nl: "Minder follow-up. Meer voltooide dossiers.", en: "Less follow-up. More completed files.", fa: "پیگیری کمتر. پرونده‌های تکمیل‌شده بیشتر." },
    sub:     { nl: "TaxWijs vervangt uw accountantssoftware niet — het verbetert de kwaliteit van klantaanleveringen zodat u sneller kunt werken.", en: "TaxWijs doesn't replace your accounting software — it improves client submission quality so you can work faster.", fa: "TaxWijs نرم‌افزار حسابداری شما را جایگزین نمی‌کند — کیفیت تحویل مشتری را بهبود می‌دهد." },
    items:   {
      nl: [
        { icon: "bar",     title: "Gereedheids-dashboard",    body: "Zie in één oogopslag welke klanten klaar zijn, wie documenten mist en wat de prioriteit is." },
        { icon: "file",    title: "Documentbeheer",           body: "Bekijk, keur goed of wijs af geüploade documenten. AI extraheert gegevens voor verificatie." },
        { icon: "clip",    title: "Slimme checklists",        body: "Automatisch gegenereerde checklists per klanttype (ZZP, werknemer, expat, DGA)." },
        { icon: "msg",     title: "Directe clientchat",       body: "Geïntegreerde berichtenservice — geen e-mail meer voor het opvragen van documenten." },
      ],
      en: [
        { icon: "bar",     title: "Readiness Dashboard",      body: "See at a glance which clients are ready, who has missing documents, and what needs priority." },
        { icon: "file",    title: "Document Management",      body: "View, approve, or reject uploaded documents. AI extracts data for cross-checking." },
        { icon: "clip",    title: "Smart Checklists",         body: "Auto-generated checklists per client type — ZZP, employee, expat, DGA." },
        { icon: "msg",     title: "Direct Client Messaging",  body: "Integrated messaging — no more email threads to request documents." },
      ],
      fa: [
        { icon: "bar",     title: "داشبورد آمادگی",          body: "با یک نگاه ببینید کدام مشتریان آماده هستند، چه کسی اسناد ناقص دارد." },
        { icon: "file",    title: "مدیریت اسناد",             body: "اسناد آپلودشده را مشاهده، تأیید یا رد کنید. هوش مصنوعی داده‌ها را استخراج می‌کند." },
        { icon: "clip",    title: "چک‌لیست‌های هوشمند",      body: "چک‌لیست‌های تولیدشده خودکار برای هر نوع مشتری — ZZP، کارمند، مهاجر، DGA." },
        { icon: "msg",     title: "پیام‌رسانی مستقیم با مشتری", body: "پیام‌رسانی یکپارچه — دیگر نیازی به ایمیل برای درخواست اسناد نیست." },
      ],
    },
    cta:     { nl: "Accountant demo boeken", en: "Book Accountant Demo", fa: "رزرو دمو برای حسابداران" },
    ctaSub:  { nl: "30 minuten · gratis · geen verplichting", en: "30 minutes · free · no obligation", fa: "۳۰ دقیقه · رایگان · بدون تعهد" },
  },

  safety: {
    eyebrow: { nl: "Veiligheidsgarantie", en: "Safety guarantee", fa: "ضمانت ایمنی" },
    h2:      { nl: "AI die zijn grenzen kent.", en: "AI that knows its limits.", fa: "هوش مصنوعی که محدودیت‌هایش را می‌داند." },
    sub:     { nl: "Vier ingebouwde principes die voorkomen dat AI onjuiste belastingcijfers geeft.", en: "Four built-in principles that prevent AI from giving wrong tax numbers.", fa: "چهار اصل داخلی که از دادن اعداد مالیاتی اشتباه توسط هوش مصنوعی جلوگیری می‌کند." },
    items:   {
      nl: [
        { title: "AI berekent nooit eindcijfers",          body: "Alle belastingbedragen komen uit de deterministische rekenmotor, niet uit de AI." },
        { title: "AI beslist nooit over aftrekbaarheid",   body: "AI legt regels uit en citeert bronnen. Accountants nemen de definitieve beslissing." },
        { title: "AI keurt nooit documenten automatisch goed", body: "Elk document vereist menselijke review door een gekwalificeerde accountant." },
        { title: "Elke claim heeft een bron-URL",          body: "Elk feit dat de AI noemt heeft een citaat van belastingdienst.nl of officiële regelgeving." },
      ],
      en: [
        { title: "AI never calculates final numbers",      body: "All tax amounts come from the deterministic rule engine, never from the AI." },
        { title: "AI never decides deductibility",         body: "AI explains rules and cites sources. Accountants make the final decision." },
        { title: "AI never auto-approves documents",       body: "Every document requires human review by a qualified accountant." },
        { title: "Every claim has a source URL",           body: "Every fact AI states has a citation from belastingdienst.nl or official legislation." },
      ],
      fa: [
        { title: "هوش مصنوعی هرگز اعداد نهایی محاسبه نمی‌کند", body: "تمام مبالغ مالیاتی از موتور قانون قطعی می‌آیند، نه از هوش مصنوعی." },
        { title: "هوش مصنوعی هرگز در مورد کسرپذیری تصمیم نمی‌گیرد", body: "هوش مصنوعی قوانین را توضیح می‌دهد. حسابداران تصمیم نهایی را می‌گیرند." },
        { title: "هوش مصنوعی هرگز اسناد را به‌طور خودکار تأیید نمی‌کند", body: "هر سند نیاز به بررسی انسانی توسط حسابدار مجاز دارد." },
        { title: "هر ادعایی یک URL منبع دارد",                 body: "هر حقیقتی که هوش مصنوعی بیان می‌کند استنادی از belastingdienst.nl دارد." },
      ],
    },
  },

  faq: {
    eyebrow: { nl: "Veelgestelde vragen", en: "Frequently asked questions", fa: "سؤالات متداول" },
    h2:      { nl: "Heeft u vragen?", en: "Have questions?", fa: "سؤال دارید؟" },
    items:   {
      nl: [
        { q: "Vervangt TaxWijs mijn accountant?",       a: "Nee. TaxWijs versnelt de voorbereiding van uw dossier. Uw accountant keurt alles goed en dient in. Wij versterken de samenwerking — wij vervangen niet." },
        { q: "Is TaxWijs geschikt voor ZZP-ers?",       a: "Ja. TaxWijs is speciaal gebouwd voor ZZP-ers. Het berekent zelfstandigenaftrek, MKB-winstvrijstelling, ZVW-bijdrage, Wet DBA-risico en maandelijkse belastingreservering." },
        { q: "Welke talen worden ondersteund?",         a: "TaxWijs ondersteunt Nederlands, Engels en Perzisch (Farsi) als volwaardige talen — niet als vertaling. Elke taal heeft volledige belastinginhoud." },
        { q: "Hoe veilig zijn mijn documenten?",        a: "Documenten worden versleuteld opgeslagen. BSN-nummers worden nooit in plaintext bewaard. Uw gegevens worden conform AVG/GDPR behandeld." },
        { q: "Kan ik TaxWijs gratis proberen?",         a: "Ja. Start gratis zonder account. U kunt aftrekken controleren, belasting simuleren en vragen stellen. Een account is nodig voor documentopslag en accountantsamenwerking." },
        { q: "Wat is de gereedheidscore?",              a: "De gereedheidscore geeft aan hoe volledig uw belastingdossier is: documenten (40%), checklist (25%), verificatie (20%) en accountantsbeoordeling (15%)." },
      ],
      en: [
        { q: "Does TaxWijs replace my accountant?",     a: "No. TaxWijs accelerates your file preparation. Your accountant approves everything and submits. We enhance collaboration — we don't replace anyone." },
        { q: "Is TaxWijs suitable for ZZP freelancers?", a: "Yes. TaxWijs is built specifically for ZZP. It calculates self-employed deductions, MKB exemption, ZVW contribution, Wet DBA risk, and monthly tax reserve." },
        { q: "Which languages are supported?",          a: "TaxWijs supports Dutch, English, and Persian (Farsi) as first-class languages — not translations. Every language has full tax content." },
        { q: "How secure are my documents?",            a: "Documents are stored encrypted. BSN numbers are never stored in plaintext. Your data is handled under GDPR / AVG." },
        { q: "Can I try TaxWijs for free?",             a: "Yes. Start free with no account. You can check deductions, simulate taxes, and ask questions. An account is needed for document storage and accountant collaboration." },
        { q: "What is the readiness score?",            a: "The readiness score shows how complete your tax file is: documents (40%), checklist (25%), verification (20%), and accountant review (15%)." },
      ],
      fa: [
        { q: "آیا TaxWijs حسابدار من را جایگزین می‌کند؟",  a: "نه. TaxWijs آماده‌سازی پرونده شما را تسریع می‌کند. حسابدار شما همه چیز را تأیید و ارسال می‌کند. ما همکاری را بهبود می‌دهیم — نه جایگزین." },
        { q: "آیا TaxWijs برای ZZP مناسب است؟",            a: "بله. TaxWijs به‌طور خاص برای ZZP ساخته شده. کسر کارآفرینی، معافیت MKB، ZVW، ریسک Wet DBA و ذخیره مالیات ماهانه را محاسبه می‌کند." },
        { q: "چه زبان‌هایی پشتیبانی می‌شوند؟",            a: "TaxWijs از هلندی، انگلیسی و فارسی به‌عنوان زبان‌های درجه اول پشتیبانی می‌کند — نه ترجمه. هر زبان محتوای مالیاتی کامل دارد." },
        { q: "امنیت اسناد من چقدر است؟",                   a: "اسناد رمزگذاری‌شده ذخیره می‌شوند. شماره BSN هرگز به‌صورت متن ساده ذخیره نمی‌شود. داده‌های شما طبق GDPR/AVG پردازش می‌شود." },
        { q: "آیا می‌توانم TaxWijs را رایگان امتحان کنم؟", a: "بله. بدون نیاز به حساب شروع کنید. می‌توانید کسورات را بررسی، مالیات را شبیه‌سازی و سؤال بپرسید. برای ذخیره اسناد به حساب نیاز است." },
        { q: "امتیاز آمادگی چیست؟",                        a: "امتیاز آمادگی نشان می‌دهد پرونده مالیاتی شما چقدر کامل است: اسناد (40%)، چک‌لیست (25%)، تأیید (20%) و بررسی حسابدار (15%)." },
      ],
    },
  },

  finalCta: {
    h2:     { nl: "Klaar om te starten?", en: "Ready to get started?", fa: "آماده شروع هستید؟" },
    indiv:  {
      label:  { nl: "Voor particulieren & ZZP", en: "For individuals & ZZP", fa: "برای افراد و ZZP" },
      h3:     { nl: "Begin gratis vandaag", en: "Start free today", fa: "امروز رایگان شروع کنید" },
      body:   { nl: "Geen creditcard nodig. Controleer uw aftrekken, simuleer uw belasting en vraag alles.", en: "No credit card required. Check your deductions, simulate your tax, and ask anything.", fa: "کارت اعتباری لازم نیست. کسورات خود را بررسی کنید." },
      cta:    { nl: "Gratis starten", en: "Start Free", fa: "شروع رایگان" },
    },
    acct:   {
      label:  { nl: "Voor accountants & belastingadviseurs", en: "For accountants & tax advisors", fa: "برای حسابداران" },
      h3:     { nl: "Zie het accountantsplatform", en: "See the accountant platform", fa: "پلتفرم حسابدار را ببینید" },
      body:   { nl: "30 minuten demo. Wij laten u zien hoe u klantgereedheid beheert en documentverzameling automatiseert.", en: "30-minute demo. We show you how to manage client readiness and automate document collection.", fa: "دمو ۳۰ دقیقه‌ای. نشان می‌دهیم چطور آمادگی مشتری را مدیریت کنید." },
      cta:    { nl: "Demo boeken", en: "Book Demo", fa: "رزرو دمو" },
    },
  },
} as const;

/* ─── Helpers ────────────────────────────────────────────────────── */
function t<T extends Record<string, unknown>>(obj: T, lang: Lang): T[typeof lang] {
  return (obj[lang] ?? obj["en"]) as T[typeof lang];
}

const COLOR_MAP: Record<string, string> = {
  blue:   "var(--blue)",
  ok:     "var(--ok)",
  warn:   "var(--warn)",
  purple: "var(--purple)",
};
const SUBTLE_MAP: Record<string, string> = {
  blue:   "var(--blue-subtle)",
  ok:     "var(--ok-subtle)",
  warn:   "var(--warn-subtle)",
  purple: "var(--purple-subtle)",
};

/* ─── Sub-components ──────────────────────────────────────────────── */
function SectionLabel({ text, color = "var(--blue)" }: { text: string; color?: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)" }}>{text}</span>
    </div>
  );
}

function FeatureIcon({ icon, color }: { icon: string; color: string }) {
  const c = COLOR_MAP[color] ?? color;
  const s = SUBTLE_MAP[color] ?? "var(--bg-2)";
  const props = { size: 18, color: c };
  const el = icon === "bot"      ? <Bot {...props} />
           : icon === "search"   ? <Search {...props} />
           : icon === "upload"   ? <Upload {...props} />
           : icon === "users"    ? <Users {...props} />
           : icon === "building" ? <Building2 {...props} />
           : icon === "bar"      ? <BarChart3 {...props} />
           : icon === "alert"    ? <AlertCircle {...props} />
           : icon === "calc"     ? <Calculator {...props} />
           : icon === "file"     ? <FileCheck {...props} />
           : icon === "clip"     ? <ClipboardList {...props} />
           : icon === "msg"      ? <MessageSquare {...props} />
           : <Zap {...props} />;
  return (
    <span style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: s, border: `1px solid ${c}22`, display: "grid", placeItems: "center", flexShrink: 0 }}>
      {el}
    </span>
  );
}

function FAQItem({ q, a, lang }: { q: string; a: string; lang: Lang }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--border)", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 0", background: "none", border: "none", cursor: "pointer",
          textAlign: lang === "fa" ? "right" : "left",
          gap: 16,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>{q}</span>
        <span style={{ flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0)", color: "var(--text-3)" }}>
          <ChevronDown size={16} />
        </span>
      </button>
      <div style={{
        maxHeight: open ? 300 : 0, overflow: "hidden", transition: "max-height .3s ease",
      }}>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.65, paddingBottom: 18, marginTop: 0 }}>{a}</p>
      </div>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { i18n } = useTranslation();
  const navigate  = useNavigate();
  const isMobile  = useMobile();
  const lang      = i18n.language as Lang;
  const isRtl     = lang === "fa";

  const [tabIdx, setTabIdx]         = useState(0);
  const [tabPaused, setTabPaused]   = useState(false);
  const tabTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (tabPaused) return;
    tabTimer.current = setInterval(() => setTabIdx(i => (i + 1) % 4), 4500);
    return () => { if (tabTimer.current) clearInterval(tabTimer.current); };
  }, [tabPaused]);

  const W = 1200; // max-width
  const px = isMobile ? "20px" : "64px";

  const featureItems  = t(TX.features.items, lang);
  const tabLabels     = t(TX.userTypes.tabs, lang);
  const userItems     = t(TX.userTypes.items, lang);
  const acctItems     = t(TX.accountant.items, lang);
  const safetyItems   = t(TX.safety.items, lang);
  const faqItems      = t(TX.faq.items, lang);
  const posCards      = t(TX.positioning.cards, lang);
  const steps         = t(TX.howItWorks.steps, lang);
  const activeType    = userItems[tabIdx];

  return (
    <main dir={isRtl ? "rtl" : "ltr"} style={{ overflowX: "hidden" }}>

      {/* ══════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: isMobile ? "72px 20px 60px" : "100px 64px 88px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Radial glow background */}
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 70% 55% at 55% 30%, oklch(0.48 0.15 265 / 0.10) 0%, transparent 70%)",
          zIndex: 0,
        }} />

        <div style={{ maxWidth: W, margin: "0 auto", position: "relative", zIndex: 1,
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 48 : 80, alignItems: "center" }}>

          {/* LEFT: Copy */}
          <div>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 999,
              border: "1px solid var(--blue-border)", background: "var(--blue-subtle)", marginBottom: 24,
              animation: "heroFadeUp .55s ease both" }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--blue)", flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--blue-text)" }}>
                {t(TX.hero.badge, lang)}
              </span>
            </div>

            {/* Headline */}
            <h1 style={{ fontSize: isMobile ? "clamp(2.2rem, 9vw, 3rem)" : "clamp(2.6rem, 3.5vw, 3.8rem)",
              lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.035em", margin: 0,
              color: "var(--text)" }}>
              <span style={{ display: "block", animation: "heroFadeUp .65s ease both", animationDelay: ".1s" }}>
                {t(TX.hero.h1a, lang)}
              </span>
              <span style={{ display: "block", color: "var(--blue-text)", animation: "heroFadeUp .65s ease both", animationDelay: ".22s" }}>
                {t(TX.hero.h1b, lang)}
              </span>
              <span style={{ display: "block", animation: "heroFadeUp .65s ease both", animationDelay: ".34s" }}>
                {t(TX.hero.h1c, lang)}
              </span>
            </h1>

            {/* Sub */}
            <p style={{ marginTop: 22, fontSize: 16, lineHeight: 1.65, color: "var(--text-3)", maxWidth: 500,
              animation: "heroFadeUp .65s ease both", animationDelay: ".46s" }}>
              {t(TX.hero.sub, lang)}
            </p>

            {/* CTAs */}
            <div style={{ marginTop: 30, display: "flex", flexWrap: "wrap", gap: 12,
              animation: "heroFadeUp .65s ease both", animationDelay: ".58s" }}>
              <button className="btn btn-accent btn-lg"
                onClick={() => navigate("/register")}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999 }}>
                {t(TX.hero.cta1, lang)} <ArrowRight size={16} />
              </button>
              <button className="btn btn-ghost btn-lg"
                onClick={() => navigate("/register?role=accountant")}
                style={{ borderRadius: 999 }}>
                {t(TX.hero.cta2, lang)}
              </button>
            </div>

            {/* Micro-trust */}
            <p style={{ marginTop: 18, fontSize: 12.5, color: "var(--text-4)", fontStyle: "italic",
              animation: "heroFadeUp .65s ease both", animationDelay: ".70s" }}>
              {t(TX.hero.trust, lang)}
            </p>
          </div>

          {/* RIGHT: Dashboard composition */}
          {!isMobile && (
            <div style={{ position: "relative", animation: "heroFadeIn .9s ease both", animationDelay: ".25s" }}>
              {/* Main card — Readiness overview */}
              <div className="card" style={{
                padding: 22, borderRadius: "var(--r-xl)",
                boxShadow: "var(--sh-lg)",
                animation: "floatCard 6s ease-in-out infinite", animationDelay: ".3s",
              }}>
                {/* Card header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  paddingBottom: 14, borderBottom: "1px solid var(--border)", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--blue-subtle)",
                      display: "grid", placeItems: "center" }}>
                      <BarChart3 size={14} color="var(--blue-text)" />
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                      {t(TX.hero.card.client, lang)}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-4)", fontVariantNumeric: "tabular-nums" }}>2026</span>
                </div>

                {/* Readiness bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>{t(TX.hero.card.score, lang)}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--blue-text)" }}>78%</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 999, background: "var(--bg-3)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "78%", borderRadius: 999,
                      background: "linear-gradient(90deg, var(--blue), var(--ok))" }} />
                  </div>
                  <div style={{ marginTop: 7, display: "flex", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999,
                      background: "var(--blue-subtle)", color: "var(--blue-text)", fontWeight: 600 }}>
                      {t(TX.hero.card.ready, lang)}
                    </span>
                  </div>
                </div>

                {/* Factor pills */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                  {[
                    { label: t(TX.hero.card.docs, lang), val: "3/5", color: "warn" },
                    { label: "Checklist",                val: "✓",   color: "ok"   },
                    { label: "Verificatie",              val: "✓",   color: "ok"   },
                    { label: "Accountant",               val: "—",   color: "blue" },
                  ].map(f => (
                    <div key={f.label} style={{ padding: "8px 10px", borderRadius: "var(--r)",
                      background: "var(--bg-2)", border: "1px solid var(--border)",
                      display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "var(--text-3)" }}>{f.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: COLOR_MAP[f.color] }}>{f.val}</span>
                    </div>
                  ))}
                </div>

                {/* AI answer snippet */}
                <div style={{ padding: 12, borderRadius: "var(--r)", background: "var(--blue-subtle)",
                  border: "1px solid var(--blue-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Bot size={12} color="var(--blue-text)" />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--blue-text)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {t(TX.hero.card.aiLabel, lang)}
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, margin: 0 }}>
                    {t(TX.hero.card.aiA, lang)}
                  </p>
                  <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-4)" }}>{t(TX.hero.card.source, lang)}</div>
                </div>
              </div>

              {/* Floating missing-docs chip */}
              <div className="card" style={{
                position: "absolute", left: -28, top: 40, padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 10,
                boxShadow: "var(--sh-md)", borderRadius: "var(--r-lg)",
                animation: "floatCard 6s ease-in-out infinite", animationDelay: "1.2s",
              }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--warn-subtle)",
                  display: "grid", placeItems: "center" }}>
                  <AlertCircle size={13} color="var(--warn)" />
                </span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{t(TX.hero.card.docs, lang)}</div>
                  <div style={{ fontSize: 11, color: "var(--warn)" }}>{t(TX.hero.card.missing, lang)}</div>
                </div>
              </div>

              {/* Floating tax summary chip */}
              <div className="card" style={{
                position: "absolute", right: -24, bottom: 48, padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 10,
                boxShadow: "var(--sh-md)", borderRadius: "var(--r-lg)",
                animation: "floatCard 6s ease-in-out infinite", animationDelay: ".8s",
              }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--ok-subtle)",
                  display: "grid", placeItems: "center" }}>
                  <Calculator size={13} color="var(--ok)" />
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ok)", fontVariantNumeric: "tabular-nums" }}>€ 14,736</div>
                  <div style={{ fontSize: 11, color: "var(--text-4)" }}>Box 1 · 2026</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TRUST STRIP
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-2)", padding: "14px 64px", overflowX: "auto" }}>
        <div style={{ maxWidth: W, margin: "0 auto", display: "flex", alignItems: "center", gap: isMobile ? 20 : 40,
          justifyContent: isMobile ? "flex-start" : "center", minWidth: "max-content", padding: "0 20px" }}>
          {t(TX.trust.items, lang).map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
              <CheckCircle size={13} color="var(--ok)" />
              <span style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 500, whiteSpace: "nowrap" }}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          POSITIONING: "What TaxWijs actually is"
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: isMobile ? "64px 20px" : "96px 64px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: W, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionLabel text={t(TX.positioning.eyebrow, lang)} />
            <h2 style={{ fontSize: isMobile ? 28 : 38, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 14 }}>
              {t(TX.positioning.h2, lang)}
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-3)", maxWidth: 540, margin: "0 auto" }}>
              {t(TX.positioning.sub, lang)}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 20 }}>
            {posCards.map((card, i) => {
              const colors = ["blue", "ok", "purple"];
              const c = colors[i];
              return (
                <div key={i} className="card" style={{
                  padding: 28, borderRadius: "var(--r-xl)",
                  border: `1px solid ${COLOR_MAP[c]}33`,
                  background: SUBTLE_MAP[c],
                  position: "relative", overflow: "hidden",
                }}>
                  {/* "Not X" strike-through label */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18,
                    padding: "4px 10px", borderRadius: 999,
                    background: "var(--bg-3)", border: "1px solid var(--border-2)" }}>
                    <span style={{ fontSize: 11, color: "var(--text-4)", textDecoration: "line-through" }}>
                      {card.notLabel}
                    </span>
                    <span style={{ color: "var(--text-4)" }}>→</span>
                  </div>
                  <FeatureIcon icon={card.icon} color={c} />
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 14, marginBottom: 10 }}>{card.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.65, margin: 0 }}>{card.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURE GRID
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: isMobile ? "64px 20px" : "96px 64px", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
        <div style={{ maxWidth: W, margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "flex-end", gap: 20, marginBottom: 52 }}>
            <div>
              <SectionLabel text={t(TX.features.eyebrow, lang)} />
              <h2 style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 10 }}>
                {t(TX.features.h2, lang)}
              </h2>
              <p style={{ fontSize: 15, color: "var(--text-3)" }}>{t(TX.features.sub, lang)}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: 16 }}>
            {featureItems.map((f, i) => (
              <div key={i} className="card" style={{
                padding: "20px 18px", borderRadius: "var(--r-lg)",
                transition: "transform .2s, box-shadow .2s",
                cursor: "default",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--sh-md)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = ""; }}
              >
                <FeatureIcon icon={f.icon} color={f.color} />
                <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 14, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6, margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: isMobile ? "64px 20px" : "96px 64px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: W, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <SectionLabel text={t(TX.howItWorks.eyebrow, lang)} />
            <h2 style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, letterSpacing: "-0.03em" }}>
              {t(TX.howItWorks.h2, lang)}
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: isMobile ? 32 : 48, position: "relative" }}>
            {/* Connector line on desktop */}
            {!isMobile && (
              <div aria-hidden style={{
                position: "absolute", top: 28, left: "calc(33.33% + 24px)", right: "calc(33.33% + 24px)",
                height: 1, background: "linear-gradient(90deg, var(--blue) 0%, var(--ok) 100%)",
                opacity: 0.35,
              }} />
            )}
            {steps.map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 999, margin: "0 auto 20px",
                  background: i === 2 ? "var(--blue)" : "var(--bg-2)",
                  border: `2px solid ${i === 2 ? "var(--blue)" : "var(--border-2)"}`,
                  display: "grid", placeItems: "center", position: "relative", zIndex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: i === 2 ? "#fff" : "var(--blue-text)",
                    fontVariantNumeric: "tabular-nums" }}>{s.n}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.65, maxWidth: 280, margin: "0 auto" }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          USER TYPES
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: isMobile ? "64px 20px" : "96px 64px", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}
        onMouseEnter={() => setTabPaused(true)} onMouseLeave={() => setTabPaused(false)}>
        <div style={{ maxWidth: W, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <SectionLabel text={t(TX.userTypes.eyebrow, lang)} />
            <h2 style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, letterSpacing: "-0.03em" }}>
              {t(TX.userTypes.h2, lang)}
            </h2>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 36, flexWrap: "wrap" }}>
            {tabLabels.map((label, i) => (
              <button key={i}
                onClick={() => { setTabIdx(i); setTabPaused(true); }}
                style={{
                  padding: "8px 20px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", transition: "all .2s",
                  background: tabIdx === i ? "var(--blue)" : "var(--bg-3)",
                  color: tabIdx === i ? "#fff" : "var(--text-3)",
                  border: tabIdx === i ? "1px solid var(--blue)" : "1px solid var(--border)",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Active tab card */}
          <div className="card" style={{
            padding: isMobile ? 24 : 36, borderRadius: "var(--r-xl)",
            border: `1px solid ${COLOR_MAP[activeType.color]}44`,
            maxWidth: 740, margin: "0 auto",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: COLOR_MAP[activeType.color] }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)" }}>{activeType.sub}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              {activeType.items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10,
                  padding: "11px 14px", borderRadius: "var(--r)", background: "var(--bg-2)",
                  border: "1px solid var(--border)" }}>
                  <CheckCircle size={14} color={COLOR_MAP[activeType.color]} />
                  <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          ACCOUNTANT SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: isMobile ? "64px 20px" : "96px 64px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: W, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 48 : 80, alignItems: "center" }}>
            {/* Left: copy */}
            <div>
              <SectionLabel text={t(TX.accountant.eyebrow, lang)} color="var(--ok)" />
              <h2 style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16, lineHeight: 1.15 }}>
                {t(TX.accountant.h2, lang)}
              </h2>
              <p style={{ fontSize: 15, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 32 }}>
                {t(TX.accountant.sub, lang)}
              </p>
              <button className="btn btn-accent btn-lg"
                onClick={() => navigate("/register?role=accountant")}
                style={{ borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 8 }}>
                {t(TX.accountant.cta, lang)} <ArrowRight size={16} />
              </button>
              <p style={{ marginTop: 12, fontSize: 12, color: "var(--text-4)" }}>{t(TX.accountant.ctaSub, lang)}</p>
            </div>

            {/* Right: feature cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {acctItems.map((item, i) => (
                <div key={i} className="card" style={{ padding: 20, borderRadius: "var(--r-lg)" }}>
                  <FeatureIcon icon={item.icon} color="ok" />
                  <h3 style={{ fontSize: 13, fontWeight: 700, marginTop: 12, marginBottom: 7 }}>{item.title}</h3>
                  <p style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6, margin: 0 }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          MULTILINGUAL CALLOUT
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: isMobile ? "48px 20px" : "72px 64px", borderBottom: "1px solid var(--border)",
        background: "var(--blue-subtle)", borderTop: "1px solid var(--blue-border)" }}>
        <div style={{ maxWidth: W, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
            <Globe size={20} color="var(--blue-text)" />
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>
              {lang === "nl" ? "Volledig drietalig — NL · EN · FA"
               : lang === "fa" ? "کاملاً سه‌زبانه — NL · EN · FA"
               : "Fully multilingual — NL · EN · FA"}
            </h2>
          </div>
          <p style={{ fontSize: 15, color: "var(--blue-text)", maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
            {lang === "nl"
              ? "Elke taal is een volwaardige implementatie — geen Google Translate. Belastinginhoud, AI-antwoorden en portaalinterface zijn allemaal beschikbaar in Nederlands, Engels en Perzisch (Farsi)."
              : lang === "fa"
              ? "هر زبان یک پیاده‌سازی کامل است — نه Google Translate. محتوای مالیاتی، پاسخ‌های هوش مصنوعی و رابط پورتال همه در هلندی، انگلیسی و فارسی موجود است."
              : "Every language is a first-class implementation — not Google Translate. Tax content, AI answers, and the portal interface are all available in Dutch, English, and Persian (Farsi)."}
          </p>
          <div style={{ marginTop: 24, display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {["🇳🇱 Nederlands", "🇬🇧 English", "🇮🇷 فارسی"].map(l => (
              <span key={l} style={{ fontSize: 14, fontWeight: 600, color: "var(--blue-text)",
                padding: "6px 16px", borderRadius: 999, background: "var(--bg-2)",
                border: "1px solid var(--blue-border)" }}>{l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SAFETY PRINCIPLES
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: isMobile ? "64px 20px" : "96px 64px", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
        <div style={{ maxWidth: W, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <SectionLabel text={t(TX.safety.eyebrow, lang)} color="var(--ok)" />
            <h2 style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 14 }}>
              {t(TX.safety.h2, lang)}
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-3)", maxWidth: 520, margin: "0 auto" }}>
              {t(TX.safety.sub, lang)}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            {safetyItems.map((s, i) => (
              <div key={i} className="card" style={{
                padding: "22px 24px", borderRadius: "var(--r-lg)", display: "flex", gap: 16, alignItems: "flex-start",
              }}>
                <span style={{ width: 36, height: 36, borderRadius: "var(--r)", background: "var(--ok-subtle)",
                  border: "1px solid var(--ok-border)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Shield size={16} color="var(--ok)" />
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 7 }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.65, margin: 0 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: isMobile ? "64px 20px" : "96px 64px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <SectionLabel text={t(TX.faq.eyebrow, lang)} />
            <h2 style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, letterSpacing: "-0.03em" }}>
              {t(TX.faq.h2, lang)}
            </h2>
          </div>
          <div>
            {faqItems.map((f, i) => (
              <FAQItem key={i} q={f.q} a={f.a} lang={lang} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FINAL DUAL CTA
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: isMobile ? "64px 20px 80px" : "96px 64px 108px" }}>
        <div style={{ maxWidth: W, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: isMobile ? 28 : 38, fontWeight: 800, letterSpacing: "-0.035em" }}>
              {t(TX.finalCta.h2, lang)}
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
            {/* Individuals card */}
            <div className="card" style={{
              padding: isMobile ? 28 : 36, borderRadius: "var(--r-xl)",
              border: "1px solid var(--blue-border)",
              background: "var(--blue-subtle)",
            }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px",
                borderRadius: 999, background: "var(--blue)", marginBottom: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {t(TX.finalCta.indiv.label, lang)}
                </span>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, letterSpacing: "-0.025em" }}>
                {t(TX.finalCta.indiv.h3, lang)}
              </h3>
              <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 28 }}>
                {t(TX.finalCta.indiv.body, lang)}
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="btn btn-accent btn-lg"
                  onClick={() => navigate("/register")}
                  style={{ borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {t(TX.finalCta.indiv.cta, lang)} <ArrowRight size={16} />
                </button>
                <button className="btn btn-ghost btn-sm"
                  onClick={() => navigate("/chat")}
                  style={{ borderRadius: 999 }}>
                  {lang === "nl" ? "Chat proberen" : lang === "fa" ? "امتحان چت" : "Try the chat"}
                </button>
              </div>
              <p style={{ marginTop: 14, fontSize: 11.5, color: "var(--text-4)" }}>
                {lang === "nl" ? "Geen creditcard · Geen account vereist om te starten" : lang === "fa" ? "بدون کارت اعتباری · برای شروع نیازی به حساب نیست" : "No credit card · No account needed to get started"}
              </p>
            </div>

            {/* Accountants card */}
            <div className="card" style={{
              padding: isMobile ? 28 : 36, borderRadius: "var(--r-xl)",
              border: "1px solid var(--ok-border)",
              background: "var(--ok-subtle)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px",
                borderRadius: 999, background: "var(--ok)", marginBottom: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {t(TX.finalCta.acct.label, lang)}
                </span>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, letterSpacing: "-0.025em" }}>
                {t(TX.finalCta.acct.h3, lang)}
              </h3>
              <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 28 }}>
                {t(TX.finalCta.acct.body, lang)}
              </p>
              <button className="btn btn-lg"
                onClick={() => navigate("/register?role=accountant")}
                style={{ borderRadius: 999, background: "var(--ok)", color: "#fff",
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "0 24px", height: 44, fontWeight: 700, fontSize: 14 }}>
                {t(TX.finalCta.acct.cta, lang)} <ArrowRight size={16} />
              </button>
              <p style={{ marginTop: 14, fontSize: 11.5, color: "var(--text-4)" }}>
                {lang === "nl" ? "30 minuten · Gratis · Geen verplichting" : lang === "fa" ? "۳۰ دقیقه · رایگان · بدون تعهد" : "30 minutes · Free · No obligation"}
              </p>

              {/* Decorative dots */}
              <div aria-hidden style={{
                position: "absolute", right: -20, bottom: -20,
                width: 120, height: 120, borderRadius: 999,
                background: "var(--ok)", opacity: 0.07,
              }} />
            </div>
          </div>

          {/* Trust row */}
          <div style={{ marginTop: 40, display: "flex", justifyContent: "center", gap: isMobile ? 16 : 32, flexWrap: "wrap" }}>
            {[
              { icon: <Lock size={13} />, label: lang === "nl" ? "AVG/GDPR-klaar" : lang === "fa" ? "GDPR-ready" : "GDPR-ready" },
              { icon: <Shield size={13} />, label: lang === "nl" ? "28 geverifieerde regels" : lang === "fa" ? "۲۸ قانون تأییدشده" : "28 verified rules" },
              { icon: <Star size={13} />, label: lang === "nl" ? "Geverifieerde bronnen" : lang === "fa" ? "منابع تأییدشده" : "Verified sources" },
              { icon: <BookOpen size={13} />, label: lang === "nl" ? "Deterministische berekeningen" : lang === "fa" ? "محاسبات قطعی" : "Deterministic calculations" },
            ].map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-4)", fontSize: 12.5 }}>
                <span style={{ color: "var(--text-3)" }}>{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
