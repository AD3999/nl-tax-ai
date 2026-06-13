// tw-landing.jsx — TaxWijs Landing Page
const {useState,useEffect,useRef}=React;

const LT={
  en:{nav:{features:'Features',pricing:'Pricing',signin:'Sign in',cta:'Start free'},
    hero:{badge:'AI TAX ASSISTANT · NETHERLANDS · 2026',h1a:'Your Dutch taxes,',h1b:'handled by AI.',sub:'Verified tax rules for ZZP, employees, expats and DGAs — calculated, not estimated. Ask anything in Dutch, English or Farsi.',cta1:'Start for free',cta2:'Try the AI chat',t1:'28 rules verified',t2:'Source on every answer',t3:'No account needed'},
    social:'Trusted by freelancers, expats and 40+ accounting firms across the Netherlands',
    stats:[['12,400+','Active users'],['€4.2M','Tax saved in 2025'],['28','Verified tax rules'],['98%','Calculation accuracy']],
    feat:{label:'THE PLATFORM',title:'Everything for your Dutch tax return',sub:'One intelligent platform that replaces guesswork, spreadsheets and expensive advisors.',
      items:[{ic:'chat',title:'AI Tax Chat',sub:'Ask any tax question in plain language. Get sourced, accurate answers in seconds — in Dutch, English or Farsi.'},{ic:'calc',title:'Tax Calculator',sub:'Precise Box 1, 2 & 3 calculations with your real numbers. Covers ZZP, DGA and the 30% expat ruling.'},{ic:'check',title:'Deduction Checker',sub:'Find every deduction you qualify for in under 60 seconds. Never leave money on the table again.'},{ic:'globe',title:'Expat Guide',sub:'30% ruling, your first IB return, zorgtoeslag and DigiD — your complete relocation tax toolkit.'},{ic:'grid',title:'Smart Dashboard',sub:'A proactive overview of deadlines, savings opportunities and AI recommendations tailored to you.'},{ic:'users',title:'Accountant Portal',sub:'Manage every client, document and engagement in one enterprise-grade workspace built for advisors.'}]},
    chatShow:{label:'AI ASSISTANT',title:'An advisor that never sleeps',sub:'Every answer is grounded in official belastingdienst.nl rules — with the source attached, so you can trust it.',
      pts:[['Sourced answers','Each response cites the exact tax rule and article it relies on.'],['Save to dashboard','Turn any answer into a tracked task or saved calculation in one click.'],['Three languages','Switches seamlessly between Dutch, English and Persian mid-conversation.']]},
    dashShow:{label:'DASHBOARD',title:'Know exactly where you stand',sub:'A financial-grade overview that tells you what needs attention, what you could save, and what is coming up — before the deadline does.'},
    acctShow:{label:'FOR ACCOUNTANTS',title:'Built for the firms that do this all day',sub:'Risk indicators, client workflows, document vaults and engagement tracking — the enterprise tools advisors actually need.',
      pts:['Unlimited client management','Automated risk flagging','Secure document exchange','White-label tax reports']},
    testi:{label:'TESTIMONIALS',title:'Loved by people who hate tax season',items:[{q:'Finally a tool that explains Dutch tax in plain English. It found €2,400 in deductions on my first ZZP return that I would have missed entirely.',n:'Sarah Klein',r:'Freelance Designer · Amsterdam'},{q:'The 30% ruling calculator is exactly right. I wish I had this the day I moved to the Netherlands instead of paying an advisor €600.',n:'Priya Menon',r:'Software Engineer · Expat from India'},{q:'I run TaxWijs for all my clients now. The accountant portal saves me roughly three hours per client, every single year.',n:'Jan Vermeulen',r:'Tax Consultant · Rotterdam'}]},
    price:{label:'PRICING',title:'Simple, honest pricing',sub:'Start free. Upgrade when you need more. Cancel anytime.',mo:'Monthly',yr:'Annual',save:'Save 20%'},
    faq:{label:'FAQ',title:'Questions, answered',items:[{q:'Is TaxWijs an official tax service?',a:'No. TaxWijs is an AI assistant that cites official belastingdienst.nl sources to help you understand and prepare your taxes. For complex situations we always recommend verifying with a registered advisor.'},{q:'Which languages are supported?',a:'Dutch, English and Persian (Farsi). The AI chat detects your language automatically and replies in the same one — and you can switch mid-conversation.'},{q:'How accurate are the calculations?',a:'Our rule set is updated quarterly from official government sources. For the 2026 tax year we cover all major Box 1, 2 and 3 scenarios with 98%+ accuracy on standard cases.'},{q:'Do I need to create an account?',a:'No account is required for basic chat and calculations. Creating one lets you save results, track your history and use the proactive dashboard.'},{q:'Can I use TaxWijs for my clients?',a:'Yes. The Accountant plan gives you a dedicated portal to manage unlimited clients, exchange documents securely and track every engagement in one place.'}]},
    fcta:{title:'File your 2026 return with confidence',sub:'Start free · No account needed · Cancel anytime',b1:'Get started free',b2:'Book a demo'},
    foot:{tag:'AI tax assistant for the Netherlands',cols:[['Product',['Features','Pricing','AI Chat','Calculator','Changelog']],['Company',['About','Careers','Blog','Press']],['Legal',['Privacy','Terms','Disclaimer','Cookies']]],note:'TaxWijs is an AI assistant and not an official tax service provider. Always verify with a registered advisor for complex cases.'}},
  nl:{nav:{features:'Functies',pricing:'Prijzen',signin:'Inloggen',cta:'Gratis beginnen'},
    hero:{badge:'AI BELASTINGASSISTENT · NEDERLAND · 2026',h1a:'Uw Nederlandse belasting,',h1b:'afgehandeld door AI.',sub:'Geverifieerde belastingregels voor ZZP, werknemers, expats en DGA\'s — berekend, niet geschat. Vraag alles in het Nederlands, Engels of Farsi.',cta1:'Gratis beginnen',cta2:'Probeer de AI-chat',t1:'28 regels geverifieerd',t2:'Bron bij elk antwoord',t3:'Geen account nodig'},
    social:'Vertrouwd door freelancers, expats en 40+ accountantskantoren in Nederland',
    stats:[['12.400+','Actieve gebruikers'],['€4,2M','Bespaard in 2025'],['28','Geverifieerde regels'],['98%','Nauwkeurigheid']],
    feat:{label:'HET PLATFORM',title:'Alles voor uw Nederlandse aangifte',sub:'Eén intelligent platform dat giswerk, spreadsheets en dure adviseurs vervangt.',
      items:[{ic:'chat',title:'AI Belastingchat',sub:'Stel elke belastingvraag in gewone taal. Krijg direct accurate antwoorden met bronvermelding — in NL, EN of FA.'},{ic:'calc',title:'Belastingcalculator',sub:'Nauwkeurige Box 1, 2 & 3 berekeningen met uw echte cijfers. Inclusief ZZP, DGA en de 30%-regeling.'},{ic:'check',title:'Aftrekpostenchecker',sub:'Vind in 60 seconden alle aftrekposten waar u recht op heeft. Laat nooit meer geld liggen.'},{ic:'globe',title:'Expat Gids',sub:'30%-regeling, uw eerste IB-aangifte, zorgtoeslag en DigiD — uw complete verhuisbelastingkit.'},{ic:'grid',title:'Slim Dashboard',sub:'Een proactief overzicht van deadlines, besparingskansen en AI-aanbevelingen op maat.'},{ic:'users',title:'Accountantsportaal',sub:'Beheer elke klant, document en opdracht in één werkomgeving van enterprise-niveau.'}]},
    chatShow:{label:'AI ASSISTENT',title:'Een adviseur die nooit slaapt',sub:'Elk antwoord is gebaseerd op officiële regels van belastingdienst.nl — met de bron erbij, zodat u erop kunt vertrouwen.',
      pts:[['Antwoorden met bron','Elk antwoord citeert de exacte belastingregel en het artikel.'],['Opslaan op dashboard','Maak van elk antwoord met één klik een taak of opgeslagen berekening.'],['Drie talen','Schakelt naadloos tussen Nederlands, Engels en Perzisch.']]},
    dashShow:{label:'DASHBOARD',title:'Weet precies waar u staat',sub:'Een overzicht van financieel niveau dat u vertelt wat aandacht nodig heeft, wat u kunt besparen en wat eraan komt — vóór de deadline.'},
    acctShow:{label:'VOOR ACCOUNTANTS',title:'Gebouwd voor kantoren die dit dagelijks doen',sub:'Risico-indicatoren, klantworkflows, documentkluizen en opdrachtbeheer — de enterprise-tools die adviseurs echt nodig hebben.',
      pts:['Onbeperkt klantbeheer','Automatische risicosignalering','Veilige documentuitwisseling','White-label rapporten']},
    testi:{label:'ERVARINGEN',title:'Geliefd bij wie het aangifteseizoen haat',items:[{q:'Eindelijk een tool die Nederlandse belasting in gewone taal uitlegt. Vond €2.400 aan aftrekposten bij mijn eerste ZZP-aangifte die ik anders had gemist.',n:'Sarah Klein',r:'Freelance Designer · Amsterdam'},{q:'De 30%-regelingcalculator klopt precies. Had ik dit maar gehad toen ik naar Nederland verhuisde.',n:'Priya Menon',r:'Software Engineer · Expat'},{q:'Ik gebruik TaxWijs nu voor al mijn klanten. Het portaal bespaart me zo\'n drie uur per klant, elk jaar.',n:'Jan Vermeulen',r:'Belastingadviseur · Rotterdam'}]},
    price:{label:'PRIJZEN',title:'Eenvoudige, eerlijke prijzen',sub:'Begin gratis. Upgrade wanneer u meer nodig heeft. Altijd opzegbaar.',mo:'Maandelijks',yr:'Jaarlijks',save:'20% korting'},
    faq:{label:'FAQ',title:'Vragen, beantwoord',items:[{q:'Is TaxWijs een officiële belastingdienst?',a:'Nee. TaxWijs is een AI-assistent die officiële bronnen van belastingdienst.nl citeert om u te helpen uw belasting te begrijpen. Voor complexe situaties raden we altijd aan een geregistreerd adviseur te raadplegen.'},{q:'Welke talen worden ondersteund?',a:'Nederlands, Engels en Perzisch (Farsi). De AI detecteert uw taal automatisch en antwoordt in dezelfde taal.'},{q:'Hoe nauwkeurig zijn de berekeningen?',a:'Onze regelset wordt driemaandelijks bijgewerkt vanuit officiële overheidsbronnen. Voor 2026 dekken we alle Box 1, 2 en 3 scenario\'s met 98%+ nauwkeurigheid.'},{q:'Heb ik een account nodig?',a:'Geen account nodig voor basis chat en berekeningen. Met een account kunt u resultaten opslaan en het dashboard gebruiken.'},{q:'Kan ik TaxWijs voor mijn klanten gebruiken?',a:'Ja. Het Accountantsplan geeft u een portaal om onbeperkt klanten te beheren en documenten veilig uit te wisselen.'}]},
    fcta:{title:'Doe uw 2026-aangifte met vertrouwen',sub:'Gratis te proberen · Geen account · Altijd opzegbaar',b1:'Gratis beginnen',b2:'Demo boeken'},
    foot:{tag:'AI belastingassistent voor Nederland',cols:[['Product',['Functies','Prijzen','AI Chat','Calculator','Wijzigingen']],['Bedrijf',['Over ons','Vacatures','Blog','Pers']],['Juridisch',['Privacy','Voorwaarden','Disclaimer','Cookies']]],note:'TaxWijs is een AI-assistent en geen officiële belastingdienst. Verifieer complexe gevallen altijd bij een geregistreerd adviseur.'}},
  fa:{nav:{features:'امکانات',pricing:'قیمت‌ها',signin:'ورود',cta:'شروع رایگان'},
    hero:{badge:'دستیار مالیاتی هوش مصنوعی · هلند · ۲۰۲۶',h1a:'مالیات هلند شما،',h1b:'با هوش مصنوعی.',sub:'قوانین مالیاتی تأییدشده برای ZZP، کارمندان، مهاجران و DGA — محاسبه‌شده، نه تخمینی. هر سوالی را به هلندی، انگلیسی یا فارسی بپرسید.',cta1:'شروع رایگان',cta2:'چت هوش مصنوعی',t1:'۲۸ قانون تأییدشده',t2:'منبع برای هر پاسخ',t3:'بدون نیاز به حساب'},
    social:'مورد اعتماد فریلنسرها، مهاجران و بیش از ۴۰ شرکت حسابداری در سراسر هلند',
    stats:[['+۱۲٬۴۰۰','کاربر فعال'],['€۴٫۲M','صرفه‌جویی ۲۰۲۵'],['۲۸','قانون تأییدشده'],['۹۸٪','دقت محاسبه']],
    feat:{label:'پلتفرم',title:'همه چیز برای اظهارنامه مالیاتی هلند',sub:'یک پلتفرم هوشمند که حدس و گمان، صفحات گسترده و مشاوران گران‌قیمت را جایگزین می‌کند.',
      items:[{ic:'chat',title:'چت مالیاتی AI',sub:'هر سوال مالیاتی را به زبان ساده بپرسید. پاسخ دقیق با منبع در چند ثانیه دریافت کنید.'},{ic:'calc',title:'ماشین حساب مالیاتی',sub:'محاسبات دقیق باکس ۱، ۲ و ۳ با اعداد واقعی شما. شامل ZZP، DGA و قانون ۳۰٪.'},{ic:'check',title:'بررسی کسورات',sub:'در کمتر از ۶۰ ثانیه همه کسورات واجد شرایط را پیدا کنید.'},{ic:'globe',title:'راهنمای مهاجران',sub:'قانون ۳۰٪، اولین اظهارنامه IB، zorgtoeslag و DigiD.'},{ic:'grid',title:'داشبورد هوشمند',sub:'نمای کلی فعال از مهلت‌ها، فرصت‌های صرفه‌جویی و توصیه‌های AI.'},{ic:'users',title:'پورتال حسابداری',sub:'مدیریت هر مشتری، سند و پروژه در یک فضای کاری در سطح سازمانی.'}]},
    chatShow:{label:'دستیار AI',title:'مشاوری که هرگز نمی‌خوابد',sub:'هر پاسخ بر اساس قوانین رسمی belastingdienst.nl است — با منبع پیوست‌شده.',
      pts:[['پاسخ با منبع','هر پاسخ قانون و ماده دقیق مالیاتی را ذکر می‌کند.'],['ذخیره در داشبورد','هر پاسخ را با یک کلیک به یک وظیفه یا محاسبه تبدیل کنید.'],['سه زبان','به‌طور یکپارچه بین هلندی، انگلیسی و فارسی جابه‌جا می‌شود.']]},
    dashShow:{label:'داشبورد',title:'دقیقاً بدانید کجا هستید',sub:'نمایی در سطح مالی که به شما می‌گوید چه چیزی نیاز به توجه دارد، چقدر می‌توانید صرفه‌جویی کنید و چه چیزی در پیش است.'},
    acctShow:{label:'برای حسابداران',title:'ساخته‌شده برای شرکت‌هایی که هر روز این کار را می‌کنند',sub:'شاخص‌های ریسک، گردش کار مشتری، گاوصندوق اسناد و پیگیری پروژه — ابزارهای سازمانی که مشاوران واقعاً نیاز دارند.',
      pts:['مدیریت نامحدود مشتری','علامت‌گذاری خودکار ریسک','تبادل امن اسناد','گزارش‌های white-label']},
    testi:{label:'نظرات',title:'محبوب کسانی که از فصل مالیات متنفرند',items:[{q:'بالاخره ابزاری که مالیات هلند را به زبان ساده توضیح می‌دهد. در اولین اظهارنامه ZZP من €۲٬۴۰۰ کسورات پیدا کرد.',n:'سارا کلاین',r:'طراح فریلنس · آمستردام'},{q:'ماشین حساب قانون ۳۰٪ دقیقاً درست است. کاش وقتی به هلند آمدم این را داشتم.',n:'پریا منون',r:'مهندس نرم‌افزار · مهاجر'},{q:'حالا TaxWijs را برای همه مشتریانم استفاده می‌کنم. پورتال سالانه حدود سه ساعت در هر مشتری صرفه‌جویی می‌کند.',n:'یان ورمولن',r:'مشاور مالیاتی · روتردام'}]},
    price:{label:'قیمت‌ها',title:'قیمت‌گذاری ساده و صادقانه',sub:'رایگان شروع کنید. هر وقت نیاز داشتید ارتقا دهید.',mo:'ماهانه',yr:'سالانه',save:'۲۰٪ تخفیف'},
    faq:{label:'سوالات متداول',title:'پاسخ به سوالات',items:[{q:'آیا TaxWijs یک سرویس مالیاتی رسمی است؟',a:'خیر. TaxWijs یک دستیار AI است که منابع رسمی belastingdienst.nl را ذکر می‌کند. برای موارد پیچیده همیشه مشاوره با یک مشاور ثبت‌شده را توصیه می‌کنیم.'},{q:'چه زبان‌هایی پشتیبانی می‌شوند؟',a:'هلندی، انگلیسی و فارسی. AI زبان شما را تشخیص داده و به همان زبان پاسخ می‌دهد.'},{q:'محاسبات چقدر دقیق هستند؟',a:'مجموعه قوانین ما هر سه ماه از منابع رسمی دولت بروزرسانی می‌شود. برای سال ۲۰۲۶ تمام سناریوهای باکس ۱، ۲ و ۳ را پوشش می‌دهیم.'},{q:'آیا به حساب کاربری نیاز دارم؟',a:'برای چت و محاسبات پایه نیازی به حساب نیست.'},{q:'می‌توانم TaxWijs را برای مشتریانم استفاده کنم؟',a:'بله. پلن حسابدار یک پورتال اختصاصی برای مدیریت نامحدود مشتری به شما می‌دهد.'}]},
    fcta:{title:'اظهارنامه ۲۰۲۶ خود را با اطمینان تکمیل کنید',sub:'شروع رایگان · بدون نیاز به حساب · لغو در هر زمان',b1:'شروع رایگان',b2:'رزرو دمو'},
    foot:{tag:'دستیار مالیاتی هوش مصنوعی برای هلند',cols:[['محصول',['امکانات','قیمت‌ها','چت AI','ماشین حساب','تغییرات']],['شرکت',['درباره ما','مشاغل','وبلاگ','مطبوعات']],['قانونی',['حریم خصوصی','شرایط','سلب مسئولیت','کوکی‌ها']]],note:'TaxWijs یک دستیار AI است و یک سرویس مالیاتی رسمی نیست. برای موارد پیچیده همیشه با یک مشاور ثبت‌شده تأیید کنید.'}},
};

