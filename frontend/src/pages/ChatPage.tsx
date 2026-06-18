import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { sendMessage, type ExplainAlert } from "../api/chat";
import { ANON_SESSION_LIMIT } from "../api/client";
import { useAuth } from "../context/AuthContext";
import UpgradeModal from "../components/UpgradeModal";
import { Icon } from "../components/Icon";
import { useMobile } from "../hooks/useMobile";
import { useToast } from "../context/ToastContext";
import { Skeleton } from "../components/Skeleton";
import { printIBReport, type IBAnswers } from "../utils/ibReport";
import TrustStrip from "../components/TrustStrip";

const SOURCE_CHIP_COLORS: Record<string, string> = {
  Profile:             "var(--blue)",
  Documents:           "var(--purple, #7c3aed)",
  Rules:               "var(--ok)",
  Engagement:          "var(--warn)",
  "Accountant Review": "var(--danger)",
};

function ContextSourceChips({ sources }: { sources: string[] }) {
  if (sources.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--hairline)" }}>
      {sources.map(src => (
        <span key={src} style={{
          fontSize: "var(--text-xs)", fontWeight: 600, padding: "2px 8px", borderRadius: 999,
          background: "var(--paper-3)",
          color: SOURCE_CHIP_COLORS[src] ?? "var(--ink-3)",
          border: `1px solid ${SOURCE_CHIP_COLORS[src] ?? "var(--hairline-2)"}`,
        }}>
          {src}
        </span>
      ))}
    </div>
  );
}

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  isIntake?: boolean;
  isIBResult?: boolean;
  isSavePrompt?: boolean;
  saveProfileData?: Record<string, unknown>;
}

const SIM_CHIP_LABEL: Record<string, string> = {
  nl: "Belastingsimulatie 2026",
  en: "Tax Simulation 2026",
  fa: "شبیه‌سازی مالیاتی ۲۰۲۶",
};

const SIM_TRIGGER: Record<string, string> = {
  nl: "Bereken mijn geschatte belasting voor 2026",
  en: "Calculate my estimated 2026 Dutch taxes",
  fa: "مالیات تخمینی ۲۰۲۶ من را محاسبه کنید",
};

// First message the AI sends to open the IB return flow
const IB_TRIGGER: Record<string, string> = {
  nl: "Ik wil mijn aangifte inkomstenbelasting 2025 doen",
  en: "I want to complete my 2025 income tax return (aangifte)",
  fa: "می‌خواهم اظهارنامه مالیاتی ۲۰۲۵ خود را تکمیل کنم",
};

const IB_CHIP_LABEL: Record<string, string> = {
  nl: "Aangifte doen 2025",
  en: "Start IB Return 2025",
  fa: "شروع اظهارنامه ۲۰۲۵",
};

