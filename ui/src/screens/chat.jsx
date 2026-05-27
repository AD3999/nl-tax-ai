/* TaxWijs — Chat (the main experience) */

const CHAT_QUESTIONS = {
  zzp: [
    { q: "Am I a Wet DBA risk?",            tag: "Compliance" },
    { q: "How much tax should I reserve?",   tag: "Cashflow" },
    { q: "Do I qualify for zelfstandigenaftrek?", tag: "Deduction" },
    { q: "Explain MKB-vrijstelling",         tag: "Deduction" },
    { q: "Quarterly VAT — when & how much?", tag: "BTW" },
    { q: "Pension contributions for ZZP",    tag: "Box 1" },
  ],
  employee: [
    { q: "What does my payslip mean?",       tag: "Loon" },
    { q: "Am I overpaying on Box 3?",        tag: "Box 3" },
    { q: "Do I get IACK?",                   tag: "Credit" },
    { q: "Heffingskorting transfer to partner", tag: "Credit" },
    { q: "Bonuses — taxed differently?",     tag: "Loon" },
    { q: "Commute to work — deductible?",    tag: "Deduction" },
  ],
  expat: [
    { q: "Am I still in the 30% ruling?",    tag: "Ruling" },
    { q: "How is my foreign income taxed?",  tag: "Foreign" },
    { q: "Voorlopige aanslag — set up?",     tag: "Cashflow" },
    { q: "Partial non-resident status",      tag: "Ruling" },
    { q: "Tax treaty — Iran / NL",           tag: "Foreign" },
    { q: "End of ruling — what changes?",    tag: "Ruling" },
  ],
  dga: [
    { q: "Optimal salary vs. dividend",      tag: "Box 2" },
    { q: "Gebruikelijk loon — minimum?",     tag: "Salary" },
    { q: "Excessief lenen — am I close?",    tag: "Box 2" },
    { q: "Pensioen in eigen beheer",         tag: "Pension" },
    { q: "Dividend now or next year?",       tag: "Timing" },
    { q: "BV vs. eenmanszaak — switch?",     tag: "Structure" },
  ],
};

const PROFILES = {
  zzp:      { headline: "ZZP", sub: "€72,000 · 1,500 h · 1 client" },
  employee: { headline: "Employee", sub: "€55,000 · partner · 2 kids" },
  expat:    { headline: "Expat", sub: "€95,000 · 30% ruling y2" },
  dga:      { headline: "DGA", sub: "€56,000 salary · €12,000 dividend" },
};

const SAMPLE_THREADS = {
  zzp: {
    userMsg: "Am I a Wet DBA risk?",
    answer: "Yes — with **100% of revenue from a single client**, you sit firmly in the HIGH-risk band of the Wet DBA test. The Belastingdienst can reclassify the relationship as employment, which would unwind your zelfstandigenaftrek and trigger back-taxes.",
    numbers: [
      ["Single-client share", "100 %",   "high"],
      ["Total revenue",       "€ 72,000", null],
      ["Hours rule (1,225 h)","met",      "ok"],
      ["Risk band",           "HIGH",     "high"],
    ],
    sources: ["belastingdienst.nl/wet-dba", "kvk.nl/modelovereenkomst"],
  },
  employee: {
    userMsg: "Do I get IACK?",
    answer: "**Yes — you qualify.** With one child under 12 and personal income above the minimum, you receive the **Inkomensafhankelijke Combinatiekorting** for 2026. Estimated **€2,694** added to your refund.",
    numbers: [
      ["Children u12",     "2",         "ok"],
      ["Personal income",  "€ 55,000",  null],
      ["IACK estimate",    "€ 2,694",   "ok"],
    ],
    sources: ["belastingdienst.nl/iack", "rule:HK-2026-IACK"],
  },
  expat: {
    userMsg: "Am I still in the 30% ruling?",
    answer: "**Yes — year 2 of 5.** Three years left, ending **31 Dec 2028**. From 2027 the percentage stages down (30% → 20% → 10%). Salary threshold (€46,107) currently met.",
    numbers: [
      ["Ruling start",    "01 Jan 2025", null],
      ["Year",            "2 / 5",       "ok"],
      ["Threshold met",   "yes",         "ok"],
      ["Stage-down starts","Jan 2027",   "warn"],
    ],
    sources: ["belastingdienst.nl/30-procent-regeling"],
  },
  dga: {
    userMsg: "Optimal salary vs. dividend?",
    answer: "Current split is close to optimal. Pushing salary above **€56,000** crosses into the 49.5% bracket; dividends in Box 2 above **€67,804** trigger the 31% rate. Recommended: keep salary at gebruikelijk loon and take dividend up to the threshold.",
    numbers: [
      ["Salary now",            "€ 56,000",  null],
      ["Dividend now",          "€ 12,000",  null],
      ["Gebruikelijk loon min", "€ 56,000",  "ok"],
      ["Box 2 24.5% ceiling",   "€ 67,804",  null],
    ],
    sources: ["belastingdienst.nl/gebruikelijk-loon", "rule:DGA-2026-BOX2"],
  },
};

