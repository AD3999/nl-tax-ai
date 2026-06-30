import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useMobile } from "../hooks/useMobile";
import { AppSidebarDesktop, AppSidebarMobileDrawer } from "./AppSidebar";
import BottomNav from "./BottomNav";
import NotificationBell from "./NotificationBell";
import { useAuth } from "../context/AuthContext";

// Pages that should fill the content area without padding (full-bleed)
const FULL_BLEED = new Set(["/chat", "/client/messages"]);

// Pages that belong to the client role — bottom nav is shown on these
const CLIENT_PATHS = ["/dashboard", "/client", "/chat", "/intake", "/tax-history", "/tax-calendar", "/calculator", "/deduction-checker", "/zzp-workspace"];

export default function AppLayout() {
  const isMobile = useMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const { pathname } = location;
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // ── Authentication guard ──────────────────────────────────────────────────
  // AuthContext sets loading=false once it has tried to resolve the profile.
  // If loading completes and user is still null the visitor is unauthenticated.
  // Redirect them to /login and preserve the current path as ?next= so after
  // login the user lands where they were going.
  useEffect(() => {
    if (loading) return;          // still resolving — wait
    if (!user) {
      const next = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?next=${next}`, { replace: true });
    }
  }, [user, loading, navigate, location.pathname, location.search]);
  // ──────────────────────────────────────────────────────────────────────────

  const isFullBleed = FULL_BLEED.has(pathname);

  // Show bottom nav only for client role on mobile
  const isAdmin      = !!user?.is_admin;
  const isAccountant = user?.role === "accountant";
  const isClientRole = !isAdmin && !isAccountant;
  const isClientPath = CLIENT_PATHS.some(p => pathname.startsWith(p));
  const showBottomNav = isMobile && isClientRole && isClientPath;

  // Show a minimal loading state while AuthContext resolves the profile.
  // This prevents a jarring flash of empty sidebar before the redirect fires.
  if (loading) {
    return (
      <div style={{
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
      }}>
        <div
          className="skel"
          style={{ width: 40, height: 40, borderRadius: "50%" }}
        />
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      minHeight: "100svh",
      width: "100%",
      maxWidth: 1600,
      margin: "0 auto",
    }}>
      {/* ── Sidebar: desktop always visible; mobile: drawer for all roles ── */}
      {!isMobile && <AppSidebarDesktop />}
      {isMobile && (
        <AppSidebarMobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      )}

      {/* ── Main content area ── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: "100svh",
        paddingBottom: showBottomNav ? 60 : 0,
      }}>
        {/* Mobile topbar */}
        {isMobile && (
          <div style={{
            height: 52,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 12,
            background: "var(--bg)",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}>
            {/* Always available: bottom nav only covers 5 frequent client destinations,
                everything else (Calculator, Tax Calendar, ZZP Workspace, etc.) lives here. */}
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              style={{
                width: 36, height: 36, borderRadius: 8,
                border: "1px solid var(--border-2)",
                background: "transparent",
                color: "var(--text-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Menu size={16} />
            </button>

            <span style={{
              fontFamily: "var(--font)",
              fontSize: "var(--text-sm)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--text)",
              flex: 1,
            }}>
              Tax<span style={{ color: "var(--blue)" }}>Wijs</span>
            </span>
            <NotificationBell />
          </div>
        )}

        {/* Page content */}
        <div style={isFullBleed ? { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" } : {
          flex: 1,
          padding: isMobile ? "var(--sp-4)" : "var(--sp-8)",
          maxWidth: "100%",
          boxSizing: "border-box",
          overflowY: "auto",
        }}>
          <Outlet />
        </div>
      </div>

      {/* ── Client mobile bottom navigation ── */}
      {showBottomNav && <BottomNav />}
    </div>
  );
}
