/* TaxWijs — Landing page (mobile + desktop) */

function LandingDesktop() {
  const features = [
    { kbd: "01", title: "Chat", body: "Plain-language tax answers in NL, EN, or FA — grounded in 2026 rules and your own numbers." },
    { kbd: "02", title: "Calculator", body: "Box 1 · 2 · 3, ZZP deductions, credits and Wet DBA — calculated, not estimated." },
    { kbd: "03", title: "IB Return", body: "Field-by-field walkthrough of the official aangifte with explanations and traps." },
    { kbd: "04", title: "Three languages", body: "Dutch, English and Persian — first class, with full RTL layout." },
  ];
  const proofRows = [
    ["ZZP · 1 client",          "€72,000", "WET DBA · HIGH"],
    ["Employee · 30% ruling",   "€95,000", "RULING YEAR 2"],
    ["DGA · BV salary + div",   "€56,000", "DIVIDEND €12k"],
  ];
  return (
    <div className="tw" style={{ width: "100%", height: "100%", overflow: "auto", background: "var(--paper)" }}>
      <TopNav active="home" />
      {/* HERO */}
      <section className="grain" style={{ padding: "72px 56px 56px", borderBottom: "1px solid var(--hairline)" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 11px", borderRadius: 999, background: "var(--paper)", border: "1px solid var(--accent-line)" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--sage-600)" }} />
              <span className="eyebrow eyebrow-accent">Dutch Tax AI · 2026</span>
            </div>
            <h1 style={{ marginTop: 22, fontSize: 64, lineHeight: 1.02, color: "var(--ink)", fontWeight: 400, fontFamily: "var(--serif)", letterSpacing: "-0.025em" }}>
              Tax in the Netherlands,<br/>
              <span style={{ fontStyle: "italic", color: "var(--sage-700)" }}>answered plainly.</span>
            </h1>
            <p style={{ marginTop: 18, fontSize: 17, lineHeight: 1.5, color: "var(--ink-2)", maxWidth: 520 }}>
              An AI assistant for ZZP&apos;ers, employees, expats and DGA directors. Enter your situation once and ask any question — in Dutch, English or Persian.
            </p>
            <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 12 }}>
              <button className="btn btn-accent btn-lg">Set up your profile <Icon.arrow /></button>
              <button className="btn btn-ghost btn-lg">Ask a question</button>
            </div>
            <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14, color: "var(--ink-3)", fontSize: 12.5 }}>
              <span>· No account needed</span>
              <span>· 2026 rules verified</span>
              <span>· Sources on every answer</span>
            </div>
          </div>

          {/* Right — composed hero artifact */}
          <div style={{ position: "relative" }}>
            <div className="card" style={{ padding: 18, boxShadow: "var(--shadow-lg)", borderRadius: "var(--r-xl)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 6px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--sage-500)" }} />
                  <span className="eyebrow">Live answer · ZZP · €72,000</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--ink-4)" }}>2.3s</span>
              </div>

              {/* User question chip */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                <div style={{ padding: "8px 14px", borderRadius: 16, background: "var(--ink)", color: "var(--paper)", fontSize: 13, maxWidth: 320 }}>
                  Am I a Wet DBA risk if I have one client?
                </div>
              </div>

              {/* Assistant answer */}
              <div style={{ padding: 16, background: "var(--paper-3)", borderRadius: "var(--r)", border: "1px solid var(--hairline)" }}>
                <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
                  Yes — one client accounting for 100% of revenue places you in <strong style={{ color: "var(--ink)" }}>HIGH risk</strong> under the Wet DBA test. The Belastingdienst can reclassify the relationship as employment.
                </p>
                <div style={{ marginTop: 12, padding: 12, background: "var(--paper)", borderRadius: "var(--r-sm)", border: "1px dashed var(--accent-line)" }}>
                  <div className="eyebrow eyebrow-accent" style={{ marginBottom: 4 }}>Your numbers</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 4, fontSize: 13 }}>
                    <span>Revenue</span><span className="num">€ 72,000</span>
                    <span>Single-client share</span><span className="num">100 %</span>
                    <span>Risk band</span><span className="num" style={{ color: "var(--danger)" }}>HIGH</span>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["What proves independence?", "Add a second client", "Modelovereenkomst guide"].map(s => (
                    <span key={s} style={{ padding: "5px 10px", borderRadius: 999, fontSize: 12, background: "var(--paper)", border: "1px solid var(--hairline-2)", color: "var(--ink-2)" }}>{s}</span>
                  ))}
                </div>
              </div>

              {/* Sources */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 4px 2px", fontSize: 11, color: "var(--ink-3)" }}>
                <span className="eyebrow">Sources</span>
                <span>belastingdienst.nl/wet-dba</span>
                <span>·</span>
                <span>kvk.nl/modelovereenkomst</span>
              </div>
            </div>

            {/* Floating chips */}
            <div className="card" style={{ position: "absolute", left: -32, top: 36, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--shadow)" }}>
              <span style={{ width: 22, height: 22, borderRadius: 999, background: "var(--sage-100)", display: "grid", placeItems: "center", color: "var(--sage-700)", fontSize: 11, fontWeight: 600 }}>NL</span>
              <span style={{ fontSize: 12 }}>Switch to Nederlands</span>
            </div>
            <div className="card" style={{ position: "absolute", right: -28, bottom: 60, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--shadow)" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--sage-700)" }}>€ 24,310</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>tax to reserve</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "72px 56px", borderBottom: "1px solid var(--hairline)" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <div className="eyebrow eyebrow-accent">What it does</div>
              <h2 style={{ fontSize: 36, fontFamily: "var(--serif)", fontWeight: 400, color: "var(--ink)", marginTop: 6, letterSpacing: "-0.02em" }}>
                Four tools, one tax brain.
              </h2>
            </div>
            <p style={{ maxWidth: 360, color: "var(--ink-3)", fontSize: 14 }}>
              Each tool shares the same verified ruleset, your stored profile and the same calculation engine — answers stay consistent.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--hairline)", border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
            {features.map(f => (
              <div key={f.kbd} style={{ padding: "28px 22px 30px", background: "var(--paper)", display: "flex", flexDirection: "column", gap: 14, minHeight: 220 }}>
                <span className="eyebrow">{f.kbd}</span>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 400, color: "var(--ink)" }}>{f.title}</h3>
                <p style={{ fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.55 }}>{f.body}</p>
                <span style={{ marginTop: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--sage-700)" }}>
                  Open <Icon.arrow />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF / WHO IT'S FOR */}
      <section style={{ padding: "72px 56px", background: "var(--paper-tint)", borderBottom: "1px solid var(--hairline)" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 56, alignItems: "center" }}>
          <div>
            <div className="eyebrow eyebrow-accent">Built for the four ways NL gets taxed</div>
            <h2 style={{ fontSize: 36, fontFamily: "var(--serif)", fontWeight: 400, marginTop: 6, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              Same engine. Different prompts, deductions and risks per type.
            </h2>
            <p style={{ marginTop: 14, color: "var(--ink-3)", fontSize: 14.5, lineHeight: 1.55, maxWidth: 460 }}>
              The system knows the rules that apply to <em>you</em> — including the ones most people miss, like MKB-vrijstelling, IACK, or the last year of startersaftrek.
            </p>
            <div style={{ marginTop: 22, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(USER_TYPES).map(([k, v]) => (
                <span key={k} style={{ padding: "8px 14px", border: "1px solid var(--hairline-2)", borderRadius: 999, background: "var(--paper)", fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: v.color }} />
                  {v.label}
                </span>
              ))}
            </div>
          </div>
          <div className="card" style={{ background: "var(--paper)", padding: 0, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", padding: "14px 22px", background: "var(--paper-3)", borderBottom: "1px solid var(--hairline)" }}>
              <span className="eyebrow">Sample profile</span>
              <span className="eyebrow" style={{ textAlign: "right" }}>Income</span>
              <span className="eyebrow" style={{ textAlign: "right" }}>Flag</span>
            </div>
            {proofRows.map(([a, b, c], i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", padding: "18px 22px", borderBottom: i < proofRows.length - 1 ? "1px solid var(--hairline)" : "none", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--ink)" }}>{a}</span>
                <span className="num" style={{ color: "var(--ink)" }}>{b}</span>
                <span className="num" style={{ fontSize: 11, color: "var(--sage-700)", letterSpacing: "0.06em" }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section style={{ padding: "80px 56px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 46, fontFamily: "var(--serif)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            File 2026 with a second pair of eyes.
          </h2>
          <p style={{ marginTop: 14, color: "var(--ink-3)", fontSize: 15 }}>
            Free to try · upgrade only if you want unlimited.
          </p>
          <div style={{ marginTop: 22, display: "inline-flex", gap: 10 }}>
            <button className="btn btn-accent btn-lg">Start free</button>
            <button className="btn btn-ghost btn-lg">See pricing</button>
          </div>
          <p style={{ marginTop: 40, fontSize: 11.5, color: "var(--ink-4)" }}>
            TaxWijs provides general information — not official tax advice.
          </p>
        </div>
      </section>
    </div>
  );
}

function LandingMobile() {
  return (
    <MobileFrame>
      <div className="tw" style={{ padding: "12px 18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <Wordmark size={14} />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <LangSwitch />
            <button style={{ width: 34, height: 34, borderRadius: 999, border: "1px solid var(--hairline-2)", background: "var(--paper)", display: "grid", placeItems: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            </button>
          </div>
        </div>

        {/* Hero */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: "var(--paper)", border: "1px solid var(--accent-line)" }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--sage-600)" }} />
          <span className="eyebrow eyebrow-accent" style={{ fontSize: 9.5 }}>Dutch Tax AI · 2026</span>
        </div>
        <h1 style={{ marginTop: 14, fontSize: 36, lineHeight: 1.05, color: "var(--ink)", fontFamily: "var(--serif)", fontWeight: 400, letterSpacing: "-0.02em" }}>
          Tax in the Netherlands,<br/>
          <span style={{ fontStyle: "italic", color: "var(--sage-700)" }}>answered plainly.</span>
        </h1>
        <p style={{ marginTop: 12, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>
          AI tax help for ZZP&apos;ers, employees, expats and DGAs. In NL, EN or FA.
        </p>

        {/* Inline answer card */}
        <div className="card" style={{ marginTop: 18, padding: 14, borderRadius: "var(--r-lg)", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--sage-500)" }} />
              <span className="eyebrow" style={{ fontSize: 9.5 }}>Live · ZZP · €72k</span>
            </div>
            <span style={{ fontSize: 10, color: "var(--ink-4)" }}>2.3s</span>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
            <div style={{ padding: "7px 12px", borderRadius: 14, background: "var(--ink)", color: "var(--paper)", fontSize: 12.5 }}>
              Wet DBA risk?
            </div>
          </div>
          <div style={{ padding: 12, background: "var(--paper-3)", borderRadius: "var(--r-sm)" }}>
            <p style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5 }}>
              Yes — single client at 100% revenue is <strong style={{ color: "var(--ink)" }}>HIGH risk</strong>.
            </p>
            <div style={{ marginTop: 10, padding: 10, background: "var(--paper)", borderRadius: 6, border: "1px dashed var(--accent-line)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 3, fontSize: 12 }}>
                <span>Revenue</span><span className="num">€ 72,000</span>
                <span>Risk</span><span className="num" style={{ color: "var(--danger)" }}>HIGH</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="btn btn-accent btn-lg" style={{ width: "100%" }}>Set up your profile <Icon.arrow /></button>
          <button className="btn btn-ghost btn-lg" style={{ width: "100%" }}>Ask a question first</button>
        </div>
        <p style={{ marginTop: 12, fontSize: 11.5, color: "var(--ink-4)", textAlign: "center" }}>No account needed · Free to try</p>

        {/* Feature stack */}
        <div style={{ marginTop: 30 }}>
          <div className="eyebrow eyebrow-accent">What it does</div>
          <h2 style={{ marginTop: 4, fontSize: 22, fontFamily: "var(--serif)", fontWeight: 400, color: "var(--ink)" }}>Four tools, one tax brain.</h2>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
            {[
              ["01", "Chat", "Sourced answers from 2026 rules."],
              ["02", "Calculator", "Box 1·2·3 with ZZP deductions."],
              ["03", "IB Return", "Field-by-field aangifte guide."],
              ["04", "3 Languages", "NL · EN · FA with RTL."],
            ].map(([k, t, b]) => (
              <div key={k} style={{ padding: "16px 16px", display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 14, borderBottom: "1px solid var(--hairline)", background: "var(--paper)" }}>
                <span className="eyebrow">{k}</span>
                <div>
                  <div style={{ fontSize: 15, color: "var(--ink)", fontWeight: 500 }}>{t}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{b}</div>
                </div>
                <Icon.chev />
              </div>
            ))}
          </div>
        </div>
        <p style={{ marginTop: 28, fontSize: 11, color: "var(--ink-4)", textAlign: "center" }}>
          TaxWijs provides general information — not official tax advice.
        </p>
      </div>
    </MobileFrame>
  );
}

Object.assign(window, { LandingDesktop, LandingMobile });
