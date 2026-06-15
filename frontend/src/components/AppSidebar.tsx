import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, MessageSquare, Calendar, Search,
  Users, Calculator, ClipboardList, Shield, FileText,
  LogOut, Briefcase, Inbox, Settings, User, Truck,
  ListChecks, Building2, Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { client as apiClient } from "../api/client";
import Wordmark from "./Wordmark";
import LangSwitch from "./LangSwitch";
import ThemeToggle from "./ThemeToggle";

export const SIDEBAR_W = 280;

function useUnreadCount(isAccountant: boolean, isClient: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isAccountant && !isClient) return;
    const url = isAccountant ? "/portal/inbox/" : "/portal/client/messages/unread-count/";
    const pick = (r: { data: { counts?: { unread_messages?: number }; count?: number } }) =>
      isAccountant ? (r.data.counts?.unread_messages ?? 0) : (r.data.count ?? 0);
    const poll = () => {
      apiClient.get(url).then(r => setCount(pick(r as never))).catch(() => null);
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [isAccountant, isClient]);
  return count;
}

// ── Nav item definitions ─────────────────────────────────────────────────────

interface NavItem { to: string; label: string; icon: React.ReactNode; end?: boolean }

function clientNav(t: (k: string) => string): NavItem[] {
  return [
    { to: "/dashboard",         label: t("nav.dashboard"),         icon: <LayoutDashboard size={15} />, end: true },
    { to: "/chat",              label: t("nav.chat"),              icon: <MessageSquare size={15} /> },
    { to: "/client",            label: "My Portal",                icon: <Briefcase size={15} />, end: true },
    { to: "/client/messages",   label: "Messages",                 icon: <MessageSquare size={15} />, end: true },
    { to: "/client/profile",    label: "My Profile",               icon: <User size={15} />, end: true },
    { to: "/zzp-workspace",     label: "ZZP Workspace",            icon: <Truck size={15} /> },
    { to: "/deduction-checker", label: t("nav.deduction_checker"), icon: <Search size={15} /> },
    { to: "/tax-calendar",      label: t("nav.tax_calendar"),      icon: <Calendar size={15} /> },
    { to: "/tax-history",       label: t("nav.tax_history"),       icon: <ClipboardList size={15} /> },
    { to: "/calculator",        label: "Calculator",               icon: <Calculator size={15} /> },
  ];
}

function accountantNav(): NavItem[] {
  return [
    { to: "/accountant/portal",       label: "Dashboard",     icon: <LayoutDashboard size={15} />, end: true },
    { to: "/accountant/review-queue", label: "Review Queue",  icon: <ListChecks size={15} /> },
    { to: "/accountant/inbox",        label: "Inbox",          icon: <Inbox size={15} /> },
    { to: "/chat",                    label: "Ask AI",         icon: <MessageSquare size={15} /> },
    { to: "/tax-calendar",            label: "Tax Calendar",   icon: <Calendar size={15} /> },
    { to: "/accountant/settings",     label: "Settings",       icon: <Settings size={15} /> },
  ];
}

function adminNav(): NavItem[] {
  return [
    { to: "/admin",                    label: "Overview",     icon: <Shield size={15} />,        end: true },
    { to: "/admin/users",              label: "Users",        icon: <Users size={15} /> },
    { to: "/admin/firms",              label: "Firms",        icon: <Building2 size={15} /> },
    { to: "/admin/rules",              label: "Tax Rules",    icon: <FileText size={15} /> },
    { to: "/admin/audit-logs",         label: "Audit Logs",   icon: <ClipboardList size={15} /> },
    { to: "/admin/ai-monitoring",      label: "AI Monitor",   icon: <Activity size={15} /> },
    { to: "/admin/chat-logs",          label: "Chat Logs",    icon: <MessageSquare size={15} /> },
    { to: "/admin/calculator-preview", label: "Calculator",   icon: <Calculator size={15} /> },
    { to: "/admin/rag-preview",        label: "RAG Preview",  icon: <Search size={15} /> },
    { to: "/admin/settings",           label: "Settings",     icon: <Settings size={15} /> },
  ];
}

