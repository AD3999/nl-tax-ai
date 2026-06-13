import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMobile } from "../hooks/useMobile";
import { useTranslation } from "react-i18next";
import { captureEmail } from "../api/reminders";
import { useAuth } from "../context/AuthContext";
import {
  trackDeductionCheckerStarted,
  trackDeductionCheckerCompleted,
  trackCheckerStepCompleted,
  trackCheckerResultsViewed,
  trackCheckerWaitlistSubmitted,
} from "../lib/analytics";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Lang = "nl" | "en" | "fa";
type EligStatus = "likely" | "needs_info" | "not_likely";
type UserType = "zzp" | "employee" | "expat" | "dga";

interface Answers {
  user_type?: UserType;
  profit?: string;
  hours?: "lt500" | "mid" | "gte1225" | "unknown";
  is_starter?: "yes" | "no" | "unsure";
  starter_times?: "never" | "once" | "twice" | "thrice" | "unknown";
  expenses: string[];
  has_assets?: "yes" | "no";
  asset_amount?: string;
  btw_status?: "registered" | "kor" | "not_registered" | "unknown";
  pension?: "yes" | "no" | "unsure";
}

interface DeductionResult {
  id: string;
  status: EligStatus;
  title: string;
  reason: string;
  action: string;
}

// ─── Translations ───────────────────────────────────────────────────────────────
const TX: Record<Lang, Record<string, string | ((n: number) => string)>> = {
  nl: {
    badge: "Gratis scan",
    title: "Welke belastingaftrekken mis ik?",
    subtitle: "Beantwoord 10 vragen en ontdek welke Nederlandse belastingkansen voor u gelden.",
    next: "Volgende →",
    back: "← Terug",
    see_results: "Bekijk resultaten →",
    start_over: "Opnieuw beginnen",
    likely: "Waarschijnlijk van toepassing",
    needs_info: "Bevestiging nodig",
    not_likely: "Waarschijnlijk niet",
    result_title: "Uw aftrekpostenanalyse 2026",
    result_sub: "Op basis van uw antwoorden:",
    result_count: (n: number) => `${n} mogelijke kansen gevonden`,
    cta_calc: "Bereken exacte belasting →",
    cta_chat: "Vraag de belasting-AI →",
    non_zzp_title: "Deze scanner is geoptimaliseerd voor ZZP'ers",
    non_zzp_sub: "We bouwen flows voor werknemers, expats en DGA's. Laat uw e-mail achter om als eerste te weten wanneer dit beschikbaar is.",
    non_zzp_cta: "Stel mij op de hoogte",
    waitlist_done: "Bedankt — we sturen u een bericht zodra uw profiel beschikbaar is.",
    email_placeholder: "uw@email.nl",
    // Step labels
    q_user_type: "Wat beschrijft uw situatie het beste?",
    q_profit: "Wat is uw geschatte jaarwinst na zakelijke kosten?",
    q_profit_hint: "Een schatting is prima — dit hoeft niet exact te zijn.",
    q_profit_placeholder: "bijv. 45000",
    q_hours: "Hoeveel uur werkte u in 2026 aan uw bedrijf?",
    q_hours_hint: "Het urencriterium (1.225 uur) is vereist voor de zelfstandigenaftrek.",
    q_starter: "Bent u een starter — is dit één van uw eerste 5 ondernemersjaren?",
    q_starter_hint: "De startersaftrek is alleen beschikbaar in de eerste 3 jaar als ondernemer.",
    q_starter_times: "Hoe vaak heeft u de startersaftrek al gebruikt?",
    q_expenses: "Welke zakelijke kosten had u in 2026?",
    q_expenses_hint: "Selecteer alles wat van toepassing is. Klik Volgende als u klaar bent.",
    q_expenses_none: "Geen van bovenstaande",
    q_assets: "Kocht u zakelijke apparatuur of middelen boven €450?",
    q_assets_hint: "Laptop, camera, gereedschap, machines, meubilair — per aankoop boven €450.",
    q_asset_amount: "Wat is het totale investeringsbedrag (bij benadering)?",
    q_asset_placeholder: "bijv. 3500",
    q_btw: "Wat is uw BTW-status?",
    q_pension: "Heeft u lijfrente- of pensioenbetalingen gedaan?",
  },
  en: {
    badge: "Free scan",
    title: "Which tax deductions am I missing?",
    subtitle: "Answer 10 questions and discover which Dutch tax opportunities apply to you.",
    next: "Next →",
    back: "← Back",
    see_results: "See results →",
    start_over: "Start over",
    likely: "Likely eligible",
    needs_info: "Needs confirmation",
    not_likely: "Not likely",
    result_title: "Your 2026 deduction analysis",
    result_sub: "Based on your answers:",
    result_count: (n: number) => `${n} possible opportunities found`,
    cta_calc: "Calculate exact tax →",
    cta_chat: "Ask the tax AI →",
    non_zzp_title: "This checker is currently optimised for ZZP freelancers",
    non_zzp_sub: "We are building flows for employees, expats, and DGA directors. Leave your email to be first to know when it launches.",
    non_zzp_cta: "Notify me",
    waitlist_done: "Thank you — we will notify you when your profile type is available.",
    email_placeholder: "your@email.com",
    q_user_type: "What best describes your situation?",
    q_profit: "What is your estimated yearly profit after business expenses?",
    q_profit_hint: "An estimate is fine — this does not need to be exact.",
    q_profit_placeholder: "e.g. 45000",
    q_hours: "How many hours did you work on your business in 2026?",
    q_hours_hint: "The 1,225-hour threshold (urencriterium) is required for the self-employed deduction.",
    q_starter: "Are you a starter — is this one of your first 5 years as an entrepreneur?",
    q_starter_hint: "Startersaftrek is only available in the first 3 years of entrepreneurship.",
    q_starter_times: "How many times have you already claimed startersaftrek?",
    q_expenses: "Which business expenses did you have in 2026?",
    q_expenses_hint: "Select all that apply. Click Next when done.",
    q_expenses_none: "None of the above",
    q_assets: "Did you purchase business assets above €450?",
    q_assets_hint: "Laptop, camera, tools, machinery, furniture — per purchase above €450.",
    q_asset_amount: "What is the approximate total investment amount?",
    q_asset_placeholder: "e.g. 3500",
    q_btw: "What is your VAT (BTW) status?",
    q_pension: "Did you make pension or lijfrente contributions?",
  },
  fa: {
    badge: "اسکن رایگان",
    title: "کدام کسورات مالیاتی را از دست می‌دهم؟",
    subtitle: "۱۰ سوال پاسخ دهید تا بدانید کدام فرصت‌های مالیاتی هلند برای شما اعمال می‌شود.",
    next: "بعدی ←",
    back: "→ قبلی",
    see_results: "نتایج را ببین ←",
    start_over: "شروع مجدد",
    likely: "احتمالاً مشمول",
    needs_info: "نیاز به تأیید",
    not_likely: "احتمالاً مشمول نمی‌شود",
    result_title: "تحلیل کسورات ۲۰۲۶ شما",
    result_sub: "بر اساس پاسخ‌های شما:",
    result_count: (n: number) => `${n} فرصت احتمالی یافت شد`,
    cta_calc: "محاسبه مالیات دقیق ←",
    cta_chat: "از هوش مصنوعی بپرس ←",
    non_zzp_title: "این اسکنر در حال حاضر برای ZZP‌ها بهینه شده است",
    non_zzp_sub: "در حال ساخت جریان‌هایی برای کارمندان، اکسپت‌ها و مدیران DGA هستیم. ایمیلتان را بگذارید.",
    non_zzp_cta: "اطلاع‌رسانی کنید",
    waitlist_done: "ممنون — وقتی پروفایل شما در دسترس باشد اطلاع می‌دهیم.",
    email_placeholder: "ایمیل@شما.com",
    q_user_type: "وضعیت شما را بهتر توصیف می‌کند؟",
    q_profit: "سود سالانه تخمینی شما پس از هزینه‌های تجاری چقدر است؟",
    q_profit_hint: "تخمین کافی است — لازم نیست دقیق باشد.",
    q_profit_placeholder: "مثلاً ۴۵۰۰۰",
    q_hours: "در سال ۲۰۲۶ چند ساعت روی کسب‌وکارتان کار کردید؟",
    q_hours_hint: "سقف ۱٬۲۲۵ ساعت (urencriterium) برای کسر zelfstandigenaftrek الزامی است.",
    q_starter: "آیا تازه‌کار هستید — آیا این یکی از پنج سال اول کارآفرینی شماست؟",
    q_starter_hint: "startersaftrek فقط در سه سال اول کارآفرینی در دسترس است.",
    q_starter_times: "چند بار از startersaftrek استفاده کرده‌اید؟",
    q_expenses: "در سال ۲۰۲۶ چه هزینه‌های تجاری داشتید؟",
    q_expenses_hint: "همه موارد مرتبط را انتخاب کنید. پس از اتمام روی بعدی کلیک کنید.",
    q_expenses_none: "هیچ‌کدام",
    q_assets: "آیا دارایی‌های تجاری بالای €۴۵۰ خریداری کردید؟",
    q_assets_hint: "لپ‌تاپ، دوربین، ابزار، ماشین‌آلات، مبلمان — هر خرید بالای €۴۵۰.",
    q_asset_amount: "مبلغ تقریبی کل سرمایه‌گذاری چقدر است؟",
    q_asset_placeholder: "مثلاً ۳۵۰۰",
    q_btw: "وضعیت مالیات بر ارزش افزوده (BTW) شما چیست؟",
    q_pension: "آیا مشارکت بازنشستگی یا lijfrente پرداخت کردید؟",
  },
};

