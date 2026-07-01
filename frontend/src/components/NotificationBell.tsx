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
  invitation_accepted:  "🤝",
  invitation_declined:  "❌",
  system:               "🔔",
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Strip an absolute origin from action_url so react-router navigate() gets a path.
// Backend stores "/client/messages" (relative) but guard against full URLs too.
function toRelativePath(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin === window.location.origin) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
  } catch { /* already relative */ }
  return url.startsWith("/") ? url : `/${url}`;
}

export default function NotificationBell() {
  const { user }      = useAuth();
  const { showToast } = useToast();
  const navigate      = useNavigate();

  const [open, setOpen]       = useState(false);
  const [count, setCount]     = useState(0);
  const [items, setItems]     = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const [wsConnected, setWsConnected] = useState(false);

  const prevCountRef    = useRef(0);
  const initializedRef  = useRef(false);
  const reconnectDelay  = useRef(1000);
  const reconnectTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Two refs: one for the bell button, one for the portal panel.
  // The outside-click handler must check BOTH — without this, every click
  // inside the portal looks like an "outside click" and fires before onClick.
  const bellRef     = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wsRef       = useRef<WebSocket | null>(null);

  // ── Polling fallback ─────────────────────────────────────────────
  const fetchCount = useCallback(async () => {
    if (!user) return;
    try {
      const n = await getUnreadCount();
      if (initializedRef.current && n > prevCountRef.current) {
        showToast("You have a new notification", "success");
      }
      initializedRef.current = true;
      prevCountRef.current   = n;
      setCount(n);
    } catch { /* silent */ }
  }, [user, showToast]);

  // ── WebSocket (primary) + polling fallback + exponential reconnect ───────────────────────
  useEffect(() => {
    if (!user) return;

    fetchCount();

    const token = localStorage.getItem("access_token");
    if (!token) {
      const id = setInterval(fetchCount, 15_000);
      return () => clearInterval(id);
    }

    let pollingId: ReturnType<typeof setInterval> | null = null;
    let destroyed = false;

    function startPolling() {
      setWsConnected(false);
      if (!pollingId) pollingId = setInterval(fetchCount, 15_000);
    }

    function connect() {
      if (destroyed) return;
      const wsProto = window.location.protocol === "https:" ? "wss" : "ws";
      const wsHost  = import.meta.env.VITE_API_URL
        ? new URL(import.meta.env.VITE_API_URL as string).host
        : window.location.host;
      const ws = new WebSocket(`${wsProto}://${wsHost}/ws/notifications/?token=${encodeURIComponent(token as string)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        reconnectDelay.current = 1000;
        if (pollingId) { clearInterval(pollingId); pollingId = null; }
      };

      ws.onmessage = (evt: MessageEvent) => {
        try {
          const data = JSON.parse(evt.data as string) as { id?: number; title?: string; metadata?: { event?: string } };
          showToast(data.title ?? "You have a new notification", "success");
          setCount(c => c + 1);
          prevCountRef.current += 1;
          setItems(prev => {
            if (prev.length === 0) return prev;
            if (data.id && prev.some(n => n.id === data.id)) return prev;
            return [{ ...data, is_read: false } as AppNotification, ...prev];
          });
          if (data.metadata?.event === "client_reactivated") {
            window.dispatchEvent(new CustomEvent("portal:client_reactivated"));
          }
          if (data.metadata?.event === "client_deactivated") {
            window.dispatchEvent(new CustomEvent("portal:client_deactivated"));
          }
        } catch { /* ignore malformed frames */ }
      };

      ws.onerror = () => { startPolling(); };

      ws.onclose = () => {
        startPolling();
        // Exponential back-off reconnect: 1s → 2s → 4s → … → max 30s
        const delay = Math.min(reconnectDelay.current, 30_000);
        reconnectDelay.current = delay * 2;
        reconnectTimer.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); wsRef.current = null; }
      if (pollingId) clearInterval(pollingId);
    };
  }, [user, fetchCount, showToast]);

  // ── Load list when panel opens ────────────────────────────────────
  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    getNotifications()
      .then(setItems)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [open, user]);

  // ── Outside-click: close panel ───────────────────────────────────
  // Must check BOTH the bell wrapper AND the portal dropdown, because
  // the portal renders to document.body and is outside bellRef's subtree.
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      const insideBell     = bellRef.current?.contains(target)     ?? false;
      const insideDropdown = dropdownRef.current?.contains(target) ?? false;
      if (!insideBell && !insideDropdown) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Handlers ─────────────────────────────────────────────────────
  function handleOpen() {
    setOpen(o => !o);
    // Badge count is NOT cleared on open — only on markAllRead or server poll
  }

  async function handleMarkAllRead() {
    await markAllRead();
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    setCount(0);
    prevCountRef.current = 0;
  }

  function handleClick(notif: AppNotification) {
    // 1. Mark as read in-place so the item stays visible without the blue dot
    setItems(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));

    // 2. Decrement badge count for unread notifications immediately
    if (!notif.is_read) {
      setCount(c => Math.max(0, c - 1));
      prevCountRef.current = Math.max(0, prevCountRef.current - 1);
      markRead(notif.id).catch(() => null);
    }

    // 3. Close panel and navigate
    setOpen(false);
    if (notif.action_url) {
      navigate(toRelativePath(notif.action_url));
    }
  }

  if (!user) return null;

  return (
    <div ref={bellRef} style={{ position: "relative" }}>
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
        {!wsConnected && localStorage.getItem("access_token") && (
          <span title="Real-time disconnected — polling" style={{
            position: "absolute", bottom: -2, right: -2,
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--ink-4)",
            border: "1px solid var(--bg)",
          }} />
        )}
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

      {/* ── Dropdown panel (portal to escape sidebar stacking context) ── */}
      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: 52,
            right: 12,
            width: 340,
            maxHeight: 480,
            background: "var(--glass-heavy)",
            backdropFilter: "blur(36px) saturate(220%)",
            WebkitBackdropFilter: "blur(36px) saturate(220%)",
            border: "1px solid var(--border-2)",
            borderRadius: "var(--r-xl)",
            boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.08), var(--sh-lg)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "fadeDown 0.18s cubic-bezier(0.4,0,0.2,1)",
            transformOrigin: "top right",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text)" }}>
              Notifications
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {items.some(n => !n.is_read) && (
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
                No notifications
              </div>
            )}
            {!loading && items.map(notif => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                style={{
                  width: "100%", textAlign: "left",
                  border: "none", borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  padding: "12px 16px",
                  display: "flex", gap: 10, alignItems: "flex-start",
                  background: notif.is_read ? "transparent" : "oklch(0.55 0.18 243 / 0.12)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.55 0.18 243 / 0.18)")}
                onMouseLeave={e => (e.currentTarget.style.background = notif.is_read ? "transparent" : "oklch(0.55 0.18 243 / 0.12)")}
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
