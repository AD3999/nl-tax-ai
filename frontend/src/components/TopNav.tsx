import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import Wordmark from "./Wordmark";
import LangSwitch from "./LangSwitch";
import ThemeToggle from "./ThemeToggle";
import { useMobile } from "../hooks/useMobile";

const NAV_ITEMS_GUEST = [
  { to: "/deduction-checker", labelKey: "nav.deduction_checker" },
  { to: "/chat",              labelKey: "nav.chat" },
] as const;

const NAV_ITEMS_AUTH = [
  { to: "/dashboard",         labelKey: "nav.dashboard" },
  { to: "/chat",              labelKey: "nav.chat" },
  { to: "/tax-calendar",      labelKey: "nav.tax_calendar" },
  { to: "/tax-history",       labelKey: "nav.tax_history" },
] as const;

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      {open ? (
        <>
          <line x1="3" y1="3" x2="17" y2="17" />
          <line x1="17" y1="3" x2="3" y2="17" />
        </>
      ) : (
        <>
          <line x1="2" y1="6"  x2="18" y2="6" />
          <line x1="2" y1="10" x2="18" y2="10" />
          <line x1="2" y1="14" x2="18" y2="14" />
        </>
      )}
    </svg>
  );
}

export default function TopNav() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isRtl = i18n.language === "fa";
  const isMobile = useMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navItems = user ? NAV_ITEMS_AUTH : NAV_ITEMS_GUEST;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [i18n.language]);

  function handleLogout() {
    logout();
    navigate("/");
    setMenuOpen(false);
  }

  function closeMenu() { setMenuOpen(false); }

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    display: "inline-flex",
    alignItems: "center",
    height: 44,
    padding: "0 8px",
    fontSize: "var(--text-sm)" as string,
    fontWeight: isActive ? 600 : 500,
    color: isActive ? "var(--ink)" : "var(--ink-3)",
    borderBottom: isActive ? "2px solid var(--ink)" : "2px solid transparent",
    textDecoration: "none",
    transition: "color .15s, border-color .15s",
    letterSpacing: "-0.01em",
  });

  return (
    <>
      <header
        dir={isRtl ? "rtl" : "ltr"}
        style={{
          height: 64,
          padding: isMobile ? "0 var(--sp-4)" : "0 var(--sp-8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid var(--hairline)",
          background: scrolled ? "var(--paper-glass)" : "var(--paper)",
          backdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
          boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.06)" : "none",
          transition: "background .25s, box-shadow .25s, border-color .25s",
          position: "sticky",
          top: 0,
          zIndex: 30,
          flexShrink: 0,
        }}
      >
        {/* Left: wordmark + nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 0 : 4 }}>
          <NavLink to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", marginInlineEnd: isMobile ? 0 : 20 }} onClick={closeMenu}>
            <Wordmark size={16} />
          </NavLink>

          {!isMobile && (
            <nav aria-label="Main navigation" style={{ display: "flex", alignItems: "center" }}>
              {navItems.map(item => (
                <NavLink key={item.to} to={item.to} style={navLinkStyle}>
                  {t(item.labelKey)}
                </NavLink>
              ))}
              {user?.is_admin && (
                <NavLink
                  to="/accountant/portal"
                  style={({ isActive }) => ({
                    ...navLinkStyle({ isActive }),
                    color: isActive ? "var(--ink)" : "var(--ink-4)",
                  })}
                >
                  Accountant
                </NavLink>
              )}
              {user && !user.is_admin && (
                <NavLink
                  to="/client"
                  style={({ isActive }) => ({
                    ...navLinkStyle({ isActive }),
                    color: isActive ? "var(--ink)" : "var(--ink-4)",
                  })}
                >
                  My Portal
                </NavLink>
              )}
              {user?.is_admin && (
                <NavLink
                  to="/admin"
                  end
                  style={({ isActive }) => ({
                    ...navLinkStyle({ isActive }),
                    color: isActive ? "var(--ink)" : "var(--ink-4)",
                  })}
                >
                  Admin
                </NavLink>
              )}
            </nav>
          )}
        </div>

        {/* Right: theme toggle + lang switch + auth + hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
          <ThemeToggle />
          <LangSwitch />

          {!isMobile && user ? (
            <>
              {user.plan === "premium" && (
                <span className="pill pill-accent">⚡ Premium</span>
              )}
              <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </span>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                {t("nav.logout")}
              </button>
            </>
          ) : !isMobile ? (
            <>
              <NavLink to="/login" style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)", textDecoration: "none", padding: "0 8px", height: 44, display: "inline-flex", alignItems: "center" }}>
                {t("nav.login")}
              </NavLink>
              <NavLink to="/register" className="btn btn-accent btn-sm" style={{ textDecoration: "none" }}>
                {t("auth.register")}
              </NavLink>
            </>
          ) : null}

          {/* Hamburger — mobile only */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              style={{
                background: "none",
                border: "1px solid var(--hairline-2)",
                borderRadius: "var(--r-sm)",
                width: 44,
                height: 44,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: "var(--ink)",
                flexShrink: 0,
              }}
            >
              <HamburgerIcon open={menuOpen} />
            </button>
          )}
        </div>
      </header>

      {/* Mobile dropdown — always mounted so slide animation works */}
      {isMobile && (
        <>
          <div
            id="mobile-nav-backdrop"
            onClick={closeMenu}
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              top: 64,
              zIndex: 25,
              background: "rgba(0,0,0,0.20)",
              opacity: menuOpen ? 1 : 0,
              pointerEvents: menuOpen ? "auto" : "none",
              transition: "opacity .22s",
            }}
          />
          <nav
            id="mobile-nav"
            dir={isRtl ? "rtl" : "ltr"}
            aria-label="Mobile navigation"
            role="navigation"
            style={{
              position: "fixed",
              top: 64,
              left: 0,
              right: 0,
              zIndex: 26,
              background: "var(--paper)",
              borderBottom: "1px solid var(--hairline)",
              paddingBottom: 16,
              boxShadow: "var(--shadow)",
              transform: menuOpen ? "translateY(0)" : "translateY(-10px)",
              opacity: menuOpen ? 1 : 0,
              pointerEvents: menuOpen ? "auto" : "none",
              transition: "transform .24s cubic-bezier(0.4,0,0.2,1), opacity .2s",
            }}
          >
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  height: 52,
                  padding: "0 var(--sp-5)",
                  fontSize: "var(--text-md)",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--sage-700)" : "var(--ink-2)",
                  textDecoration: "none",
                  background: isActive ? "var(--accent-soft)" : "transparent",
                  borderInlineStart: isActive ? "3px solid var(--sage-600)" : "3px solid transparent",
                })}
              >
                {t(item.labelKey)}
              </NavLink>
            ))}

            {user?.is_admin && (
              <NavLink
                to="/accountant/portal"
                onClick={closeMenu}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", height: 52,
                  padding: "0 var(--sp-5)", fontSize: "var(--text-md)", fontWeight: 500,
                  color: isActive ? "var(--sage-700)" : "var(--ink-3)", textDecoration: "none",
                  background: isActive ? "var(--accent-soft)" : "transparent",
                  borderInlineStart: isActive ? "3px solid var(--sage-600)" : "3px solid transparent",
                })}
              >
                Accountant
              </NavLink>
            )}
            {user && !user.is_admin && (
              <NavLink
                to="/client"
                onClick={closeMenu}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", height: 52,
                  padding: "0 var(--sp-5)", fontSize: "var(--text-md)", fontWeight: 500,
                  color: isActive ? "var(--sage-700)" : "var(--ink-3)", textDecoration: "none",
                  background: isActive ? "var(--accent-soft)" : "transparent",
                  borderInlineStart: isActive ? "3px solid var(--sage-600)" : "3px solid transparent",
                })}
              >
                My Portal
              </NavLink>
            )}
            {user?.is_admin && (
              <NavLink
                to="/admin"
                onClick={closeMenu}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  height: 52,
                  padding: "0 var(--sp-5)",
                  fontSize: "var(--text-md)",
                  fontWeight: 500,
                  color: isActive ? "var(--sage-700)" : "var(--ink-3)",
                  textDecoration: "none",
                  background: isActive ? "var(--accent-soft)" : "transparent",
                  borderInlineStart: isActive ? "3px solid var(--sage-600)" : "3px solid transparent",
                })}
              >
                Admin
              </NavLink>
            )}

            <div style={{ margin: "10px var(--sp-5)", height: 1, background: "var(--hairline)" }} />

            {user ? (
              <div style={{ padding: "6px var(--sp-5)" }}>
                {user.plan === "premium" && (
                  <div style={{ marginBottom: 10 }}>
                    <span className="pill pill-accent">⚡ Premium</span>
                  </div>
                )}
                <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginBottom: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </div>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                  {t("nav.logout")}
                </button>
              </div>
            ) : (
              <div style={{ padding: "6px var(--sp-5)", display: "flex", gap: 10 }}>
                <NavLink to="/login" onClick={closeMenu} className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>
                  {t("nav.login")}
                </NavLink>
                <NavLink to="/register" onClick={closeMenu} className="btn btn-accent btn-sm" style={{ textDecoration: "none" }}>
                  {t("auth.register")}
                </NavLink>
              </div>
            )}
          </nav>
        </>
      )}
    </>
  );
}
