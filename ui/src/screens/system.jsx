/* TaxWijs — Design System showcase */

function SystemShowcase() {
  return (
    <div className="tw" style={{ width: "100%", height: "100%", overflow: "auto", background: "var(--paper)", padding: 32 }}>
      <div className="eyebrow eyebrow-accent">TaxWijs · 2026</div>
      <h1 style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: 44, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1.05 }}>
        The system in one screen.
      </h1>
      <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 14, maxWidth: 560 }}>
        Sage on warm paper. Geist for UI, Instrument Serif for display, JetBrains Mono for figures.
      </p>

      <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
        {/* Colors */}
        <section>
          <div className="eyebrow">Color · sage scale</div>
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 6 }}>
            {[100,200,300,400,500,600,700,800,900].map(n => (
              <div key={n}>
                <div style={{ height: 56, borderRadius: 8, background: `var(--sage-${n})`, border: "1px solid var(--hairline)" }} />
                <div style={{ marginTop: 4, fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)" }}>sage-{n}</div>
              </div>
            ))}
          </div>

          <div className="eyebrow" style={{ marginTop: 24 }}>Color · paper & ink</div>
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {[
              ["paper", "var(--paper)", "var(--ink)"],
              ["paper-2", "var(--paper-2)", "var(--ink)"],
              ["paper-3", "var(--paper-3)", "var(--ink)"],
              ["ink", "var(--ink)", "var(--paper)"],
            ].map(([n, bg, fg]) => (
              <div key={n} style={{ background: bg, color: fg, borderRadius: 8, padding: 12, height: 80, border: "1px solid var(--hairline)" }}>
                <div className="eyebrow" style={{ color: fg, opacity: 0.7 }}>{n}</div>
              </div>
            ))}
          </div>

          <div className="eyebrow" style={{ marginTop: 24 }}>Color · semantic</div>
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {[["ok","--ok","--ok-soft"],["warn","--warn","--warn-soft"],["danger","--danger","--danger-soft"],["info","--info","--info-soft"]].map(([n, c, s]) => (
              <div key={n} style={{ borderRadius: 8, background: `var(${s})`, padding: 10, height: 70, border: "1px solid var(--hairline)" }}>
                <div className="eyebrow" style={{ color: `var(${c})` }}>{n}</div>
                <div style={{ marginTop: 6, height: 6, borderRadius: 3, background: `var(${c})` }} />
              </div>
            ))}
          </div>
        </section>

        {/* Type */}
        <section>
          <div className="eyebrow">Typography</div>
          <div className="card" style={{ marginTop: 10, padding: 20 }}>
            <div className="eyebrow">Display · Instrument Serif</div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 48, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1.04, marginTop: 4 }}>
              Tax, answered <em style={{ color: "var(--sage-700)" }}>plainly.</em>
            </div>
            <div className="dots" style={{ margin: "18px 0" }} />
            <div className="eyebrow">UI · Geist</div>
            <div style={{ fontSize: 22, color: "var(--ink)", marginTop: 4, fontWeight: 500 }}>Headline / 22 medium</div>
            <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 4 }}>Body / 14 regular — keeping decisions calm, decisive and quiet.</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>Meta / 12 regular muted</div>
            <div className="dots" style={{ margin: "18px 0" }} />
            <div className="eyebrow">Figures · JetBrains Mono</div>
            <div className="font-mono" style={{ fontSize: 26, color: "var(--ink)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>€ 12,974.50</div>
            <div className="eyebrow" style={{ marginTop: 4 }}>BOX 1 · 1a · 1,225 h</div>
          </div>
        </section>
      </div>

      {/* Components row */}
      <section style={{ marginTop: 28 }}>
        <div className="eyebrow">Components</div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div className="card" style={{ padding: 18 }}>
            <div className="eyebrow eyebrow-accent">Buttons</div>
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button className="btn btn-accent">Primary</button>
              <button className="btn btn-primary">Ink</button>
              <button className="btn btn-soft">Soft</button>
              <button className="btn btn-ghost">Ghost</button>
              <button className="btn btn-accent btn-sm">Small</button>
              <button className="btn btn-accent btn-lg">Large</button>
            </div>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div className="eyebrow eyebrow-accent">Pills</div>
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
              <span className="pill pill-accent">⚡ Premium</span>
              <span className="pill pill-ok">verified</span>
              <span className="pill pill-warn">pending</span>
              <span className="pill pill-danger">expired</span>
              <span className="pill pill-ink">ZZP</span>
            </div>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div className="eyebrow eyebrow-accent">Inputs</div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              <input className="input" placeholder="email@example.nl" />
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)" }}>€</span>
                <input className="input" defaultValue="72,000" style={{ paddingLeft: 28 }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing & radii */}
      <section style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="eyebrow eyebrow-accent">Radii</div>
          <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "flex-end" }}>
            {[["6", "xs"], ["8", "sm"], ["12", "r"], ["16", "lg"], ["22", "xl"], ["28", "2xl"]].map(([r, n]) => (
              <div key={n} style={{ textAlign: "center" }}>
                <div style={{ width: 56, height: 56, background: "var(--sage-100)", borderRadius: `${r}px`, border: "1px solid var(--sage-300)" }} />
                <div className="eyebrow" style={{ marginTop: 4 }}>{n} · {r}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="eyebrow eyebrow-accent">Imagery placeholder</div>
          <div className="image-slot" style={{ marginTop: 12, height: 100 }}>illustration · 16:9</div>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { SystemShowcase });
