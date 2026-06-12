import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { client as apiClient } from "../api/client";

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
  const isFA = i18n.language?.startsWith("fa");
  const isNL = i18n.language?.startsWith("nl");

  const [data, setData] = useState<InboxData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<InboxData>("/portal/inbox/")
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const T = {
    title:       isFA ? "صندوق ورودی حسابدار" : isNL ? "Accountant Inbox" : "Accountant Inbox",
    pendingDocs: isFA ? "اسناد در انتظار" : isNL ? "Wachtende documenten" : "Pending Documents",
    openActions: isFA ? "اقدامات باز" : isNL ? "Open acties" : "Open Actions",
    unreadMsg:   isFA ? "پیام‌های خوانده نشده" : isNL ? "Ongelezen berichten" : "Unread Messages",
    reminders:   isFA ? "یادآوری‌های اخیر" : isNL ? "Recente herinneringen" : "Recent Reminders",
    noItems:     isFA ? "موردی وجود ندارد" : isNL ? "Geen items" : "No items",
    client:      isFA ? "مشتری" : isNL ? "Klant" : "Client",
    type:        isFA ? "نوع" : isNL ? "Type" : "Type",
    body:        isFA ? "پیام" : isNL ? "Bericht" : "Message",
    date:        isFA ? "تاریخ" : isNL ? "Datum" : "Date",
    delivered:   isFA ? "تحویل داده شد" : isNL ? "Bezorgd" : "Delivered",
    channel:     isFA ? "کانال" : isNL ? "Kanaal" : "Channel",
  };

  if (loading) return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "var(--sp-6) var(--sp-4)" }}>
      <div className="skel" style={{ height: 400 }} />
    </div>
  );

  const counts = data?.counts ?? { pending_docs: 0, open_actions: 0, unread_messages: 0 };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "var(--sp-6) var(--sp-4)" }}>
      <h1 style={{ fontWeight: 800, fontSize: "1.8rem", marginBottom: "var(--sp-6)" }}>{T.title}</h1>

      {/* KPI pills */}
      <div style={{ display: "flex", gap: "var(--sp-4)", marginBottom: "var(--sp-6)", flexWrap: "wrap" }}>
        {[
          { label: T.pendingDocs, count: counts.pending_docs, color: "var(--amber, #f39c12)" },
          { label: T.openActions, count: counts.open_actions, color: "var(--blue)" },
          { label: T.unreadMsg,   count: counts.unread_messages, color: "var(--green)" },
        ].map(({ label, count, color }) => (
          <div key={label} className="card" style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", minWidth: 180, borderLeft: `3px solid ${color}` }}>
            <span style={{ fontSize: "1.6rem", fontWeight: 900, color }}>{count}</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Pending documents */}
      <Section title={T.pendingDocs}>
        {(data?.pending_docs ?? []).length === 0
          ? <Empty label={T.noItems} />
          : (data?.pending_docs ?? []).map(d => (
            <Row key={d.id}>
              <Cell bold>{d.client_name}</Cell>
              <Cell>{d.file_name}</Cell>
              <Cell muted>{new Date(d.uploaded_at).toLocaleDateString()}</Cell>
              <Cell><span className="pill-blue">{d.status}</span></Cell>
            </Row>
          ))
        }
      </Section>

      {/* Open actions */}
      <Section title={T.openActions}>
        {(data?.open_actions ?? []).length === 0
          ? <Empty label={T.noItems} />
          : (data?.open_actions ?? []).map(a => (
            <Row key={a.id}>
              <Cell bold>{a.client_name}</Cell>
              <Cell>{a.description}</Cell>
              <Cell muted>{a.due_date ? new Date(a.due_date).toLocaleDateString() : "—"}</Cell>
            </Row>
          ))
        }
      </Section>

      {/* Unread messages */}
      <Section title={T.unreadMsg}>
        {(data?.unread_messages ?? []).length === 0
          ? <Empty label={T.noItems} />
          : (data?.unread_messages ?? []).map(m => (
            <Row key={m.id}>
              <Cell bold>{m.client_name}</Cell>
              <Cell>{m.body.substring(0, 80)}{m.body.length > 80 ? "…" : ""}</Cell>
              <Cell muted>{new Date(m.created_at).toLocaleDateString()}</Cell>
            </Row>
          ))
        }
      </Section>

      {/* Recent reminders */}
      <Section title={T.reminders}>
        {(data?.recent_reminders ?? []).length === 0
          ? <Empty label={T.noItems} />
          : (data?.recent_reminders ?? []).map(r => (
            <Row key={r.id}>
              <Cell bold>{r.client_name}</Cell>
              <Cell>{r.reminder_type}</Cell>
              <Cell muted>{r.channel}</Cell>
              <Cell muted>{new Date(r.created_at).toLocaleDateString()}</Cell>
              <Cell><span style={{ color: r.delivered ? "var(--green)" : "var(--text-3)", fontSize: "0.85rem" }}>{r.delivered ? "✓" : "—"}</span></Cell>
            </Row>
          ))
        }
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: "var(--sp-5)" }}>
      <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "var(--sp-3)", paddingBottom: "var(--sp-3)", borderBottom: "1px solid var(--border)" }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "var(--sp-4)", alignItems: "center", padding: "var(--sp-2) 0", borderBottom: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}

function Cell({ children, bold, muted }: { children: React.ReactNode; bold?: boolean; muted?: boolean }) {
  return (
    <div style={{ flex: 1, fontWeight: bold ? 600 : 400, color: muted ? "var(--text-3)" : undefined, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {children}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div style={{ color: "var(--text-3)", padding: "var(--sp-4)", textAlign: "center", fontSize: "0.9rem" }}>{label}</div>;
}
