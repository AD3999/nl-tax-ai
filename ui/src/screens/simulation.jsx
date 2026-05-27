/* TaxWijs — Simulation (11-step aangifte) */

const SIM_STEPS = [
  { i: 1,  t: "Personal details",        d: "Year · partner · birth",  glyph: "01" },
  { i: 2,  t: "Income type",             d: "Salary · ZZP · foreign",  glyph: "02" },
  { i: 3,  t: "Wages & benefits",        d: "Employer · loonheffing",  glyph: "03", optional: true },
  { i: 4,  t: "Business profit",         d: "Revenue · expenses · hours", glyph: "04", optional: true },
  { i: 5,  t: "Home",                    d: "WOZ · mortgage",         glyph: "05" },
  { i: 6,  t: "Deductions",              d: "Pension · healthcare",   glyph: "06" },
  { i: 7,  t: "Foreign income",          d: "Tax treaty",             glyph: "07", optional: true },
  { i: 8,  t: "Box 3 savings",           d: "Assets · investments",   glyph: "08" },
  { i: 9,  t: "Box 2 substantial",       d: "BV dividend",           glyph: "09", optional: true },
  { i: 10, t: "Tax credits",             d: "IACK · heffingskorting", glyph: "10" },
  { i: 11, t: "Overview & calculation",  d: "Your assessment",        glyph: "11" },
];

