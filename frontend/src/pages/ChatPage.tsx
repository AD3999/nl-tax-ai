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

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  isIntake?: boolean;
}

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
      { q: "مجموع مالیات من را به زبان ساده توضیح بده",                tag: "خلاصه" },
      { q: "چرا ZVW می‌پردازم و دقیقاً چقدر است؟",                   tag: "ZVW" },
      { q: "هر ماه چقدر باید برای مالیات کنار بگذارم؟",               tag: "جریان نقدی" },
      { q: "خطر Wet DBA من چقدر است؟",                                tag: "انطباق" },
      { q: "کسر کارآفرینی چگونه مالیات من را کاهش داد؟",             tag: "کسر" },
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
      { q: "محاسبه مالیات من را به زبان ساده توضیح بده",              tag: "خلاصه" },
      { q: "نرخ مؤثر مالیاتی من چقدر است؟",                          tag: "نرخ" },
      { q: "تخفیف کار (arbeidskorting) چگونه به من کمک می‌کند؟",     tag: "تخفیف" },
      { q: "آیا با این درآمد به کمک هزینه مراقبت بهداشتی حق دارم؟", tag: "کمک هزینه" },
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
      { q: "قانون ۳۰٪ چطور مالیات من را تحت تأثیر قرار می‌دهد؟",   tag: "قانون ۳۰٪" },
      { q: "مجموع مالیات من را توضیح بده",                           tag: "خلاصه" },
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
      { q: "تفاوت بین مالیات Box 1 و Box 2 من را توضیح بده",         tag: "باکس ۱/۲" },
      { q: "چرا مالیات سود سهام می‌پردازم و چقدر است؟",              tag: "سود سهام" },
      { q: "مجموع مالیات من را به زبان ساده توضیح بده",              tag: "خلاصه" },
    ],
  },
};

function getCards(userType: string, lang: string) {
  const byType = RESULT_QUESTIONS[userType] ?? RESULT_QUESTIONS.zzp;
  return byType[lang] ?? byType.en ?? byType.nl ?? [];
}

const USER_TYPE_META: Record<string, { color: string; glyph: string }> = {
  zzp:      { color: "var(--sage-600)",      glyph: "ZZ" },
  employee: { color: "oklch(0.55 0.12 230)", glyph: "EM" },
  expat:    { color: "oklch(0.62 0.13 50)",  glyph: "EX" },
  dga:      { color: "oklch(0.55 0.10 290)", glyph: "DG" },
};

