import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import Wordmark from "./Wordmark";
import LangSwitch from "./LangSwitch";
import ThemeToggle from "./ThemeToggle";
import { useMobile } from "../hooks/useMobile";

// Landing page marketing nav (shown only on /)
const LANDING_NAV: Record<string, { to: string; label: string }[]> = {
  nl: [
    { to: "/zzp-tax-netherlands",   label: "ZZP Gids" },
    { to: "/expat-tax-netherlands", label: "Expat Gids" },
    { to: "/dga-tax-netherlands",   label: "DGA Gids" },
    { to: "/chat",                  label: "AI Assistent" },
  ],
  en: [
    { to: "/zzp-tax-netherlands",   label: "ZZP Guide" },
    { to: "/expat-tax-netherlands", label: "Expat Guide" },
    { to: "/dga-tax-netherlands",   label: "DGA Guide" },
    { to: "/chat",                  label: "AI Assistant" },
  ],
  fa: [
    { to: "/zzp-tax-netherlands",   label: "راهنمای ZZP" },
    { to: "/expat-tax-netherlands", label: "راهنمای اکسپت" },
    { to: "/dga-tax-netherlands",   label: "راهنمای DGA" },
    { to: "/chat",                  label: "دستیار هوش مصنوعی" },
  ],
};

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
  const { pathname } = useLocation();
  const isRtl = i18n.language === "fa";
  const isMobile = useMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHomePage = pathname === "/";
  const lang = i18n.language as "nl" | "en" | "fa";
  const navItems = user ? NAV_ITEMS_AUTH : NAV_ITEMS_GUEST;
  const landingItems = LANDING_NAV[lang] ?? LANDING_NAV.en;

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

  return (
    <>
      <header
        dir={isRtl ? "rtl" : "ltr"}
        style={{
          height: 60,
          padding: isMobile ? "0 var(--sp-4)" : "0 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
          background: scrolled ? "var(--paper-glass)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          boxShadow: scrolled ? "0 1px 0 var(--border)" : "none",
          transition: "background .3s, box-shadow .3s, border-color .3s",
          position: "sticky",
          top: 0,
          zIndex: 30,
          flexShrink: 0,
        }}
      >
        {/* Left: wordmark */}
        <NavLink to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }} onClick={closeMenu}>
          <Wordmark size={15} />
        </NavLink>

        {/* Centre: nav links (desktop) */}
        {!isMobile && (
          <nav aria-label="Main navigation" style={{
            display: "flex", alignItems: "center",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: 999,
            padding: "3px 4px",
            gap: 2,
          }}>
            {(isHomePage && !user ? landingItems : navItems).map(item => (
              <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
                display: "inline-flex", alignItems: "center", height: 32,
                padding: "0 14px",
                fontSize: "var(--text-sm)", fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--text)" : "var(--text-3)",
                borderRadius: 999,
                background: isActive ? "var(--bg)" : "transparent",
                boxShadow: isActive ? "var(--sh-sm)" : "none",
                textDecoration: "none",
                transition: "all .15s",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
              })}>
                {"label" in item ? item.label : t(item.labelKey)}
              </NavLink>
            ))}
            {(user?.role === "accountant" || user?.is_admin) && (
              <NavLink to="/accountant/portal" style={({ isActive }) => ({
                display: "inline-flex", alignItems: "center", height: 32, padding: "0 14px",
                fontSize: "var(--text-sm)", fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--text)" : "var(--text-3)",
                borderRadius: 999, background: isActive ? "var(--bg)" : "transparent",
                boxShadow: isActive ? "var(--sh-sm)" : "none",
                textDecoration: "none", transition: "all .15s",
              })}>Accountant</NavLink>
            )}
            {user && user.role !== "accountant" && !user.is_admin && (
              <NavLink to="/client" style={({ isActive }) => ({
                display: "inline-flex", alignItems: "center", height: 32, padding: "0 14px",
                fontSize: "var(--text-sm)", fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--text)" : "var(--text-3)",
                borderRadius: 999, background: isActive ? "var(--bg)" : "transparent",
                boxShadow: isActive ? "var(--sh-sm)" : "none",
                textDecoration: "none", transition: "all .15s",
              })}>My Portal</NavLink>
            )}
            {user?.is_admin && (
              <NavLink to="/admin" end style={({ isActive }) => ({
                display: "inline-flex", alignItems: "center", height: 32, padding: "0 14px",
                fontSize: "var(--text-sm)", fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--text)" : "var(--text-3)",
                borderRadius: 999, background: isActive ? "var(--bg)" : "transparent",
                boxShadow: isActive ? "var(--sh-sm)" : "none",
                textDecoration: "none", transition: "all .15s",
              })}>Admin</NavLink>
            )}
          </nav>
        )}

        {/* Right: controls + auth */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ThemeToggle />
          <LangSwitch />

          {!isMobile && (
            <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />
          )}

          {!isMobile && user ? (
            <>
              {user.plan === "premium" && (
                <span className="pill pill-accent">⚡</span>
              )}
              <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ fontSize: "var(--text-sm)" }}>
                {t("nav.logout")}
              </button>
            </>
          ) : !isMobile ? (
            <>
              <NavLink to="/login" style={{
                fontSize: "var(--text-sm)", color: "var(--text-3)", textDecoration: "none",
                padding: "0 12px", height: 36, display: "inline-flex", alignItems: "center",
                borderRadius: 999, fontWeight: 500,
                transition: "color .15s",
              }}>
                {t("nav.login")}
              </NavLink>
              <NavLink to="/register" className="btn btn-accent btn-sm" style={{ textDecoration: "none", borderRadius: 999 }}>
                {t("auth.register")}
              </NavLink>
              {isHomePage && (
                <NavLink to="/register?role=accountant" className="btn btn-ghost btn-sm" style={{ textDecoration: "none", borderRadius: 999, marginInlineStart: 4 }}>
                  {lang === "nl" ? "Demo boeken" : lang === "fa" ? "رزرو دمو" : "Book Demo"}
                </NavLink>
              )}
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
                background: "var(--glass-heavy)",
                backdropFilter: "blur(24px) saturate(200%)",
                WebkitBackdropFilter: "blur(24px) saturate(200%)",
                border: "1px solid var(--border-2)",
                borderRadius: "var(--r-sm)",
                boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.12), var(--sh-sm)",
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: "var(--text)",
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
              background: "oklch(0 0 0 / 0.5)",
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
              background: "var(--glass-heavy)",
              backdropFilter: "blur(36px) saturate(220%)",
              WebkitBackdropFilter: "blur(36px) saturate(220%)",
              borderBottom: "1px solid var(--border-2)",
              boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.10), var(--sh-lg)",
              paddingBottom: 16,
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
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? "var(--blue-text)" : "var(--text-2)",
                  textDecoration: "none",
                  background: isActive ? "var(--blue-subtle)" : "transparent",
                  borderInlineStart: isActive ? "3px solid var(--blue)" : "3px solid transparent",
                })}
              >
                {t(item.labelKey)}
              </NavLink>
            ))}

            {(user?.role === "accountant" || user?.is_admin) && (
              <NavLink
                to="/accountant/portal"
                onClick={closeMenu}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", height: 52,
                  padding: "0 var(--sp-5)", fontSize: "var(--text-md)", fontWeight: isActive ? 700 : 600,
                  color: isActive ? "var(--blue-text)" : "var(--text-2)", textDecoration: "none",
                  background: isActive ? "var(--blue-subtle)" : "transparent",
                  borderInlineStart: isActive ? "3px solid var(--blue)" : "3px solid transparent",
                })}
              >
                Accountant
              </NavLink>
            )}
            {user && user.role !== "accountant" && !user.is_admin && (
              <NavLink
                to="/client"
                onClick={closeMenu}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", height: 52,
                  padding: "0 var(--sp-5)", fontSize: "var(--text-md)", fontWeight: isActive ? 700 : 600,
                  color: isActive ? "var(--blue-text)" : "var(--text-2)", textDecoration: "none",
                  background: isActive ? "var(--blue-subtle)" : "transparent",
                  borderInlineStart: isActive ? "3px solid var(--blue)" : "3px solid transparent",
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
                  display: "flex", alignItems: "center", height: 52,
                  padding: "0 var(--sp-5)", fontSize: "var(--text-md)", fontWeight: isActive ? 700 : 600,
                  color: isActive ? "var(--blue-text)" : "var(--text-2)", textDecoration: "none",
                  background: isActive ? "var(--blue-subtle)" : "transparent",
                  borderInlineStart: isActive ? "3px solid var(--blue)" : "3px solid transparent",
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
