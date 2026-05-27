/* TaxWijs — Intake Wizard (3 steps) */

function IntakeStepDots({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: 4, borderRadius: 2, width: i === step ? 36 : 18,
          background: i <= step ? "var(--sage-600)" : "var(--hairline-2)",
          transition: "width .2s",
        }} />
      ))}
    </div>
  );
}

function IntakeDesktop() {
  // Default to step 2 for ZZP — best showcase
  const [step, setStep] = React.useState(2);
  const [type, setType] = React.useState("zzp");

  return (
    <div className="tw grain" style={{ width: "100%", height: "100%", overflow: "auto" }}>
      <TopNav active="" />
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr 320px", maxWidth: 1180, margin: "0 auto", padding: "32px 40px 56px", gap: 40, alignItems: "flex-start" }}>
        {/* Left rail */}
        <aside style={{ position: "sticky", top: 92 }}>
          <div className="eyebrow eyebrow-accent">Profile intake</div>
          <h2 style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: 30, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Two minutes.<br/>One tax brain.
          </h2>
          <p style={{ marginTop: 12, fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.55 }}>
            Your answers personalise the assistant. They never leave your browser unless you create an account.
          </p>
          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { i: 1, t: "Who you are",   d: "Profession & tax type" },
              { i: 2, t: "Your income",   d: "Annual figures" },
              { i: 3, t: "Your situation",d: "Partner · kids · assets" },
            ].map(s => {
              const done = s.i < step, active = s.i === step;
              return (
                <button key={s.i} onClick={() => setStep(s.i)} style={{
                  textAlign: "left", padding: "12px 14px", border: "none", background: active ? "var(--accent-soft)" : "transparent",
                  borderRadius: "var(--r)", display: "flex", gap: 12, alignItems: "center", cursor: "pointer"
                }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: 999, display: "grid", placeItems: "center",
                    background: done ? "var(--sage-600)" : active ? "var(--ink)" : "var(--paper-3)",
                    color: done || active ? "white" : "var(--ink-3)",
                    fontSize: 11, fontWeight: 600
                  }}>
                    {done ? <Icon.check style={{ width: 12, height: 12 }} /> : s.i}
                  </span>
                  <div>
                    <div style={{ fontSize: 13.5, color: active || done ? "var(--ink)" : "var(--ink-3)", fontWeight: 500 }}>{s.t}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{s.d}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 24, padding: 14, border: "1px dashed var(--hairline-2)", borderRadius: "var(--r)" }}>
            <div className="eyebrow">Estimate so far</div>
            <div className="font-mono" style={{ marginTop: 6, fontSize: 22, color: "var(--ink)", letterSpacing: "-0.01em" }}>€ 24,310</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>updates as you type</div>
          </div>
        </aside>

        {/* Center card */}
        <main className="card" style={{ padding: 36, borderRadius: "var(--r-xl)", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <IntakeStepDots step={step} />
            <span className="eyebrow">Step {step} of 3</span>
          </div>

          {step === 1 && <IntakeStep1 type={type} setType={setType} />}
          {step === 2 && <IntakeStep2 type={type} />}
          {step === 3 && <IntakeStep3 />}

          <div style={{ marginTop: 30, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button className="btn btn-ghost" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>← Back</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <a style={{ fontSize: 12.5, color: "var(--ink-4)" }}>Skip for now</a>
              <button className="btn btn-accent" onClick={() => setStep(Math.min(3, step + 1))}>
                {step === 3 ? "Calculate" : "Continue"} <Icon.arrow />
              </button>
            </div>
          </div>
        </main>

        {/* Right tip */}
        <aside style={{ position: "sticky", top: 92 }}>
          <div className="card" style={{ padding: 18, background: "var(--ink)", color: "var(--paper)", border: "none" }}>
            <span className="eyebrow" style={{ color: "var(--sage-300)" }}>Why we ask</span>
            <p style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.5, color: "oklch(0.88 0.01 95)" }}>
              {step === 1 && "Your tax type changes everything — deductions, credits, even what questions the chat shows you."}
              {step === 2 && "Income drives every Box 1 calculation. We round to the cent on the official 2026 brackets."}
              {step === 3 && "Partner, kids, and Box 3 assets unlock IACK, heffingskorting transfers and the savings threshold."}
            </p>
          </div>
          <div style={{ marginTop: 14, padding: 14, fontSize: 12, color: "var(--ink-3)", border: "1px solid var(--hairline)", borderRadius: "var(--r)" }}>
            <span className="eyebrow eyebrow-accent">Did you know</span>
            <p style={{ marginTop: 6, color: "var(--ink-2)", fontSize: 12.5, lineHeight: 1.5 }}>
              2026 is the <em>last year</em> of startersaftrek (€2,123). The chat will flag if you qualify.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function IntakeStep1({ type, setType }) {
  return (
    <div style={{ marginTop: 24 }}>
      <h1 style={{ fontFamily: "var(--serif)", fontSize: 34, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
        Which describes you best?
      </h1>
      <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 14 }}>One choice. You can change this later.</p>

      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {Object.entries(USER_TYPES).map(([k, v]) => {
          const on = type === k;
          return (
            <button key={k} type="button" onClick={() => setType(k)} style={{
              textAlign: "left", padding: "18px 20px", borderRadius: "var(--r)",
              border: `1px solid ${on ? "var(--sage-600)" : "var(--hairline-2)"}`,
              background: on ? "var(--accent-soft)" : "var(--paper)",
              display: "flex", flexDirection: "column", gap: 12, cursor: "pointer", minHeight: 150,
              position: "relative",
            }}>
              {on && (
                <span style={{ position: "absolute", top: 14, right: 14, width: 18, height: 18, borderRadius: 999, background: "var(--sage-600)", color: "white", display: "grid", placeItems: "center" }}>
                  <Icon.check style={{ width: 10, height: 10 }} />
                </span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: v.color, color: "white", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}>
                  {v.glyph}
                </span>
                <div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 22, color: "var(--ink)" }}>{v.label}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{v.desc}</div>
                </div>
              </div>
              <div style={{ marginTop: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(k === "zzp"      ? ["Wet DBA", "Zelfstandigenaftrek", "MKB"] :
                  k === "employee" ? ["Loonheffing", "IACK"] :
                  k === "expat"    ? ["30% ruling", "Foreign income"] :
                                     ["Box 2", "Salary + dividend"]).map(t => (
                  <span key={t} className="eyebrow" style={{ padding: "3px 7px", background: "var(--paper-3)", borderRadius: 999 }}>{t}</span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function IntakeStep2({ type }) {
  const fields = {
    zzp: [
      { l: "Annual revenue",     ph: "72,000", v: "72000", unit: "€", help: "Gross before expenses" },
      { l: "Business expenses",  ph: "8,000",  v: "8000",  unit: "€", help: "Software, travel, materials" },
      { l: "Hours per year",     ph: "1,500",  v: "1500",  unit: "h", help: "Need 1,225 h for zelfstandigenaftrek" },
    ],
    employee: [
      { l: "Annual gross salary", ph: "55,000", v: "55000", unit: "€" },
      { l: "Holiday allowance %", ph: "8",      v: "8",     unit: "%" },
    ],
    expat: [
      { l: "Annual gross salary", ph: "95,000", v: "95000", unit: "€" },
      { l: "30% ruling year",     ph: "2",      v: "2",     unit: "/5" },
    ],
    dga: [
      { l: "Annual BV salary",  ph: "56,000", v: "56000", unit: "€" },
      { l: "Box 2 dividend",    ph: "12,000", v: "12000", unit: "€" },
    ],
  }[type] || [];
  return (
    <div style={{ marginTop: 24 }}>
      <h1 style={{ fontFamily: "var(--serif)", fontSize: 34, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
        Your <span style={{ color: "var(--sage-700)", fontStyle: "italic" }}>{USER_TYPES[type].label}</span> income.
      </h1>
      <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 14 }}>Numbers stay on your device until you create an account.</p>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        {fields.map(f => (
          <div key={f.l}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="label">{f.l}</span>
              {f.help && <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{f.help}</span>}
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", fontSize: 14 }}>{f.unit}</span>
              <input className="input" defaultValue={f.v} placeholder={f.ph} style={{ paddingLeft: 32 }} />
            </div>
          </div>
        ))}
        {type === "zzp" && (
          <label style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 14px", background: "var(--paper-3)", borderRadius: "var(--r-sm)", fontSize: 13.5 }}>
            <input type="checkbox" defaultChecked />
            <span><strong style={{ color: "var(--ink)" }}>Starter year?</strong> Unlocks startersaftrek (€2,123 in 2026 — last year).</span>
          </label>
        )}
      </div>
    </div>
  );
}

function IntakeStep3() {
  return (
    <div style={{ marginTop: 24 }}>
      <h1 style={{ fontFamily: "var(--serif)", fontSize: 34, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
        Your household.
      </h1>
      <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 14 }}>Affects credits, allowances and Box 3.</p>

      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <ToggleField label="Fiscal partner?" />
        <SelectField label="Children under 12" value="2" opts={["0","1","2","3+"]} />
        <NumField label="Partner income" v="34,000" unit="€" />
        <NumField label="Box 3 net assets" v="48,000" unit="€" />
        <NumField label="Pension contribution" v="3,600" unit="€" />
        <NumField label="Mortgage interest paid" v="9,200" unit="€" />
      </div>
    </div>
  );
}

function ToggleField({ label }) {
  const [v, set] = React.useState(true);
  return (
    <div>
      <div className="label" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", border: "1px solid var(--hairline-2)", borderRadius: "var(--r-sm)", overflow: "hidden" }}>
        {[["Yes", true], ["No", false]].map(([t, val]) => (
          <button key={t} onClick={() => set(val)} style={{
            flex: 1, padding: "9px 0", fontSize: 13.5, border: "none", cursor: "pointer",
            background: v === val ? "var(--accent-soft)" : "var(--paper)",
            color: v === val ? "var(--sage-700)" : "var(--ink-3)",
            fontWeight: v === val ? 600 : 400,
          }}>{t}</button>
        ))}
      </div>
    </div>
  );
}
function SelectField({ label, value, opts }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 6 }}>{label}</div>
      <div className="input" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "var(--ink)" }}>{value}</span>
        <Icon.chev style={{ transform: "rotate(90deg)" }} />
      </div>
    </div>
  );
}
function NumField({ label, v, unit }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", fontSize: 14 }}>{unit}</span>
        <input className="input" defaultValue={v} style={{ paddingLeft: 32 }} />
      </div>
    </div>
  );
}

// ─── Mobile ─────────────────────────────────────────────────
function IntakeMobile() {
  const [step, setStep] = React.useState(1);
  const [type, setType] = React.useState("zzp");
  return (
    <MobileFrame bg="var(--paper)">
      <MobileTopBar back title={`Step ${step} of 3`} action={<a style={{ fontSize: 12, color: "var(--ink-3)" }}>Skip</a>} />
      <div className="tw" style={{ padding: "16px 18px 28px" }}>
        <IntakeStepDots step={step} />

        {step === 1 && (
          <div style={{ marginTop: 20 }}>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              Which describes you?
            </h1>
            <p style={{ marginTop: 6, color: "var(--ink-3)", fontSize: 13 }}>One choice. Change later.</p>
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(USER_TYPES).map(([k, v]) => {
                const on = type === k;
                return (
                  <button key={k} onClick={() => setType(k)} style={{
                    textAlign: "left", padding: 14, borderRadius: "var(--r)",
                    border: `1px solid ${on ? "var(--sage-600)" : "var(--hairline-2)"}`,
                    background: on ? "var(--accent-soft)" : "var(--paper)",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <span style={{ width: 34, height: 34, borderRadius: 8, background: v.color, color: "white", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}>{v.glyph}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--ink)" }}>{v.label}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{v.desc}</div>
                    </div>
                    {on && (
                      <span style={{ width: 20, height: 20, borderRadius: 999, background: "var(--sage-600)", color: "white", display: "grid", placeItems: "center" }}>
                        <Icon.check style={{ width: 11, height: 11 }} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && <div style={{ marginTop: 18 }}><IntakeStep2 type={type} /></div>}
        {step === 3 && <div style={{ marginTop: 18 }}><IntakeStep3 /></div>}

        <div style={{ marginTop: 26, display: "flex", gap: 10 }}>
          {step > 1 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)} style={{ flex: 1 }}>Back</button>}
          <button className="btn btn-accent" onClick={() => setStep(Math.min(3, step + 1))} style={{ flex: 2 }}>
            {step === 3 ? "Calculate" : "Continue"} <Icon.arrow />
          </button>
        </div>
      </div>
    </MobileFrame>
  );
}

Object.assign(window, { IntakeDesktop, IntakeMobile });
