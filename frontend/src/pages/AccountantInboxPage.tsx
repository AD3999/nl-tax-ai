import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageSquare } from "lucide-react";
import { client as apiClient } from "../api/client";
import { fetchEngagementMessages } from "../api/portal/messages";
import { formatDate } from "../lib/utils";
import { useMobile } from "../hooks/useMobile";

interface InboxData {
  counts: {
    pending_docs: number;
    open_actions: number;
    unread_messages: number;
  };
  pending_docs: Array<{ id: number; client_name: string; file_name: string; uploaded_at: string; status: string }>;
  open_actions: Array<{ id: number; client_name: string; action_type: string; description: string; due_date: string | null }>;
  recent_reminders: Array<{ id: number; client_name: string; reminder_type: string; channel: string; created_at: string; delivered: boolean }>;
  unread_messages: Array<{ id: number; engagement: number; client_name: string; body: string; created_at: string }>;
}

export default function AccountantInboxPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const isFA = i18n.language?.startsWith("fa");
  const isNL = i18n.language?.startsWith("nl");

  const [data, setData] = useState<InboxData | null>(null);
  const [loading, setLoading] = useState(true);

  function refresh() {
    apiClient.get<InboxData>("/portal/inbox/")
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { refresh(); }, []);

  const T = {
    title:       isFA ? "صندوق ورودی" : isNL ? "Inbox" : "Inbox",
    pendingDocs: isFA ? "اسناد در انتظار" : isNL ? "Wachtende documenten" : "Pending Documents",
    openActions: isFA ? "اقدامات باز" : isNL ? "Open acties" : "Open Actions",
    unreadMsg:   isFA ? "پیام‌های خوانده نشده" : isNL ? "Ongelezen berichten" : "Unread Messages",
    reminders:   isFA ? "یادآوری‌های اخیر" : isNL ? "Recente herinneringen" : "Recent Reminders",
    noItems:     isFA ? "موردی وجود ندارد" : isNL ? "Geen items" : "No items",
    allDone:     isFA ? "همه چیز به‌روز است" : isNL ? "Alles is bijgewerkt" : "All caught up",
    allDoneSub:  isFA ? "هیچ اقدامی در انتظار نیست" : isNL ? "Geen acties in behandeling" : "No pending actions",
    open:        isFA ? "باز کردن ↗" : isNL ? "Openen ↗" : "Open ↗",
  };

  const handleOpenMessage = async (m: InboxData["unread_messages"][0]) => {
    // Optimistic: remove from local state immediately so badge clears
    setData(prev => prev ? {
      ...prev,
      unread_messages: prev.unread_messages.filter(um => um.id !== m.id),
      counts: { ...prev.counts, unread_messages: Math.max(0, prev.counts.unread_messages - 1) },
    } : prev);
    // Pre-mark as read on server (the GET endpoint marks unread → read)
    try { await fetchEngagementMessages(m.engagement); } catch { /* ignore */ }
    navigate(`/accountant/engagements/${m.engagement}?tab=messages`);
  };

  if (loading) return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div className="skel" style={{ height: 400, borderRadius: "var(--r-lg)" }} />
    </div>
  );

  const msgs         = data?.unread_messages ?? [];
  const pendingDocs  = data?.pending_docs ?? [];
  const openActions  = data?.open_actions ?? [];
  const reminders    = data?.recent_reminders ?? [];
  const counts       = data?.counts ?? { pending_docs: 0, open_actions: 0, unread_messages: 0 };

  const allEmpty = msgs.length === 0 && pendingDocs.length === 0 && openActions.length === 0 && reminders.length === 0;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ fontWeight: 800, fontSize: "var(--text-2xl)", marginBottom: "var(--sp-6)", color: "var(--text)" }}>{T.title}</h1>

      {/* KPI row — always visible */}
      <div style={{ display: "flex", gap: "var(--sp-2)", marginBottom: "var(--sp-6)", flexWrap: "wrap" }}>
        {[
          { label: T.unreadMsg,   count: counts.unread_messages, color: "var(--blue)" },
          { label: T.pendingDocs, count: counts.pending_docs,    color: "var(--warn)" },
          { label: T.openActions, count: counts.open_actions,    color: "var(--ok)" },
        ].map(({ label, count, color }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: "var(--sp-3)",
            padding: isMobile ? "var(--sp-3) var(--sp-3)" : "var(--sp-3) var(--sp-5)",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            borderInlineStart: `3px solid ${color}`,
            flex: isMobile ? "1 1 0" : "0 0 auto",
            minWidth: 0,
          }}>
            <span style={{ fontSize: "var(--text-2xl)", fontWeight: 900, color, lineHeight: 1 }}>{count}</span>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-2)" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* All-empty state */}
      {allEmpty && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "var(--sp-3)", padding: "var(--sp-10) var(--sp-6)", textAlign: "center",
          background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "var(--ok-subtle)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "1.4rem" }}>✓</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "var(--text-md)", color: "var(--text)" }}>{T.allDone}</div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", marginTop: 4 }}>{T.allDoneSub}</div>
          </div>
        </div>
      )}

      {/* Unread messages — shown only when there are messages */}
      {msgs.length > 0 && (
        <Section title={T.unreadMsg} count={msgs.length} accent="var(--blue)" isMobile={isMobile}>
          {msgs.map(m => (
            <button
              key={m.id}
              onClick={() => void handleOpenMessage(m)}
              style={{
                display: "flex", alignItems: "center", gap: "var(--sp-3)",
                width: "100%", padding: isMobile ? "var(--sp-3) var(--sp-3)" : "var(--sp-3) var(--sp-4)",
                background: "transparent", border: "none",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer", textAlign: "start",
                transition: "background 0.12s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-3)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: "var(--blue-subtle)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MessageSquare size={16} style={{ color: "var(--blue)" }} />
              </div>
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text)", marginBottom: 2 }}>
                  {m.client_name}
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.body}
                </div>
              </div>
              {/* Date + action */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-4)" }}>
                  {formatDate(m.created_at)}
                </span>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--blue)" }}>{T.open}</span>
              </div>
            </button>
          ))}
        </Section>
      )}

      {/* Pending documents — shown only when there are some */}
      {pendingDocs.length > 0 && (
        <Section title={T.pendingDocs} count={pendingDocs.length} accent="var(--warn)" isMobile={isMobile}>
          {pendingDocs.map(d => (
            <Row key={d.id} isMobile={isMobile}>
              <Cell bold>{d.client_name}</Cell>
              <Cell>{d.file_name}</Cell>
              <Cell muted>{formatDate(d.uploaded_at)}</Cell>
              <Cell><span className="pill-blue">{d.status}</span></Cell>
            </Row>
          ))}
        </Section>
      )}

      {/* Open actions — shown only when there are some */}
      {openActions.length > 0 && (
        <Section title={T.openActions} count={openActions.length} accent="var(--ok)" isMobile={isMobile}>
          {openActions.map(a => (
            <Row key={a.id} isMobile={isMobile}>
              <Cell bold>{a.client_name}</Cell>
              <Cell>{a.description}</Cell>
              <Cell muted>{a.due_date ? formatDate(a.due_date) : "—"}</Cell>
            </Row>
          ))}
        </Section>
      )}

      {/* Recent reminders — shown only when there are some */}
      {reminders.length > 0 && (
        <Section title={T.reminders} count={reminders.length} accent="var(--text-4)" isMobile={isMobile}>
          {reminders.map(r => (
            <Row key={r.id} isMobile={isMobile}>
              <Cell bold>{r.client_name}</Cell>
              <Cell>{r.reminder_type}</Cell>
              <Cell muted>{r.channel}</Cell>
              <Cell muted>{formatDate(r.created_at)}</Cell>
              <Cell>
                <span style={{ color: r.delivered ? "var(--ok)" : "var(--text-3)", fontSize: "0.85rem" }}>
                  {r.delivered ? "✓" : "—"}
                </span>
              </Cell>
            </Row>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, count, accent, children, isMobile }: {
  title: string; count: number; accent: string; children: React.ReactNode; isMobile?: boolean;
}) {
  return (
    <div className="card" style={{ marginBottom: "var(--sp-4)", overflow: "hidden" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "var(--sp-3)",
        padding: isMobile ? "var(--sp-3) var(--sp-3)" : "var(--sp-4) var(--sp-5)",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-3)",
      }}>
        <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text)", flex: 1 }}>{title}</span>
        <span style={{
          fontSize: "var(--text-xs)", fontWeight: 700,
          padding: "2px 8px", borderRadius: 999,
          background: accent, color: "#fff",
        }}>{count}</span>
      </div>
      {children}
    </div>
  );
}

function Row({ children, onClick, isMobile }: { children: React.ReactNode; onClick?: () => void; isMobile?: boolean }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", gap: "var(--sp-3)", alignItems: "center", flexWrap: isMobile ? "wrap" : "nowrap",
        padding: isMobile ? "var(--sp-3) var(--sp-3)" : "var(--sp-3) var(--sp-5)", borderBottom: "1px solid var(--border)",
        cursor: onClick ? "pointer" : "default",
        transition: "background 0.1s",
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = "var(--bg-3)"; }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.background = ""; }}
    >
      {children}
    </div>
  );
}

function Cell({ children, bold, muted }: { children: React.ReactNode; bold?: boolean; muted?: boolean }) {
  return (
    <div style={{ flex: 1, fontWeight: bold ? 600 : 400, color: muted ? "var(--text-3)" : undefined, fontSize: "var(--text-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {children}
    </div>
  );
}
