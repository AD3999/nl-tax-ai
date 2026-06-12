import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";
import type { PortalMessage } from "../api/portal/messages";
import { fetchClientMessages, sendClientMessage } from "../api/portal/messages";

export default function ClientMessagesPage() {
  const { i18n } = useTranslation();
  const isFA = i18n.language?.startsWith("fa");
  const isNL = i18n.language?.startsWith("nl");
  const dir  = isFA ? "rtl" : "ltr";

  const T = {
    title:       isFA ? "پیام‌های من" : isNL ? "Mijn berichten" : "Messages",
    subtitle:    isFA ? "چت با حسابدار شما" : isNL ? "Chat met uw accountant" : "Chat with your accountant",
    placeholder: isFA ? "پیامی بنویسید…" : isNL ? "Schrijf een bericht…" : "Write a message…",
    send:        isFA ? "ارسال" : isNL ? "Verstuur" : "Send",
    noMessages:  isFA ? "هنوز هیچ پیامی وجود ندارد" : isNL ? "Nog geen berichten" : "No messages yet",
    noMessagesSub: isFA ? "وقتی حسابدار شما پیامی بفرستد، اینجا نمایش داده می‌شود" : isNL ? "Wanneer uw accountant een bericht stuurt, verschijnt het hier" : "When your accountant sends a message, it will appear here",
    you:         isFA ? "شما" : isNL ? "U" : "You",
  };

  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [body, setBody]         = useState("");
  const [sending, setSending]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchClientMessages().then(setMessages).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const msg = await sendClientMessage(text);
      setMessages(prev => [...prev, msg]);
      setBody("");
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return isFA ? "امروز" : isNL ? "Vandaag" : "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return isFA ? "دیروز" : isNL ? "Gisteren" : "Yesterday";
    return d.toLocaleDateString(isFA ? "fa-IR" : isNL ? "nl-NL" : "en-GB", { day: "numeric", month: "long" });
  }

  // Group messages by day
  const grouped: { dateLabel: string; msgs: PortalMessage[] }[] = [];
  for (const m of messages) {
    const label = formatDate(m.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.dateLabel === label) {
      last.msgs.push(m);
    } else {
      grouped.push({ dateLabel: label, msgs: [m] });
    }
  }

  return (
    <div
      dir={dir}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: "var(--sp-4) var(--sp-6)",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-3)",
      }}>
        {/* Avatar */}
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: "var(--blue)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.8rem", fontWeight: 700, color: "#fff",
          flexShrink: 0,
        }}>
          AC
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.2 }}>{T.title}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: 1 }}>{T.subtitle}</div>
        </div>
      </div>

      {/* ── Message list ── */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "var(--sp-5) var(--sp-6)",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--sp-3)",
            textAlign: "center",
            paddingBottom: "var(--sp-8)",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "var(--bg-3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.4rem",
            }}>
              💬
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>{T.noMessages}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-3)", marginTop: 4, maxWidth: 280 }}>{T.noMessagesSub}</div>
            </div>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.dateLabel}>
              {/* Day separator */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-3)",
                margin: "var(--sp-4) 0",
              }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{
                  fontSize: "0.72rem", fontWeight: 700,
                  color: "var(--text-4)",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                }}>
                  {group.dateLabel}
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              {/* Messages in this group */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                {group.msgs.map(m => {
                  const isOwn = m.is_own;
                  return (
                    <div key={m.id} style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isOwn ? (isFA ? "flex-start" : "flex-end") : (isFA ? "flex-end" : "flex-start"),
                      gap: 2,
                    }}>
                      {/* Sender label */}
                      <span style={{
                        fontSize: "0.7rem",
                        color: "var(--text-4)",
                        fontWeight: 600,
                        paddingInline: 4,
                      }}>
                        {isOwn ? T.you : m.sender_name} · {formatTime(m.created_at)}
                      </span>
                      {/* Bubble */}
                      <div style={{
                        maxWidth: "72%",
                        padding: "var(--sp-3) var(--sp-4)",
                        borderRadius: isOwn
                          ? (isFA ? "16px 16px 16px 4px" : "16px 16px 4px 16px")
                          : (isFA ? "16px 16px 4px 16px" : "16px 16px 16px 4px"),
                        background: isOwn ? "var(--blue)" : "var(--bg-3)",
                        color: isOwn ? "#fff" : "var(--text)",
                        fontSize: "0.9rem",
                        lineHeight: 1.5,
                        wordBreak: "break-word",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                      }}>
                        {m.body}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div style={{
        padding: "var(--sp-3) var(--sp-6)",
        borderTop: "1px solid var(--border)",
        flexShrink: 0,
        background: "var(--bg)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "var(--sp-2)",
          background: "var(--bg-2)",
          border: "1.5px solid var(--border-2)",
          borderRadius: 14,
          padding: "var(--sp-2) var(--sp-3)",
          transition: "border-color 0.15s",
        }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = "var(--blue)")}
          onBlurCapture={e => (e.currentTarget.style.borderColor = "var(--border-2)")}
        >
          <textarea
            ref={inputRef}
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "inherit",
              fontSize: "0.95rem",
              color: "var(--text)",
              lineHeight: 1.5,
              padding: "6px 4px",
              maxHeight: 120,
              overflowY: "auto",
            }}
            placeholder={T.placeholder}
            value={body}
            onChange={e => {
              setBody(e.target.value);
              // Auto-resize
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSend}
            disabled={sending || !body.trim()}
            style={{
              width: 36, height: 36,
              borderRadius: 10,
              border: "none",
              background: body.trim() ? "var(--blue)" : "var(--bg-3)",
              color: body.trim() ? "#fff" : "var(--text-4)",
              cursor: body.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {sending
              ? <span style={{ fontSize: 14 }}>…</span>
              : <Send size={15} />
            }
          </button>
        </div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-4)", marginTop: 6, textAlign: "center" }}>
          {isFA ? "Enter برای ارسال — Shift+Enter برای خط جدید" :
           isNL ? "Enter om te verzenden — Shift+Enter voor nieuwe regel" :
           "Enter to send · Shift+Enter for new line"}
        </div>
      </div>
    </div>
  );
}
