/* TaxWijs — Login & Register */

function AuthShellDesktop({ children, side }) {
  return (
    <div className="tw" style={{ width: "100%", height: "100%", display: "grid", gridTemplateColumns: "1.1fr 1fr", overflow: "hidden" }}>
      {/* Left — content */}
      <div style={{ padding: "36px 56px 36px", display: "flex", flexDirection: "column", background: "var(--paper)", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Wordmark size={16} />
          <a style={{ fontSize: 13, color: "var(--ink-3)" }}>← Back to home</a>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{ width: "100%", maxWidth: 380 }}>{children}</div>
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-4)", display: "flex", justifyContent: "space-between" }}>
          <span>© 2026 TaxWijs</span>
          <span>Privacy · Terms</span>
        </div>
      </div>
      {/* Right — editorial side panel */}
      <div className="grain" style={{ padding: 36, position: "relative", borderLeft: "1px solid var(--hairline)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {side}
      </div>
    </div>
  );
}

function LoginDesktop() {
  return (
    <AuthShellDesktop side={<LoginSide />}>
      <div className="eyebrow eyebrow-accent">Welcome back</div>
      <h1 style={{ marginTop: 8, fontSize: 36, fontFamily: "var(--serif)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
        Log in to your<br/>tax workspace.
      </h1>

      <form style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>Email</div>
          <input className="input" defaultValue="anna@studio.nl" />
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span className="label">Password</span>
            <a style={{ fontSize: 11.5, color: "var(--sage-700)" }}>Forgot?</a>
          </div>
          <input className="input" type="password" defaultValue="••••••••" />
        </div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, color: "var(--ink-3)", marginTop: 4 }}>
          <input type="checkbox" defaultChecked /> Keep me signed in
        </label>
        <button className="btn btn-accent btn-lg" style={{ marginTop: 6 }}>Log in <Icon.arrow /></button>
      </form>

      <div style={{ margin: "22px 0", display: "flex", alignItems: "center", gap: 12, color: "var(--ink-4)", fontSize: 11 }}>
        <span className="hair" style={{ flex: 1 }} /> OR <span className="hair" style={{ flex: 1 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button className="btn btn-ghost">Continue with Google</button>
        <button className="btn btn-ghost">Single sign-on</button>
      </div>

      <p style={{ marginTop: 24, fontSize: 13, color: "var(--ink-3)" }}>
        New here? <a style={{ color: "var(--sage-700)", fontWeight: 500 }}>Create an account →</a>
      </p>
    </AuthShellDesktop>
  );
}

function LoginSide() {
  return (
    <>
      <Wordmark size={14} dark />
      <div>
        <span className="pill" style={{ background: "rgba(255,255,255,0.12)", color: "white" }}>Today’s tip</span>
        <h2 style={{ marginTop: 16, color: "var(--ink)", fontFamily: "var(--serif)", fontWeight: 400, fontSize: 32, lineHeight: 1.12, letterSpacing: "-0.015em" }}>
          “Startersaftrek runs out at the end of <em>2026</em> — last call for the €2,123 deduction.”
        </h2>
        <p style={{ marginTop: 16, color: "var(--ink-3)", fontSize: 13, maxWidth: 360 }}>
          One of 28 verified 2026 rules in your knowledge base.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[["28", "Rules verified"], ["3", "Languages"], ["1,225 h", "ZZP hour rule"]].map(([n, l]) => (
          <div key={l} style={{ padding: 14, background: "var(--paper)", border: "1px solid var(--hairline)", borderRadius: "var(--r)" }}>
            <div className="font-serif" style={{ fontSize: 26, color: "var(--ink)", lineHeight: 1 }}>{n}</div>
            <div className="eyebrow" style={{ marginTop: 6 }}>{l}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function RegisterDesktop() {
  const [type, setType] = React.useState("zzp");
  return (
    <AuthShellDesktop side={<RegisterSide type={type} />}>
      <div className="eyebrow eyebrow-accent">Step 1 of 3</div>
      <h1 style={{ marginTop: 8, fontSize: 36, fontFamily: "var(--serif)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
        Make an account.
      </h1>
      <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 14 }}>
        We&apos;ll personalise everything to your tax type.
      </p>

      <form style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>Email</div>
          <input className="input" placeholder="you@example.nl" />
        </div>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>Password</div>
          <input className="input" type="password" placeholder="At least 8 characters" />
        </div>

        <div style={{ marginTop: 6 }}>
          <div className="label" style={{ marginBottom: 8 }}>I&apos;m a</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {Object.entries(USER_TYPES).map(([k, v]) => {
              const on = type === k;
              return (
                <button key={k} type="button" onClick={() => setType(k)} style={{
                  textAlign: "left", padding: "12px 14px", borderRadius: "var(--r-sm)",
                  border: `1px solid ${on ? "var(--sage-600)" : "var(--hairline-2)"}`,
                  background: on ? "var(--accent-soft)" : "var(--paper)",
                  display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "all .15s"
                }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: v.color, color: "white", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}>
                    {v.glyph}
                  </span>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{v.label}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{v.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button className="btn btn-accent btn-lg" style={{ marginTop: 10 }}>Continue <Icon.arrow /></button>
      </form>

      <p style={{ marginTop: 22, fontSize: 13, color: "var(--ink-3)" }}>
        Already have an account? <a style={{ color: "var(--sage-700)", fontWeight: 500 }}>Log in →</a>
      </p>
    </AuthShellDesktop>
  );
}

function RegisterSide({ type }) {
  const t = USER_TYPES[type];
  return (
    <>
      <Wordmark size={14} />
      <div>
        <span className="pill pill-accent">For {t.label.toLowerCase()}s</span>
        <h2 style={{ marginTop: 14, color: "var(--ink)", fontFamily: "var(--serif)", fontWeight: 400, fontSize: 32, lineHeight: 1.12, letterSpacing: "-0.015em" }}>
          We&apos;ll tune the chat, the calculator and the return guide to <em>{t.label}</em> situations.
        </h2>
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
          {(type === "zzp" ? [
            "Wet DBA risk check on every chat",
            "Zelfstandigenaftrek + MKB-vrijstelling auto-applied",
            "Quarterly VAT reminders",
          ] : type === "employee" ? [
            "Payslip translator (loonheffing → take-home)",
            "Box 3 forecast with WOZ inputs",
            "All standard tax credits",
          ] : type === "expat" ? [
            "30%-ruling year tracker (years 1–5)",
            "Foreign income reconciliation",
            "EN + FA chat as a first-class language",
          ] : [
            "Optimal salary vs. dividend split",
            "Box 2 calculations for your BV",
            "DGA-only deductions surfaced first",
          ]).map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, color: "var(--ink-2)" }}>
              <span style={{ marginTop: 5, width: 14, height: 14, borderRadius: 999, background: t.color, color: "white", display: "grid", placeItems: "center" }}>
                <Icon.check style={{ width: 9, height: 9 }} />
              </span>
              {l}
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--ink-4)" }}>
        Can change later in your profile.
      </div>
    </>
  );
}

// ─── Mobile ────────────────────────────────────────────────
function LoginMobile() {
  return (
    <MobileFrame>
      <MobileTopBar />
      <div className="tw" style={{ padding: "32px 22px 28px" }}>
        <div className="eyebrow eyebrow-accent">Welcome back</div>
        <h1 style={{ marginTop: 6, fontSize: 28, fontFamily: "var(--serif)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
          Log in.
        </h1>

        <form style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Email</div>
            <input className="input" defaultValue="anna@studio.nl" />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="label">Password</span>
              <a style={{ fontSize: 11.5, color: "var(--sage-700)" }}>Forgot?</a>
            </div>
            <input className="input" type="password" defaultValue="••••••••" />
          </div>
          <button className="btn btn-accent btn-lg" style={{ width: "100%", marginTop: 6 }}>Log in</button>
        </form>

        <div style={{ margin: "20px 0", display: "flex", alignItems: "center", gap: 12, color: "var(--ink-4)", fontSize: 11 }}>
          <span className="hair" style={{ flex: 1 }} /> OR <span className="hair" style={{ flex: 1 }} />
        </div>
        <button className="btn btn-ghost btn-lg" style={{ width: "100%" }}>Continue with Google</button>

        <p style={{ marginTop: 22, fontSize: 13, color: "var(--ink-3)", textAlign: "center" }}>
          New here? <a style={{ color: "var(--sage-700)", fontWeight: 500 }}>Create an account →</a>
        </p>
      </div>
    </MobileFrame>
  );
}

function RegisterMobile() {
  const [type, setType] = React.useState("zzp");
  return (
    <MobileFrame>
      <MobileTopBar back />
      <div className="tw" style={{ padding: "20px 22px 28px" }}>
        <div className="eyebrow eyebrow-accent">Step 1 of 3</div>
        <h1 style={{ marginTop: 6, fontSize: 28, fontFamily: "var(--serif)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
          Make an account.
        </h1>

        <form style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Email</div>
            <input className="input" placeholder="you@example.nl" />
          </div>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Password</div>
            <input className="input" type="password" placeholder="At least 8 characters" />
          </div>

          <div style={{ marginTop: 6 }}>
            <div className="label" style={{ marginBottom: 8 }}>I&apos;m a</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(USER_TYPES).map(([k, v]) => {
                const on = type === k;
                return (
                  <button key={k} type="button" onClick={() => setType(k)} style={{
                    textAlign: "left", padding: 10, borderRadius: "var(--r-sm)",
                    border: `1px solid ${on ? "var(--sage-600)" : "var(--hairline-2)"}`,
                    background: on ? "var(--accent-soft)" : "var(--paper)",
                    display: "flex", flexDirection: "column", gap: 6,
                  }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: v.color, color: "white", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em" }}>{v.glyph}</span>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{v.label}</div>
                    <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{v.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <button className="btn btn-accent btn-lg" style={{ width: "100%", marginTop: 10 }}>Continue <Icon.arrow /></button>
        </form>
      </div>
    </MobileFrame>
  );
}

Object.assign(window, { LoginDesktop, LoginMobile, RegisterDesktop, RegisterMobile });