function renderMd(s) {
  // bold + line breaks only
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**")
      ? <strong key={i} style={{ color: "var(--ink)", fontWeight: 600 }}>{p.slice(2, -2)}</strong>
      : <React.Fragment key={i}>{p}</React.Fragment>
  );
}

function ProfileBar({ type, plan = "free", used = 3, cap = 10 }) {
  const p = PROFILES[type];
  return (
    <div style={{
      padding: "12px 22px",
      background: "var(--accent-soft)",
      borderBottom: "1px solid var(--accent-line)",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{
          width: 30, height: 30, borderRadius: 8, background: USER_TYPES[type].color,
          color: "white", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em"
        }}>{USER_TYPES[type].glyph}</span>
        <div>
          <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
            {p.headline} <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>· {p.sub}</span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {plan === "premium" ? (
          <span className="pill pill-accent">⚡ Premium · unlimited</span>
        ) : (
          <>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
              <span style={{ fontFamily: "var(--mono)", color: "var(--ink)" }}>{used}</span> / {cap} today
            </div>
            <a style={{ fontSize: 12, color: "var(--sage-700)", fontWeight: 500 }}>Upgrade →</a>
          </>
        )}
        <button style={{ background: "var(--paper)", border: "1px solid var(--hairline-2)", width: 30, height: 30, borderRadius: 999, display: "grid", placeItems: "center", cursor: "pointer" }}>
          <Icon.edit />
        </button>
      </div>
    </div>
  );
}

function ChatCards({ type, onAsk, hidden = [] }) {
  const all = CHAT_QUESTIONS[type] || [];
  const visible = all.filter(c => !hidden.includes(c.q));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {visible.slice(0, 6).map((c, i) => (
        <button key={c.q} onClick={() => onAsk?.(c.q)} style={{
          textAlign: "left", padding: "16px 16px", background: "var(--paper)", border: "1px solid var(--hairline)",
          borderRadius: "var(--r-lg)", display: "flex", flexDirection: "column", gap: 8, cursor: "pointer",
          transition: "all .15s",
          animation: `cardIn .35s ease-out both`, animationDelay: `${i * 50}ms`,
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--sage-600)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--hairline)"; e.currentTarget.style.background = "var(--paper)"; }}
        >
          <span className="eyebrow eyebrow-accent">{c.tag}</span>
          <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.35 }}>{c.q}</div>
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--ink-3)" }}>
            Ask <Icon.arrow style={{ width: 11, height: 11 }} />
          </div>
        </button>
      ))}
    </div>
  );
}

