import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bell, X, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getNotifications, getUnreadCount, markRead, markAllRead,
  type AppNotification,
} from "../api/notifications";

const TYPE_ICONS: Record<string, string> = {
  message_received:    "💬",
  document_uploaded:   "📄",
  document_approved:   "✅",
  document_rejected:   "❌",
  checklist_update:    "📋",
  readiness_milestone: "🎯",
  engagement_ready:    "🏁",
  invitation_sent:     "✉️",
  invitation_accepted: "🤝",
  system:              "🔔",
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)  return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [open, setOpen]           = useState(false);
  const [count, setCount]         = useState(0);
  const [items, setItems]         = useState<AppNotification[]>([]);
  const [loading, setLoading]     = useState(false);
  const prevCountRef              = useRef(0);
  const initializedRef            = useRef(false); // skip toast on first mount poll
  const panelRef                  = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(async () => {
    if (!user) return;
    try {
      const n = await getUnreadCount();
      // Show toast when count increases during the session (not on first mount)
      if (initializedRef.current && n > prevCountRef.current) {
        showToast("You have a new notification", "success");
      }
      initializedRef.current = true;
      prevCountRef.current = n;
      setCount(n);
    } catch { /* silent */ }
  }, [user, showToast]);

  // Poll unread count every 30s
  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  }, [fetchCount]);

  // Load full list when panel opens
  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    getNotifications()
      .then(setItems)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [open, user]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function handleMarkAllRead() {
    await markAllRead();
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    setCount(0);
    prevCountRef.current = 0;
  }

  async function handleClick(notif: AppNotification) {
    // Close panel first so navigation feels instant
    setOpen(false);
    // Mark as read (fire-and-forget — don't block navigation)
    if (!notif.is_read) {
      markRead(notif.id).catch(() => null);
      setItems(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    // Navigate to the relevant page
    if (notif.action_url) {
      navigate(notif.action_url);
    }
  }

  function handleOpen() {
    const opening = !open;
    setOpen(o => !o);
    // Clear badge the moment user opens the panel
    if (opening && count > 0) {
      setCount(0);
      prevCountRef.current = 0;
    }
  }

  if (!user) return null;

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* ── Bell button ── */}
      <button
        onClick={handleOpen}
        title="Notifications"
        style={{
          position: "relative",
          width: 32, height: 32,
          borderRadius: "var(--r-sm)",
          border: "1px solid var(--border-2)",
          background: open ? "var(--bg-2)" : "transparent",
          color: "var(--text-2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <Bell size={15} />
        {count > 0 && (
          <span style={{
            position: "absolute",
            top: -5, right: -5,
            minWidth: 16, height: 16,
            borderRadius: 999,
            background: "var(--danger)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 3px",
            lineHeight: 1,
            border: "2px solid var(--bg)",
          }}>
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* ── Dropdown panel — rendered in a portal so it escapes sidebar overflow/stacking ── */}
      {open && createPortal(
        <div style={{
          position: "fixed",
          top: 52,
          right: 12,
          width: 340,
          maxHeight: 480,
          background: "var(--bg)",
          border: "1px solid var(--border-2)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--sh-lg)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text)" }}>
              Notifications {count > 0 && <span style={{ color: "var(--danger)" }}>({count})</span>}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {count > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4,
                    fontSize: "var(--text-xs)", padding: "2px 6px", borderRadius: 4,
                  }}
                >
                  <CheckCheck size={12} /> All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex", alignItems: "center" }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading && (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-4)", fontSize: "var(--text-sm)" }}>
                Loading…
              </div>
            )}
            {!loading && items.length === 0 && (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-4)", fontSize: "var(--text-sm)" }}>
                <Bell size={28} style={{ opacity: 0.25, display: "block", margin: "0 auto 8px" }} />
                No notifications yet
              </div>
            )}
            {!loading && items.map(notif => (
              <button
                key={notif.id}
                onClick={() => void handleClick(notif)}
                style={{
                  width: "100%", textAlign: "left",
                  border: "none", borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  padding: "12px 16px",
                  display: "flex", gap: 10, alignItems: "flex-start",
                  background: notif.is_read ? "transparent" : "var(--blue-subtle, oklch(0.97 0.01 243))",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-2)")}
                onMouseLeave={e => (e.currentTarget.style.background = notif.is_read ? "transparent" : "var(--blue-subtle, oklch(0.97 0.01 243))")}
              >
                <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>
                  {TYPE_ICONS[notif.notification_type] ?? "🔔"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "var(--text-sm)", fontWeight: notif.is_read ? 500 : 700,
                    color: "var(--text)", lineHeight: 1.3, marginBottom: 2,
                  }}>
                    {notif.title}
                  </div>
                  {notif.body && (
                    <div style={{
                      fontSize: "var(--text-xs)", color: "var(--text-3)",
                      lineHeight: 1.4,
                      overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                      {notif.body}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: "var(--text-4)", marginTop: 4 }}>
                    {timeAgo(notif.created_at)}
                  </div>
                </div>
                {!notif.is_read && (
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "var(--blue)", flexShrink: 0, marginTop: 5,
                  }} />
                )}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
