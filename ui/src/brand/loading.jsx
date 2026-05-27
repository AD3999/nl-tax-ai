/* TaxWijs — Loading screens · 3 directions */

// Direction 1 · CALM SPLASH — full-bleed paper with the mark gently pulsing,
// a thin progress bar at the bottom, an editorial tagline rotating in.
function LoadingCalm() {
  const [tip, setTip] = React.useState(0);
  const tips = [
    "Verifying 2026 rules…",
    "Loading your saved profile…",
    "Connecting calculator engine…",
    "Almost there…",
  ];
  const [pct, setPct] = React.useState(8);
  React.useEffect(() => {
    const a = setInterval(() => setPct(p => p < 92 ? p + Math.random() * 6 : p), 320);
    const b = setInterval(() => setTip(t => (t + 1) % tips.length), 1700);
    return () => { clearInterval(a); clearInterval(b); };
  }, []);

  return (
    <div className="tw" style={{ width: "100%", height: "100%", background: "var(--paper)", display: "grid", placeItems: "center", position: "relative", overflow: "hidden" }}>
      {/* paper grain */}
      <div style={{ position: "absolute", inset: 0,
        background: "radial-gradient(60% 50% at 80% 0%, oklch(0.95 0.05 115 / 0.55), transparent 60%), radial-gradient(50% 40% at 0% 100%, oklch(0.95 0.03 95 / 0.6), transparent 60%)" }} />
      <div style={{ position: "relative", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        <div style={{ position: "relative" }}>
          {/* concentric breathing rings */}
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: "absolute", inset: 0, margin: "auto",
              width: 120, height: 120, borderRadius: 999,
              border: "1px solid var(--sage-300)",
              animation: `breath 2.6s ease-out ${i * 0.6}s infinite`,
              opacity: 0,
            }} />
          ))}
          <MarkShield size={120} />
          {/* drawing-on check overlay */}
          <svg width={120} height={120} viewBox="0 0 64 64" style={{ position: "absolute", inset: 0 }}>
            <path d="M20 32 L29 41 L46 22"
              stroke="white" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" fill="none"
              strokeDasharray="44" strokeDashoffset="44"
              style={{ animation: "draw 2.4s ease-out forwards infinite" }}
            />
          </svg>
        </div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 32, color: "var(--ink)", letterSpacing: "-0.02em" }}>
          TaxWijs
        </div>
        <div style={{ height: 18, position: "relative", overflow: "hidden", width: 280 }}>
          {tips.map((t, i) => (
            <div key={i} style={{
              position: "absolute", inset: 0, fontSize: 13, color: "var(--ink-3)",
              textAlign: "center",
              transform: `translateY(${(i - tip) * 18}px)`,
              opacity: i === tip ? 1 : 0,
              transition: "all .35s ease-out",
            }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Bottom progress */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 4, background: "var(--paper-3)" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "var(--sage-600)", transition: "width .35s" }} />
      </div>
      <div style={{ position: "absolute", left: 24, bottom: 14, fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-4)", letterSpacing: "0.06em" }}>
        TAXWIJS · 2026 · v2.4
      </div>
      <div style={{ position: "absolute", right: 24, bottom: 14, fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-4)" }}>
        {Math.floor(pct)}%
      </div>

      <style>{`
        @keyframes breath { 0% { transform: scale(.7); opacity: .7; } 80% { opacity: 0; } 100% { transform: scale(2); opacity: 0; } }
        @keyframes draw { 0% { stroke-dashoffset: 44; } 60% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
}

// Direction 2 · COMPILING — verifier console aesthetic. Lines of "rule checked"
// scroll past below a smaller mark, with the tax-brain coming alive.
function LoadingCompiling() {
  const RULES = [
    "ZZP-2026-ZELFAFTREK         · verified",
    "ZZP-2026-MKB                · verified",
    "EMP-2026-IACK               · verified",
    "EMP-2026-AKORT              · verified",
    "EXP-2026-RULING-Y2          · verified",
    "DGA-2026-BOX2               · verified",
    "ALL-2026-BOX3               · verified",
    "ALL-2026-WOZ                · verified",
    "ZZP-2026-DBA                · verified",
    "EMP-2026-HK                 · verified",
    "ZZP-2026-START              · verified",
    "EXP-2026-PARTIAL-NR         · verified",
  ];
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setN(v => v < RULES.length ? v + 1 : v), 280);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="tw" style={{ width: "100%", height: "100%", background: "var(--ink)", color: "var(--paper)", display: "grid", placeItems: "center", padding: 32 }}>
      <div style={{ width: "min(560px, 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <MarkShield size={48} bg="var(--sage-400)" bg2="var(--sage-500)" />
          <div>
            <div className="eyebrow" style={{ color: "var(--sage-300)" }}>Booting tax brain</div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 26, color: "white", letterSpacing: "-0.015em", marginTop: 2 }}>TaxWijs</div>
          </div>
        </div>
        <div style={{ marginTop: 22, padding: 18, background: "rgba(255,255,255,0.04)", borderRadius: "var(--r)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span className="eyebrow" style={{ color: "var(--sage-300)" }}>Verifying rules</span>
            <span className="font-mono" style={{ fontSize: 11, color: "oklch(0.78 0.01 95)" }}>
              {n}/{RULES.length}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, height: 200, overflow: "hidden", position: "relative" }}>
            {RULES.map((r, i) => (
              <div key={i} style={{
                opacity: i < n ? 1 : 0.18,
                fontFamily: "var(--mono)", fontSize: 11.5, color: i < n ? "oklch(0.92 0.05 115)" : "oklch(0.6 0.01 95)",
                transition: "opacity .25s", display: "flex", justifyContent: "space-between"
              }}>
                <span>{r.split("·")[0].trim()}</span>
                <span style={{ color: i < n ? "var(--sage-300)" : "oklch(0.5 0.01 95)" }}>{i < n ? "✓ verified" : "…"}</span>
              </div>
            ))}
          </div>
          {/* bar */}
          <div style={{ marginTop: 14, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(n / RULES.length) * 100}%`, background: "var(--sage-400)", transition: "width .25s" }} />
          </div>
        </div>
        <div style={{ marginTop: 14, fontFamily: "var(--mono)", fontSize: 11, color: "oklch(0.7 0.01 95)" }}>
          $ taxwijs --year 2026 --validate
        </div>
      </div>
    </div>
  );
}

// Direction 3 · ANSWER-FORMING — a question chip slides in, then a sparkline
// of "your numbers" assembles itself, telegraphing the product. Most distinctive.
function LoadingAnswer() {
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 5), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="tw" style={{ width: "100%", height: "100%", background: "var(--paper-tint)", display: "grid", placeItems: "center", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0,
        background: "radial-gradient(50% 40% at 50% 30%, oklch(0.95 0.06 115 / 0.45), transparent 60%)" }} />
      <div style={{ position: "relative", width: "min(480px, 92%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
          <MarkShield size={40} />
          <span style={{ fontFamily: "var(--serif)", fontSize: 26, color: "var(--ink)", letterSpacing: "-0.02em" }}>TaxWijs</span>
        </div>

        {/* Composing card */}
        <div className="card" style={{ marginTop: 26, padding: 18, borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-lg)" }}>
          {/* Q chip */}
          <div style={{ display: "flex", justifyContent: "flex-end", opacity: step >= 0 ? 1 : 0, transform: `translateY(${step >= 0 ? 0 : 6}px)`, transition: "all .35s" }}>
            <div style={{ padding: "8px 14px", borderRadius: 16, background: "var(--ink)", color: "var(--paper)", fontSize: 13 }}>
              Loading your tax brain…
            </div>
          </div>

          {/* Answer skeleton */}
          <div style={{ marginTop: 12, padding: 14, background: "var(--paper-3)", borderRadius: "var(--r-sm)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 22, height: 22, borderRadius: 999, background: "var(--sage-100)", color: "var(--sage-700)", display: "grid", placeItems: "center", fontFamily: "var(--serif)", fontSize: 11 }}>T</span>
              <Dots />
            </div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {[80, 92, 60].map((w, i) => (
                <Bar key={i} w={w} visible={step >= i + 1} />
              ))}
            </div>
            {/* numbers */}
            <div style={{ marginTop: 12, padding: 10, background: "var(--paper)", borderRadius: 6, border: "1px dashed var(--accent-line)", opacity: step >= 4 ? 1 : 0.2, transition: "opacity .4s" }}>
              <div className="eyebrow eyebrow-accent" style={{ fontSize: 9.5 }}>Your numbers</div>
              <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "1fr auto", rowGap: 4, fontSize: 12 }}>
                <span>Revenue</span><span className="num">€ 72,000</span>
                <span>Tax due</span><span className="num" style={{ color: "var(--sage-700)" }}>€ 12,974</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, textAlign: "center" }}>
          <div className="eyebrow eyebrow-accent">{["Connecting…","Reading your profile…","Loading 2026 rules…","Calculating…","Almost there…"][step]}</div>
        </div>
      </div>
    </div>
  );
}