// Greeting the bot sends when there's no profile — starts the conversational intake
const INTAKE_GREETING: Record<string, string> = {
  nl: "Hallo! Ik ben TaxWijs, uw Nederlandse belastingassistent voor 2026.\n\nOm uw belastingsituatie te berekenen, stel ik u een paar korte vragen.\n\n**Wat is uw werksituatie?**\n- **ZZP** — Freelancer / zelfstandige\n- **Werknemer** — In loondienst\n- **Expat** — Met 30%-regeling\n- **DGA** — Directeur-grootaandeelhouder",
  en: "Hello! I'm TaxWijs, your Dutch tax assistant for 2026.\n\nTo calculate your tax situation, I'll ask you a few quick questions.\n\n**What is your work situation?**\n- **ZZP** — Freelancer / self-employed\n- **Employee** — Salaried employee\n- **Expat** — With 30% ruling\n- **DGA** — Director with own company",
  fa: "سلام! من TaxWijs هستم، دستیار مالیاتی هلندی شما برای سال ۲۰۲۶.\n\nبرای محاسبه وضعیت مالیاتی شما، چند سؤال کوتاه می‌پرسم.\n\n**وضعیت کاری شما چیست؟**\n- **ZZP** — فریلنسر / خوداشتغال\n- **Employee** — کارمند حقوق‌بگیر\n- **Expat** — با قانون ۳۰٪\n- **DGA** — مدیر شرکت",
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

  // Persist messages to localStorage on every change (strip streaming flag so restore is clean)
  useEffect(() => {
    if (messages.length === 0) return;
    localStorage.setItem(historyKey(), JSON.stringify(messages));
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // On mount: restore history first, then fall through to normal init if nothing saved
  useEffect(() => {
    const locState = location.state as { question?: string; explain_alert?: ExplainAlert } | null;
    const q = locState?.question;

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
          } else {
            startIntakeGreeting();
          }
        })
        .catch(() => startIntakeGreeting())
        .finally(() => setLoadingProfile(false));
    } else {
      startIntakeGreeting();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const sessionLimitReached = !user && sessionCount >= ANON_SESSION_LIMIT;
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

  const submit = async (question: string, fromInput = false) => {
    if (!question.trim() || loading || sessionLimitReached) return;

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
      .map(m => ({ role: m.role, content: m.content }));

    abortRef.current = new AbortController();
    let fullResponse = "";

    try {
      // Determine if we're in intake mode (no profile yet)
      const isIntakeMode = !profile && !intakeComplete;

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
          fullResponse += token;
          setMessages(prev => prev.map(m => m.id === aid ? { ...m, content: m.content + token } : m));
        },
        abortRef.current.signal,
        profile ?? undefined,
        newCount,
        isIntakeMode,
        lang,
        alertCtx,
      );

      // Check if intake profile was embedded in the response
      const extracted = extractIntakeProfile(fullResponse);
      if (extracted) {
        // Save profile to localStorage and update state
        localStorage.setItem("taxwijs_calc_input", JSON.stringify(extracted));
        setProfile(extracted);
        setIntakeComplete(true);

        // For authenticated users: also persist to server so it works across devices
        if (user) {
          const token = localStorage.getItem("access_token");
          fetch("/api/users/profile/", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ intake_profile: extracted }),
          }).catch(() => null); // non-fatal
        }

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
      style={{ flex: 1, display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", overflow: "hidden" }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {upgradeModal && <UpgradeModal reason={upgradeModal.reason} onClose={() => setUpgradeModal(null)} />}

      {/* Profile bar — only when profile exists */}
      {profile && (
        <div style={{ padding: isMobile ? "10px 16px" : "12px 28px", background: "var(--accent-soft)", borderBottom: "1px solid var(--accent-line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: meta.color, color: "white", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em" }}>
              {meta.glyph}
            </span>
            <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
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
            <div style={{ textAlign: "center", paddingBottom: 24 }}>
              <span style={{ display: "inline-grid", placeItems: "center", width: 56, height: 56, borderRadius: 999, background: "var(--accent-soft)", color: "var(--sage-700)", fontFamily: "var(--serif)", fontSize: 24 }}>T</span>
              <h2 style={{ marginTop: 16, fontFamily: "var(--serif)", fontSize: 32, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                {t("chat.ready_title")}
              </h2>
              <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 15 }}>{t("chat.ready_subtitle")}</p>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map(msg => (
            msg.role === "user" ? (
              <div key={msg.id} style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ padding: "10px 16px", borderRadius: "18px 18px 4px 18px", background: "var(--ink)", color: "var(--paper)", fontSize: 14, maxWidth: "78%" }}>
                  {msg.content}
                </div>
              </div>
            ) : (
              <div key={msg.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", maxWidth: "92%" }}>
                <span style={{ width: 30, height: 30, borderRadius: 999, background: "var(--sage-100)", color: "var(--sage-700)", display: "grid", placeItems: "center", fontFamily: "var(--serif)", fontSize: 14, marginTop: 2, flexShrink: 0 }}>T</span>
                <div className="card" style={{ flex: 1, padding: 18 }}>
                  {msg.streaming && !msg.content ? (
                    /* Typing indicator — shown while waiting for first token */
                    <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 2px" }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{
                          width: 9, height: 9, borderRadius: "50%",
                          background: "var(--sage-400)",
                          display: "inline-block",
                          animation: "typingBounce 1.3s ease-in-out infinite",
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
                  {msg.content.includes("Source") && (
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, paddingTop: 12, borderTop: "1px solid var(--hairline)" }}>
                      <span className="eyebrow">Sources</span>
                      <Icon.external style={{ color: "var(--ink-4)" }} />
                    </div>
                  )}
                </div>
              </div>
            )
          ))}


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
                      Ask <Icon.arrow style={{ width: 11, height: 11 }} />
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
                aria-label={profile
                  ? (lang === "nl" ? "Stel een vraag over uw belasting" : lang === "fa" ? "سؤالی درباره مالیات بپرسید" : "Ask a tax question")
                  : (lang === "nl" ? "Typ uw antwoord" : lang === "fa" ? "پاسخ خود را بنویسید" : "Type your answer")
                }
                placeholder={profile
                  ? (lang === "nl" ? "Stel een vraag over uw belasting…" : lang === "fa" ? "سؤالی درباره مالیات خود بپرسید…" : "Ask a question about your taxes…")
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
                onFocus={e => { e.currentTarget.style.borderColor = "var(--sage-600)"; e.currentTarget.style.boxShadow = "0 0 0 3px oklch(0.92 0.07 115)"; }}
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
                style={{ background: "none", border: "none", fontSize: 11.5, color: "var(--ink-4)", cursor: "pointer", padding: 0 }}
                onClick={() => {
                  setMessages([]);
                  setSessionCount(0);
                  setAskedSet(new Set());
                  setShowCards(true);
                  setIntakeComplete(false);
                  localStorage.removeItem(historyKey());
                  if (!profile) startIntakeGreeting();
                }}
              >
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