const RESULT_QUESTIONS: Record<string, Record<string, { q: string; tag: string }[]>> = {
  zzp: {
    nl: [
      { q: "Leg mijn totale belastingrekening uit in eenvoudige woorden", tag: "Overzicht" },
      { q: "Waarom betaal ik ZVW-bijdrage en hoeveel is dat precies?",   tag: "ZVW" },
      { q: "Hoeveel moet ik elke maand opzij zetten voor de belasting?",  tag: "Cashflow" },
      { q: "Wat zijn mijn risico's voor Wet DBA?",                       tag: "Compliance" },
      { q: "Hoe heeft de zelfstandigenaftrek mijn belasting verlaagd?",  tag: "Aftrek" },
      { q: "Hoe werkt de MKB-winstvrijstelling bij mijn winst?",         tag: "Aftrek" },
    ],
    en: [
      { q: "Explain my total tax bill in simple words",                  tag: "Overview" },
      { q: "Why do I pay ZVW and exactly how much is it?",               tag: "ZVW" },
      { q: "How much should I set aside each month for taxes?",          tag: "Cashflow" },
      { q: "What is my Wet DBA risk level?",                             tag: "Compliance" },
      { q: "How did the self-employed deduction reduce my tax?",         tag: "Deduction" },
      { q: "How does the 12.7% SME profit exemption work?",             tag: "Deduction" },
    ],
    fa: [
      { q: "مجموع مالیات من را به زبان ساده توضیح دهید",              tag: "خلاصه" },
      { q: "چرا ZVW می‌پردازم و دقیقاً چقدر است؟",                   tag: "ZVW" },
      { q: "هر ماه چقدر باید برای مالیات کنار بگذارم؟",               tag: "جریان نقدی" },
      { q: "سطح ریسک Wet DBA من چقدر است؟",                          tag: "انطباق" },
      { q: "کسر کارآفرینی چگونه مالیات من را کاهش داده است؟",        tag: "کسر" },
      { q: "معافیت سود ۱۲.۷٪ چگونه اعمال می‌شود؟",                  tag: "کسر" },
    ],
  },
  employee: {
    nl: [
      { q: "Leg mijn belastingberekening uit in eenvoudige woorden",     tag: "Overzicht" },
      { q: "Wat is mijn effectieve belastingtarief?",                    tag: "Tarief" },
      { q: "Hoe werkt de arbeidskorting in mijn situatie?",              tag: "Korting" },
      { q: "Heb ik recht op zorgtoeslag met mijn inkomen?",              tag: "Toeslag" },
      { q: "Kom ik in aanmerking voor de IACK als ik kinderen heb?",     tag: "IACK" },
    ],
    en: [
      { q: "Explain my tax calculation in simple words",                 tag: "Overview" },
      { q: "What is my effective tax rate and what does it mean?",       tag: "Rate" },
      { q: "How does the labour tax credit (arbeidskorting) help me?",   tag: "Credit" },
      { q: "Am I entitled to healthcare allowance (zorgtoeslag)?",       tag: "Allowance" },
      { q: "Do I qualify for the childcare credit (IACK) with children?",tag: "IACK" },
    ],
    fa: [
      { q: "محاسبه مالیات من را به زبان ساده توضیح دهید",             tag: "خلاصه" },
      { q: "نرخ مؤثر مالیاتی من چقدر است؟",                          tag: "نرخ" },
      { q: "اعتبار مالیاتی کار (arbeidskorting) چگونه به من کمک می‌کند؟", tag: "اعتبار" },
      { q: "آیا با این درآمد مشمول کمک هزینه مراقبت بهداشتی می‌شوم؟", tag: "کمک هزینه" },
    ],
  },
  expat: {
    nl: [
      { q: "Hoe beïnvloedt de 30%-regeling mijn belasting dit jaar?",   tag: "30%-regeling" },
      { q: "Leg mijn totale belastingrekening uit",                      tag: "Overzicht" },
      { q: "Wat verandert er in jaar 4 en 5 van de 30%-regeling?",      tag: "Fase-out" },
      { q: "Hoe werkt de arbeidskorting bij een 30%-regeling?",         tag: "Korting" },
    ],
    en: [
      { q: "How does the 30% ruling affect my tax this year?",          tag: "30% ruling" },
      { q: "Explain my total tax bill in simple words",                 tag: "Overview" },
      { q: "What changes in year 4 and 5 of the 30% ruling?",          tag: "Phase-out" },
      { q: "How does the labour tax credit apply with the 30% ruling?", tag: "Credit" },
    ],
    fa: [
      { q: "قانون ۳۰٪ چگونه مالیات من را تحت تأثیر قرار می‌دهد؟",  tag: "قانون ۳۰٪" },
      { q: "مجموع مالیات من را توضیح دهید",                          tag: "خلاصه" },
      { q: "در سال ۴ و ۵ قانون ۳۰٪ چه تغییری ایجاد می‌شود؟",       tag: "مرحله‌بندی" },
    ],
  },
  dga: {
    nl: [
      { q: "Leg het verschil uit tussen mijn Box 1 en Box 2 belasting", tag: "Box 1/2" },
      { q: "Waarom betaal ik dividendbelasting en hoeveel is dat?",      tag: "Dividend" },
      { q: "Leg mijn totale belastingrekening uit in eenvoudige woorden",tag: "Overzicht" },
      { q: "Wat is de minimum DGA-salarisverplichting voor 2026?",       tag: "Salaris" },
    ],
    en: [
      { q: "Explain the difference between my Box 1 and Box 2 tax",     tag: "Box 1/2" },
      { q: "Why do I pay dividend tax and how much is it?",              tag: "Dividend" },
      { q: "Explain my total tax bill in simple words",                  tag: "Overview" },
      { q: "What is the minimum DGA salary requirement for 2026?",       tag: "Salary" },
    ],
    fa: [
      { q: "تفاوت بین مالیات Box 1 و Box 2 من را توضیح دهید",        tag: "باکس ۱/۲" },
      { q: "چرا مالیات سود سهام می‌پردازم و چقدر است؟",              tag: "سود سهام" },
      { q: "مجموع مالیات من را به زبان ساده توضیح دهید",             tag: "خلاصه" },
    ],
  },
};

function getCards(userType: string, lang: string) {
  const byType = RESULT_QUESTIONS[userType] ?? RESULT_QUESTIONS.zzp;
  return byType[lang] ?? byType.en ?? byType.nl ?? [];
}

const USER_TYPE_META: Record<string, { color: string; glyph: string }> = {
  zzp:      { color: "var(--blue)",   glyph: "ZZ" },
  employee: { color: "var(--info)",   glyph: "EM" },
  expat:    { color: "var(--warn)",   glyph: "EX" },
  dga:      { color: "var(--purple)", glyph: "DG" },
};

// Greeting the bot sends when there's no profile — starts the conversational intake
const INTAKE_GREETING: Record<string, string> = {
  nl: "Hallo! Ik ben TaxWijs, uw Nederlandse belastingassistent voor 2026.\n\nOm uw belastingsituatie te berekenen, stel ik u een paar korte vragen.\n\n**Wat is uw werksituatie?**\n- **ZZP** — Freelancer / zelfstandige\n- **Werknemer** — In loondienst\n- **Expat** — Met 30%-regeling\n- **DGA** — Directeur-grootaandeelhouder",
  en: "Hello! I'm TaxWijs, your Dutch tax assistant for 2026.\n\nTo calculate your tax situation, I'll ask you a few quick questions.\n\n**What is your work situation?**\n- **ZZP** — Freelancer / self-employed\n- **Employee** — Salaried employee\n- **Expat** — With 30% ruling\n- **DGA** — Director with own company",
  fa: "سلام! من TaxWijs هستم، دستیار مالیاتی هلندی شما برای سال ۲۰۲۶.\n\nبرای محاسبه وضعیت مالیاتی شما، چند سؤال کوتاه می‌پرسم.\n\n**وضعیت شغلی شما چیست؟**\n- **ZZP** — آزادکار / کارآفرین مستقل\n- **کارمند** — حقوق‌بگیر\n- **مهاجر خارجی** — مشمول قانون ۳۰٪\n- **DGA** — مدیرعامل شرکت",
};

