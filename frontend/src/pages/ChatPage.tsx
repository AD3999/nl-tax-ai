import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { sendMessage } from "../api/chat";

const MAX_SESSION_MESSAGES = 10;

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

// Questions per user type per language — source for the card deck
const RESULT_QUESTIONS: Record<string, Record<string, string[]>> = {
  zzp: {
    nl: [
      "Leg mijn totale belastingrekening uit in eenvoudige woorden",
      "Waarom betaal ik ZVW-bijdrage en hoeveel is dat precies?",
      "Hoeveel moet ik elke maand opzij zetten voor de belasting?",
      "Wat zijn mijn risico's voor Wet DBA?",
      "Hoe heeft de zelfstandigenaftrek mijn belasting verlaagd?",
      "Hoe werkt de MKB-winstvrijstelling bij mijn winst?",
      "Heb ik recht op de startersaftrek (laatste jaar!)?",
      "Kan ik de KIA toepassen als ik in apparatuur heb geïnvesteerd?",
      "Hoeveel lijfrente kan ik aftrekken voor mijn pensioen?",
      "Kom ik in aanmerking voor de KOR BTW-vrijstelling?",
    ],
    en: [
      "Explain my total tax bill in simple words",
      "Why do I pay ZVW and exactly how much is it?",
      "How much should I set aside each month for taxes?",
      "What is my Wet DBA risk level?",
      "How did the self-employed deduction reduce my tax?",
      "How does the 12.7% SME profit exemption work?",
      "Do I still qualify for the starter deduction (last year!)?",
      "Can I apply the KIA investment deduction on my purchases?",
      "How much pension contribution can I deduct via lijfrente?",
      "Do I qualify for the KOR VAT exemption?",
    ],
    fa: [
      "مجموع مالیات من را به زبان ساده توضیح بده",
      "چرا ZVW می‌پردازم و دقیقاً چقدر است؟",
      "هر ماه چقدر باید برای مالیات کنار بگذارم؟",
      "خطر Wet DBA من چقدر است؟",
      "کسر کارآفرینی چگونه مالیات من را کاهش داد؟",
      "معافیت سود ۱۲.۷٪ چگونه اعمال می‌شود؟",
      "آیا هنوز واجد شرایط کسر استارتاپ هستم (آخرین سال!)?",
      "هر ماه چقدر باید ذخیره کنم؟",
    ],
  },
  employee: {
    nl: [
      "Leg mijn belastingberekening uit in eenvoudige woorden",
      "Wat is mijn effectieve belastingtarief en wat betekent dat?",
      "Hoe werkt de arbeidskorting in mijn situatie?",
      "Waarom betaal ik dit bedrag aan inkomstenbelasting?",
      "Hoeveel reiskostenvergoeding mag ik onbelast ontvangen?",
      "Kan ik een onbelaste thuiswerkvergoeding ontvangen?",
      "Heb ik recht op zorgtoeslag met mijn inkomen?",
      "Kom ik in aanmerking voor de IACK als ik kinderen heb?",
    ],
    en: [
      "Explain my tax calculation in simple words",
      "What is my effective tax rate and what does it mean?",
      "How does the labour tax credit (arbeidskorting) help me?",
      "Why do I pay this amount in income tax?",
      "How much untaxed travel allowance can I receive?",
      "Can I receive an untaxed home-working allowance?",
      "Am I entitled to healthcare allowance (zorgtoeslag)?",
      "Do I qualify for the childcare credit (IACK) with children?",
    ],
    fa: [
      "محاسبه مالیات من را به زبان ساده توضیح بده",
      "نرخ مؤثر مالیاتی من چقدر است؟",
      "تخفیف کار (arbeidskorting) چگونه به من کمک می‌کند؟",
      "چرا این مقدار مالیات بر درآمد می‌پردازم؟",
      "چقدر کمک هزینه سفر بدون مالیات می‌توانم دریافت کنم؟",
      "آیا با این درآمد به کمک هزینه مراقبت بهداشتی حق دارم؟",
    ],
  },
  expat: {
    nl: [
      "Hoe beïnvloedt de 30%-regeling mijn belasting dit jaar?",
      "Leg mijn totale belastingrekening uit",
      "Wat verandert er in jaar 4 en 5 van de 30%-regeling?",
      "Wat is mijn effectieve belastingtarief?",
      "Hoe werkt de arbeidskorting bij een 30%-regeling?",
      "Heb ik recht op zorgtoeslag?",
    ],
    en: [
      "How does the 30% ruling affect my tax this year?",
      "Explain my total tax bill in simple words",
      "What changes in year 4 and 5 of the 30% ruling?",
      "What is my effective tax rate?",
      "How does the labour tax credit apply with the 30% ruling?",
      "Am I entitled to the healthcare allowance (zorgtoeslag)?",
    ],
    fa: [
      "قانون ۳۰٪ چطور مالیات من را تحت تأثیر قرار می‌دهد؟",
      "مجموع مالیات من را توضیح بده",
      "در سال ۴ و ۵ قانون ۳۰٪ چه تغییری ایجاد می‌شود؟",
      "نرخ موثر مالیاتی من چقدر است؟",
    ],
  },
  dga: {
    nl: [
      "Leg het verschil uit tussen mijn Box 1 en Box 2 belasting",
      "Waarom betaal ik dividendbelasting en hoeveel is dat?",
      "Leg mijn totale belastingrekening uit in eenvoudige woorden",
      "Wat is de minimum DGA-salarisverplichting voor 2026?",
      "Hoeveel vennootschapsbelasting betaalt mijn BV?",
      "Wat is mijn effectieve totale belastingtarief als DGA?",
    ],
    en: [
      "Explain the difference between my Box 1 and Box 2 tax",
      "Why do I pay dividend tax and how much is it?",
      "Explain my total tax bill in simple words",
      "What is the minimum DGA salary requirement for 2026?",
      "How much corporate tax (VPB) does my BV pay?",
      "What is my total effective tax rate as a DGA?",
    ],
    fa: [
      "تفاوت بین مالیات Box 1 و Box 2 من را توضیح بده",
      "چرا مالیات سود سهام می‌پردازم و چقدر است؟",
      "مجموع مالیات من را به زبان ساده توضیح بده",
      "حداقل حقوق DGA در ۲۰۲۶ چقدر است؟",
    ],
  },
};

