import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { sendMessage } from "../api/chat";
import s from "./ChatPage.module.css";

const MAX_SESSION_MESSAGES = 10;
const MAX_INPUT_LENGTH = 400;

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

// Questions shown in the sidebar — only about the user's OWN results, not general tax questions.
const RESULT_QUESTIONS: Record<string, Record<string, string[]>> = {
  zzp: {
    nl: [
      "Leg mijn totale belastingrekening uit in eenvoudige woorden",
      "Waarom betaal ik ZVW-bijdrage en hoeveel is dat precies?",
      "Hoeveel moet ik elke maand opzij zetten voor de belasting?",
      "Wat zijn mijn risico's voor Wet DBA?",
      "Hoe heeft de zelfstandigenaftrek mijn belasting verlaagd?",
    ],
    en: [
      "Explain my total tax bill in simple words",
      "Why do I pay ZVW and exactly how much is it?",
      "How much should I set aside each month?",
      "What is my Wet DBA risk level?",
      "How did the zelfstandigenaftrek reduce my tax?",
    ],
    fa: [
      "مجموع مالیات من را به زبان ساده توضیح بده",
      "چرا ZVW می‌پردازم و دقیقاً چقدر است؟",
      "هر ماه چقدر باید کنار بگذارم؟",
      "خطر Wet DBA من چقدر است؟",
    ],
  },
  employee: {
    nl: [
      "Leg mijn belastingberekening uit in eenvoudige woorden",
      "Wat is mijn effectieve belastingtarief en wat betekent dat?",
      "Hoe werkt de arbeidskorting in mijn situatie?",
      "Waarom betaal ik dit bedrag aan inkomstenbelasting?",
    ],
    en: [
      "Explain my tax calculation in simple words",
      "What is my effective tax rate and what does it mean?",
      "How does the arbeidskorting (employment credit) help me?",
      "Why do I pay this amount in income tax?",
    ],
    fa: [
      "محاسبه مالیات من را به زبان ساده توضیح بده",
      "نرخ مؤثر مالیاتی من چقدر است؟",
      "تخفیف کار (arbeidskorting) چگونه به من کمک می‌کند؟",
    ],
  },
  expat: {
    nl: [
      "Hoe beïnvloedt de 30%-regeling mijn belasting dit jaar?",
      "Leg mijn totale belastingrekening uit",
      "Wat verandert er in jaar 4 en 5 van de 30%-regeling?",
      "Wat is mijn effectieve belastingtarief?",
    ],
    en: [
      "How does the 30% ruling affect my tax this year?",
      "Explain my total tax bill in simple words",
      "What changes in year 4 and 5 of the 30% ruling?",
      "What is my effective tax rate?",
    ],
    fa: [
      "قانون ۳۰٪ چطور مالیات من را تحت تأثیر قرار می‌دهد؟",
      "مجموع مالیات من را توضیح بده",
      "در سال ۴ و ۵ قانون ۳۰٪ چه تغییری ایجاد می‌شود؟",
    ],
  },
  dga: {
    nl: [
      "Leg het verschil uit tussen mijn Box 1 en Box 2 belasting",
      "Waarom betaal ik dividend belasting en hoeveel is dat?",
      "Leg mijn totale belastingrekening uit in eenvoudige woorden",
      "Wat is de minimum DGA-salarisverplichting?",
    ],
    en: [
      "Explain the difference between my Box 1 and Box 2 tax",
      "Why do I pay dividend tax and how much is it?",
      "Explain my total tax bill in simple words",
      "What is the minimum DGA salary requirement?",
    ],
    fa: [
      "تفاوت بین مالیات Box 1 و Box 2 من را توضیح بده",
      "چرا مالیات سود سهام می‌پردازم و چقدر است؟",
      "مجموع مالیات من را به زبان ساده توضیح بده",
    ],
  },
};