// ─── Option sets ───────────────────────────────────────────────────────────────
const USER_TYPE_OPTS = [
  { value: "zzp",      nl: "ZZP / Freelancer",      en: "ZZP / Freelancer",     fa: "ZZP / فریلنسر" },
  { value: "employee", nl: "Werknemer",              en: "Employee",              fa: "کارمند" },
  { value: "expat",    nl: "Expat",                  en: "Expat",                 fa: "اکسپت" },
  { value: "dga",      nl: "DGA / BV-directeur",     en: "DGA / BV director",     fa: "DGA / مدیر BV" },
];

const HOURS_OPTS = [
  { value: "lt500",   nl: "Minder dan 500 uur",  en: "Less than 500 hours", fa: "کمتر از ۵۰۰ ساعت" },
  { value: "mid",     nl: "500–1.224 uur",        en: "500–1,224 hours",     fa: "۵۰۰–۱٬۲۲۴ ساعت" },
  { value: "gte1225", nl: "1.225 uur of meer",    en: "1,225 hours or more", fa: "۱٬۲۲۵ ساعت یا بیشتر" },
  { value: "unknown", nl: "Weet ik niet",         en: "I don't know",        fa: "نمی‌دانم" },
];

const STARTER_OPTS = [
  { value: "yes",    nl: "Ja, ik ben starter",              en: "Yes, I am a starter",             fa: "بله، تازه‌کار هستم" },
  { value: "no",     nl: "Nee, al meer dan 5 jaar actief",  en: "No, more than 5 years active",    fa: "خیر، بیش از ۵ سال است" },
  { value: "unsure", nl: "Weet ik niet",                    en: "I'm not sure",                    fa: "مطمئن نیستم" },
];

const STARTER_TIMES_OPTS = [
  { value: "never",  nl: "Nooit gebruikt",    en: "Never claimed it",   fa: "هرگز استفاده نکرده‌ام" },
  { value: "once",   nl: "1× gebruikt",       en: "Claimed once",       fa: "یک بار" },
  { value: "twice",  nl: "2× gebruikt",       en: "Claimed twice",      fa: "دو بار" },
  { value: "thrice", nl: "3× gebruikt",       en: "Claimed 3 times",    fa: "سه بار" },
  { value: "unknown",nl: "Weet ik niet",      en: "I'm not sure",       fa: "مطمئن نیستم" },
];

