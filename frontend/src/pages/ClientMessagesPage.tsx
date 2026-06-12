import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { PortalMessage } from "../api/portal/messages";
import { fetchClientMessages, sendClientMessage } from "../api/portal/messages";

export default function ClientMessagesPage() {
  const { i18n } = useTranslation();
  const isFA = i18n.language?.startsWith("fa");
  const isNL = i18n.language?.startsWith("nl");
  const dir  = isFA ? "rtl" : "ltr";

  const T = {
    title:       isFA ? "پیام‌های من" : isNL ? "Mijn berichten" : "My Messages",
    placeholder: isFA ? "پیام بنویسید…" : isNL ? "Bericht schrijven…" : "Write a message…",
    send:        isFA ? "ارسال" : isNL ? "Verzenden" : "Send",
    noMessages:  isFA ? "هنوز پیامی وجود ندارد" : isNL ? "Nog geen berichten" : "No messages yet",
    you:         isFA ? "شما" : isNL ? "Jij" : "You",
  };

  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [body, setBody]         = useState("");
  const [sending, setSending]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchClientMessages().then(setMessages).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = body.trim();
    if (!text) return;
    setSending(true);
    try {
      const msg = await sendClientMessage(text);
      setMessages(prev => [...prev, msg]);
      setBody("");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div dir={dir} style={{ maxWidth: 700, margin: "0 auto", padding: "var(--sp-6) var(--sp-4)", height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
      <h1 style={{ fontWeight: 800, fontSize: "1.6rem", marginBottom: "var(--sp-4)" }}>{T.title}</h1>

      {/* Message list */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--sp-3)", paddingRight: "var(--sp-2)" }}>
        {messages.length === 0 && (
          <div style={{ margin: "auto", color: "var(--text-3)", textAlign: "center" }}>{T.noMessages}</div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.is_own ? "flex-end" : "flex-start" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-3)", marginBottom: 2 }}>
              {m.is_own ? T.you : m.sender_name} · {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{
              maxWidth: "80%",
              padding: "var(--sp-3) var(--sp-4)",
              borderRadius: 14,
              background: m.is_own ? "var(--blue)" : "var(--bg-2)",
              color: m.is_own ? "#fff" : undefined,
              fontSize: "0.95rem",
              lineHeight: 1.5,
              wordBreak: "break-word",
            }}>
              {m.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ marginTop: "var(--sp-4)", display: "flex", gap: "var(--sp-3)", alignItems: "flex-end" }}>
        <textarea
          className="input"
          rows={2}
          style={{ flex: 1, resize: "none", fontFamily: "inherit" }}
          placeholder={T.placeholder}
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={sending || !body.trim()} style={{ minWidth: 80, height: 60 }}>
          {sending ? "…" : T.send}
        </button>
      </div>
    </div>
  );
}
