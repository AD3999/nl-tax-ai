import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { useMobile } from "../hooks/useMobile";
import { AppSidebarDesktop, AppSidebarMobileDrawer } from "./AppSidebar";

// Pages that should fill the content area without padding (full-bleed)
const FULL_BLEED = new Set(["/chat"]);

export default function AppLayout() {
  const isMobile = useMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();
  const isFullBleed = FULL_BLEED.has(pathname);

  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      minHeight: "100svh",
      width: "100%",
      maxWidth: 1600,
      margin: "0 auto",
    }}>
      {/* ── Sidebar (desktop: always visible; mobile: drawer) ── */}
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
      }}>
        {/* Mobile topbar — only shown on small screens */}
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

            {/* Mini wordmark on mobile topbar */}
            <span style={{
              fontFamily: "var(--font)",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--text)",
            }}>
              Tax<span style={{ color: "var(--blue)" }}>Wijs</span>
            </span>
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
    </div>
  );
}