const EXPENSE_CATS = [
  { value: "laptop",      nl: "Laptop / computer",          en: "Laptop / computer",        fa: "لپ‌تاپ / کامپیوتر" },
  { value: "phone",       nl: "Telefoon",                   en: "Phone",                    fa: "موبایل" },
  { value: "internet",    nl: "Internet & telecom",          en: "Internet & telecom",       fa: "اینترنت و مخابرات" },
  { value: "software",    nl: "Software-abonnementen",       en: "Software subscriptions",   fa: "اشتراک نرم‌افزار" },
  { value: "office",      nl: "Kantoorbenodigdheden",        en: "Office supplies",          fa: "لوازم اداری" },
  { value: "travel_ov",   nl: "OV-reiskosten",              en: "Public transport",          fa: "حمل‌ونقل عمومی" },
  { value: "travel_car",  nl: "Auto / kilometervergoeding",  en: "Car / mileage",            fa: "ماشین / کیلومتر" },
  { value: "training",    nl: "Cursussen / opleidingen",     en: "Courses / training",       fa: "آموزش / دوره‌ها" },
  { value: "accountant",  nl: "Accountant / boekhouding",   en: "Accountant / bookkeeping", fa: "حسابدار" },
  { value: "marketing",   nl: "Marketing / website",         en: "Marketing / website",      fa: "بازاریابی / وبسایت" },
  { value: "insurance",   nl: "Zakelijke verzekering",       en: "Business insurance",       fa: "بیمه تجاری" },
  { value: "home_office", nl: "Werkruimte thuis",            en: "Home office",              fa: "دفتر خانگی" },
];

const ASSETS_OPTS = [
  { value: "yes", nl: "Ja", en: "Yes", fa: "بله" },
  { value: "no",  nl: "Nee", en: "No",  fa: "خیر" },
];

const BTW_OPTS = [
  { value: "registered",    nl: "Ja, ik dien BTW-aangifte in",              en: "Yes, I file VAT returns",         fa: "بله، اظهارنامه مالیاتی می‌دهم" },
  { value: "kor",           nl: "Ik gebruik de KOR",                        en: "I use the KOR (small business)",  fa: "از KOR استفاده می‌کنم" },
  { value: "not_registered",nl: "Ik ben niet BTW-plichtig",                 en: "I am not VAT registered",         fa: "مشمول مالیات ارزش افزوده نیستم" },
  { value: "unknown",       nl: "Weet ik niet",                             en: "I don't know",                    fa: "مطمئن نیستم" },
];

const PENSION_OPTS = [
  { value: "yes",    nl: "Ja",                          en: "Yes",                        fa: "بله" },
  { value: "no",     nl: "Nee",                         en: "No",                         fa: "خیر" },
  { value: "unsure", nl: "Weet ik niet / overweeg het", en: "Not sure / considering it",  fa: "مطمئن نیستم / در نظر دارم" },
];

// ─── Step flow (conditional) ────────────────────────────────────────────────────
type StepId =
  | "user_type" | "profit" | "hours" | "is_starter" | "starter_times"
  | "expenses" | "has_assets" | "asset_amount" | "btw_status" | "pension";

function getStepIds(answers: Answers): StepId[] {
  const steps: StepId[] = ["user_type"];
  if (answers.user_type !== "zzp") return steps;
  steps.push("profit", "hours", "is_starter");
  if (answers.is_starter !== "no") steps.push("starter_times");
  steps.push("expenses", "has_assets");
  if (answers.has_assets === "yes") steps.push("asset_amount");
  steps.push("btw_status", "pension");
  return steps;
}