window.LT=LT;

// ── Section heading ──────────────────────────────────────────────────────────
function SecHead({label,title,sub,center}){
  return(
    <div style={{textAlign:center?'center':'start',maxWidth:center?640:560,margin:center?'0 auto':0,marginBottom:48}}>
      <div className="eyebrow eyebrow-blue" style={{marginBottom:12}}>{label}</div>
      <h2 style={{fontSize:'clamp(1.7rem,3.4vw,2.4rem)',fontWeight:800,letterSpacing:'-0.03em',lineHeight:1.12,color:'var(--text)',margin:0}}>{title}</h2>
      {sub&&<p style={{marginTop:14,fontSize:'var(--text-md)',lineHeight:1.65,color:'var(--text-2)'}}>{sub}</p>}
    </div>
  );
}

// ── Reveal-on-scroll wrapper ──────────────────────────────────────────────────
function Reveal({children,delay=0,style}){
  const ref=useRef(null);
  const [vis,setVis]=useState(false);
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    const io=new IntersectionObserver(([e])=>{if(e.isIntersecting){setVis(true);io.disconnect();}},{threshold:0.12});
    io.observe(el);return()=>io.disconnect();
  },[]);
  return <div ref={ref} style={{opacity:vis?1:0,transform:vis?'translateY(0)':'translateY(24px)',transition:`opacity .55s ease ${delay}s, transform .55s cubic-bezier(.16,1,.3,1) ${delay}s`,...style}}>{children}</div>;
}
window.Reveal=Reveal;
window.SecHead=SecHead;
