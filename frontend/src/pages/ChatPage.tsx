import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { sendMessage } from "../api/chat";
import s from "./ChatPage.module.css";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const EXAMPLE_QUESTIONS = {
  nl: [
    "Hoeveel belasting betaal ik als ZZP'er met €50.000 omzet?",
    "Wat is de zelfstandigenaftrek in 2026?",
    "Hoe werkt de startersaftrek en is dit het laatste jaar?",
    "Wat is ZVW-bijdrage en moet ik die betalen?",
    "Wat zijn mijn risico's voor Wet DBA?",
  ],
  en: [
    "How much tax do I pay as a freelancer with €50,000 revenue?",
    "What is the zelfstandigenaftrek in 2026?",
    "How does the 30% expat ruling work?",
  ],
  fa: [
    "به عنوان ZZP با درآمد ۵۰،۰۰۰ یورو چقدر مالیات باید بپردازم؟",
    "استارترزافترک چیست و آیا این آخرین سال آن است؟",
  ],
};

export default function ChatPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "nl" | "en" | "fa";
  const isRtl = lang === "fa";

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", content: question };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: ChatMsg = { id: assistantId, role: "assistant", content: "", streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setLoading(true);

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
      submit();
    }
  };

  const examples = EXAMPLE_QUESTIONS[lang] ?? EXAMPLE_QUESTIONS.nl;

  return (
    <div className={s.page} dir={isRtl ? "rtl" : "ltr"}>
      <div className={s.sidebar}>
        <p className={s.sidebarTitle}>{t("chat.examples")}</p>
        {examples.map((q, i) => (
          <button key={i} className={s.exampleBtn} onClick={() => submit(q)}>
            {q}
          </button>
        ))}

        {messages.length > 0 && (
          <button
            className={s.clearBtn}
            onClick={() => setMessages([])}
          >
            {t("chat.clear")}
          </button>
        )}
      </div>

      <div className={s.main}>
        <div className={s.messages}>
          {messages.length === 0 && (
            <div className={s.empty}>
              <div className={s.emptyIcon}>💬</div>
              <p className={s.emptyTitle}>{t("chat.welcome_title")}</p>
              <p className={s.emptySubtitle}>{t("chat.welcome_subtitle")}</p>
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

          <div ref={bottomRef} />
        </div>

        <form
          className={s.inputRow}
          onSubmit={(e) => { e.preventDefault(); submit(); }}
        >
          <textarea
            ref={inputRef}
            className={s.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={t("chat.placeholder")}
            rows={2}
            disabled={loading}
            dir={isRtl ? "rtl" : "ltr"}
          />
          <button
            type="submit"
            className={s.sendBtn}
            disabled={loading || !input.trim()}
          >
            {loading ? "…" : "→"}
          </button>
        </form>

        <p className={s.disclaimer}>{t("chat.disclaimer")}</p>
      </div>
    </div>
  );
}