export default function ChatPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const lang = i18n.language as "nl" | "en" | "fa";
  const isRtl = lang === "fa";
  const isMobile = useMobile();

  const { showToast } = useToast();

  const [messages, setMessages]           = useState<ChatMsg[]>([]);
  const [inputText, setInputText]         = useState("");
  const [loading, setLoading]             = useState(false);
  const [sessionCount, setSessionCount]   = useState(0);
  const [askedSet, setAskedSet]           = useState<Set<string>>(new Set());
  const [showCards, setShowCards]         = useState(true);
  const [upgradeModal, setUpgradeModal]   = useState<{ reason: "session_limit" | "daily_limit" | "register" } | null>(null);
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [ibMode, setIbMode]               = useState(false);
  const [ibAnswers, setIbAnswers]         = useState<IBAnswers | null>(null);

  const [simMode, setSimMode]             = useState(false);

  const [profile, setProfile] = useState<Record<string, unknown> | null>(() => {
    try { const r = localStorage.getItem("taxwijs_calc_input"); return r ? JSON.parse(r) : null; }
    catch { return null; }
  });
  const [loadingProfile, setLoadingProfile] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef  = useRef<AbortController | null>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  // Holds the structured alert context passed from Dashboard "Ask AI" button
  const pendingAlertRef = useRef<ExplainAlert | null>(
    (location.state as { explain_alert?: ExplainAlert } | null)?.explain_alert ?? null
  );

  // Per-user history key: logged-in users get their own slot so history survives
  // logout/login. Anonymous users share the generic key (cleared on logout).
  function historyKey(): string {
    const uid = localStorage.getItem("taxwijs_user_id");
    return uid ? `taxwijs_chat_history_u${uid}` : "taxwijs_chat_history";
  }

  function startIntakeGreeting() {
    setMessages([{
      id: "intake-greeting",
      role: "assistant",
      content: INTAKE_GREETING[lang] ?? INTAKE_GREETING.en,
      isIntake: true,
    }]);
  }

  function startSimulation() {
    localStorage.removeItem(historyKey());
    setSimMode(true);
    setIbMode(false);
    setIbAnswers(null);
    setMessages([]);
    void submit(SIM_TRIGGER[lang] ?? SIM_TRIGGER.en, false, false, true);
  }

  // Persist messages to localStorage on every change (strip streaming flag so restore is clean)
  useEffect(() => {
    if (messages.length === 0) return;
    localStorage.setItem(historyKey(), JSON.stringify(messages));
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // On mount: restore history first, then fall through to normal init if nothing saved
  useEffect(() => {
    const locState = location.state as { question?: string; explain_alert?: ExplainAlert; ibReturn?: boolean; simulation?: boolean } | null;
    const q = locState?.question;

    // Auto-start IB return mode if URL param or location state requests it
    const params = new URLSearchParams(location.search);
    if (params.get("mode") === "ib-return" || locState?.ibReturn) {
      setIbMode(true);
      // Clear history and start the IB return flow fresh
      localStorage.removeItem(historyKey());
      setMessages([]);
      void submit(IB_TRIGGER[lang] ?? IB_TRIGGER.en, false, true);
      return;
    }

    // Auto-start simulation mode if URL param or location state requests it
    if (params.get("mode") === "simulation" || locState?.simulation) {
      startSimulation();
      return;
    }

    // 1. Try restoring a previous conversation
    try {
      const raw = localStorage.getItem(historyKey());
      if (raw) {
        const saved = (JSON.parse(raw) as ChatMsg[])
          .map(m => ({ ...m, streaming: false }))   // never restore a streaming state
          .filter(m => m.content.trim().length > 0); // drop any empty partial messages
        if (saved.length > 0) {
          setMessages(saved);
          // Rebuild session count and asked-set from the saved messages
          const userMsgs = saved.filter(m => m.role === "user");
          setSessionCount(userMsgs.length);
          setAskedSet(new Set(userMsgs.map(m => m.content)));
          if (profile) setIntakeComplete(true);
          // An incoming question (e.g. from IB Guide "Ask TaxWijs") must still be
          // submitted even when we're continuing an existing conversation.
          if (q) void submit(q);
          return; // skip normal init — history is restored
        }
      }
    } catch { /* corrupted cache — fall through to normal init */ }

    // 2. Normal init flow (no saved history)
    const stored = localStorage.getItem("taxwijs_calc_input");
    if (stored) {
      if (q) void submit(q);
      return;
    }

    if (user) {
      setLoadingProfile(true);
      const token = localStorage.getItem("access_token");
      fetch("/api/users/profile/", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(r => r.ok ? r.json() as Promise<{ intake_profile?: Record<string, unknown> | null }> : null)
        .then(data => {
          if (data?.intake_profile) {
            localStorage.setItem("taxwijs_calc_input", JSON.stringify(data.intake_profile));
            setProfile(data.intake_profile);
            if (q) void submit(q);
            else startIntakeGreeting();
          } else {
            if (q) void submit(q);
            else startIntakeGreeting();
          }
        })
        .catch(() => { if (q) void submit(q); else startIntakeGreeting(); })
        .finally(() => setLoadingProfile(false));
    } else {
      if (q) void submit(q);
      else startIntakeGreeting();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load DB chat history for authenticated users on a new device (localStorage is empty)
  useEffect(() => {
    if (!user) return;
    if (messages.length > 0) return; // localStorage already restored or intake greeting shown
    if (ibMode || simMode || loadingProfile) return;
    // If the user navigated here with a question (e.g. "Ask AI" from portal), skip DB history
    // restore entirely — the init effect already called submit(q) and restoring history would
    // overwrite the in-flight question due to React async state batching.
    const navQ = (location.state as { question?: string } | null)?.question;
    if (navQ) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch("/api/chat/history/", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() as Promise<Array<{ id: string; role: string; content: string }>> : null)
      .then(data => {
        if (!data || data.length === 0) return;
        const msgs: ChatMsg[] = data
          .filter(m => (m.role === "user" || m.role === "assistant") && m.content.trim())
          .map(m => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content, streaming: false }));
        if (msgs.length === 0) return;
        setMessages(msgs);
        const userMsgs = msgs.filter(m => m.role === "user");
        setSessionCount(userMsgs.length);
        setAskedSet(new Set(userMsgs.map(m => m.content)));
        if (profile) setIntakeComplete(true);
        setShowCards(false);
        localStorage.setItem(historyKey(), JSON.stringify(msgs));
      })
      .catch(() => null);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleTextSubmit();
    }
  }

  // Chat is unlimited for all users — no rate limit enforced
  const sessionLimitReached = false;
  const userType = String(profile?.user_type ?? "zzp");
  const allCards = getCards(userType, lang);
  const remainingCards = allCards.filter(c => !askedSet.has(c.q));
  const cardsToShow = messages.filter(m => !m.isIntake || m.id !== "intake-greeting").length === 0
    ? allCards.slice(0, 6)
    : remainingCards.slice(0, 4);
  const meta = USER_TYPE_META[userType] ?? USER_TYPE_META.zzp;

  const income = ((profile?.annual_revenue_zzp as number) || (profile?.employment_income as number) || 0).toLocaleString("nl-NL");

  // Check if a Claude response contains an intake-complete JSON block
  function extractIntakeProfile(text: string): Record<string, unknown> | null {
    const match = text.match(/\[INTAKE_COMPLETE:\s*(\{[\s\S]*?\})\]/);
    if (!match) return null;
    try {
      return JSON.parse(match[1]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  // Check if a Claude response contains an IB-complete JSON block
  function extractIBComplete(text: string): IBAnswers | null {
    const match = text.match(/\[IB_COMPLETE:\s*(\{[\s\S]*?\})\]/);
    if (!match) return null;
    try {
      return JSON.parse(match[1]) as IBAnswers;
    } catch {
      return null;
    }
  }

  async function handleSaveToDashboard(data: Record<string, unknown>, msgId: string) {
    // Dismiss the save prompt immediately
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isSavePrompt: false } : m));
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch("/api/users/profile/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ intake_profile: data }),
      });
      if (!res.ok) throw new Error("save_failed");
      showToast(
        lang === "nl" ? "Profiel opgeslagen in dashboard" : lang === "fa" ? "پروفایل در داشبورد ذخیره شد" : "Profile saved to dashboard",
        "success",
      );
      const confirmText: Record<string, string> = {
        nl: "✓ Uw belastingprofiel is opgeslagen. Bekijk uw dashboard voor het volledige overzicht",
        en: "✓ Your tax profile has been saved. Visit your dashboard to see the full overview",
        fa: "✓ پروفایل مالیاتی شما ذخیره شد. برای مشاهده خلاصه کامل به داشبورد مراجعه کنید",
      };
      setMessages(prev => [...prev, {
        id: `save-confirmed-${Date.now()}`,
        role: "assistant",
        content: confirmText[lang] ?? confirmText.en,
      }]);
    } catch {
      showToast(
        lang === "nl" ? "Opslaan mislukt — probeer het opnieuw" : lang === "fa" ? "ذخیره‌سازی ناموفق بود" : "Save failed — please try again",
        "error",
      );
    }
  }

  const submit = async (question: string, fromInput = false, ibReturnOverride = false, simModeOverride = false) => {
    if (!question.trim() || loading || sessionLimitReached) return;
    const isIBMode = ibMode || ibReturnOverride;

    if (fromInput) {
      setAskedSet(prev => new Set([...prev, question]));
    } else {
      setAskedSet(prev => new Set([...prev, question]));
    }
    setShowCards(false);

    const uid = `u-${Date.now()}`, aid = `a-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { id: uid, role: "user", content: question },
      { id: aid, role: "assistant", content: "", streaming: true },
    ]);
    setLoading(true);
    const newCount = sessionCount + 1;
    setSessionCount(newCount);
    setInputText("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    const history = messages
      .filter(m => m.id !== "intake-greeting")
      .map(m => ({ role: m.role, content: m.content }))
      .slice(-40); // backend uses last 10; cap at 40 to stay within serializer limit

    abortRef.current = new AbortController();
    let fullResponse = "";

    try {
      // Intake mode: no profile yet, OR simulation chip triggered (treats sim as a fresh intake)
      const isIntakeMode = !isIBMode && (simMode || simModeOverride || (!profile && !intakeComplete));

      // Consume the pending alert context (only used on the first message after navigation)
      const alertCtx = pendingAlertRef.current;
      pendingAlertRef.current = null;

      await sendMessage(
        question,
        history,
        (token, meta) => {
          if (meta?.upgrade_required) {
            const reason = meta.reason === "daily_limit" ? "daily_limit" : meta.reason === "session_limit" ? "session_limit" : "register";
            setUpgradeModal({ reason });
            setMessages(prev => prev.filter(m => m.id !== aid));
            return;
          }
          // Profile update collected by AI mid-conversation — merge silently
          if (meta?.profile_update) {
            const updates = meta.profile_update;
            const base = profile ?? {};
            const updatedProfile = { ...base, ...updates };
            localStorage.setItem("taxwijs_calc_input", JSON.stringify(updatedProfile));
            setProfile(updatedProfile);
            // Persist to backend for authenticated users
            if (user) {
              const authToken = localStorage.getItem("access_token");
              fetch("/api/users/profile/", {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                },
                body: JSON.stringify({ intake_profile: updatedProfile }),
              }).catch(() => null);
            }
            showToast(
              lang === "nl" ? "Profiel bijgewerkt ✓" :
              lang === "fa" ? "پروفایل به‌روز شد ✓" :
              "Profile updated ✓",
              "success",
            );
            return;
          }
          fullResponse += token;
          setMessages(prev => prev.map(m => m.id === aid ? { ...m, content: m.content + token } : m));
        },
        abortRef.current.signal,
        profile ?? undefined,
        newCount,
        isIntakeMode,
        lang,
        alertCtx,
        isIBMode,
      );

      // Check if IB return is complete
      if (isIBMode) {
        const ibData = extractIBComplete(fullResponse);
        if (ibData) {
          setIbAnswers(ibData);
          // Strip the JSON marker from the displayed message and mark it as IB result
          const cleanContent = fullResponse.replace(/\[IB_COMPLETE:\s*\{[\s\S]*?\}\]/g, "").trim();
          setMessages(prev => prev.map(m =>
            m.id === aid ? { ...m, content: cleanContent, isIBResult: true } : m
          ));
          showToast(
            lang === "nl" ? "Aangifte overzicht klaar — download uw rapport" :
            lang === "fa" ? "خلاصه اظهارنامه آماده است — گزارش را دانلود کنید" :
            "IB return summary ready — download your report",
            "success"
          );
          return; // skip intake extraction below
        }
      }

      // Strip any [PROFILE_UPDATE] markers from the displayed message
      // (the actual save already happened via the SSE meta event above)
      if (/\[PROFILE_UPDATE:/.test(fullResponse)) {
        const stripped = fullResponse.replace(/\[PROFILE_UPDATE:\s*\{[^}]*\}\]\n?/g, "").trim();
        setMessages(prev => prev.map(m => m.id === aid ? { ...m, content: stripped } : m));
      }

      // Check if intake profile was embedded in the response
      const extracted = extractIntakeProfile(fullResponse);
      if (extracted) {
        // Save profile to localStorage and update state
        localStorage.setItem("taxwijs_calc_input", JSON.stringify(extracted));
        setProfile(extracted);
        setIntakeComplete(true);
        setSimMode(false); // simulation complete — switch to normal chat

        showToast(
          lang === "nl" ? "Profiel aangemaakt — belasting wordt berekend" : lang === "fa" ? "پروفایل ایجاد شد — در حال محاسبه مالیات شما" : "Profile created — calculating your taxes",
          "success",
        );

        // Strip the JSON block from the displayed message
        const cleanContent = fullResponse.replace(/\[INTAKE_COMPLETE:\s*\{[\s\S]*?\}\]/g, "").trim();
        setMessages(prev => prev.map(m => m.id === aid ? { ...m, content: cleanContent } : m));

        // Silently run calculator to get a result
        try {
          const resp = await fetch("/api/calculator/calculate/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(extracted),
          });
          if (resp.ok) {
            const calcResult = await resp.json() as { result: { total_tax: number; effective_rate: number; monthly_reserve_needed: number } };
            const r = calcResult.result;
            const tax = Math.round(r.total_tax).toLocaleString("nl-NL");
            const rate = (r.effective_rate * 100).toFixed(1);
            const reserve = Math.round(r.monthly_reserve_needed).toLocaleString("nl-NL");
            const summaryMap: Record<string, string> = {
              nl: `\n\n---\n**Uw belastingoverzicht 2026:**\n- Totale belasting: **€${tax}**\n- Effectief tarief: **${rate}%**\n- Maandelijks reserveren: **€${reserve}**\n\nU kunt nu vragen stellen over uw situatie. Klik op een onderwerp hieronder of typ uw vraag.`,
              en: `\n\n---\n**Your 2026 tax summary:**\n- Total tax: **€${tax}**\n- Effective rate: **${rate}%**\n- Monthly reserve: **€${reserve}**\n\nYou can now ask questions about your situation. Click a topic below or type your question.`,
              fa: `\n\n---\n**خلاصه مالیات ۲۰۲۶ شما:**\n- مجموع مالیات: **€${tax}**\n- نرخ مؤثر: **${rate}٪**\n- ذخیره ماهانه: **€${reserve}**\n\nاکنون می‌توانید سؤالاتی درباره وضعیت خود بپرسید.`,
            };
            const summaryLang = lang in summaryMap ? lang : "en";
            setMessages(prev => prev.map(m => m.id === aid
              ? { ...m, content: cleanContent + (summaryMap[summaryLang] ?? summaryMap.en) }
              : m
            ));
          }
        } catch {
          // Calculator error is non-fatal
        }

        // Ask authenticated users if they want to persist data to their dashboard
        if (user) {
          const savePromptText: Record<string, string> = {
            nl: "Wilt u uw belastingprofiel opslaan in uw dashboard? Dan heeft u het altijd bij de hand en kan ik uw situatie in toekomstige gesprekken onthouden",
            en: "Would you like to save your tax profile to your dashboard? This lets me remember your situation in future conversations",
            fa: "آیا می‌خواهید پروفایل مالیاتی خود را در داشبورد ذخیره کنید؟ این کار به من اجازه می‌دهد وضعیت شما را در مکالمات آینده به خاطر بسپارم",
          };
          setMessages(prev => [...prev, {
            id: `save-prompt-${Date.now()}`,
            role: "assistant",
            content: savePromptText[lang] ?? savePromptText.en,
            isSavePrompt: true,
            saveProfileData: extracted,
          }]);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        const errMsg = lang === "nl" ? "Er is een fout opgetreden — probeer het opnieuw" : lang === "fa" ? "خطایی رخ داد — دوباره تلاش کنید" : "Something went wrong — please try again";
        setMessages(prev => prev.map(m => m.id === aid ? { ...m, content: t("chat.error"), streaming: false } : m));
        showToast(errMsg, "error");
      }
    } finally {
      setMessages(prev => prev.map(m => m.id === aid ? { ...m, streaming: false } : m));
      setLoading(false);
      setTimeout(() => setShowCards(true), 300);
    }
  };

  async function handleTextSubmit() {
    const q = inputText.trim();
    if (q) await submit(q, true);
  }

  const hasRealMessages = messages.some(m => m.id !== "intake-greeting");
  const showResultCards = !!profile && showCards && !sessionLimitReached && cardsToShow.length > 0 && !loading;

  // Single counter value — show what's left, not two different numbers
  const counterLabel = user?.plan === "premium"
    ? null
    : user
      ? `${user.daily_message_count ?? 0} / 10`
      : `${sessionCount} / ${ANON_SESSION_LIMIT}`;

  return (
    <div
      style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <TrustStrip />
      {upgradeModal && <UpgradeModal reason={upgradeModal.reason} onClose={() => setUpgradeModal(null)} />}

      {/* Profile bar — only when profile exists */}
      {profile && (
        <div style={{ padding: isMobile ? "10px 16px" : "12px 28px", background: "var(--accent-soft)", borderBottom: "1px solid var(--accent-line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: meta.color, color: "white", display: "grid", placeItems: "center", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.04em" }}>
              {meta.glyph}
            </span>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--ink)", fontWeight: 500 }}>
              {userType.toUpperCase()} <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>· €{income}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {user?.plan === "premium" ? (
              <span className="pill pill-accent">⚡ Premium</span>
            ) : counterLabel ? (
              <>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
                  <span className="font-mono" style={{ color: "var(--ink)" }}>{counterLabel}</span>
                  {" "}{lang === "nl" ? "vragen" : lang === "fa" ? "سؤال" : "questions"}
                </span>
                <button
                  onClick={() => user ? navigate("/pricing") : setUpgradeModal({ reason: "register" })}
                  style={{ background: "none", border: "none", fontSize: "var(--text-xs)", color: "var(--sage-700)", fontWeight: 500, cursor: "pointer", padding: 0 }}
                >
                  {t("chat.upgrade_cta")} →
                </button>
              </>
            ) : null}
            <button
              onClick={() => navigate("/intake")}
              title="Update profile"
              style={{ background: "var(--paper)", border: "1px solid var(--hairline-2)", width: 30, height: 30, borderRadius: 999, display: "grid", placeItems: "center", cursor: "pointer" }}
            >
              <Icon.edit />
            </button>
          </div>
        </div>
      )}

      {/* Chip bar — always visible, sits between header and messages, never scrolls away */}
      <div style={{
        flexShrink: 0,
        padding: isMobile ? "6px 14px" : "6px 28px",
        borderBottom: "1px solid var(--hairline)",
        background: "var(--paper)",
        display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
      }}>
        <button
          onClick={() => { if (!ibMode && !simMode) { setIbMode(true); void submit(IB_TRIGGER[lang] ?? IB_TRIGGER.en, false, true); } }}
          disabled={ibMode || simMode}
          style={{
            padding: "5px 14px", borderRadius: 999, fontSize: "var(--text-xs)", fontWeight: 500,
            border: ibMode ? "2px solid var(--sage-600)" : "1px solid var(--sage-600)",
            background: ibMode ? "var(--sage-100)" : "var(--accent-soft)",
            color: (!ibMode && simMode) ? "var(--ink-4)" : "var(--sage-700)",
            cursor: ibMode ? "default" : simMode ? "not-allowed" : "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
            opacity: simMode ? 0.45 : 1,
            transition: "all .15s",
          }}
        >
          {IB_CHIP_LABEL[lang] ?? IB_CHIP_LABEL.en}
          {ibMode && (
            <span style={{ fontSize: "var(--text-xs)", background: "var(--sage-600)", color: "white", borderRadius: 999, padding: "1px 6px" }}>
              {lang === "nl" ? "actief" : lang === "fa" ? "فعال" : "active"}
            </span>
          )}
        </button>
        <button
          onClick={() => { if (!simMode && !ibMode) startSimulation(); }}
          disabled={simMode || ibMode}
          style={{
            padding: "5px 14px", borderRadius: 999, fontSize: "var(--text-xs)", fontWeight: 500,
            border: simMode ? "2px solid var(--sage-600)" : "1px solid var(--sage-600)",
            background: simMode ? "var(--sage-100)" : "var(--accent-soft)",
            color: (!simMode && ibMode) ? "var(--ink-4)" : "var(--sage-700)",
            cursor: simMode ? "default" : ibMode ? "not-allowed" : "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
            opacity: ibMode ? 0.45 : 1,
            transition: "all .15s",
          }}
        >
          {SIM_CHIP_LABEL[lang] ?? SIM_CHIP_LABEL.en}
          {simMode && (
            <span style={{ fontSize: "var(--text-xs)", background: "var(--sage-600)", color: "white", borderRadius: 999, padding: "1px 6px" }}>
              {lang === "nl" ? "actief" : lang === "fa" ? "فعال" : "active"}
            </span>
          )}
        </button>
      </div>

      {/* Messages area — aria-live so screen readers announce new messages */}
      <div
        role="log"
        aria-live="polite"
        aria-label={lang === "nl" ? "Chatberichten" : lang === "fa" ? "پیام‌های چت" : "Chat messages"}
        style={{ flex: 1, overflowY: "auto", padding: isMobile ? "var(--sp-5) var(--sp-3) var(--sp-4)" : "var(--sp-8) var(--sp-7) var(--sp-6)" }}
      >
        <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Loading profile from server */}
          {loadingProfile && (
            <div style={{ paddingTop: 40, display: "flex", flexDirection: "column", gap: 12 }}>
              <Skeleton height={14} width="55%" />
              <Skeleton height={14} width="80%" />
              <Skeleton height={14} width="40%" />
            </div>
          )}

          {/* Empty state (with profile, before first real message) */}
          {profile && !hasRealMessages && !loadingProfile && (
            <div className="afu" style={{ textAlign: "center", paddingBottom: 24 }}>
              <span style={{ display: "inline-grid", placeItems: "center", width: 56, height: 56, borderRadius: "var(--r-md)", background: "var(--blue)", fontSize: 24, color: "#fff" }}>
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                  <path d="M4 16L10 4l6 12H4z" fill="white" fillOpacity="0.9"/>
                  <path d="M7 16L10 10.5l3 5.5" fill="white" fillOpacity="0.45"/>
                </svg>
              </span>
              <h2 style={{ marginTop: 16, fontFamily: "var(--font)", fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em" }}>
                {t("chat.ready_title")}
              </h2>
              <p style={{ marginTop: 8, color: "var(--text-3)", fontSize: 15 }}>{t("chat.ready_subtitle")}</p>
              {/* Mode chips */}
              <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => { setIbMode(true); void submit(IB_TRIGGER[lang] ?? IB_TRIGGER.en, false, true); }}
                  disabled={loading}
                  style={{ padding: "10px 20px", borderRadius: 999, border: "1px solid var(--blue-border)", background: "var(--blue-subtle)", color: "var(--blue-text)", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, transition: "background var(--t-fast)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--blue-subtle)"; }}
                >
                  {IB_CHIP_LABEL[lang] ?? IB_CHIP_LABEL.en}
                </button>
                <button
                  onClick={() => startSimulation()}
                  disabled={loading}
                  style={{ padding: "10px 20px", borderRadius: 999, border: "1px solid var(--border-2)", background: "var(--bg-3)", color: "var(--text-2)", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, transition: "background var(--t-fast)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-3)"; }}
                >
                  {SIM_CHIP_LABEL[lang] ?? SIM_CHIP_LABEL.en}
                </button>
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map(msg => {
            return msg.role === "user" ? (
              <div key={msg.id} style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ padding: "10px 16px", borderRadius: "18px 18px 4px 18px", background: "var(--blue)", color: "#fff", fontSize: 14, maxWidth: "78%" }}>
                  {msg.content}
                </div>
              </div>
            ) : (
              <div key={msg.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", maxWidth: "92%" }}>
                <span style={{ width: 30, height: 30, borderRadius: "var(--r-sm)", background: "var(--blue-subtle)", color: "var(--blue-text)", display: "grid", placeItems: "center", fontSize: 14, marginTop: 2, flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M4 16L10 4l6 12H4z" fill="currentColor" fillOpacity="0.9"/></svg>
                </span>
                <div className="card" style={{ flex: 1, padding: 18 }}>
                  {msg.streaming && !msg.content ? (
                    /* Typing indicator — shown while waiting for first token */
                    <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 2px" }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{
                          width: 9, height: 9, borderRadius: "50%",
                          background: "var(--text-3)",
                          display: "inline-block",
                          animation: "dotBounce 1.3s ease-in-out infinite",
                          animationDelay: `${i * 0.18}s`,
                        }} />
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)" }}
                      className="[&_p]:m-0 [&_p:not(:last-child)]:mb-2 [&_ul]:m-1 [&_ul]:ml-4 [&_li]:mb-1 [&_strong]:font-semibold [&_strong]:text-[var(--ink)] [&_h1]:font-medium [&_h2]:font-medium [&_h3]:font-medium"
                    >
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                  {!msg.streaming && !msg.isIntake && (
                    <ContextSourceChips sources={[
                      "Rules",
                      ...(profile ? ["Profile"] : []),
                      ...(ibMode && !msg.isIntake ? ["Engagement"] : []),
                    ]} />
                  )}
                  {msg.isIBResult && ibAnswers && (
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--hairline)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                        {lang === "nl" ? "Uw aangifte-overzicht is klaar" : lang === "fa" ? "خلاصه اظهارنامه شما آماده است" : "Your return summary is ready"}
                      </span>
                      <button
                        className="btn btn-accent btn-sm"
                        onClick={() => printIBReport(ibAnswers, lang)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        ↓ {lang === "nl" ? "Download rapport (PDF)" : lang === "fa" ? "دانلود گزارش (PDF)" : "Download report (PDF)"}
                      </button>
                    </div>
                  )}
                  {msg.isSavePrompt && msg.saveProfileData && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--hairline)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <button
                        className="btn btn-accent btn-sm"
                        onClick={() => void handleSaveToDashboard(msg.saveProfileData!, msg.id)}
                      >
                        {lang === "nl" ? "Ja, opslaan" : lang === "fa" ? "بله، ذخیره کن" : "Yes, save"}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isSavePrompt: false } : m))}
                      >
                        {lang === "nl" ? "Nee, bedankt" : lang === "fa" ? "نه، ممنون" : "No thanks"}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate("/dashboard")}
                        style={{ marginInlineStart: "auto" }}
                      >
                        {lang === "nl" ? "Bekijk dashboard →" : lang === "fa" ? "مشاهده داشبورد →" : "View dashboard →"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}


          {/* Question suggestion cards — only when profile is available */}
          {showResultCards && (
            <div>
              {hasRealMessages && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <span className="eyebrow eyebrow-accent">{t("chat.result_questions", { defaultValue: "Ask a follow-up" })}</span>
                  <span className="hair" style={{ flex: 1 }} />
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                {cardsToShow.map((c, i) => (
                  <button
                    key={c.q}
                    onClick={() => void submit(c.q)}
                    disabled={loading}
                    style={{
                      textAlign: "start", padding: "16px 16px", background: "var(--paper)",
                      border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)",
                      display: "flex", flexDirection: "column", gap: 8, cursor: "pointer",
                      animation: "cardIn .35s ease-out both",
                      animationDelay: `${i * 50}ms`,
                      transition: "border-color .15s, background .15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--sage-600)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--hairline)"; e.currentTarget.style.background = "var(--paper)"; }}
                  >
                    <span className="eyebrow eyebrow-accent">{c.tag}</span>
                    <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.35 }}>{c.q}</div>
                    <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--ink-3)" }}>
                      {lang === "nl" ? "Vraag" : lang === "fa" ? "بپرسید" : "Ask"} <Icon.arrow style={{ width: 11, height: 11 }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area — position sticky so it never scrolls away on any browser */}
      <div
        role="form"
        aria-label={lang === "nl" ? "Stuur een bericht" : lang === "fa" ? "ارسال پیام" : "Send a message"}
        style={{
          borderTop: "1px solid var(--hairline)",
          padding: isMobile ? "var(--sp-3) var(--sp-3)" : "var(--sp-3) var(--sp-7)",
          flexShrink: 0,
          background: "var(--paper)",
          position: "sticky",
          bottom: 0,
        }}
      >
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          {/* Mode chips — always visible, active chip highlighted */}
          {!loading && (
            <div style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => { if (!ibMode && !simMode) { setIbMode(true); void submit(IB_TRIGGER[lang] ?? IB_TRIGGER.en, false, true); } }}
                disabled={ibMode || simMode}
                style={{
                  padding: "6px 14px", borderRadius: 999, fontSize: "var(--text-sm)", fontWeight: 500,
                  border: ibMode ? "2px solid var(--sage-600)" : "1px solid var(--sage-600)",
                  background: ibMode ? "var(--sage-100)" : "var(--accent-soft)",
                  color: (!ibMode && simMode) ? "var(--ink-4)" : "var(--sage-700)",
                  cursor: ibMode ? "default" : simMode ? "not-allowed" : "pointer",
                  display: "inline-flex", alignItems: "center", gap: 6,
                  opacity: simMode ? 0.45 : 1,
                  transition: "all .15s",
                }}
              >
                {IB_CHIP_LABEL[lang] ?? IB_CHIP_LABEL.en}
                {ibMode && (
                  <span style={{ fontSize: "var(--text-xs)", background: "var(--sage-600)", color: "white", borderRadius: 999, padding: "1px 6px" }}>
                    {lang === "nl" ? "actief" : lang === "fa" ? "فعال" : "active"}
                  </span>
                )}
              </button>
              <button
                onClick={() => { if (!simMode && !ibMode) startSimulation(); }}
                disabled={simMode || ibMode}
                style={{
                  padding: "6px 14px", borderRadius: 999, fontSize: "var(--text-sm)", fontWeight: 500,
                  border: simMode ? "2px solid var(--sage-600)" : "1px solid var(--sage-600)",
                  background: simMode ? "var(--sage-100)" : "var(--accent-soft)",
                  color: (!simMode && ibMode) ? "var(--ink-4)" : "var(--sage-700)",
                  cursor: simMode ? "default" : ibMode ? "not-allowed" : "pointer",
                  display: "inline-flex", alignItems: "center", gap: 6,
                  opacity: ibMode ? 0.45 : 1,
                  transition: "all .15s",
                }}
              >
                {SIM_CHIP_LABEL[lang] ?? SIM_CHIP_LABEL.en}
                {simMode && (
                  <span style={{ fontSize: "var(--text-xs)", background: "var(--sage-600)", color: "white", borderRadius: 999, padding: "1px 6px" }}>
                    {lang === "nl" ? "actief" : lang === "fa" ? "فعال" : "active"}
                  </span>
                )}
              </button>
            </div>
          )}

          {sessionLimitReached ? (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <button className="btn btn-accent btn-sm" onClick={() => setUpgradeModal({ reason: "session_limit" })}>
                {t("chat.upgrade_cta")} →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={loading}
                aria-label={
                  ibMode ? (lang === "nl" ? "Geef uw antwoord voor de aangifte" : lang === "fa" ? "پاسخ اظهارنامه را بنویسید" : "Enter your return answer")
                  : profile ? (lang === "nl" ? "Stel een vraag over uw belasting" : lang === "fa" ? "سؤالی درباره مالیات بپرسید" : "Ask a tax question")
                  : (lang === "nl" ? "Typ uw antwoord" : lang === "fa" ? "پاسخ خود را بنویسید" : "Type your answer")
                }
                placeholder={
                  ibMode ? (lang === "nl" ? "Typ uw antwoord…" : lang === "fa" ? "پاسخ خود را بنویسید…" : "Type your answer…")
                  : profile ? (lang === "nl" ? "Stel een vraag over uw belasting…" : lang === "fa" ? "سؤالی درباره مالیات خود بپرسید…" : "Ask a question about your taxes…")
                  : (lang === "nl" ? "Typ uw antwoord…" : lang === "fa" ? "پاسخ خود را بنویسید…" : "Type your answer…")
                }
                rows={1}
                style={{
                  flex: 1,
                  resize: "none",
                  padding: "10px 14px",
                  borderRadius: "var(--r)",
                  border: "1px solid var(--hairline-2)",
                  background: "var(--paper-2)",
                  fontSize: 16,
                  color: "var(--ink)",
                  fontFamily: "var(--sans)",
                  outline: "none",
                  lineHeight: 1.45,
                  transition: "border-color .15s",
                  maxHeight: 140,
                  overflowY: "auto",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "var(--blue)"; e.currentTarget.style.boxShadow = "var(--sh-focus)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "var(--hairline-2)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <button
                onClick={() => void handleTextSubmit()}
                disabled={loading || !inputText.trim()}
                className="btn btn-accent"
                style={{ height: 42, paddingInline: 18, flexShrink: 0 }}
              >
                {loading ? "···" : <Icon.arrow />}
              </button>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            {messages.length > 1 ? (
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: "var(--ink-3)", gap: 6 }}
                onClick={() => {
                  setMessages([]);
                  setSessionCount(0);
                  setAskedSet(new Set());
                  setShowCards(true);
                  setIntakeComplete(false);
                  setIbMode(false);
                  setIbAnswers(null);
                  setSimMode(false);
                  localStorage.removeItem(historyKey());
                  if (user) {
                    const token = localStorage.getItem("access_token");
                    if (token) {
                      fetch("/api/chat/history/", {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                      }).catch(() => null);
                    }
                  }
                  if (!profile) startIntakeGreeting();
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {t("chat.clear")}
              </button>
            ) : (
              <span />
            )}
            <p style={{ fontSize: 11, color: "var(--ink-4)", margin: 0 }}>{t("chat.disclaimer")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