function getResultQuestions(userType: string, lang: string): string[] {
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
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // Count of user messages sent this session — passed to backend
  const [sessionCount, setSessionCount] = useState(0);

  const [profile] = useState<Record<string, unknown> | null>(() => {
    try {
      const raw = localStorage.getItem("taxwijs_calc_input");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Pre-fill question when navigated from IB Guide or Simulation
  useEffect(() => {
    const q = (location.state as { question?: string } | null)?.question;
    if (q && profile) {
      setInput(q);
      inputRef.current?.focus();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sessionLimitReached = sessionCount >= MAX_SESSION_MESSAGES;
  const userType = String(profile?.user_type ?? "zzp");
  const questions = getResultQuestions(userType, lang);

  const submit = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || loading || !profile || sessionLimitReached) return;

    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", content: question };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: ChatMsg = { id: assistantId, role: "assistant", content: "", streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
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
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  // ── No profile: full gate screen ──────────────────────────────────────────
  if (!profile) {
    return (
      <div className={s.page} dir={isRtl ? "rtl" : "ltr"}>
        <div className={s.main}>
          <div className={s.gateScreen}>
            <div className={s.gateIcon}>🧮</div>
            <h2 className={s.gateTitle}>{t("chat.gate_title")}</h2>
            <p className={s.gateSub}>{t("chat.gate_subtitle")}</p>
            <button className={s.gateBtn} onClick={() => navigate("/intake")}>
              {t("chat.gate_cta")} →
            </button>
            <p className={s.gateNote}>{t("chat.gate_note")}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Has profile: normal chat ──────────────────────────────────────────────
  const income = (
    (profile.annual_revenue_zzp as number) ||
    (profile.employment_income as number) ||
    0
  ).toLocaleString("nl-NL");

  return (
    <div className={s.page} dir={isRtl ? "rtl" : "ltr"}>
      <div className={s.sidebar}>
        <p className={s.sidebarTitle}>{t("chat.result_questions")}</p>
        {questions.map((q, i) => (
          <button
            key={i}
            className={s.exampleBtn}
            onClick={() => void submit(q)}
            disabled={loading || sessionLimitReached}
          >
            {q}
          </button>
        ))}

        {/* Session counter */}
        <div className={s.sessionCounter}>
          <span className={sessionLimitReached ? s.sessionLimitHit : s.sessionCountText}>
            {t("chat.session_count", { used: sessionCount, max: MAX_SESSION_MESSAGES })}
          </span>
        </div>

        {messages.length > 0 && (
          <button
            className={s.clearBtn}
            onClick={() => { setMessages([]); setSessionCount(0); }}
          >
            {t("chat.clear")}
          </button>
        )}
      </div>

      <div className={s.main}>
        {/* Profile banner */}
        <div className={s.profileBanner}>
          <span>
            {t("chat.profile_active", {
              type: String(profile.user_type ?? "").toUpperCase(),
              income,
            })}
          </span>
          <button
            className={s.profileDismiss}
            onClick={() => navigate("/intake")}
            title={t("chat.update_profile")}
          >
            ✎
          </button>
        </div>

        <div className={s.messages}>
          {messages.length === 0 && (
            <div className={s.empty}>
              <div className={s.emptyIcon}>📊</div>
              <p className={s.emptyTitle}>{t("chat.ready_title")}</p>
              <p className={s.emptySubtitle}>{t("chat.ready_subtitle")}</p>
              {/* Explain button — fires the first result question automatically */}
              <button
                className={s.intakeBtn}
                onClick={() => void submit(questions[0])}
                disabled={loading}
              >
                {t("chat.explain_results")} →
              </button>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={msg.role === "user" ? s.userBubble : s.assistantBubble}>
              {msg.role === "assistant" ? (
                <div className={s.markdownWrap}>
                  <ReactMarkdown>{msg.content || (msg.streaming ? "▍" : "")}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          ))}

          {/* Session limit reached message */}
          {sessionLimitReached && (
            <div className={s.assistantBubble}>
              <div className={s.markdownWrap}>
                <p>{t("chat.session_limit_msg", { max: MAX_SESSION_MESSAGES })}</p>
                <button className={s.intakeBtn} onClick={() => navigate("/intake")} style={{ marginTop: "8px" }}>
                  {t("chat.update_profile_btn")} →
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form
          className={s.inputRow}
          onSubmit={(e) => { e.preventDefault(); void submit(); }}
        >
          <textarea
            ref={inputRef}
            className={s.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_LENGTH))}
            onKeyDown={handleKey}
            placeholder={sessionLimitReached ? t("chat.session_limit_placeholder") : t("chat.placeholder_results")}
            rows={2}
            disabled={loading || sessionLimitReached}
            dir={isRtl ? "rtl" : "ltr"}
          />
          <div className={s.inputMeta}>
            <span className={s.charCount}>{input.length}/{MAX_INPUT_LENGTH}</span>
            <button
              type="submit"
              className={s.sendBtn}
              disabled={loading || !input.trim() || sessionLimitReached}
            >
              {loading ? "…" : "→"}
            </button>
          </div>
        </form>

        <p className={s.disclaimer}>{t("chat.disclaimer_results")}</p>
      </div>
    </div>
  );
}
