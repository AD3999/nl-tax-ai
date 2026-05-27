/* TaxWijs — IB Return Guide */

const IB_FIELDS = [
  { box: "1", code: "1a", t: "Winst uit onderneming",         q: "Your business profit (revenue − expenses)", type: "currency", v: "64,000", mistakes: ["Forgetting private use of business assets (auto, telefoon)", "Mixing VAT-inclusive and exclusive figures"], answered: true },
  { box: "1", code: "1b", t: "Loon en uitkeringen",           q: "Salary, benefits and other employment income", type: "currency", v: "0", mistakes: ["Missing employer-provided lease car (Bijtelling)"], answered: false },
  { box: "1", code: "1c", t: "Zelfstandigenaftrek",           q: "Did you work ≥ 1,225 hours on your business?", type: "bool", v: "Yes", mistakes: ["Counting admin time without proof", "Forgetting hours during sickness leave"], answered: true },
  { box: "1", code: "1d", t: "Startersaftrek",                q: "First 5 years as ZZP and used ≥ 3 times before?", type: "bool", v: "Yes", mistakes: ["2026 is the LAST year — extra €2,123"], answered: true, warn: true },
  { box: "1", code: "1e", t: "MKB-winstvrijstelling (12.7%)", q: "Applied automatically after aftrekposten",     type: "info", v: "Auto", answered: true },
  { box: "1", code: "1f", t: "Lijfrentepremies",              q: "Annuities paid in the year",                    type: "currency", v: "3,600", answered: true },
  { box: "2", code: "2a", t: "Voordeel aanmerkelijk belang",  q: "Dividend from your BV (≥ 5% stake)",            type: "currency", v: "—",       answered: false },
  { box: "3", code: "3a", t: "Bezittingen Box 3",             q: "Total net assets on 1 Jan 2026",                type: "currency", v: "48,000", answered: true },
  { box: "1", code: "VOL-1", t: "Voorlopige aanslag",         q: "Tax already paid via voorlopige aanslag",       type: "currency", v: "8,000", answered: false },
];

const BOX_COLOR = {
  "1": { bg: "var(--sage-100)", fg: "var(--sage-800)" },
  "2": { bg: "oklch(0.94 0.05 230)", fg: "oklch(0.40 0.13 230)" },
  "3": { bg: "oklch(0.94 0.06 150)", fg: "oklch(0.40 0.14 150)" },
};