function Dots() {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ width: 5, height: 5, borderRadius: 999, background: "var(--ink-3)", animation: `dot 1.2s ease-in-out ${i * 0.18}s infinite` }} />
      ))}
      <style>{`@keyframes dot { 0%,100% { opacity: .25; } 50% { opacity: 1; } }`}</style>
    </div>
  );
}
function Bar({ w, visible }) {
  return <div style={{
    height: 10, width: `${w}%`, borderRadius: 4,
    background: "linear-gradient(90deg, var(--paper) 0%, var(--paper-2) 40%, var(--paper) 80%)",
    backgroundSize: "200% 100%",
    animation: visible ? "shimmer 1.4s linear infinite" : "none",
    opacity: visible ? 1 : 0.15,
    border: "1px solid var(--hairline)",
    transition: "opacity .3s",
  }} >
    <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
  </div>;
}

// ─── Mobile splash variants ─────────────────────────────────
function LoadingMobileCalm() {
  return (
    <MobileFrame>
      <div style={{ height: "100%", display: "grid", placeItems: "center", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(50% 40% at 50% 30%, oklch(0.95 0.06 115 / 0.55), transparent 60%)" }} />
        <div className="tw" style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <MarkShield size={88} />
          <div style={{ fontFamily: "var(--serif)", fontSize: 28, color: "var(--ink)", letterSpacing: "-0.02em" }}>TaxWijs</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Verifying 2026 rules…</div>
        </div>
        <div className="tw" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: "var(--paper-3)" }}>
          <div style={{ height: "100%", width: "62%", background: "var(--sage-600)" }} />
        </div>
      </div>
    </MobileFrame>
  );
}

Object.assign(window, { LoadingCalm, LoadingCompiling, LoadingAnswer, LoadingMobileCalm });
