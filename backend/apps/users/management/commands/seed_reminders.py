"""
Management command: seed all 2026 TaxReminder records.
Covers T3-2 (BTW all 4 quarters), T4-1 (IB), T4-2 (toeslagen),
T4-3 (ZZP admin), T4-4 (voorlopige aanslag).

Usage:
    python manage.py seed_reminders
    python manage.py seed_reminders --reset   # deletes existing 2026 records first
"""
from django.core.management.base import BaseCommand
from apps.users.models import TaxReminder


REMINDERS = [
    # ── BTW / VAT (T3-2: all 4 quarters) ────────────────────────────────────
    {
        "title_nl": "BTW aangifte Q1 2026 deadline",
        "title_en": "VAT return Q1 2026 due",
        "title_fa": "مهلت اظهارنامه BTW Q1 2026",
        "description_nl": "De BTW-aangifte over het eerste kwartaal (jan–mrt 2026) is uiterlijk 30 april 2026 ingediend en betaald. Een boete bij te late indiening is automatisch, ook bij een nihilaangifte.",
        "description_en": "VAT return for Q1 2026 (Jan–Mar) must be filed and paid by 30 April 2026. A penalty is issued automatically for late filing, even on a zero return.",
        "description_fa": "اظهارنامه BTW فصل اول ۲۰۲۶ (فروردین–خرداد) باید تا ۳۰ آوریل ۲۰۲۶ ارسال و پرداخت شود. تأخیر جریمه خودکار دارد.",
        "category": "vat",
        "user_types": ["zzp"],
        "tax_year": 2026,
        "due_date": "2026-04-30",
        "recurrence": "quarterly",
        "reminder_offsets": [30, 14, 7, 1],
        "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/btw_aangifte_doen_en_betalen/btw_aangifte_doen",
        "action_type": "file_return",
    },
    {
        "title_nl": "BTW aangifte Q2 2026 deadline",
        "title_en": "VAT return Q2 2026 due",
        "title_fa": "مهلت اظهارنامه BTW Q2 2026",
        "description_nl": "BTW-aangifte Q2 (apr–jun 2026) uiterlijk 31 juli 2026.",
        "description_en": "VAT return Q2 2026 (Apr–Jun) must be filed and paid by 31 July 2026.",
        "description_fa": "اظهارنامه BTW فصل دوم تا ۳۱ ژوئیه ۲۰۲۶.",
        "category": "vat",
        "user_types": ["zzp"],
        "tax_year": 2026,
        "due_date": "2026-07-31",
        "recurrence": "quarterly",
        "reminder_offsets": [30, 14, 7, 1],
        "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/btw_aangifte_doen_en_betalen/btw_aangifte_doen",
        "action_type": "file_return",
    },
    {
        "title_nl": "BTW aangifte Q3 2026 deadline",
        "title_en": "VAT return Q3 2026 due",
        "title_fa": "مهلت اظهارنامه BTW Q3 2026",
        "description_nl": "BTW-aangifte Q3 (jul–sep 2026) uiterlijk 31 oktober 2026.",
        "description_en": "VAT return Q3 2026 (Jul–Sep) must be filed and paid by 31 October 2026.",
        "description_fa": "اظهارنامه BTW فصل سوم تا ۳۱ اکتبر ۲۰۲۶.",
        "category": "vat",
        "user_types": ["zzp"],
        "tax_year": 2026,
        "due_date": "2026-10-31",
        "recurrence": "quarterly",
        "reminder_offsets": [30, 14, 7, 1],
        "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/btw_aangifte_doen_en_betalen/btw_aangifte_doen",
        "action_type": "file_return",
    },
    {
        "title_nl": "BTW aangifte Q4 2026 deadline",
        "title_en": "VAT return Q4 2026 due",
        "title_fa": "مهلت اظهارنامه BTW Q4 2026",
        "description_nl": "BTW-aangifte Q4 (okt–dec 2026) uiterlijk 31 januari 2027.",
        "description_en": "VAT return Q4 2026 (Oct–Dec) must be filed and paid by 31 January 2027.",
        "description_fa": "اظهارنامه BTW فصل چهارم تا ۳۱ ژانویه ۲۰۲۷.",
        "category": "vat",
        "user_types": ["zzp"],
        "tax_year": 2026,
        "due_date": "2027-01-31",
        "recurrence": "quarterly",
        "reminder_offsets": [30, 14, 7, 1],
        "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/btw_aangifte_doen_en_betalen/btw_aangifte_doen",
        "action_type": "file_return",
    },

    # ── Inkomstenbelasting / IB (T4-1: 6 events) ────────────────────────────
    {
        "title_nl": "Aangifte inkomstenbelasting 2025 is open",
        "title_en": "IB tax return for 2025 is now open",
        "title_fa": "اظهارنامه مالیات بر درآمد ۲۰۲۵ باز شد",
        "description_nl": "Vanaf 1 januari 2026 kunt u uw aangifte inkomstenbelasting 2025 indienen. Vroeg indienen is handig als u recht heeft op teruggave.",
        "description_en": "From 1 January 2026 you can file your 2025 income tax return. Filing early is useful if you are due a refund.",
        "description_fa": "از ۱ ژانویه ۲۰۲۶ می‌توانید اظهارنامه ۲۰۲۵ را ارسال کنید. اگر بازپرداخت دارید، زود ارسال کنید.",
        "category": "income_tax",
        "user_types": ["zzp"],
        "tax_year": 2026,
        "due_date": "2026-01-15",
        "reminder_offsets": [],
        "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/aangifte_doen",
        "action_type": "file_return",
    },
    {
        "title_nl": "Deadline aangifte inkomstenbelasting 2025",
        "title_en": "IB return deadline for tax year 2025",
        "title_fa": "مهلت اظهارنامه مالیاتی سال ۲۰۲۵",
        "description_nl": "Uiterlijk 1 mei 2026 moet uw aangifte inkomstenbelasting 2025 zijn ingediend. Vraag tijdig uitstel aan als u meer tijd nodig heeft.",
        "description_en": "The deadline for your 2025 income tax return is 1 May 2026. Request an extension (uitstel) before the deadline if you need more time.",
        "description_fa": "مهلت اظهارنامه مالیات بر درآمد ۲۰۲۵ تا ۱ مه ۲۰۲۶ است. در صورت نیاز، قبل از مهلت تمدید بخواهید.",
        "category": "income_tax",
        "user_types": ["zzp"],
        "tax_year": 2026,
        "due_date": "2026-05-01",
        "reminder_offsets": [30, 14, 7, 1],
        "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/aangifte_doen/wanneer_aangifte_doen",
        "action_type": "file_return",
    },
    {
        "title_nl": "Verzoek uitstel aangifte 2025",
        "title_en": "Request extension for 2025 IB return",
        "title_fa": "درخواست تمدید مهلت اظهارنامه ۲۰۲۵",
        "description_nl": "Als u niet op tijd kunt indienen, vraag dan uitstel aan voor 1 mei. Uitstel geeft u 5 maanden extra (tot 1 oktober 2026).",
        "description_en": "If you cannot file by 1 May, request an extension before the deadline. This gives you 5 extra months (until 1 October 2026).",
        "description_fa": "اگر نمی‌توانید تا ۱ مه ارسال کنید، قبل از مهلت تمدید بخواهید. تمدید ۵ ماه اضافه می‌دهد.",
        "category": "income_tax",
        "user_types": ["zzp"],
        "tax_year": 2026,
        "due_date": "2026-04-24",
        "reminder_offsets": [14, 7],
        "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/aangifte_doen/uitstel_aangifte",
        "action_type": "file_return",
    },
    {
        "title_nl": "Bezwaartermijn aanslag 2025",
        "title_en": "Objection window for 2025 tax assessment",
        "title_fa": "مهلت اعتراض به برگ مالیاتی ۲۰۲۵",
        "description_nl": "Na ontvangst van uw aanslag 2025 heeft u 6 weken om bezwaar te maken als u het er niet mee eens bent.",
        "description_en": "After receiving your 2025 tax assessment, you have 6 weeks to file an objection (bezwaar) if you disagree.",
        "description_fa": "پس از دریافت برگ مالیاتی ۲۰۲۵، ۶ هفته فرصت دارید اعتراض کنید.",
        "category": "income_tax",
        "user_types": ["zzp"],
        "tax_year": 2026,
        "due_date": "2026-10-01",
        "reminder_offsets": [7],
        "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/aangifte_doen/na_aangifte_doen",
        "action_type": "review_rule",
    },

    # ── Toeslagen (T4-2) ────────────────────────────────────────────────────
    {
        "title_nl": "Zorgtoeslag: controleer uw inkomen",
        "title_en": "Zorgtoeslag: check your income eligibility",
        "title_fa": "Zorgtoeslag: درآمد واجد شرایط را بررسی کنید",
        "description_nl": "Als uw inkomen in 2026 boven €40.857 (alleenstaand) uitkomt, heeft u geen recht meer op zorgtoeslag. Wijzig uw inkomenschatting via Mijn Toeslagen.",
        "description_en": "If your 2026 income exceeds €40,857 (single), you lose all zorgtoeslag — even €1 over = €0. Update your income estimate via Mijn Toeslagen.",
        "description_fa": "اگر درآمد ۲۰۲۶ شما از €۴۰٬۸۵۷ (مجرد) بیشتر شود، کل zorgtoeslag را از دست می‌دهید. تخمین درآمد را به‌روز کنید.",
        "category": "toeslagen",
        "user_types": ["zzp"],
        "tax_year": 2026,
        "due_date": "2026-06-01",
        "reminder_offsets": [14],
        "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/toeslagen/zorgtoeslag",
        "action_type": "update_income",
    },
    {
        "title_nl": "Huurtoeslag: 2026 hervorming",
        "title_en": "Huurtoeslag: 2026 reform — no rent ceiling",
        "title_fa": "Huurtoeslag: اصلاحات ۲۰۲۶ — سقف اجاره حذف شد",
        "description_nl": "In 2026 is het huurprijsplafond voor huurtoeslag afgeschaft. Controleer of u nu in aanmerking komt als u eerder buiten de boot viel.",
        "description_en": "In 2026 the rent ceiling for huurtoeslag was abolished. Check your eligibility if you were previously excluded due to high rent.",
        "description_fa": "در ۲۰۲۶ سقف اجاره برای huurtoeslag حذف شد. اگر قبلاً واجد شرایط نبودید، مجدداً بررسی کنید.",
        "category": "toeslagen",
        "user_types": ["zzp"],
        "tax_year": 2026,
        "due_date": "2026-03-01",
        "reminder_offsets": [7],
        "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/toeslagen/huurtoeslag",
        "action_type": "check_eligibility",
    },
    {
        "title_nl": "Toeslagen definitief stopzetten voor belastingjaar 2025",
        "title_en": "Finalise toeslagen for tax year 2025",
        "title_fa": "نهایی‌سازی toeslagen برای سال مالیاتی ۲۰۲۵",
        "description_nl": "Vóór 1 september 2026 kunt u uw definitieve toeslag voor 2025 aanvragen of bijstellen.",
        "description_en": "By 1 September 2026, you can request or adjust your final toeslagen for 2025.",
        "description_fa": "تا ۱ سپتامبر ۲۰۲۶ می‌توانید toeslagen نهایی ۲۰۲۵ را درخواست یا اصلاح کنید.",
        "category": "toeslagen",
        "user_types": ["zzp"],
        "tax_year": 2026,
        "due_date": "2026-09-01",
        "reminder_offsets": [30, 14],
        "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/toeslagen",
        "action_type": "file_return",
    },

    # ── ZZP admin (T4-3) ────────────────────────────────────────────────────
    {
        "title_nl": "Urencriterium: Q4 waarschuwing",
        "title_en": "Urencriterium: Q4 warning — check your hour count",
        "title_fa": "urencriterium: هشدار فصل چهارم — ساعات کاری را بررسی کنید",
        "description_nl": "U heeft 1.225 uur nodig voor de zelfstandigenaftrek. Als u in oktober nog onder de 900 uur zit, is het risico groot dat u de eis niet haalt. Houd een urenregistratie bij.",
        "description_en": "You need 1,225 hours for the zelfstandigenaftrek. If you are below 900 hours in October, you risk missing the requirement. Keep a time log.",
        "description_fa": "برای zelfstandigenaftrek نیاز به ۱٬۲۲۵ ساعت دارید. اگر در اکتبر زیر ۹۰۰ ساعت باشید، ریسک از دست دادن آن را دارید.",
        "category": "zzp_admin",
        "user_types": ["zzp"],
        "tax_year": 2026,
        "due_date": "2026-10-01",
        "reminder_offsets": [7],
        "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/inkomstenbelasting/ondernemers_en_inkomstenbelasting/zelfstandigenaftrek",
        "action_type": "log_hours",
    },
    {
        "title_nl": "Jaar-einde checklist ZZP",
        "title_en": "ZZP year-end checklist",
        "title_fa": "چک‌لیست پایان سال ZZP",
        "description_nl": "November: controleer uw aftrekposten, KIA-investeringen, voorlopige aanslag en cashflow voor het belastingseizoen.",
        "description_en": "November: review your deductions, KIA investments, voorlopige aanslag and cashflow for the tax season.",
        "description_fa": "نوامبر: کسورات، سرمایه‌گذاری‌های KIA، voorlopige aanslag و جریان نقدی را برای فصل مالیاتی بررسی کنید.",
        "category": "zzp_admin",
        "user_types": ["zzp"],
        "tax_year": 2026,
        "due_date": "2026-11-01",
        "reminder_offsets": [7],
        "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/inkomstenbelasting/ondernemers_en_inkomstenbelasting",
        "action_type": "review_deadline",
    },
    {
        "title_nl": "Kwartaal onkostenregistratie",
        "title_en": "Quarterly expense log check",
        "title_fa": "بررسی ثبت هزینه‌های فصل",
        "description_nl": "Controleer of alle zakelijke kosten van dit kwartaal zijn geregistreerd in uw boekhouding.",
        "description_en": "Make sure all business expenses for this quarter are logged in your accounting records.",
        "description_fa": "اطمینان حاصل کنید که تمام هزینه‌های تجاری این فصل در حسابداری ثبت شده‌اند.",
        "category": "zzp_admin",
        "user_types": ["zzp"],
        "tax_year": 2026,
        "due_date": "2026-04-01",
        "recurrence": "quarterly",
        "reminder_offsets": [7],
        "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/administratie_bijhouden",
        "action_type": "log_expenses",
    },

    # ── Voorlopige aanslag (T4-4) ────────────────────────────────────────────
    {
        "title_nl": "Vraag voorlopige aanslag aan",
        "title_en": "Request voorlopige aanslag (provisional assessment)",
        "title_fa": "درخواست voorlopige aanslag (ارزیابی موقت)",
        "description_nl": "Als u meer dan €500 belasting verwacht te betalen, kunt u een voorlopige aanslag aanvragen om de last te spreiden over maandelijkse termijnen. Dit is gratis.",
        "description_en": "If you expect to pay more than €500 in tax, request a voorlopige aanslag to spread the payment over monthly instalments. This is free.",
        "description_fa": "اگر انتظار دارید بیش از €۵۰۰ مالیات بپردازید، درخواست voorlopige aanslag کنید تا پرداخت را در اقساط ماهانه تقسیم کنید. رایگان است.",
        "category": "provisional_assessment",
        "user_types": ["zzp"],
        "tax_year": 2026,
        "due_date": "2026-02-15",
        "reminder_offsets": [14, 7],
        "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/aangifte_doen/voorlopige_aanslag",
        "action_type": "pay_tax",
    },
    {
        "title_nl": "Voorlopige aanslag herzien bij inkomenswijziging",
        "title_en": "Revise voorlopige aanslag after income change",
        "title_fa": "تجدید نظر در voorlopige aanslag پس از تغییر درآمد",
        "description_nl": "Als uw inkomen dit jaar significant verschilt van de raming, pas dan uw voorlopige aanslag aan om ineens veel bijbetalen of terugkrijgen te voorkomen.",
        "description_en": "If your income changed significantly from the estimate, revise your voorlopige aanslag to avoid a large year-end bill or refund.",
        "description_fa": "اگر درآمدتان به طور قابل توجهی از برآورد تفاوت دارد، voorlopige aanslag را اصلاح کنید تا از پرداخت یکجا در پایان سال جلوگیری کنید.",
        "category": "provisional_assessment",
        "user_types": ["zzp"],
        "tax_year": 2026,
        "due_date": "2026-07-01",
        "reminder_offsets": [7],
        "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/aangifte_doen/voorlopige_aanslag",
        "action_type": "update_income",
    },

    {
        "title_nl": "Box 3 peildatum 1 januari",
        "title_en": "Box 3 reference date: 1 January",
        "title_fa": "تاریخ مرجع باکس ۳: ۱ ژانویه",
        "description_nl": "De peildatum voor Box 3 is 1 januari. Uw vermogen op die dag bepaalt de belasting. Zorg dat hoge spaarstanden niet onnodig op de peildatum staan.",
        "description_en": "The Box 3 reference date is 1 January. Your assets on that day determine the tax. Make sure large cash balances are not unnecessarily high on the reference date.",
        "description_fa": "تاریخ مرجع باکس ۳ اول ژانویه است. دارایی شما در آن روز مالیات را تعیین می‌کند. مطمئن شوید موجودی‌های بالا در آن تاریخ اضافی نباشند.",
        "category": "box3",
        "user_types": ["zzp"],
        "tax_year": 2026,
        "due_date": "2026-12-20",
        "reminder_offsets": [14, 7],
        "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/vermogen_en_belasting",
        "action_type": "review_rule",
    },
]


class Command(BaseCommand):
    help = "Seed 2026 TaxReminder records (BTW, IB, toeslagen, ZZP admin, voorlopige aanslag)"

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Delete existing 2026 reminders before seeding")

    def handle(self, *args, **options):
        if options["reset"]:
            deleted, _ = TaxReminder.objects.filter(tax_year=2026).delete()
            self.stdout.write(f"Deleted {deleted} existing 2026 reminders")

        created = 0
        updated = 0
        for data in REMINDERS:
            obj, was_created = TaxReminder.objects.update_or_create(
                title_en=data["title_en"],
                tax_year=data["tax_year"],
                defaults=data,
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(
            f"Done — {created} created, {updated} updated ({len(REMINDERS)} total reminders)"
        ))
