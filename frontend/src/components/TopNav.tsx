import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import Wordmark from "./Wordmark";
import LangSwitch from "./LangSwitch";
import { useMobile } from "../hooks/useMobile";

const NAV_ITEMS_GUEST = [
  { to: "/chat",       labelKey: "nav.chat" },
  { to: "/pricing",    labelKey: "nav.pricing" },
] as const;

const NAV_ITEMS_AUTH = [
  { to: "/dashboard",  labelKey: "nav.dashboard" },
  { to: "/chat",       labelKey: "nav.chat" },
  { to: "/ib-guide",   labelKey: "ib.nav" },
  { to: "/simulation", labelKey: "nav.simulation" },
  { to: "/pricing",    labelKey: "nav.pricing" },
] as const;

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      {open ? (
        <>
          <line x1="4" y1="4" x2="18" y2="18" />
          <line x1="18" y1="4" x2="4" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="7" x2="19" y2="7" />
          <line x1="3" y1="11" x2="19" y2="11" />
          <line x1="3" y1="15" x2="19" y2="15" />
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
  const navItems = user ? NAV_ITEMS_AUTH : NAV_ITEMS_GUEST;

  function handleLogout() {
    logout();
    navigate("/");
    setMenuOpen(false);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <header
        dir={isRtl ? "rtl" : "ltr"}
        style={{
          height: 64,
          padding: isMobile ? "0 16px" : "0 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--hairline)",
          background: "var(--paper)",
          position: "sticky",
          top: 0,
          zIndex: 30,
          flexShrink: 0,
        }}
      >
        {/* Left: wordmark + nav links (links hidden on mobile) */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 0 : 32 }}>
          <NavLink to="/" style={{ textDecoration: "none" }} onClick={closeMenu}>
            <Wordmark size={16} />
          </NavLink>
          {!isMobile && (
            <nav style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: isActive ? "var(--ink)" : "var(--ink-3)",
                    borderBottom: isActive ? "1px solid var(--ink)" : "1px solid transparent",
                    paddingBottom: 2,
                    textDecoration: "none",
                    transition: "color .15s",
                  })}
                >
                  {"labelKey" in item ? t(item.labelKey) : item.label}
                </NavLink>
              ))}
              {user?.is_admin && (
                <NavLink
                  to="/admin"
                  style={({ isActive }) => ({
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: isActive ? "var(--ink)" : "var(--ink-4)",
                    borderBottom: isActive ? "1px solid var(--ink)" : "1px solid transparent",
                    paddingBottom: 2,
                    textDecoration: "none",
                  })}
                >
                  Admin
                </NavLink>
              )}
            </nav>
          )}
        </div>

        {/* Right: lang switch + auth + hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 14 }}>
          <LangSwitch />
          {!isMobile && user ? (
            <>
              {user.plan === "premium" && (
                <span className="pill pill-accent">⚡ Premium</span>
              )}
              <span style={{ fontSize: 13, color: "var(--ink-3)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </span>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                {t("nav.logout")}
              </button>
            </>
          ) : !isMobile ? (
            <>
              <NavLink
                to="/login"
                style={{ fontSize: 13, color: "var(--ink-3)", textDecoration: "none" }}
              >
                {t("nav.login")}
              </NavLink>
              <NavLink to="/register" className="btn btn-accent btn-sm" style={{ textDecoration: "none" }}>
                {t("auth.register")}
              </NavLink>
            </>
          ) : null}

          {/* Hamburger button — mobile only */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                background: "none",
                border: "1px solid var(--hairline-2)",
                borderRadius: "var(--r-sm)",
                width: 36,
                height: 36,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: "var(--ink)",
              }}
              aria-label="Menu"
            >
              <HamburgerIcon open={menuOpen} />
            </button>
          )}
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeMenu}
            style={{
              position: "fixed",
              inset: 0,
              top: 64,
              zIndex: 25,
              background: "rgba(0,0,0,0.18)",
            }}
          />
          {/* Menu panel */}
          <div
            dir={isRtl ? "rtl" : "ltr"}
            style={{
              position: "fixed",
              top: 64,
              left: 0,
              right: 0,
              zIndex: 26,
              background: "var(--paper)",
              borderBottom: "1px solid var(--hairline)",
              padding: "12px 0 16px",
              boxShadow: "var(--shadow)",
            }}
          >
            {/* Nav links */}
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                style={({ isActive }) => ({
                  display: "block",
                  padding: "12px 20px",
                  fontSize: 15,
                  fontWeight: 500,
                  color: isActive ? "var(--sage-700)" : "var(--ink-2)",
                  textDecoration: "none",
                  background: isActive ? "var(--accent-soft)" : "transparent",
                })}
              >
                {"labelKey" in item ? t(item.labelKey) : item.label}
              </NavLink>
            ))}

            {user?.is_admin && (
              <NavLink
                to="/admin"
                onClick={closeMenu}
                style={({ isActive }) => ({
                  display: "block",
                  padding: "12px 20px",
                  fontSize: 15,
                  fontWeight: 500,
                  color: isActive ? "var(--sage-700)" : "var(--ink-3)",
                  textDecoration: "none",
                })}
              >
                Admin
              </NavLink>
            )}

            {/* Divider */}
            <div style={{ margin: "10px 20px", height: 1, background: "var(--hairline)" }} />

            {/* Auth area */}
            {user ? (
              <div style={{ padding: "6px 20px" }}>
                {user.plan === "premium" && (
                  <div style={{ marginBottom: 8 }}>
                    <span className="pill pill-accent">⚡ Premium</span>
                  </div>
                )}
                <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </div>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                  {t("nav.logout")}
                </button>
              </div>
            ) : (
              <div style={{ padding: "6px 20px", display: "flex", gap: 10 }}>
                <NavLink
                  to="/login"
                  onClick={closeMenu}
                  className="btn btn-ghost btn-sm"
                  style={{ textDecoration: "none" }}
                >
                  {t("nav.login")}
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={closeMenu}
                  className="btn btn-accent btn-sm"
                  style={{ textDecoration: "none" }}
                >
                  {t("auth.register")}
                </NavLink>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
