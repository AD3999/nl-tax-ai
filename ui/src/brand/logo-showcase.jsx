/* TaxWijs — Brand showcase: 5 logo options, sizes, on-dark, favicon, type lockups */

function LogoShowcase() {
  return (
    <div className="tw" style={{ width: "100%", height: "100%", overflow: "auto", background: "var(--paper)" }}>
      {/* Title */}
      <section style={{ padding: "44px 40px 28px", borderBottom: "1px solid var(--hairline)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          <div>
            <div className="eyebrow eyebrow-accent">Brand · v1</div>
            <h1 style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: 50, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1.04 }}>
              Five marks.<br /><em style={{ color: "var(--sage-700)" }}>One idea.</em>
            </h1>
          </div>
          <p style={{ maxWidth: 380, fontSize: 14, color: "var(--ink-3)", lineHeight: 1.55 }}>
            Every option is built from the same brief — <strong style={{ color: "var(--ink)" }}>verified</strong> · <strong style={{ color: "var(--ink)" }}>green</strong> · <strong style={{ color: "var(--ink)" }}>quietly confident</strong>. Pick a direction and we&apos;ll finalise it.
          </p>
        </div>
      </section>

      {/* Option grid */}
      <section style={{ padding: "36px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, background: "var(--hairline)", border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          <LogoCard kbd="01" name="Shield Check" rec  mark={<MarkShield size={88} />} desc="Pointed-bottom shield with a hand-drawn check. Reads as ‘verified’ and ‘protected’ at any size." />
          <LogoCard kbd="02" name="Leaf"               mark={<MarkLeaf size={88} />}   desc="Organic, friendly. The check sits across a leaf vein — softer fintech." />
          <LogoCard kbd="03" name="Monogram T"          mark={<MarkMonogram size={88} />} desc="Stencil T with a check tail. Confident, app-icon-friendly." />
          <LogoCard kbd="04" name="Euro Mark"           mark={<MarkEuro size={88} />}   desc="Editorial — the two bars of € become a tick. Best with serif type." />
          <LogoCard kbd="05" name="Petal"               mark={<MarkPetal size={88} />}  desc="Most distinctive. Six petals; one highlighted as the answered question." />
        </div>
      </section>

      {/* Recommendation: full system on Shield Check */}
      <section style={{ padding: "8px 40px 48px" }}>
        <div style={{ marginBottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div className="eyebrow eyebrow-accent">Recommendation · 01</div>
            <h2 style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: 30, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              The Shield Check, fully dressed.
            </h2>
          </div>
          <span className="pill pill-accent">My pick</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>
          {/* Lockup variants */}
          <div className="card" style={{ padding: 28 }}>
            <div className="eyebrow">Lockups</div>
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 28 }}>
              <Lockup Mark={MarkShield} size={64} />
              <Lockup Mark={MarkShield} size={40} />
              <Lockup Mark={MarkShield} size={28} weight="sans" />
            </div>
          </div>

          {/* Size & clearspace */}
          <div className="card" style={{ padding: 28 }}>
            <div className="eyebrow">Size scale</div>
            <div style={{ marginTop: 18, display: "flex", alignItems: "flex-end", gap: 18 }}>
              {[16, 24, 36, 56, 88].map(s => (
                <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <MarkShield size={s} />
                  <span className="eyebrow" style={{ fontSize: 9.5 }}>{s}px</span>
                </div>
              ))}
            </div>
            <div className="dots" style={{ margin: "22px 0" }} />
            <div className="eyebrow">Clearspace</div>
            <div style={{ marginTop: 14, position: "relative", padding: 32, border: "1px dashed var(--hairline-2)", borderRadius: 12, display: "inline-block" }}>
              <MarkShield size={64} />
              <span style={{ position: "absolute", top: 8, left: 8, fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-4)" }}>= 0.5×</span>
              <span style={{ position: "absolute", bottom: 8, right: 8, fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-4)" }}>= 0.5×</span>
            </div>
          </div>
        </div>

        {/* Backgrounds */}
        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
          <BgChip bg="var(--paper)"     label="Paper" >
            <Lockup Mark={MarkShield} size={40} />
          </BgChip>
          <BgChip bg="var(--sage-100)"   label="Sage tint">
            <Lockup Mark={MarkShield} size={40} />
          </BgChip>
          <BgChip bg="var(--ink)"        label="Ink" inkText>
            <Lockup Mark={(p) => <MarkShield {...p} bg="var(--sage-400)" bg2="var(--sage-500)" />} size={40} color="white" />
          </BgChip>
          <BgChip bg="var(--sage-600)"   label="Sage solid" inkText>
            <Lockup Mark={(p) => <MarkShield {...p} bg="white" bg2="oklch(0.94 0.04 115)" fg="var(--sage-700)" />} size={40} color="white" />
          </BgChip>
        </div>

        {/* Favicon strip */}
        <div className="card" style={{ marginTop: 18, padding: 24 }}>
          <div className="eyebrow">Favicon · app icon</div>
          <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 22 }}>
            <FaviconTile size={64} radius={14}><MarkShield size={42} /></FaviconTile>
            <FaviconTile size={48} radius={11}><MarkShield size={32} /></FaviconTile>
            <FaviconTile size={32} radius={7}><MarkShield size={22} /></FaviconTile>
            <FaviconTile size={16} radius={3.5}><MarkShield size={11} /></FaviconTile>
            <div className="hair-v" style={{ height: 50 }} />
            {/* tab-bar mockup */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "var(--paper-3)", borderRadius: 10, border: "1px solid var(--hairline)" }}>
              <MarkShield size={14} />
              <span style={{ fontSize: 12, color: "var(--ink-2)" }}>TaxWijs — Tax in NL, answered plainly</span>
              <Icon.x style={{ marginLeft: 6, color: "var(--ink-4)" }} />
            </div>
          </div>
        </div>

        {/* What NOT to do */}
        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
          {[
            ["No stretching",  <div style={{ transform: "scaleX(1.6)", transformOrigin: "left" }}><MarkShield size={40} /></div>],
            ["No drop-shadows", <div style={{ filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.45))" }}><MarkShield size={40} /></div>],
            ["No outline mode", <svg width="40" height="40" viewBox="0 0 64 64"><path d="M32 4 L56 11 V32 C56 46 45.5 56.5 32 60 C18.5 56.5 8 46 8 32 V11 Z" fill="none" stroke="var(--ink)" strokeWidth="2" /></svg>],
            ["No alt colors",   <MarkShield size={40} bg="oklch(0.60 0.20 25)" bg2="oklch(0.45 0.18 25)" />],
          ].map(([label, child], i) => (
            <div key={i} style={{ padding: 18, border: "1px solid var(--hairline)", borderRadius: "var(--r)", background: "var(--paper-2)", position: "relative" }}>
              <div style={{ height: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>{child}</div>
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 14, height: 14, borderRadius: 999, background: "var(--danger-soft)", color: "var(--danger)", display: "grid", placeItems: "center" }}>
                  <Icon.x style={{ width: 8, height: 8 }} />
                </span>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Construction grid */}
      <section style={{ padding: "8px 40px 56px" }}>
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
            <div>
              <div className="eyebrow eyebrow-accent">Anatomy</div>
              <h3 style={{ marginTop: 4, fontFamily: "var(--serif)", fontSize: 22, color: "var(--ink)", fontWeight: 400 }}>How the mark is built.</h3>
            </div>
            <span style={{ fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--mono)" }}>64 × 64 grid</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <AnatomyTile label="01 · Shield silhouette">
              <svg width="180" height="180" viewBox="0 0 64 64">
                <GridLines />
                <path d="M32 4 L56 11 V32 C56 46 45.5 56.5 32 60 C18.5 56.5 8 46 8 32 V11 Z" fill="var(--sage-600)" />
              </svg>
            </AnatomyTile>
            <AnatomyTile label="02 · Check tick at 1/3 height">
              <svg width="180" height="180" viewBox="0 0 64 64">
                <GridLines />
                <path d="M32 4 L56 11 V32 C56 46 45.5 56.5 32 60 C18.5 56.5 8 46 8 32 V11 Z" fill="var(--sage-100)" />
                <path d="M20 32 L29 41 L46 22" stroke="var(--sage-700)" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </AnatomyTile>
            <AnatomyTile label="03 · Final mark">
              <svg width="180" height="180" viewBox="0 0 64 64">
                <MarkShield size={64} />
              </svg>
            </AnatomyTile>
          </div>
        </div>
      </section>
    </div>
  );
}

function GridLines() {
  return (
    <g stroke="var(--hairline-2)" strokeWidth="0.15" opacity="0.7">
      {[8,16,24,32,40,48,56].map(n => (
        <React.Fragment key={n}>
          <line x1={n} y1="0" x2={n} y2="64" />
          <line x1="0" y1={n} x2="64" y2={n} />
        </React.Fragment>
      ))}
    </g>
  );
}

function AnatomyTile({ label, children }) {
  return (
    <div style={{ padding: 18, background: "var(--paper-3)", border: "1px solid var(--hairline)", borderRadius: "var(--r)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ background: "var(--paper)", borderRadius: 8, padding: 12 }}>{children}</div>
      <span className="eyebrow">{label}</span>
    </div>
  );
}

function LogoCard({ kbd, name, mark, desc, rec }) {
  return (
    <div style={{ padding: 24, background: "var(--paper)", display: "flex", flexDirection: "column", minHeight: 320 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="eyebrow">{kbd}</span>
        {rec && <span className="pill pill-accent" style={{ fontSize: 9.5 }}>Recommended</span>}
      </div>
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "18px 0" }}>{mark}</div>
      <h3 style={{ fontFamily: "var(--serif)", fontSize: 19, color: "var(--ink)" }}>{name}</h3>
      <p style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5 }}>{desc}</p>
    </div>
  );
}

function BgChip({ bg, label, children, inkText }) {
  return (
    <div>
      <div style={{ background: bg, borderRadius: "var(--r)", padding: "30px 22px", border: bg === "var(--paper)" ? "1px solid var(--hairline)" : "none", height: 130, display: "grid", placeItems: "center" }}>
        {children}
      </div>
      <div className="eyebrow" style={{ marginTop: 8 }}>{label}</div>
    </div>
  );
}

function FaviconTile({ size, radius, children }) {
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: "var(--paper)", border: "1px solid var(--hairline)", display: "grid", placeItems: "center", boxShadow: "var(--shadow-sm)" }}>
      {children}
    </div>
  );
}

Object.assign(window, { LogoShowcase });