// ─── Eligibility engine ─────────────────────────────────────────────────────────
function computeDeductions(answers: Answers, lang: Lang): DeductionResult[] {
  const results: DeductionResult[] = [];

  // 1. Zelfstandigenaftrek — requires 1,225 hrs
  const zaStatus: EligStatus =
    answers.hours === "gte1225" ? "likely" :
    answers.hours === "lt500"   ? "not_likely" : "needs_info";
  results.push({
    id: "za", status: zaStatus,
    title: "Zelfstandigenaftrek — €1.200",
    reason: {
      nl: zaStatus === "likely"    ? "U werkte 1.225+ uur — u voldoet aan het urencriterium."
        : zaStatus === "not_likely"? "Minder dan 500 uur werken kwalificeert niet voor deze aftrek."
        : "Bijhouden tot jaareinde kan nog. 1.225 uur vereist.",
      en: zaStatus === "likely"    ? "You worked 1,225+ hours — you meet the urencriterium."
        : zaStatus === "not_likely"? "Fewer than 500 hours does not qualify for this deduction."
        : "You can still track hours until year-end. 1,225 required.",
      fa: zaStatus === "likely"    ? "۱٬۲۲۵+ ساعت کار کردید — شرط ساعتی را برآورده می‌کنید."
        : zaStatus === "not_likely"? "کمتر از ۵۰۰ ساعت برای این کسر واجد شرایط نیست."
        : "هنوز می‌توانید ساعات را تا پایان سال ثبت کنید. ۱٬۲۲۵ ساعت لازم است.",
    }[lang],
    action: {
      nl: "Houd een urenregistratie bij. €1.200 aftrek verlaagt uw belastbare winst.",
      en: "Keep a timesheet or diary. €1,200 deduction reduces your taxable profit.",
      fa: "یک دفترچه ساعات نگه دارید. کسر €۱٬۲۰۰ سود مشمول مالیات شما را کاهش می‌دهد.",
    }[lang],
  });

  // 2. Startersaftrek — first 3 years, max 3 times, abolished after 2026
  const isStarter = answers.is_starter;
  const times = answers.starter_times;
  const saStatus: EligStatus =
    isStarter === "no" ? "not_likely" :
    isStarter === "unsure" ? "needs_info" :
    times === "thrice" ? "not_likely" :
    times === "unknown" ? "needs_info" : "likely";
  results.push({
    id: "sa", status: saStatus,
    title: "Startersaftrek — €2.123 (laatste jaar!)",
    reason: {
      nl: saStatus === "likely"    ? "U bent starter met nog startersaftrek-ruimte. Dit is het LAATSTE jaar — na 2026 vervalt de aftrek."
        : saStatus === "not_likely"? "U bent geen starter of heeft de aftrek al 3× gebruikt."
        : "Controleer of dit uw eerste 3 jaar als ondernemer is.",
      en: saStatus === "likely"    ? "You are a starter with remaining claims. This is the LAST year — abolished from 2027."
        : saStatus === "not_likely"? "You are not a starter or have already claimed it 3 times."
        : "Verify whether this is within your first 3 years as an entrepreneur.",
      fa: saStatus === "likely"    ? "تازه‌کار هستید و ظرفیت startersaftrek دارید. این آخرین سال است — از ۲۰۲۷ حذف می‌شود."
        : saStatus === "not_likely"? "تازه‌کار نیستید یا سه بار از این کسر استفاده کرده‌اید."
        : "بررسی کنید آیا در سه سال اول کارآفرینی هستید.",
    }[lang],
    action: {
      nl: "€2.123 bovenop zelfstandigenaftrek. Mis dit niet — dit is het laatste jaar.",
      en: "€2,123 on top of zelfstandigenaftrek. Do not miss this — it is the last year.",
      fa: "€۲٬۱۲۳ علاوه بر zelfstandigenaftrek. این را از دست ندهید — آخرین سال است.",
    }[lang],
  });

  // 3. MKB-winstvrijstelling — always applies to ZZP, no hours required
  results.push({
    id: "mkb", status: "likely",
    title: "MKB-winstvrijstelling — 12,7%",
    reason: {
      nl: "Geldt voor alle ZZP'ers — 12,7% van de winst na aftrekken. Geen uren vereist.",
      en: "Applies to all ZZP — 12.7% of profit after deductions. No hour requirement.",
      fa: "برای همه ZZP‌ها اعمال می‌شود — ۱۲٫۷٪ از سود پس از کسورات. بدون نیاز به ساعت.",
    }[lang],
    action: {
      nl: "Wordt automatisch verrekend. Zorg dat uw boekhouder het toepast.",
      en: "Applied automatically. Confirm your accountant includes it.",
      fa: "به طور خودکار اعمال می‌شود. مطمئن شوید حسابدارتان آن را لحاظ کرده است.",
    }[lang],
  });

  // 4. Business expenses
  const expCount = answers.expenses.length;
  results.push({
    id: "expenses",
    status: expCount > 0 ? "likely" : "needs_info",
    title: {
      nl: "Zakelijke kosten",
      en: "Business expenses",
      fa: "هزینه‌های تجاری",
    }[lang],
    reason: {
      nl: expCount > 0
        ? `U heeft ${expCount} kostencategorie${expCount > 1 ? "ën" : ""} opgegeven die aftrekbaar kunnen zijn.`
        : "Geef aan welke zakelijke kosten u had om dit te beoordelen.",
      en: expCount > 0
        ? `You reported ${expCount} expense categor${expCount > 1 ? "ies" : "y"} that may be deductible.`
        : "Specify which business expenses you had to assess this.",
      fa: expCount > 0
        ? `${expCount} دسته هزینه تجاری وارد کردید که ممکن است کسر شوند.`
        : "هزینه‌های تجاری خود را مشخص کنید تا ارزیابی شود.",
    }[lang],
    action: {
      nl: "Verzamel facturen en bonnetjes. Scheid zakelijk van privégebruik.",
      en: "Collect invoices and receipts. Separate business from private use.",
      fa: "فاکتورها و رسیدها را جمع‌آوری کنید. استفاده تجاری را از شخصی جدا کنید.",
    }[lang],
  });

  // 5. KIA — small investment deduction
  const hasAssets = answers.has_assets;
  const assetAmt = parseFloat(answers.asset_amount?.replace(/[^0-9.]/g, "") || "0");
  const kiaStatus: EligStatus =
    hasAssets === "no" ? "not_likely" :
    hasAssets === "yes" && assetAmt >= 2901 && assetAmt <= 70602 ? "likely" :
    hasAssets === "yes" && assetAmt > 0 ? "not_likely" :
    "needs_info";
  results.push({
    id: "kia", status: kiaStatus,
    title: "Kleinschaligheidsinvesteringsaftrek (KIA)",
    reason: {
      nl: kiaStatus === "likely"
        ? `Investering van ca. €${Math.round(assetAmt).toLocaleString("nl")} valt in de KIA-bandbreedte (€2.901–€70.602).`
        : kiaStatus === "not_likely"
          ? assetAmt > 0
            ? `Investering van ca. €${Math.round(assetAmt).toLocaleString("nl")} valt buiten de KIA-drempel.`
            : "Geen zakelijke investeringen boven €450 opgegeven."
          : "Geef het totale investeringsbedrag op voor een juiste beoordeling.",
      en: kiaStatus === "likely"
        ? `Investment of approx. €${Math.round(assetAmt).toLocaleString("en")} falls within the KIA range (€2,901–€70,602).`
        : kiaStatus === "not_likely"
          ? assetAmt > 0
            ? `Investment of approx. €${Math.round(assetAmt).toLocaleString("en")} is outside the KIA threshold.`
            : "No business assets above €450 reported."
          : "Enter your total investment amount for an accurate assessment.",
      fa: kiaStatus === "likely"
        ? `سرمایه‌گذاری تقریباً €${Math.round(assetAmt).toLocaleString()} در محدوده KIA قرار دارد (€۲٬۹۰۱–€۷۰٬۶۰۲).`
        : kiaStatus === "not_likely"
          ? assetAmt > 0
            ? `سرمایه‌گذاری تقریباً €${Math.round(assetAmt).toLocaleString()} خارج از آستانه KIA است.`
            : "هیچ دارایی تجاری بالای €۴۵۰ گزارش نشده است."
          : "مبلغ کل سرمایه‌گذاری را برای ارزیابی دقیق وارد کنید.",
    }[lang],
    action: {
      nl: "28% aftrek op investeringsbedrag (€2.901–€70.602). Vraag uw boekhouder dit toe te passen.",
      en: "28% deduction on investment amount (€2,901–€70,602). Ask your accountant to apply KIA.",
      fa: "کسر ۲۸٪ از مبلغ سرمایه‌گذاری (€۲٬۹۰۱–€۷۰٬۶۰۲). از حسابدارتان بخواهید KIA را اعمال کند.",
    }[lang],
  });

  // 6. ZVW — mandatory health contribution, always reminder
  results.push({
    id: "zvw", status: "likely",
    title: {
      nl: "ZVW-bijdrage — 4,85% (verplicht)",
      en: "ZVW health contribution — 4.85% (mandatory)",
      fa: "مشارکت سلامت ZVW — ۴٫۸۵٪ (اجباری)",
    }[lang],
    reason: {
      nl: "Elke ZZP'er betaalt 4,85% ZVW over de winst na aftrekken. Dit wordt vaak vergeten bij belastingreservering.",
      en: "Every ZZP pays 4.85% ZVW on profit after deductions. Often forgotten when reserving for tax.",
      fa: "هر ZZP باید ۴٫۸۵٪ ZVW از سود پس از کسورات بپردازد. اغلب در زمان ذخیره‌سازی مالیات فراموش می‌شود.",
    }[lang],
    action: {
      nl: "Reserveer apart voor ZVW. Maximum €3.851/jaar (plafond bij €79.409 winst).",
      en: "Reserve separately for ZVW. Maximum €3,851/year (ceiling at €79,409 profit).",
      fa: "جداگانه برای ZVW ذخیره کنید. حداکثر €۳٬۸۵۱/سال (سقف €۷۹٬۴۰۹ سود).",
    }[lang],
  });

  // 7. Pension / Lijfrente deduction
  const pensionStatus: EligStatus =
    answers.pension === "yes"    ? "likely" :
    answers.pension === "no"     ? "not_likely" : "needs_info";
  results.push({
    id: "pension", status: pensionStatus,
    title: {
      nl: "Lijfrente / Pensioenaftrek",
      en: "Pension / Lijfrente deduction",
      fa: "کسر بازنشستگی / Lijfrente",
    }[lang],
    reason: {
      nl: pensionStatus === "likely"    ? "U heeft pensioenpremies betaald — deze kunnen aftrekbaar zijn via de jaarruimte."
        : pensionStatus === "not_likely"? "Geen pensioenpremies betaald in 2026."
        : "Controleer uw jaarruimte. Als ZZP heeft u geen werkgeverspensioen — dit is extra belangrijk.",
      en: pensionStatus === "likely"    ? "You made pension contributions — these may be deductible via jaarruimte."
        : pensionStatus === "not_likely"? "No pension contributions made in 2026."
        : "Check your jaarruimte. As ZZP you have no employer pension — this is especially important.",
      fa: pensionStatus === "likely"    ? "حق بیمه بازنشستگی پرداخت کردید — ممکن است از طریق jaarruimte کسر شود."
        : pensionStatus === "not_likely"? "در ۲۰۲۶ هیچ حق بیمه بازنشستگی پرداخت نشده است."
        : "jaarruimte خود را بررسی کنید. به عنوان ZZP بازنشستگی کارفرمایی ندارید — این بسیار مهم است.",
    }[lang],
    action: {
      nl: "Jaarruimte = 30% × (winst − €19.172). Stort vóór 31 december bij een erkende verzekeraar.",
      en: "Jaarruimte = 30% × (profit − €19,172). Deposit before 31 December at a recognised insurer.",
      fa: "jaarruimte = ۳۰٪ × (سود − €۱۹٬۱۷۲). قبل از ۳۱ دسامبر نزد یک بیمه‌گر معتبر واریز کنید.",
    }[lang],
  });

  return results;
}

