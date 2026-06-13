/* TaxWijs — shared components */

const cn = (...xs) => xs.filter(Boolean).join(" ");

// ─── Brand mark ──────────────────────────────────────────────
function Wordmark({ size = 18, dark = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={size + 2} height={size + 2} viewBox="0 0 24 24" fill="none">
        <path d="M3 6 L12 3 L21 6 V11 C21 16.5 16.5 20.5 12 22 C7.5 20.5 3 16.5 3 11 Z"
          fill={dark ? "var(--sage-400)" : "var(--sage-600)"} />
        <path d="M8 11.5 L11 14.5 L16.5 8.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span style={{
        fontFamily: "var(--serif)", fontSize: size + 4, lineHeight: 1, color: dark ? "white" : "var(--ink)",
        letterSpacing: "-0.02em"
      }}>
        TaxWijs
      </span>
    </div>
  );
}

// ─── Top nav (desktop) ──────────────────────────────────────
function TopNav({ active = "home", user = null, tone = "paper" }) {
  const items = [
    { id: "ask",    label: "Ask" },
    { id: "calc",   label: "Calculator" },
    { id: "ib",     label: "IB Return" },
    { id: "sim",    label: "Simulation" },
    { id: "price",  label: "Pricing" },
  ];
  return (
    <header style={{
      height: 64, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: "1px solid var(--hairline)",
      background: tone === "paper" ? "var(--paper)" : "transparent",
      position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <Wordmark size={16} />
        <nav style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {items.map(it => (
            <a key={it.id} className={cn("nav-link")}
              style={{
                fontSize: 13.5, fontWeight: 500,
                color: active === it.id ? "var(--ink)" : "var(--ink-3)",
                borderBottom: active === it.id ? "1px solid var(--ink)" : "1px solid transparent",
                paddingBottom: 2,
              }}>
              {it.label}
            </a>
          ))}
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <LangSwitch />
        {user
          ? (<>
              {user.premium && <span className="pill pill-accent">⚡ Premium</span>}
              <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{user.email}</span>
            </>)
          : (<>
              <a style={{ fontSize: 13, color: "var(--ink-3)" }}>Log in</a>
              <button className="btn btn-accent btn-sm">Get started</button>
            </>)
        }
      </div>
    </header>
  );
}

// ─── Lang switcher ──────────────────────────────────────────
function LangSwitch({ value = "en" }) {
  const langs = ["NL", "EN", "FA"];
  return (
    <div style={{
      display: "inline-flex", padding: 2,
      background: "var(--paper-3)", borderRadius: 999, border: "1px solid var(--hairline)"
    }}>
      {langs.map(l => (
        <span key={l} style={{
          padding: "4px 10px", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
          borderRadius: 999,
          background: l.toLowerCase() === value ? "var(--ink)" : "transparent",
          color: l.toLowerCase() === value ? "var(--paper)" : "var(--ink-3)",
        }}>{l}</span>
      ))}
    </div>
  );
}

// ─── Mobile shell (phone-sized frame) ────────────────────────
function MobileFrame({ children, time = "9:41", showStatus = true, bg = "var(--paper)" }) {
  return (
    <div className="mobile-frame" style={{ background: bg }}>
      {showStatus && (
        <div className="statusbar">
          <span>{time}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
              <rect x="0" y="3" width="3" height="7" rx="1" fill="currentColor"/>
              <rect x="4.5" y="2" width="3" height="8" rx="1" fill="currentColor"/>
              <rect x="9" y="1" width="3" height="9" rx="1" fill="currentColor"/>
              <rect x="13.5" y="0" width="3" height="10" rx="1" fill="currentColor" opacity="0.4"/>
            </svg>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <path d="M7 8.5a1 1 0 100-2 1 1 0 000 2zM3.5 5.5a5 5 0 017 0M1 3a8.5 8.5 0 0112 0" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round"/>
            </svg>
            <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
              <rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="currentColor"/>
              <rect x="2" y="2" width="14" height="6" rx="1" fill="currentColor"/>
              <rect x="20" y="3.5" width="1.5" height="3" rx="0.5" fill="currentColor"/>
            </svg>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Mobile top bar (phone nav) ──────────────────────────────
function MobileTopBar({ title, back, action, sub }) {
  return (
    <div style={{
      padding: "10px 16px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: "1px solid var(--hairline)", background: "var(--paper)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {back ? (
          <button style={{
            width: 32, height: 32, borderRadius: 999, border: "1px solid var(--hairline)",
            background: "var(--paper)", display: "grid", placeItems: "center"
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : <Wordmark size={14} />}
        {title && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{title}</div>
            {sub && <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{sub}</div>}
          </div>
        )}
      </div>
      {action || <LangSwitch />}
    </div>
  );
}

// ─── Mobile tab bar (bottom) ─────────────────────────────────
function MobileTabBar({ active = "home" }) {
  const tabs = [
    { id: "home",   label: "Home",    icon: "M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z" },
    { id: "ask",    label: "Ask",     icon: "M21 12a9 9 0 11-3.3-6.95L21 3v6h-6" },
    { id: "calc",   label: "Calc",    icon: "M5 3h14v18H5zM8 7h8M8 11h2M12 11h2M16 11h.01M8 15h2M12 15h2M16 15h.01M8 19h2M12 19h6" },
    { id: "ib",     label: "Return",  icon: "M8 3v4M16 3v4M4 9h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" },
    { id: "me",     label: "You",     icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" },
  ];
  return (
    <div style={{
      position: "sticky", bottom: 0, left: 0, right: 0,
      borderTop: "1px solid var(--hairline)", background: "var(--paper)",
      padding: "8px 8px 14px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4
    }}>
      {tabs.map(t => (
        <div key={t.id} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 0",
          color: active === t.id ? "var(--ink)" : "var(--ink-4)"
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d={t.icon} />
          </svg>
          <span style={{ fontSize: 10, fontWeight: 500 }}>{t.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Generic icons ──────────────────────────────────────────
const Icon = {
  arrow: (p = {}) => <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  check: (p = {}) => <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>,
  x:     (p = {}) => <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M6 18L18 6"/></svg>,
  spark: (p = {}) => <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M18.4 5.6l-4.2 4.2M9.8 14.2l-4.2 4.2"/></svg>,
  chev:  (p = {}) => <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>,
  edit:  (p = {}) => <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4l6 6L8 22H2v-6z"/></svg>,
  info:  (p = {}) => <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>,
  external: (p = {}) => <svg {...p} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6M10 14L20 4M19 13v6a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1h6"/></svg>,
};

// Profile/user type definitions
const USER_TYPES = {
  zzp:      { label: "ZZP",      glyph: "ZZ", desc: "Freelance · self-employed",   color: "var(--sage-600)" },
  employee: { label: "Employee", glyph: "EM", desc: "Salaried · payslip",          color: "oklch(0.55 0.12 230)" },
  expat:    { label: "Expat",    glyph: "EX", desc: "30% ruling · foreign income", color: "oklch(0.62 0.13 50)" },
  dga:      { label: "DGA",      glyph: "DG", desc: "Director · own BV",           color: "oklch(0.55 0.10 290)" },
};

Object.assign(window, {
  cn, Wordmark, TopNav, LangSwitch,
  MobileFrame, MobileTopBar, MobileTabBar,
  Icon, USER_TYPES,
});