// ── Inner content (always dark) ───────────────────────────────────────────────

interface SidebarContentProps { onNav?: () => void }

function SidebarContent({ onNav }: SidebarContentProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin      = !!user?.is_admin;
  const isAccountant = user?.role === "accountant";
  const isClient     = !!user && !isAdmin && !isAccountant;
  const items        = isAdmin ? adminNav() : isAccountant ? accountantNav() : clientNav(t);
  const sectionLabel = isAdmin ? "Admin" : isAccountant ? "Accountant" : "Menu";
  const unreadCount  = useUnreadCount(isAccountant, isClient);

  const initials = user
    ? (user.username?.[0] ?? user.email[0]).toUpperCase()
    : "?";

  function handleLogout() {
    logout();
    navigate("/");
    onNav?.();
  }

  return (
    // data-theme="dark" makes all CSS vars inside resolve to dark-mode values
    // so the sidebar is always dark regardless of the user's chosen theme.
    <div
      data-theme="dark"
      style={{
        width: SIDEBAR_W,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "oklch(0.13 0.018 265)",
        borderInlineEnd: "1px solid var(--border)",
        colorScheme: "dark",
        overflow: "hidden",
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <NavLink to={user ? "/dashboard" : "/"} onClick={onNav} style={{ textDecoration: "none", display: "inline-block" }}>
          <Wordmark size={15} dark />
        </NavLink>
      </div>

      {/* ── Nav items ────────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 8px 8px" }} aria-label="App navigation">
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
          color: "var(--text-4)", textTransform: "uppercase",
          padding: "0 12px", marginBottom: 6,
        }}>
          {sectionLabel}
        </div>

        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNav}
            className="sb-nav-item"
          >
            <span className="sb-nav-icon">{item.icon}</span>
            <span className="sb-nav-label">{item.label}</span>
            {/* Accountant inbox: number badge */}
            {item.to === "/accountant/inbox" && unreadCount > 0 && (
              <span style={{
                marginInlineStart: "auto",
                minWidth: 18, height: 18,
                borderRadius: 999,
                background: "var(--danger)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                flexShrink: 0,
              }}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            {/* Client messages: glowing dot — no number, just a presence signal */}
            {item.to === "/client/messages" && unreadCount > 0 && (
              <span style={{
                marginInlineStart: "auto",
                width: 8, height: 8,
                borderRadius: "50%",
                background: "var(--danger)",
                flexShrink: 0,
                boxShadow: "0 0 0 2px oklch(0.13 0.018 265), 0 0 6px var(--danger)",
              }} />
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom: lang / theme / user ──────────────────────────────────── */}
      <div style={{ padding: 8, borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "0 4px" }}>
          <LangSwitch />
          <ThemeToggle />
        </div>

        {user && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 10px", borderRadius: "var(--r-md)",
            background: "var(--bg-2)", border: "1px solid var(--border)",
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "var(--blue)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.username || user.email.split("@")[0]}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </div>
            </div>
            <button onClick={handleLogout} title="Log out" className="sb-logout-btn">
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Desktop sidebar ───────────────────────────────────────────────────────────

export function AppSidebarDesktop() {
  return (
    <div style={{ position: "sticky", top: 0, height: "100svh", flexShrink: 0 }}>
      <SidebarContent />
    </div>
  );
}

// ── Mobile drawer (controlled by AppLayout) ───────────────────────────────────

interface MobileDrawerProps { open: boolean; onClose: () => void }

export function AppSidebarMobileDrawer({ open, onClose }: MobileDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          zIndex: "var(--z-sidebar)" as unknown as number,
          background: "oklch(0 0 0 / 0.55)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 240ms",
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        zIndex: "calc(var(--z-sidebar) + 1)" as unknown as number,
        transform: open ? "translateX(0)" : `translateX(-${SIDEBAR_W}px)`,
        transition: "transform 240ms cubic-bezier(0.4,0,0.2,1)",
        boxShadow: "8px 0 40px oklch(0 0 0 / 0.5)",
        willChange: "transform",
      }}>
        <SidebarContent onNav={onClose} />
      </div>
    </>
  );
}