// ─── Status badge style ─────────────────────────────────────────────────────────
const BADGE_STYLE: Record<EligStatus, { bg: string; color: string; dot: string }> = {
  likely:     { bg: "var(--accent-soft)", color: "var(--sage-700)", dot: "var(--sage-600)" },
  needs_info: { bg: "oklch(0.97 0.05 80 / 0.5)", color: "oklch(0.50 0.12 75)", dot: "oklch(0.65 0.15 75)" },
  not_likely: { bg: "var(--paper-2)", color: "var(--ink-4)", dot: "var(--ink-4)" },
};

// ─── Component ──────────────────────────────────────────────────────────────────
export default function DeductionCheckerPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const { user } = useAuth();
  const lang = (["nl", "fa"].includes(i18n.language) ? i18n.language : "en") as Lang;
  const tx = (k: string) => TX[lang][k] as string;

  const [answers, setAnswers] = useState<Answers>({ expenses: [] });
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [profitInput, setProfitInput] = useState("");
  const [assetInput, setAssetInput] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  // Email gate — shown between last question and results for anonymous users
  const [gateEmail, setGateEmail] = useState("");
  const [gateSubmitted, setGateSubmitted] = useState(false);
  const [gateLoading, setGateLoading] = useState(false);
  const startedTracked = useRef(false);

  const stepIds = getStepIds(answers);
  const currentStep = stepIds[stepIndex];
  const totalSteps = stepIds.length;

  function setAnswer<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  function advance(newAnswers?: Partial<Answers>) {
    if (!startedTracked.current) {
      trackDeductionCheckerStarted();
      startedTracked.current = true;
    }
    const merged = newAnswers ? { ...answers, ...newAnswers } : answers;
    setAnswers(merged as Answers);
    trackCheckerStepCompleted(currentStep, stepIndex);
    const newStepIds = getStepIds(merged as Answers);
    if (stepIndex >= newStepIds.length - 1) {
      const results = computeDeductions(merged as Answers, lang);
      const likelyCount = results.filter(d => d.status === "likely").length;
      const needsInfoCount = results.filter(d => d.status === "needs_info").length;
      trackDeductionCheckerCompleted(likelyCount);
      trackCheckerResultsViewed(likelyCount, needsInfoCount, merged.user_type ?? "zzp");
      setDone(true);
      return;
    }
    setStepIndex(s => s + 1);
  }

  function back() { if (stepIndex > 0) setStepIndex(s => s - 1); }

  function reset() {
    setAnswers({ expenses: [] });
    setStepIndex(0);
    setDone(false);
    setProfitInput("");
    setAssetInput("");
    setWaitlistEmail("");
    setWaitlistDone(false);
  }

  async function submitGate() {
    if (!gateEmail) return;
    setGateLoading(true);
    try {
      await captureEmail(gateEmail, "checker_gate");
    } catch { /* fail silently */ }
    setGateLoading(false);
    setGateSubmitted(true);
  }

  async function submitWaitlist() {
    if (!waitlistEmail) return;
    setWaitlistLoading(true);
    try {
      await captureEmail(waitlistEmail, `waitlist_${answers.user_type}`, answers.user_type ?? "");
      trackCheckerWaitlistSubmitted(answers.user_type ?? "unknown");
    } catch { /* fail silently */ }
    setWaitlistLoading(false);
    setWaitlistDone(true);
  }

  // ── Results ──
  const isNonZzp = answers.user_type && answers.user_type !== "zzp";
  const deductions = done && !isNonZzp ? computeDeductions(answers, lang) : [];
  const likelyCount = deductions.filter(d => d.status === "likely").length;

  // ── Step renderer ──
  function renderStep() {
    // Choice step (single-select, auto-advances)
    function ChoiceStep({
      questionKey, hintKey, options, onChoose,
    }: {
      questionKey: string;
      hintKey?: string;
      options: { value: string; nl: string; en: string; fa: string }[];
      onChoose: (value: string) => void;
    }) {
      return (
        <div>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: isMobile ? "var(--text-2xl)" : "var(--text-3xl)", fontWeight: 400, color: "var(--ink)", marginBottom: hintKey ? "var(--sp-2)" : "var(--sp-6)" }}>
            {tx(questionKey)}
          </h2>
          {hintKey && <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", marginBottom: "var(--sp-6)" }}>{tx(hintKey)}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => onChoose(opt.value)}
                style={{
                  padding: "var(--sp-4) var(--sp-5)",
                  borderRadius: "var(--r)",
                  border: "1px solid var(--hairline-2)",
                  background: "var(--paper)",
                  textAlign: lang === "fa" ? "right" : "left",
                  cursor: "pointer",
                  fontSize: "var(--text-md)",
                  color: "var(--ink)",
                  fontWeight: 500,
                  transition: "border-color .12s, background .12s",
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "var(--sage-600)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "var(--hairline-2)"; e.currentTarget.style.background = "var(--paper)"; }}
              >
                {opt[lang]}
              </button>
            ))}
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case "user_type":
        return (
          <ChoiceStep
            questionKey="q_user_type"
            options={USER_TYPE_OPTS}
            onChoose={v => advance({ user_type: v as UserType, expenses: answers.expenses })}
          />
        );

      case "profit":
        return (
          <div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: isMobile ? "var(--text-2xl)" : "var(--text-3xl)", fontWeight: 400, color: "var(--ink)", marginBottom: "var(--sp-2)" }}>
              {tx("q_profit")}
            </h2>
            <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", marginBottom: "var(--sp-5)" }}>{tx("q_profit_hint")}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-4)" }}>
              <span style={{ fontSize: "var(--text-xl)", color: "var(--ink-3)", fontWeight: 500 }}>€</span>
              <input
                className="tw-input"
                type="number"
                min="0"
                value={profitInput}
                onChange={e => setProfitInput(e.target.value)}
                placeholder={tx("q_profit_placeholder")}
                style={{ fontSize: "var(--text-xl)", maxWidth: 280 }}
                autoFocus
                onKeyDown={e => { if (e.key === "Enter" && profitInput) advance({ profit: profitInput }); }}
              />
            </div>
            <button
              className="btn btn-accent btn-lg"
              disabled={!profitInput}
              onClick={() => advance({ profit: profitInput })}
            >
              {tx("next")}
            </button>
          </div>
        );

      case "hours":
        return (
          <ChoiceStep
            questionKey="q_hours"
            hintKey="q_hours_hint"
            options={HOURS_OPTS}
            onChoose={v => advance({ hours: v as Answers["hours"] })}
          />
        );

      case "is_starter":
        return (
          <ChoiceStep
            questionKey="q_starter"
            hintKey="q_starter_hint"
            options={STARTER_OPTS}
            onChoose={v => advance({ is_starter: v as Answers["is_starter"] })}
          />
        );

      case "starter_times":
        return (
          <ChoiceStep
            questionKey="q_starter_times"
            options={STARTER_TIMES_OPTS}
            onChoose={v => advance({ starter_times: v as Answers["starter_times"] })}
          />
        );

      case "expenses": {
        const selected = answers.expenses;
        const toggle = (val: string) => {
          setAnswer("expenses", selected.includes(val) ? selected.filter(x => x !== val) : [...selected, val]);
        };
        return (
          <div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: isMobile ? "var(--text-2xl)" : "var(--text-3xl)", fontWeight: 400, color: "var(--ink)", marginBottom: "var(--sp-2)" }}>
              {tx("q_expenses")}
            </h2>
            <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", marginBottom: "var(--sp-4)" }}>{tx("q_expenses_hint")}</p>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-2)", marginBottom: "var(--sp-5)" }}>
              {EXPENSE_CATS.map(cat => {
                const checked = selected.includes(cat.value);
                return (
                  <button
                    key={cat.value}
                    onClick={() => toggle(cat.value)}
                    style={{
                      padding: "var(--sp-3) var(--sp-4)",
                      borderRadius: "var(--r)",
                      border: `1px solid ${checked ? "var(--sage-600)" : "var(--hairline-2)"}`,
                      background: checked ? "var(--accent-soft)" : "var(--paper)",
                      textAlign: lang === "fa" ? "right" : "left",
                      cursor: "pointer",
                      fontSize: "var(--text-sm)",
                      color: checked ? "var(--sage-700)" : "var(--ink)",
                      fontWeight: checked ? 600 : 400,
                      display: "flex", alignItems: "center", gap: "var(--sp-2)",
                      transition: "border-color .12s, background .12s",
                    }}
                  >
                    <span style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? "var(--sage-600)" : "var(--hairline-2)"}`, background: checked ? "var(--sage-600)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .12s" }}>
                      {checked && <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                    </span>
                    {cat[lang]}
                  </button>
                );
              })}
            </div>
            <button className="btn btn-accent btn-lg" onClick={() => advance()}>
              {tx("next")}
            </button>
          </div>
        );
      }

      case "has_assets":
        return (
          <ChoiceStep
            questionKey="q_assets"
            hintKey="q_assets_hint"
            options={ASSETS_OPTS}
            onChoose={v => advance({ has_assets: v as "yes" | "no" })}
          />
        );

      case "asset_amount":
        return (
          <div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: isMobile ? "var(--text-2xl)" : "var(--text-3xl)", fontWeight: 400, color: "var(--ink)", marginBottom: "var(--sp-5)" }}>
              {tx("q_asset_amount")}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-4)" }}>
              <span style={{ fontSize: "var(--text-xl)", color: "var(--ink-3)", fontWeight: 500 }}>€</span>
              <input
                className="tw-input"
                type="number"
                min="0"
                value={assetInput}
                onChange={e => setAssetInput(e.target.value)}
                placeholder={tx("q_asset_placeholder")}
                style={{ fontSize: "var(--text-xl)", maxWidth: 280 }}
                autoFocus
                onKeyDown={e => { if (e.key === "Enter") advance({ asset_amount: assetInput }); }}
              />
            </div>
            <button
              className="btn btn-accent btn-lg"
              onClick={() => advance({ asset_amount: assetInput })}
            >
              {tx("next")}
            </button>
          </div>
        );

      case "btw_status":
        return (
          <ChoiceStep
            questionKey="q_btw"
            options={BTW_OPTS}
            onChoose={v => advance({ btw_status: v as Answers["btw_status"] })}
          />
        );

      case "pension":
        return (
          <div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: isMobile ? "var(--text-2xl)" : "var(--text-3xl)", fontWeight: 400, color: "var(--ink)", marginBottom: "var(--sp-6)" }}>
              {tx("q_pension")}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
              {PENSION_OPTS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => advance({ pension: opt.value as Answers["pension"] })}
                  style={{
                    padding: "var(--sp-4) var(--sp-5)",
                    borderRadius: "var(--r)",
                    border: "1px solid var(--hairline-2)",
                    background: "var(--paper)",
                    textAlign: lang === "fa" ? "right" : "left",
                    cursor: "pointer",
                    fontSize: "var(--text-md)",
                    color: "var(--ink)",
                    fontWeight: 500,
                    transition: "border-color .12s, background .12s",
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = "var(--sage-600)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = "var(--hairline-2)"; e.currentTarget.style.background = "var(--paper)"; }}
                >
                  {opt[lang]}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  // ── Non-ZZP waitlist screen ──
  if (done && isNonZzp) {
    return (
      <main style={{ background: "var(--paper)", flex: 1 }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: isMobile ? "var(--sp-10) var(--sp-4)" : "var(--sp-16) var(--sp-6)", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: "var(--sp-4)" }}>🔜</div>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-3xl)", fontWeight: 400, color: "var(--ink)", marginBottom: "var(--sp-3)" }}>
            {tx("non_zzp_title")}
          </h2>
          <p style={{ color: "var(--ink-3)", fontSize: "var(--text-md)", marginBottom: "var(--sp-6)" }}>
            {tx("non_zzp_sub")}
          </p>
          {waitlistDone ? (
            <p style={{ color: "var(--sage-700)", fontWeight: 500 }}>{tx("waitlist_done")}</p>
          ) : (
            <div style={{ display: "flex", gap: "var(--sp-2)", maxWidth: 400, margin: "0 auto" }}>
              <input
                className="tw-input"
                type="email"
                value={waitlistEmail}
                onChange={e => setWaitlistEmail(e.target.value)}
                placeholder={tx("email_placeholder")}
                style={{ flex: 1 }}
                onKeyDown={e => { if (e.key === "Enter") submitWaitlist(); }}
              />
              <button
                className="btn btn-accent"
                onClick={submitWaitlist}
                disabled={waitlistLoading || !waitlistEmail}
              >
                {tx("non_zzp_cta")}
              </button>
            </div>
          )}
          <button className="btn btn-ghost btn-sm" style={{ marginTop: "var(--sp-6)", color: "var(--ink-4)" }} onClick={reset}>
            {tx("start_over")}
          </button>
        </div>
      </main>
    );
  }

  // ── Email gate (anonymous users only) ──
  const GATE = {
    nl: { title: "Bijna klaar — waar sturen we uw resultaten naartoe?",
          sub: "Vul uw e-mailadres in om uw aftrekpostenanalyse te zien. We sturen niets zonder toestemming.",
          placeholder: "uw@email.nl", cta: "Bekijk mijn resultaten →",
          skip: "Overslaan en meteen bekijken" },
    en: { title: "Almost done — where should we send your results?",
          sub: "Enter your email to view your deduction analysis. We never send spam.",
          placeholder: "your@email.com", cta: "See my results →",
          skip: "Skip and view now" },
    fa: { title: "تقریباً تمام شد — نتایج را کجا بفرستیم؟",
          sub: "ایمیل خود را وارد کنید تا تحلیل کسورات خود را ببینید. اسپم نمی‌فرستیم.",
          placeholder: "ایمیل@شما.com", cta: "نتایج من را ببین ←",
          skip: "رد کردن و مشاهده همین الان" },
  };

  if (done && !isNonZzp && !user && !gateSubmitted) {
    const g = GATE[lang];
    return (
      <main style={{ background: "var(--paper)", flex: 1 }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: isMobile ? "var(--sp-10) var(--sp-4)" : "var(--sp-16) var(--sp-6)", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--accent-soft)", border: "1px solid var(--accent-line)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--sp-5)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--sage-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-2xl)", fontWeight: 400, color: "var(--ink)", marginBottom: "var(--sp-3)" }}>
            {g.title}
          </h2>
          <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", marginBottom: "var(--sp-6)" }}>{g.sub}</p>
          <div style={{ display: "flex", gap: "var(--sp-2)", maxWidth: 380, margin: "0 auto var(--sp-4)" }}>
            <input
              className="tw-input"
              type="email"
              value={gateEmail}
              onChange={e => setGateEmail(e.target.value)}
              placeholder={g.placeholder}
              style={{ flex: 1, fontSize: 16 }}
              onKeyDown={e => { if (e.key === "Enter") submitGate(); }}
              autoFocus
            />
            <button className="btn btn-accent" onClick={submitGate} disabled={gateLoading || !gateEmail}>
              {gateLoading ? "…" : g.cta}
            </button>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ color: "var(--ink-4)" }} onClick={() => setGateSubmitted(true)}>
            {g.skip}
          </button>
        </div>
      </main>
    );
  }

  // ── Results screen ──
  if (done) {
    const statusOrder: EligStatus[] = ["likely", "needs_info", "not_likely"];
    const sorted = [...deductions].sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
    const resultCount = TX[lang].result_count as (n: number) => string;

    return (
      <main style={{ background: "var(--paper)", flex: 1 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "var(--sp-8) var(--sp-4)" : "var(--sp-12) var(--sp-6)" }}>
          <div style={{ marginBottom: "var(--sp-6)" }}>
            <span className="pill pill-accent" style={{ display: "inline-block", marginBottom: "var(--sp-3)" }}>{tx("badge")}</span>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-4xl)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em" }}>
              {tx("result_title")}
            </h1>
            <p style={{ color: "var(--ink-3)", marginTop: "var(--sp-2)" }}>{resultCount(likelyCount)}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)", marginBottom: "var(--sp-8)" }}>
            {sorted.map(d => {
              const bs = BADGE_STYLE[d.status];
              const statusLabel = tx(d.status);
              return (
                <div key={d.id} style={{ borderRadius: "var(--r)", border: `1px solid ${d.status === "likely" ? "var(--accent-line)" : "var(--hairline)"}`, overflow: "hidden" }}>
                  {/* Header */}
                  <div style={{ padding: "var(--sp-4) var(--sp-5)", background: d.status === "likely" ? "var(--accent-soft)" : "var(--paper)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--sp-2)" }}>
                    <span style={{ fontWeight: 600, color: "var(--ink)", fontSize: "var(--text-sm)" }}>{d.title}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: bs.bg, fontSize: 11, fontWeight: 600, color: bs.color, whiteSpace: "nowrap" }}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: bs.dot }} />
                      {statusLabel}
                    </span>
                  </div>
                  {/* Body */}
                  <div style={{ padding: "var(--sp-3) var(--sp-5) var(--sp-4)", borderTop: "1px solid var(--hairline)", background: "var(--paper)" }}>
                    <p style={{ color: "var(--ink-2)", fontSize: "var(--text-sm)", margin: 0, marginBottom: "var(--sp-2)" }}>{d.reason}</p>
                    <p style={{ color: "var(--ink-3)", fontSize: "var(--text-xs)", margin: 0 }}>
                      <strong style={{ color: "var(--ink-2)" }}>{lang === "nl" ? "Actie:" : lang === "fa" ? "اقدام:" : "Action:"}</strong>{" "}{d.action}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "var(--sp-3)" }}>
            <button className="btn btn-accent btn-lg" style={{ flex: 1 }} onClick={() => navigate("/intake")}>
              {tx("cta_calc")}
            </button>
            <button className="btn btn-ghost btn-lg" style={{ flex: 1 }} onClick={() => navigate("/chat")}>
              {tx("cta_chat")}
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: "var(--sp-4)" }}>
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--ink-4)" }} onClick={reset}>
              {tx("start_over")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Question wizard ──
  const isFirstStep = stepIndex === 0;

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: isMobile ? "var(--sp-8) var(--sp-4)" : "var(--sp-12) var(--sp-6)" }}>

        {/* Header — only on step 0 */}
        {isFirstStep && (
          <div style={{ textAlign: "center", marginBottom: "var(--sp-8)" }}>
            <span className="pill pill-accent" style={{ display: "inline-block", marginBottom: "var(--sp-3)" }}>{tx("badge")}</span>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-4xl)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em" }}>
              {tx("title")}
            </h1>
            <p style={{ marginTop: "var(--sp-2)", color: "var(--ink-3)", fontSize: "var(--text-md)" }}>
              {tx("subtitle")}
            </p>
          </div>
        )}

        {/* Card */}
        <div className="card" style={{ padding: isMobile ? "var(--sp-6)" : "var(--sp-8)" }}>

          {/* Progress */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-6)" }}>
            <div style={{ display: "flex", gap: 5 }}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span key={i} style={{
                  width: i === stepIndex ? 20 : 8, height: 6, borderRadius: 3,
                  background: i < stepIndex ? "var(--sage-600)" : i === stepIndex ? "var(--sage-600)" : "var(--hairline-2)",
                  opacity: i < stepIndex ? 0.5 : 1,
                  transition: "width .2s, background .2s",
                }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: "var(--ink-4)" }}>
              {TX[lang].step_of
                ? (TX[lang].step_of as (n: number, t: number) => string)(stepIndex + 1, totalSteps)
                : `${stepIndex + 1} / ${totalSteps}`}
            </span>
          </div>

          {/* Current step */}
          {renderStep()}

          {/* Back button (not on first step, not on auto-advance steps) */}
          {stepIndex > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: "var(--sp-5)", color: "var(--ink-4)" }}
              onClick={back}
            >
              {tx("back")}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
