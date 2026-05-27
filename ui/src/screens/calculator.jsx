/* TaxWijs — Calculator + Results */

const CALC_BREAKDOWN = [
  { label: "Annual revenue",          v: "72,000", tone: "ink",  bold: true },
  { label: "Business expenses",       v: "−8,000",  tone: "muted" },
  { label: "Gross profit",            v: "64,000", tone: "ink",  bold: true, line: true },
  { label: "Zelfstandigenaftrek",     v: "−2,470",  tone: "muted" },
  { label: "Startersaftrek (last yr)", v: "−2,123",  tone: "muted" },
  { label: "MKB-vrijstelling (12.7%)",v: "−7,549",  tone: "muted" },
  { label: "Taxable Box 1",           v: "51,858", tone: "ink",  bold: true, line: true },
  { label: "Income tax (Box 1)",      v: "18,420", tone: "ink" },
  { label: "ZVW contribution",        v: "3,156",  tone: "ink" },
  { label: "− Heffingskorting",       v: "−3,070",  tone: "muted" },
  { label: "− Arbeidskorting",        v: "−5,532",  tone: "muted" },
  { label: "Total tax due 2026",      v: "12,974", tone: "accent", bold: true, line: true, big: true },
];

function CalcDesktop() {
  const [type, setType] = React.useState("zzp");
  return (
    <div className="tw" style={{ width: "100%", height: "100%", overflow: "auto", background: "var(--paper)" }}>
      <TopNav active="calc" user={{ email: "anna@studio.nl" }} />
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "44px 40px 64px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div className="eyebrow eyebrow-accent">2026 Calculator</div>
            <h1 style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: 42, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              See every euro, by bracket.
            </h1>
            <p style={{ marginTop: 6, color: "var(--ink-3)", fontSize: 14 }}>
              No AI — pure deterministic engine. Same numbers your accountant would get.
            </p>
          </div>
          <button className="btn btn-ghost"><Icon.edit /> Edit profile</button>
        </div>

        {/* Type selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {Object.entries(USER_TYPES).map(([k, v]) => (
            <button key={k} onClick={() => setType(k)} style={{
              padding: "8px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 500, cursor: "pointer",
              border: "1px solid " + (type === k ? "transparent" : "var(--hairline-2)"),
              background: type === k ? "var(--ink)" : "var(--paper)",
              color: type === k ? "var(--paper)" : "var(--ink-3)",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: type === k ? v.color : "var(--hairline-2)" }} />
              {v.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 24, alignItems: "flex-start" }}>
          {/* FORM */}
          <div className="card" style={{ padding: 26, borderRadius: "var(--r-lg)" }}>
            <div className="eyebrow eyebrow-accent">Inputs</div>
            <h2 style={{ marginTop: 4, fontSize: 18, color: "var(--ink)", fontWeight: 500 }}>Your situation</h2>

            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <CalcField label="Annual revenue"     v="72,000" unit="€" />
              <CalcField label="Business expenses"  v="8,000"  unit="€" />
              <CalcField label="Hours per year"     v="1,500"  unit="h" hint="≥ 1,225 h" />
              <CalcField label="KIA investments"    v="0"      unit="€" />
              <CalcField label="Single-client %"    v="100"    unit="%" hint="Wet DBA test" />
              <CalcToggle label="Starter year?" />
            </div>

            <div style={{ marginTop: 24 }} className="dots" />
            <div className="eyebrow" style={{ marginTop: 22 }}>Household</div>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <CalcField label="Pension contribution" v="3,600" unit="€" />
              <CalcField label="Box 3 net assets"     v="48,000" unit="€" />
              <CalcSelect label="Children u12"        value="2" />
              <CalcField label="Partner income"       v="34,000" unit="€" />
            </div>

            <button className="btn btn-accent btn-lg" style={{ width: "100%", marginTop: 22 }}>
              Calculate <Icon.arrow />
            </button>
          </div>

          {/* RESULTS */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <SummaryCard kind="primary" label="Total tax due 2026"
                value={<>€<span className="font-serif" style={{ fontSize: 42, marginLeft: 4 }}>12,974</span></>}
                foot="20.3% effective rate" />
              <SummaryCard kind="ink" label="Per month to reserve"
                value={<>€<span className="font-serif" style={{ fontSize: 42, marginLeft: 4 }}>1,081</span></>}
                foot="Quarterly VAT not included" />
              <SummaryCard kind="warn" label="Wet DBA risk" value={<span style={{ fontFamily: "var(--serif)", fontSize: 30 }}>HIGH</span>}
                foot="100% single-client share" />
              <SummaryCard kind="ok" label="Hours rule" value={<span style={{ fontFamily: "var(--serif)", fontSize: 30 }}>Met</span>}
                foot="1,500 h (need 1,225)" />
            </div>

            {/* Bracket bar */}
            <div className="card" style={{ padding: 20 }}>
              <div className="eyebrow eyebrow-accent">2026 Box 1 brackets</div>
              <div style={{ marginTop: 14, height: 10, borderRadius: 999, background: "var(--paper-3)", overflow: "hidden", display: "flex" }}>
                <div style={{ width: "65%", background: "var(--sage-400)" }} />
                <div style={{ width: "30%", background: "var(--sage-600)" }} />
                <div style={{ width: "5%",  background: "var(--ink)" }} />
              </div>
              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", fontSize: 11.5, color: "var(--ink-3)" }}>
                <span>36.93% · up to €38,441</span>
                <span style={{ textAlign: "center" }}>37.07% · €38–76k</span>
                <span style={{ textAlign: "right" }}>49.5% · €76k+</span>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--ink-3)" }}>
                You sit at <strong style={{ color: "var(--ink)" }}>€51,858</strong> taxable — fully in the lower bracket band.
              </div>
            </div>

            {/* Breakdown */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--hairline)" }}>
                <div>
                  <div className="eyebrow eyebrow-accent">Full breakdown</div>
                  <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>2026 income → total tax</div>
                </div>
                <a style={{ fontSize: 12.5, color: "var(--sage-700)" }}>Export PDF</a>
              </div>
              <div>
                {CALC_BREAKDOWN.map((r, i) => (
                  <div key={i} style={{
                    padding: "11px 20px",
                    display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center",
                    background: r.bold && r.tone === "accent" ? "var(--accent-soft)" : "transparent",
                    borderTop: r.line ? "1px solid var(--hairline)" : "none",
                  }}>
                    <span style={{
                      fontSize: r.big ? 14 : 13.5,
                      color: r.tone === "muted" ? "var(--ink-3)" : "var(--ink)",
                      fontWeight: r.bold ? 600 : 400,
                    }}>{r.label}</span>
                    <span className="num" style={{
                      fontSize: r.big ? 24 : 13.5,
                      fontFamily: r.big ? "var(--serif)" : "var(--mono)",
                      color: r.tone === "accent" ? "var(--sage-700)" : r.tone === "muted" ? "var(--ink-3)" : "var(--ink)",
                      fontWeight: r.bold ? 600 : 400,
                    }}>{r.big ? r.v : `€ ${r.v}`}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }}>Save scenario</button>
              <button className="btn btn-soft" style={{ flex: 1 }}>Discuss with TaxWijs <Icon.arrow /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ kind, label, value, foot }) {
  const ink = kind === "ink";
  const warn = kind === "warn";
  const ok = kind === "ok";
  const primary = kind === "primary";
  const bg = ink ? "var(--ink)" : primary ? "var(--sage-100)" : warn ? "oklch(0.96 0.06 75)" : ok ? "oklch(0.96 0.05 150)" : "var(--paper-2)";
  const fg = ink ? "var(--paper)" : primary ? "var(--sage-800)" : warn ? "oklch(0.42 0.16 75)" : ok ? "oklch(0.40 0.15 150)" : "var(--ink)";
  const sub = ink ? "oklch(0.82 0.01 95)" : primary ? "var(--sage-700)" : warn ? "oklch(0.55 0.17 75)" : ok ? "oklch(0.55 0.14 150)" : "var(--ink-3)";
  return (
    <div style={{ padding: 18, background: bg, borderRadius: "var(--r-lg)", border: ink || primary || warn || ok ? "none" : "1px solid var(--hairline)" }}>
      <div className="eyebrow" style={{ color: sub }}>{label}</div>
      <div style={{ marginTop: 8, color: fg, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ marginTop: 10, fontSize: 11.5, color: sub }}>{foot}</div>
    </div>
  );
}

function CalcField({ label, v, unit, hint }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span className="label">{label}</span>
        {hint && <span style={{ fontSize: 10.5, color: "var(--ink-4)" }}>{hint}</span>}
      </div>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", fontSize: 13 }}>{unit}</span>
        <input className="input" defaultValue={v} style={{ paddingLeft: 28 }} />
      </div>
    </div>
  );
}
function CalcSelect({ label, value }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 6 }}>{label}</div>
      <div className="input" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "var(--ink)" }}>{value}</span>
        <Icon.chev style={{ transform: "rotate(90deg)" }} />
      </div>
    </div>
  );
}
function CalcToggle({ label }) {
  const [v, set] = React.useState(true);
  return (
    <div>
      <div className="label" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", border: "1px solid var(--hairline-2)", borderRadius: "var(--r-sm)", overflow: "hidden" }}>
        {[["Yes", true], ["No", false]].map(([t, val]) => (
          <button key={t} onClick={() => set(val)} style={{
            flex: 1, padding: "9px 0", fontSize: 13, border: "none", cursor: "pointer",
            background: v === val ? "var(--accent-soft)" : "var(--paper)",
            color: v === val ? "var(--sage-700)" : "var(--ink-3)",
            fontWeight: v === val ? 600 : 400,
          }}>{t}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile ─────────────────────────────────────────────────
function CalcMobile() {
  const [tab, setTab] = React.useState("results");
  return (
    <MobileFrame>
      <MobileTopBar title="Calculator" sub="ZZP · 2026" />
      <div className="tw" style={{ padding: "16px 16px 24px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", padding: 3, background: "var(--paper-3)", borderRadius: 999, marginBottom: 16 }}>
          {[["inputs", "Inputs"], ["results", "Results"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: "8px 0", borderRadius: 999, border: "none", fontSize: 13, fontWeight: 500,
              background: tab === k ? "var(--paper)" : "transparent",
              color: tab === k ? "var(--ink)" : "var(--ink-3)",
              boxShadow: tab === k ? "var(--shadow-sm)" : "none",
            }}>{l}</button>
          ))}
        </div>

        {tab === "results" && (
          <>
            <div style={{ padding: 20, background: "var(--sage-100)", borderRadius: "var(--r-lg)" }}>
              <div className="eyebrow eyebrow-accent">Total tax due 2026</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 52, color: "var(--sage-800)", lineHeight: 1, letterSpacing: "-0.025em", marginTop: 6 }}>
                €&nbsp;12,974
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--sage-700)" }}>
                20.3% effective rate · €1,081 / month to reserve
              </div>
            </div>

            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ padding: 14, background: "oklch(0.96 0.06 75)", borderRadius: "var(--r)" }}>
                <div className="eyebrow" style={{ color: "oklch(0.55 0.17 75)" }}>Wet DBA</div>
                <div style={{ marginTop: 4, fontFamily: "var(--serif)", fontSize: 22, color: "oklch(0.42 0.16 75)" }}>HIGH</div>
                <div style={{ fontSize: 11, color: "oklch(0.55 0.17 75)" }}>100% single-client</div>
              </div>
              <div style={{ padding: 14, background: "oklch(0.96 0.05 150)", borderRadius: "var(--r)" }}>
                <div className="eyebrow" style={{ color: "oklch(0.55 0.14 150)" }}>Hours rule</div>
                <div style={{ marginTop: 4, fontFamily: "var(--serif)", fontSize: 22, color: "oklch(0.40 0.15 150)" }}>Met</div>
                <div style={{ fontSize: 11, color: "oklch(0.55 0.14 150)" }}>1,500 h</div>
              </div>
            </div>

            {/* Bracket bar */}
            <div className="card" style={{ marginTop: 14, padding: 14 }}>
              <div className="eyebrow eyebrow-accent" style={{ fontSize: 9.5 }}>Box 1 brackets</div>
              <div style={{ marginTop: 10, height: 8, borderRadius: 999, background: "var(--paper-3)", overflow: "hidden", display: "flex" }}>
                <div style={{ width: "65%", background: "var(--sage-400)" }} />
                <div style={{ width: "30%", background: "var(--sage-600)" }} />
                <div style={{ width: "5%",  background: "var(--ink)" }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: "var(--ink-3)" }}>
                Taxable €51,858 — fully in lower band.
              </div>
            </div>

            {/* Breakdown rows */}
            <div className="card" style={{ marginTop: 14, padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="eyebrow eyebrow-accent" style={{ fontSize: 9.5 }}>Breakdown</div>
                <a style={{ fontSize: 11.5, color: "var(--sage-700)" }}>Export PDF</a>
              </div>
              {CALC_BREAKDOWN.map((r, i) => (
                <div key={i} style={{
                  padding: "10px 14px", display: "flex", justifyContent: "space-between",
                  background: r.bold && r.tone === "accent" ? "var(--accent-soft)" : "transparent",
                  borderTop: r.line ? "1px solid var(--hairline)" : "none",
                }}>
                  <span style={{ fontSize: 12.5, color: r.tone === "muted" ? "var(--ink-3)" : "var(--ink)", fontWeight: r.bold ? 600 : 400 }}>{r.label}</span>
                  <span className="num" style={{
                    fontSize: r.big ? 16 : 12.5,
                    color: r.tone === "accent" ? "var(--sage-700)" : r.tone === "muted" ? "var(--ink-3)" : "var(--ink)",
                    fontWeight: r.bold ? 600 : 400,
                  }}>{r.big ? r.v : `€ ${r.v}`}</span>
                </div>
              ))}
            </div>

            <button className="btn btn-soft btn-lg" style={{ width: "100%", marginTop: 14 }}>Discuss with TaxWijs <Icon.arrow /></button>
          </>
        )}

        {tab === "inputs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <CalcField label="Annual revenue" v="72,000" unit="€" />
            <CalcField label="Business expenses" v="8,000" unit="€" />
            <CalcField label="Hours per year" v="1,500" unit="h" hint="≥ 1,225 h" />
            <CalcField label="Single-client %" v="100" unit="%" hint="Wet DBA test" />
            <CalcToggle label="Starter year?" />
            <CalcField label="Pension contribution" v="3,600" unit="€" />
            <button className="btn btn-accent btn-lg" style={{ width: "100%", marginTop: 6 }}>Recalculate</button>
          </div>
        )}
      </div>
      <MobileTabBar active="calc" />
    </MobileFrame>
  );
}

Object.assign(window, { CalcDesktop, CalcMobile, CALC_BREAKDOWN });