function SimDesktop() {
  const [step, setStep] = React.useState(4);
  const completed = step - 1;
  return (
    <div className="tw" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "var(--paper)" }}>
      <TopNav active="sim" user={{ email: "anna@studio.nl" }} />
      {/* Progress */}
      <div style={{ height: 4, background: "var(--paper-3)" }}>
        <div style={{ width: `${(step / SIM_STEPS.length) * 100}%`, height: "100%", background: "var(--sage-600)", transition: "width .25s" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <aside style={{ borderRight: "1px solid var(--hairline)", padding: "26px 18px", overflow: "auto", background: "var(--paper)" }}>
          <div className="eyebrow eyebrow-accent">Aangifte 2026</div>
          <div style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: 22, color: "var(--ink)" }}>Simulation</div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 2 }}>
            {SIM_STEPS.map(s => {
              const done = s.i < step;
              const active = s.i === step;
              return (
                <button key={s.i} onClick={() => setStep(s.i)} style={{
                  textAlign: "left", padding: "10px 12px", borderRadius: "var(--r-sm)", border: "none",
                  background: active ? "var(--accent-soft)" : "transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 6, display: "grid", placeItems: "center", fontSize: 10,
                    fontFamily: "var(--mono)", fontWeight: 600,
                    background: done ? "var(--sage-600)" : active ? "var(--ink)" : "var(--paper-3)",
                    color: done || active ? "white" : "var(--ink-3)",
                  }}>{done ? <Icon.check style={{ width: 11, height: 11 }} /> : s.glyph}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: active || done ? "var(--ink)" : "var(--ink-3)", fontWeight: active ? 500 : 400 }}>{s.t}</div>
                    {s.optional && <div style={{ fontSize: 10.5, color: "var(--ink-4)" }}>conditional</div>}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 22, padding: 14, border: "1px dashed var(--hairline-2)", borderRadius: "var(--r)" }}>
            <div className="eyebrow">Running estimate</div>
            <div className="font-mono" style={{ marginTop: 4, fontSize: 20, color: "var(--ink)" }}>€ 4,974</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>net to pay so far</div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ overflow: "auto", padding: "32px 48px 48px" }}>
          <div style={{ maxWidth: 720 }}>
            <div className="eyebrow eyebrow-accent">Step {step} of {SIM_STEPS.length}</div>
            <h1 style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: 38, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              {SIM_STEPS[step - 1].t}
            </h1>
            <p style={{ marginTop: 6, color: "var(--ink-3)", fontSize: 14.5 }}>{SIM_STEPS[step - 1].d}</p>

            {/* Step content */}
            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 18 }}>
              <SimSection title="Revenue">
                <SimField label="Gross revenue 2026"   v="72,000" unit="€" />
                <SimField label="Other business income" v="0"     unit="€" />
              </SimSection>
              <SimSection title="Expenses">
                <SimField label="Materials & supplies" v="1,800"  unit="€" />
                <SimField label="Software & tools"     v="2,400"  unit="€" />
                <SimField label="Travel & subsistence" v="1,600"  unit="€" />
                <SimField label="Other expenses"       v="2,200"  unit="€" />
              </SimSection>
              <SimSection title="Hours & investments">
                <SimField label="Hours worked"         v="1,500"  unit="h" hint="≥ 1,225 h unlocks zelfstandigenaftrek" />
                <SimField label="KIA investments"      v="0"      unit="€" />
              </SimSection>

              {/* Info panel */}
              <div style={{ padding: 16, background: "var(--accent-soft)", border: "1px solid var(--accent-line)", borderRadius: "var(--r-sm)", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ width: 26, height: 26, borderRadius: 999, background: "var(--sage-600)", color: "white", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon.info style={{ width: 14, height: 14, color: "white" }} />
                </span>
                <div style={{ fontSize: 13, color: "var(--sage-800)", lineHeight: 1.55 }}>
                  At <strong>1,500 hours</strong> you qualify for <strong>zelfstandigenaftrek (€2,470)</strong>. Combined with startersaftrek and MKB-vrijstelling your taxable Box 1 drops by <strong>€12,142</strong>.
                </div>
              </div>
            </div>

            {/* Nav */}
            <div style={{ marginTop: 36, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="btn btn-ghost" onClick={() => setStep(Math.max(1, step - 1))}>← Previous</button>
              <div style={{ fontSize: 12.5, color: "var(--ink-4)" }}>{completed} of {SIM_STEPS.length} completed</div>
              <button className="btn btn-accent" onClick={() => setStep(Math.min(SIM_STEPS.length, step + 1))}>Continue <Icon.arrow /></button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SimSection({ title, children }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 10 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>
    </div>
  );
}

function SimField({ label, v, unit, hint }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span className="label">{label}</span>
        <button style={{ background: "transparent", border: "none", color: "var(--sage-700)", fontSize: 11, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}>
          <Icon.spark style={{ width: 10, height: 10 }} /> Ask
        </button>
      </div>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", fontSize: 13 }}>{unit}</span>
        <input className="input" defaultValue={v} style={{ paddingLeft: 28 }} />
      </div>
      {hint && <div style={{ marginTop: 4, fontSize: 11, color: "var(--ink-4)" }}>{hint}</div>}
    </div>
  );
}

// ─── Overview (step 11) showcase ────────────────────────────
function SimOverviewDesktop() {
  return (
    <div className="tw" style={{ width: "100%", height: "100%", overflow: "auto", background: "var(--paper-tint)" }}>
      <TopNav active="sim" user={{ email: "anna@studio.nl" }} />
      <div style={{ height: 4, background: "var(--paper-3)" }}>
        <div style={{ width: "100%", height: "100%", background: "var(--sage-600)" }} />
      </div>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 40px 64px", textAlign: "center" }}>
        <div className="eyebrow eyebrow-accent">Step 11 of 11 · The reveal</div>
        <h1 style={{ marginTop: 8, fontFamily: "var(--serif)", fontSize: 56, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1.05 }}>
          Your 2026 assessment<br /><em style={{ color: "var(--sage-700)" }}>is ready.</em>
        </h1>

        {/* Big result */}
        <div className="card" style={{ marginTop: 36, padding: 0, overflow: "hidden", textAlign: "left", borderRadius: "var(--r-xl)" }}>
          <div style={{ padding: "32px 32px 28px", background: "var(--ink)", color: "var(--paper)", display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center" }}>
            <div>
              <div className="eyebrow" style={{ color: "var(--sage-300)" }}>Net amount to pay</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 88, color: "white", letterSpacing: "-0.03em", lineHeight: 1, marginTop: 4 }}>€&nbsp;4,974</div>
              <div style={{ marginTop: 8, fontSize: 13.5, color: "oklch(0.82 0.01 95)" }}>after €8,000 voorlopige aanslag already paid</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[["Total tax due","€ 12,974"],["Effective rate","20.3 %"],["Per month reserve","€ 1,081"],["Wet DBA risk","HIGH"]].map(([k,v]) => (
                <div key={k} style={{ padding: 12, background: "rgba(255,255,255,0.06)", borderRadius: "var(--r)" }}>
                  <div className="eyebrow" style={{ color: "var(--sage-300)" }}>{k}</div>
                  <div className="font-mono" style={{ marginTop: 4, fontSize: 18, color: "white" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 28 }}>
            <div className="eyebrow eyebrow-accent">How we got here</div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column" }}>
              {CALC_BREAKDOWN.slice(0, -1).map((r, i) => (
                <div key={i} style={{ padding: "9px 0", display: "flex", justifyContent: "space-between", borderBottom: i < CALC_BREAKDOWN.length - 2 ? "1px solid var(--hairline)" : "none" }}>
                  <span style={{ fontSize: 13, color: r.tone === "muted" ? "var(--ink-3)" : "var(--ink)", fontWeight: r.bold ? 600 : 400 }}>{r.label}</span>
                  <span className="num" style={{ fontSize: 13, color: r.tone === "muted" ? "var(--ink-3)" : "var(--ink)", fontWeight: r.bold ? 600 : 400 }}>€ {r.v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
              <button className="btn btn-soft" style={{ flex: 1 }}><Icon.spark style={{ width: 12, height: 12 }} /> Discuss with TaxWijs</button>
              <button className="btn btn-ghost" style={{ flex: 1 }}>Download PDF</button>
              <button className="btn btn-accent" style={{ flex: 1 }}>File with Belastingdienst →</button>
            </div>
          </div>
        </div>

        <p style={{ marginTop: 28, fontSize: 11.5, color: "var(--ink-4)" }}>
          Estimate based on official 2026 brackets. TaxWijs is not a registered tax advisor.
        </p>
      </div>
    </div>
  );
}

// ─── Mobile ─────────────────────────────────────────────────
function SimMobile() {
  const step = 4;
  return (
    <MobileFrame>
      <MobileTopBar title={`Step ${step} of ${SIM_STEPS.length}`} sub={SIM_STEPS[step - 1].t} back action={
        <button style={{ background: "transparent", border: "none", color: "var(--sage-700)", fontSize: 12 }}>Save</button>
      } />
      {/* progress */}
      <div className="tw" style={{ height: 3, background: "var(--paper-3)" }}>
        <div style={{ width: `${(step / SIM_STEPS.length) * 100}%`, height: "100%", background: "var(--sage-600)" }} />
      </div>

      {/* horizontal step dots */}
      <div className="tw" style={{ padding: "12px 16px", display: "flex", gap: 4, overflowX: "auto", borderBottom: "1px solid var(--hairline)" }}>
        {SIM_STEPS.map(s => {
          const active = s.i === step;
          const done = s.i < step;
          return (
            <div key={s.i} style={{
              flex: "0 0 auto", padding: "5px 11px", borderRadius: 999, fontSize: 11, fontWeight: 500,
              background: active ? "var(--ink)" : done ? "var(--accent-soft)" : "var(--paper-3)",
              color: active ? "var(--paper)" : done ? "var(--sage-700)" : "var(--ink-3)",
              fontFamily: "var(--mono)",
            }}>{s.glyph}</div>
          );
        })}
      </div>

      <div className="tw" style={{ padding: "20px 16px 24px" }}>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 400, color: "var(--ink)" }}>{SIM_STEPS[step - 1].t}</h1>
        <p style={{ marginTop: 4, color: "var(--ink-3)", fontSize: 13 }}>{SIM_STEPS[step - 1].d}</p>

        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <SimField label="Gross revenue 2026" v="72,000" unit="€" />
          <SimField label="Materials & supplies" v="1,800" unit="€" />
          <SimField label="Hours worked" v="1,500" unit="h" hint="≥ 1,225 h unlocks deduction" />
        </div>

        <div style={{ marginTop: 16, padding: 14, background: "var(--accent-soft)", borderRadius: "var(--r-sm)" }}>
          <div className="eyebrow eyebrow-accent" style={{ fontSize: 9.5 }}>Info</div>
          <p style={{ marginTop: 4, fontSize: 12.5, color: "var(--sage-800)", lineHeight: 1.5 }}>
            At 1,500 h you unlock zelfstandigenaftrek (€2,470).
          </p>
        </div>

        <div style={{ marginTop: 22, display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }}>Back</button>
          <button className="btn btn-accent" style={{ flex: 2 }}>Continue <Icon.arrow /></button>
        </div>
      </div>
      <MobileTabBar active="ib" />
    </MobileFrame>
  );
}

Object.assign(window, { SimDesktop, SimOverviewDesktop, SimMobile });