function getQuestions(userType: string, lang: string): string[] {
  const byType = RESULT_QUESTIONS[userType] ?? RESULT_QUESTIONS.zzp;
  return byType[lang] ?? byType.en ?? byType.nl ?? [];
}

export default function ChatPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const lang = i18n.language as "nl" | "en" | "fa";
  const isRtl = lang === "fa";

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [askedQuestions, setAskedQuestions] = useState<Set<string>>(new Set());
  const [showCards, setShowCards] = useState(true);

  const [profile] = useState<Record<string, unknown> | null>(() => {
    try {
      const raw = localStorage.getItem("taxwijs_calc_input");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Pre-fill and auto-send when navigated from IB Guide or Simulation
  useEffect(() => {
    const q = (location.state as { question?: string } | null)?.question;
    if (q && profile) void submit(q);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sessionLimitReached = sessionCount >= MAX_SESSION_MESSAGES;
  const userType = String(profile?.user_type ?? "zzp");
  const allQuestions = getQuestions(userType, lang);
  const remainingCards = allQuestions.filter((q) => !askedQuestions.has(q));

  const submit = async (question: string) => {
    if (!question || loading || !profile || sessionLimitReached) return;

    setAskedQuestions((prev) => new Set([...prev, question]));
    setShowCards(false);

    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", content: question };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: ChatMsg = { id: assistantId, role: "assistant", content: "", streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setLoading(true);
    const newCount = sessionCount + 1;
    setSessionCount(newCount);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    abortRef.current = new AbortController();

    try {
      await sendMessage(
        question,
        history,
        (token) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + token } : m
            )
          );
        },
        abortRef.current.signal,
        profile ?? undefined,
        newCount,
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: t("chat.error"), streaming: false }
              : m
          )
        );
      }
    } finally {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
      );
      setLoading(false);
      // Show cards again after AI responds (with remaining questions)
      setTimeout(() => setShowCards(true), 300);
    }
  };

  // ── No profile: gate screen ───────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-52px)]" dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex flex-col items-center gap-4 max-w-md p-10 text-center">
          <div className="text-5xl">🧮</div>
          <h2 className="text-2xl font-bold text-[var(--text-h)] m-0">{t("chat.gate_title")}</h2>
          <p className="text-[15px] text-[var(--text)] leading-relaxed m-0 opacity-80">{t("chat.gate_subtitle")}</p>
          <button
            className="mt-2 px-8 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold text-[15px] border-none cursor-pointer hover:opacity-85 transition-opacity"
            onClick={() => navigate("/intake")}
          >
            {t("chat.gate_cta")} →
          </button>
          <p className="text-xs text-[var(--text)] opacity-50 m-0">{t("chat.gate_note")}</p>
        </div>
      </div>
    );
  }

  // ── Has profile: card-based chat ─────────────────────────────────────────────
  const income = (
    (profile.annual_revenue_zzp as number) ||
    (profile.employment_income as number) ||
    0
  ).toLocaleString("nl-NL");

  const cardsToShow = messages.length === 0 ? allQuestions.slice(0, 6) : remainingCards.slice(0, 4);

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100vh - 52px)" }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Profile banner */}
      <div className="flex items-center justify-between bg-[var(--accent-bg)] border-b border-[var(--accent)] px-10 py-2 text-[13px] text-[var(--accent)] flex-shrink-0">
        <span>
          {t("chat.profile_active", {
            type: String(profile.user_type ?? "").toUpperCase(),
            income,
          })}
        </span>
        <div className="flex items-center gap-4">
          {/* Session counter */}
          <span className={`text-[11px] ${sessionLimitReached ? "text-red-600 font-semibold" : "opacity-60"}`}>
            {t("chat.session_count", { used: sessionCount, max: MAX_SESSION_MESSAGES })}
          </span>
          <button
            className="bg-none border-none text-[var(--accent)] text-lg cursor-pointer opacity-70 hover:opacity-100 transition-opacity p-0 px-1 leading-none"
            onClick={() => navigate("/intake")}
            title={t("chat.update_profile")}
          >
            ✎
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-10 py-8 flex flex-col gap-5">

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="m-auto text-center flex flex-col items-center gap-3 pb-4">
            <div className="text-4xl">📊</div>
            <p className="text-xl font-semibold text-[var(--text-h)] m-0">{t("chat.ready_title")}</p>
            <p className="text-[14px] text-[var(--text)] max-w-sm leading-relaxed m-0">{t("chat.ready_subtitle")}</p>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={
              msg.role === "user"
                ? "self-end max-w-[72%] bg-[var(--accent)] text-white rounded-[16px_16px_4px_16px] px-4 py-3 text-sm leading-relaxed"
                : "self-start max-w-[80%] bg-[var(--card-bg,#f9f9f9)] border border-[var(--border)] rounded-[4px_16px_16px_16px] px-4 py-3.5 text-sm leading-relaxed"
            }
          >
            {msg.role === "assistant" ? (
              <div className="[&_p]:m-0 [&_p:not(:last-child)]:mb-2 [&_ul]:m-1 [&_ul]:ml-4 [&_ol]:m-1 [&_ol]:ml-4 [&_li]:mb-1 [&_strong]:font-semibold [&_strong]:text-[var(--text-h)] [&_code]:bg-[var(--border)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_h1]:mt-2.5 [&_h1]:mb-1 [&_h1]:font-semibold [&_h2]:mt-2.5 [&_h2]:mb-1 [&_h2]:font-semibold [&_h3]:mt-2.5 [&_h3]:mb-1 [&_h3]:font-semibold">
                <ReactMarkdown>{msg.content || (msg.streaming ? "▍" : "")}</ReactMarkdown>
              </div>
            ) : (
              <p className="m-0">{msg.content}</p>
            )}
          </div>
        ))}

        {/* Session limit message */}
        {sessionLimitReached && (
          <div className="self-start max-w-[80%] bg-[var(--card-bg,#f9f9f9)] border border-[var(--border)] rounded-[4px_16px_16px_16px] px-4 py-3.5 text-sm">
            <p className="m-0 mb-3">{t("chat.session_limit_msg", { max: MAX_SESSION_MESSAGES })}</p>
            <button
              className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white font-medium text-sm border-none cursor-pointer hover:opacity-85 transition-opacity"
              onClick={() => navigate("/intake")}
            >
              {t("chat.update_profile_btn")} →
            </button>
          </div>
        )}

        {/* Slide-up cards */}
        {showCards && !sessionLimitReached && cardsToShow.length > 0 && !loading && (
          <div className={`flex flex-col gap-2.5 ${messages.length === 0 ? "mt-2" : "mt-1"}`}>
            {messages.length > 0 && (
              <p className="text-[11px] font-bold tracking-widest uppercase text-[var(--accent)] m-0">
                {t("chat.result_questions")}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {cardsToShow.map((q, i) => (
                <button
                  key={q}
                  className="text-left bg-transparent border border-[var(--border)] rounded-xl px-3 py-2.5 text-[13px] text-[var(--text)] cursor-pointer leading-snug transition-all duration-150 hover:bg-[var(--accent-bg)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed opacity-0 animate-slide-up"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "forwards" }}
                  onClick={() => void submit(q)}
                  disabled={loading}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="self-start text-[var(--text)] opacity-50 text-sm animate-pulse">
            ···
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Clear button + disclaimer */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between px-10 pb-2 pt-1 border-t border-[var(--border)]">
          <button
            className="text-xs text-[var(--text)] opacity-50 bg-transparent border-none cursor-pointer hover:text-red-600 hover:opacity-100 transition-colors"
            onClick={() => {
              setMessages([]);
              setSessionCount(0);
              setAskedQuestions(new Set());
              setShowCards(true);
            }}
          >
            {t("chat.clear")}
          </button>
          <p className="text-[11px] text-[var(--text)] opacity-40 m-0">{t("chat.disclaimer_results")}</p>
        </div>
      )}
      {messages.length === 0 && (
        <p className="text-[11px] text-[var(--text)] opacity-40 text-center pb-3 m-0 px-10">
          {t("chat.disclaimer")}
        </p>
      )}
    </div>
  );
}