function IBDesktop() {
  const answered = IB_FIELDS.filter(f => f.answered).length;
  return (
    <div className="tw" style={{ width: "100%", height: "100%", overflow: "auto", background: "var(--paper)" }}>
      <TopNav active="ib" user={{ email: "anna@studio.nl" }} />
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "44px 40px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="eyebrow eyebrow-accent">IB Return · 2026</div>
            <h1 style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: 42, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              The fields that matter,<br />in plain language.
            </h1>
            <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 14 }}>
              Nine fields from the real aangifte form, mapped to your situation.
            </p>
          </div>
          <span style={{ padding: "8px 14px", borderRadius: 999, background: "var(--accent-soft)", color: "var(--sage-700)", fontSize: 12.5, fontWeight: 500, display: "inline-flex", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--sage-600)" }} />
            ZZP profile
          </span>
        </div>

        {/* Progress strip */}
        <div style={{ marginTop: 32, padding: "20px 24px", background: "var(--paper-2)", border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="eyebrow eyebrow-accent">Progress</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
              <span className="font-mono" style={{ color: "var(--ink)" }}>{answered}</span> of {IB_FIELDS.length} fields answered
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {IB_FIELDS.map(f => (
              <div key={f.code} style={{ flex: 1, height: 6, borderRadius: 3, background: f.answered ? (f.warn ? "oklch(0.65 0.16 75)" : "var(--sage-600)") : "var(--paper-3)" }} />
            ))}
          </div>
        </div>

        <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "flex-start" }}>
          {/* Fields stack */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {IB_FIELDS.map(f => <IBFieldCard key={f.code} f={f} />)}
          </div>

          {/* Summary card */}
          <aside style={{ position: "sticky", top: 92 }}>
            <div className="card" style={{ padding: 20, background: "var(--ink)", color: "var(--paper)", border: "none" }}>
              <div className="eyebrow" style={{ color: "var(--sage-300)" }}>Live aangifte summary</div>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["Box 1 inkomen",     "€ 51,858"],
                  ["Box 2 dividend",    "—"],
                  ["Box 3 assets",      "€ 48,000"],
                  ["− Voorlopige",      "€  8,000"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "oklch(0.85 0.01 95)" }}>
                    <span>{k}</span>
                    <span className="num" style={{ color: "white" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="dots" style={{ marginTop: 14, background: "linear-gradient(to right, rgba(255,255,255,0.3) 50%, transparent 0%)", backgroundSize: "6px 1px", backgroundRepeat: "repeat-x", height: 1 }} />
              <div style={{ marginTop: 14 }}>
                <div className="eyebrow" style={{ color: "var(--sage-300)" }}>Net to pay</div>
                <div className="font-serif" style={{ fontSize: 38, color: "white", lineHeight: 1, marginTop: 4 }}>€ 4,974</div>
              </div>
              <button className="btn" style={{ marginTop: 16, width: "100%", background: "var(--sage-500)", color: "white" }}>
                Open in chat <Icon.arrow />
              </button>
            </div>
            <div style={{ marginTop: 14, padding: 14, border: "1px solid var(--hairline)", borderRadius: "var(--r)" }}>
              <div className="eyebrow eyebrow-accent">When to file</div>
              <div style={{ marginTop: 6, fontSize: 13, color: "var(--ink-2)" }}>
                Aangifte 2026 opens <strong style={{ color: "var(--ink)" }}>1 March 2027</strong> · deadline <strong style={{ color: "var(--ink)" }}>1 May 2027</strong>.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function IBFieldCard({ f }) {
  const [open, setOpen] = React.useState(false);
  const c = BOX_COLOR[f.box];
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", borderColor: f.answered ? "var(--accent-line)" : "var(--hairline)" }}>
      <div style={{ padding: "18px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            <span style={{ padding: "3px 8px", borderRadius: 6, background: c.bg, color: c.fg, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.05em", fontFamily: "var(--mono)" }}>
              BOX {f.box}
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-3)" }}>{f.code}</span>
            <span style={{ fontFamily: "var(--serif)", fontSize: 19, color: "var(--ink)" }}>{f.t}</span>
            {f.warn && (
              <span className="pill pill-warn">⚠ Last year</span>
            )}
          </div>
          {f.answered && (
            <span style={{ width: 22, height: 22, borderRadius: 999, background: "var(--sage-600)", color: "white", display: "grid", placeItems: "center" }}>
              <Icon.check style={{ width: 12, height: 12 }} />
            </span>
          )}
        </div>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-2)" }}>{f.q}</p>

        {/* Input region */}
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
          {f.type === "currency" && (
            <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)" }}>€</span>
              <input className="input" defaultValue={f.v} style={{ paddingLeft: 28 }} />
            </div>
          )}
          {f.type === "bool" && (
            <div style={{ display: "flex", gap: 6 }}>
              {["Yes", "No"].map(t => {
                const on = f.v === t;
                return (
                  <button key={t} style={{
                    padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: "pointer",
                    border: `1px solid ${on ? "var(--sage-600)" : "var(--hairline-2)"}`,
                    background: on ? "var(--accent-soft)" : "var(--paper)",
                    color: on ? "var(--sage-700)" : "var(--ink-3)",
                  }}>{t}</button>
                );
              })}
            </div>
          )}
          {f.type === "info" && (
            <div style={{ padding: "8px 12px", background: "var(--paper-3)", borderRadius: "var(--r-sm)", fontSize: 12.5, color: "var(--ink-3)", fontFamily: "var(--mono)" }}>
              {f.v}
            </div>
          )}
        </div>

        {/* Common mistakes */}
        {f.mistakes && (
          <button onClick={() => setOpen(!open)} style={{ marginTop: 14, background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 12.5, cursor: "pointer" }}>
            <span style={{ width: 16, height: 16, borderRadius: 4, background: "oklch(0.95 0.05 75)", color: "oklch(0.50 0.16 75)", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700 }}>!</span>
            Common mistakes ({f.mistakes.length})
            <Icon.chev style={{ width: 11, height: 11, transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
          </button>
        )}
        {open && f.mistakes && (
          <ul style={{ marginTop: 8, paddingLeft: 28, fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.55 }}>
            {f.mistakes.map((m, i) => <li key={i} style={{ marginBottom: 4 }}>{m}</li>)}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 22px", background: "var(--paper-3)", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--hairline)" }}>
        <span style={{ fontSize: 11.5, color: "var(--ink-3)", display: "inline-flex", alignItems: "center", gap: 5 }}>
          Belastingdienst <Icon.external />
        </span>
        <button className="btn btn-soft btn-sm">
          <Icon.spark style={{ width: 12, height: 12 }} /> Ask TaxWijs
        </button>
      </div>
    </div>
  );
}

// ─── Mobile ─────────────────────────────────────────────────
function IBMobile() {
  const answered = IB_FIELDS.filter(f => f.answered).length;
  return (
    <MobileFrame>
      <MobileTopBar title="IB Return 2026" sub={`${answered} / ${IB_FIELDS.length} answered`} />
      {/* Progress */}
      <div className="tw" style={{ padding: "12px 16px", borderBottom: "1px solid var(--hairline)", background: "var(--paper-2)" }}>
        <div style={{ display: "flex", gap: 3 }}>
          {IB_FIELDS.map(f => (
            <div key={f.code} style={{ flex: 1, height: 4, borderRadius: 2, background: f.answered ? "var(--sage-600)" : "var(--paper-3)" }} />
          ))}
        </div>
      </div>

      <div className="tw" style={{ padding: "16px 16px 18px" }}>
        {/* Net to pay summary */}
        <div style={{ padding: 16, background: "var(--ink)", color: "var(--paper)", borderRadius: "var(--r)" }}>
          <div className="eyebrow" style={{ color: "var(--sage-300)" }}>Live · Net to pay</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 34, color: "white", marginTop: 4, lineHeight: 1 }}>€ 4,974</div>
          <div style={{ marginTop: 4, fontSize: 11, color: "oklch(0.82 0.01 95)" }}>after voorlopige aanslag</div>
        </div>

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {IB_FIELDS.map(f => {
            const c = BOX_COLOR[f.box];
            return (
              <div key={f.code} className="card" style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ padding: "2px 6px", borderRadius: 5, background: c.bg, color: c.fg, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.04em", fontFamily: "var(--mono)" }}>BOX {f.box}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-3)" }}>{f.code}</span>
                  {f.answered && (
                    <span style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: 999, background: "var(--sage-600)", color: "white", display: "grid", placeItems: "center" }}>
                      <Icon.check style={{ width: 10, height: 10 }} />
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 8, fontFamily: "var(--serif)", fontSize: 17, color: "var(--ink)" }}>{f.t}</div>
                <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink-3)" }}>{f.q}</div>
                {f.answered && f.type === "currency" && (
                  <div style={{ marginTop: 10, padding: "6px 10px", background: "var(--accent-soft)", borderRadius: 6, display: "inline-block", fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--sage-700)" }}>€ {f.v}</div>
                )}
                {f.warn && (
                  <div style={{ marginTop: 8 }}><span className="pill pill-warn">⚠ Last year 2026</span></div>
                )}
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button className="btn btn-soft btn-sm" style={{ flex: 1 }}><Icon.spark style={{ width: 11, height: 11 }} /> Ask</button>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Belastingdienst</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <MobileTabBar active="ib" />
    </MobileFrame>
  );
}

Object.assign(window, { IBDesktop, IBMobile });