function AnswerCard({ thread }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* User message */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ padding: "10px 16px", borderRadius: 18, background: "var(--ink)", color: "var(--paper)", fontSize: 14, maxWidth: "78%" }}>
          {thread.userMsg}
        </div>
      </div>
      {/* Assistant message */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", maxWidth: "92%" }}>
        <span style={{ width: 30, height: 30, borderRadius: 999, background: "var(--sage-100)", color: "var(--sage-700)", display: "grid", placeItems: "center", fontFamily: "var(--serif)", fontSize: 14, marginTop: 2 }}>T</span>
        <div style={{ flex: 1, background: "var(--paper-2)", border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", padding: 18 }}>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)" }}>{renderMd(thread.answer)}</p>

          {/* Numbers panel */}
          <div style={{ marginTop: 14, padding: 14, background: "var(--paper)", borderRadius: "var(--r-sm)", border: "1px dashed var(--accent-line)" }}>
            <div className="eyebrow eyebrow-accent" style={{ marginBottom: 8 }}>Your numbers</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 6, fontSize: 13 }}>
              {thread.numbers.map(([k, v, tone]) => (
                <React.Fragment key={k}>
                  <span style={{ color: "var(--ink-2)" }}>{k}</span>
                  <span className="num" style={{
                    color: tone === "high" ? "var(--danger)" : tone === "warn" ? "oklch(0.55 0.15 75)" : tone === "ok" ? "var(--ok)" : "var(--ink)"
                  }}>{v}</span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="eyebrow">Sources</span>
            {thread.sources.map(s => (
              <span key={s} style={{ fontSize: 11.5, color: "var(--ink-3)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                {s} <Icon.external />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatDesktop({ userType = "zzp" }) {
  const [hidden, setHidden] = React.useState([]);
  const [thread, setThread] = React.useState(SAMPLE_THREADS[userType]);

  React.useEffect(() => { setThread(SAMPLE_THREADS[userType]); setHidden([]); }, [userType]);

  const ask = (q) => {
    setHidden(h => [...h, q]);
    setThread({ ...SAMPLE_THREADS[userType], userMsg: q });
  };

  return (
    <div className="tw" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "var(--paper)" }}>
      <TopNav active="ask" user={{ email: "anna@studio.nl" }} />
      <ProfileBar type={userType} />

      <div style={{ flex: 1, overflow: "auto", padding: "32px 28px 40px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <AnswerCard thread={thread} />

          {/* Follow-up prompt strip */}
          <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 12 }}>
            <span className="eyebrow eyebrow-accent">Ask a follow-up</span>
            <span className="hair" style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{(CHAT_QUESTIONS[userType] || []).length - hidden.length} remaining</span>
          </div>

          <div style={{ marginTop: 14 }}>
            <ChatCards type={userType} hidden={hidden} onAsk={ask} />
          </div>

          <div style={{ marginTop: 24, padding: 16, border: "1px dashed var(--hairline-2)", borderRadius: "var(--r)", display: "flex", alignItems: "center", gap: 12 }}>
            <Icon.info />
            <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
              All answers are grounded in 28 verified 2026 rules and your saved profile. <span style={{ color: "var(--sage-700)" }}>How does retrieval work?</span>
            </span>
          </div>
        </div>
      </div>

      <style>{`@keyframes cardIn { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}

function ChatEmptyDesktop({ userType = "zzp" }) {
  const [hidden, setHidden] = React.useState([]);
  const [thread, setThread] = React.useState(null);
  React.useEffect(() => { setThread(null); setHidden([]); }, [userType]);
  const ask = (q) => {
    setHidden(h => [...h, q]);
    setThread({ ...SAMPLE_THREADS[userType], userMsg: q });
  };
  return (
    <div className="tw" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "var(--paper)" }}>
      <TopNav active="ask" user={{ email: "anna@studio.nl" }} />
      <ProfileBar type={userType} />
      <div style={{ flex: 1, overflow: "auto", padding: "48px 28px 40px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {!thread && (
            <>
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "inline-grid", placeItems: "center", width: 56, height: 56, borderRadius: 999, background: "var(--accent-soft)", color: "var(--sage-700)", fontFamily: "var(--serif)", fontSize: 24 }}>T</span>
                <h1 style={{ marginTop: 16, fontFamily: "var(--serif)", fontSize: 38, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                  Your tax results are ready.
                </h1>
                <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 15 }}>
                  Tap a question below — or ask your own when premium.
                </p>
              </div>
              <div style={{ marginTop: 32 }}>
                <ChatCards type={userType} onAsk={ask} hidden={hidden} />
              </div>
            </>
          )}
          {thread && <AnswerCard thread={thread} />}
        </div>
      </div>
      <style>{`@keyframes cardIn { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}

// ─── Mobile ─────────────────────────────────────────────────
function ChatMobile({ userType = "zzp" }) {
  const [hidden, setHidden] = React.useState([]);
  const [thread, setThread] = React.useState(SAMPLE_THREADS[userType]);
  React.useEffect(() => { setThread(SAMPLE_THREADS[userType]); setHidden([]); }, [userType]);
  const ask = (q) => { setHidden(h => [...h, q]); setThread({ ...SAMPLE_THREADS[userType], userMsg: q }); };

  return (
    <MobileFrame>
      <MobileTopBar title="Ask TaxWijs" sub={`${PROFILES[userType].headline} · ${PROFILES[userType].sub}`} action={<button style={{ background: "transparent", border: "none", color: "var(--sage-700)", fontSize: 12 }}>Edit</button>} />
      {/* Slim usage strip */}
      <div style={{ padding: "8px 16px", background: "var(--accent-soft)", borderBottom: "1px solid var(--accent-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="tw" style={{ fontSize: 11, color: "var(--ink-2)" }}>
          <span style={{ fontFamily: "var(--mono)", color: "var(--ink)" }}>3</span> / 10 today
        </div>
        <a className="tw" style={{ fontSize: 11, color: "var(--sage-700)", fontWeight: 600 }}>Upgrade →</a>
      </div>

      <div className="tw" style={{ padding: "18px 16px 24px" }}>
        {/* Compact answer */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ padding: "8px 14px", borderRadius: 16, background: "var(--ink)", color: "var(--paper)", fontSize: 13, maxWidth: "82%" }}>
            {thread.userMsg}
          </div>
        </div>
        <div style={{ marginTop: 12, padding: 14, background: "var(--paper-2)", border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: 999, background: "var(--sage-100)", color: "var(--sage-700)", display: "grid", placeItems: "center", fontFamily: "var(--serif)", fontSize: 11 }}>T</span>
            <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>TaxWijs · 2.3s</span>
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)" }}>{renderMd(thread.answer)}</p>
          <div style={{ marginTop: 10, padding: 10, background: "var(--paper)", borderRadius: 8, border: "1px dashed var(--accent-line)" }}>
            <div className="eyebrow eyebrow-accent" style={{ marginBottom: 4, fontSize: 9.5 }}>Your numbers</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 4, fontSize: 12 }}>
              {thread.numbers.map(([k, v, tone]) => (
                <React.Fragment key={k}>
                  <span style={{ color: "var(--ink-2)" }}>{k}</span>
                  <span className="num" style={{
                    color: tone === "high" ? "var(--danger)" : tone === "warn" ? "oklch(0.55 0.15 75)" : tone === "ok" ? "var(--ok)" : "var(--ink)"
                  }}>{v}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 8 }}>
          <span className="eyebrow eyebrow-accent">Follow-up</span>
          <span className="hair" style={{ flex: 1 }} />
        </div>

        {/* Horizontal scrolling card strip */}
        <div style={{ marginTop: 10, display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 }}>
          {(CHAT_QUESTIONS[userType] || []).filter(c => !hidden.includes(c.q)).map((c, i) => (
            <button key={c.q} onClick={() => ask(c.q)} style={{
              flex: "0 0 220px", textAlign: "left", padding: 12, background: "var(--paper)", border: "1px solid var(--hairline)",
              borderRadius: "var(--r)", display: "flex", flexDirection: "column", gap: 6, cursor: "pointer",
              animation: `cardIn .35s ease-out both`, animationDelay: `${i * 50}ms`,
            }}>
              <span className="eyebrow eyebrow-accent" style={{ fontSize: 9.5 }}>{c.tag}</span>
              <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.35 }}>{c.q}</span>
            </button>
          ))}
        </div>
      </div>

      <MobileTabBar active="ask" />
      <style>{`@keyframes cardIn { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: none; } }`}</style>
    </MobileFrame>
  );
}

Object.assign(window, { ChatDesktop, ChatEmptyDesktop, ChatMobile });
