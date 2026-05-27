/* TaxWijs — Pricing, Upgrade Modal */

const PRICING_ROWS = [
  ["Verified 2026 rules",       "all 28", "all 28"],
  ["Calculator (Box 1·2·3)",    "yes",    "yes"],
  ["IB Return guide",           "yes",    "yes"],
  ["NL · EN · FA + RTL",        "yes",    "yes"],
  ["Chat questions",            "10/day", "unlimited"],
  ["Full 11-step simulation",   "no",     "yes"],
  ["Saved scenarios & history", "1",      "unlimited"],
  ["PDF export",                "no",     "yes"],
  ["Priority responses",        "no",     "yes"],
  ["Email reminders",           "no",     "yes"],
];

function PricingDesktop() {
  return (
    <div className="tw" style={{ width: "100%", height: "100%", overflow: "auto", background: "var(--paper)" }}>
      <TopNav active="price" />
      <section style={{ padding: "56px 40px 40px", textAlign: "center" }}>
        <div className="eyebrow eyebrow-accent">Pricing</div>
        <h1 style={{ marginTop: 8, fontFamily: "var(--serif)", fontSize: 56, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1.04 }}>
          Free to try.<br /><em style={{ color: "var(--sage-700)" }}>€9.99</em> when you&apos;re ready.
        </h1>
        <p style={{ marginTop: 12, color: "var(--ink-3)", fontSize: 15.5, maxWidth: 540, margin: "12px auto 0" }}>
          One transparent price. No upsells, no surprise add-ons. Cancel any time from your billing portal.
        </p>
      </section>

      <section style={{ padding: "8px 40px 64px" }}>
        <div style={{ maxWidth: 940, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 22 }}>
          {/* Free */}
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="pill" style={{ background: "var(--paper-3)", color: "var(--ink-3)" }}>Free</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>No account ok</span>
            </div>
            <div style={{ marginTop: 18, display: "flex", alignItems: "baseline", gap: 6 }}>
              <span className="font-serif" style={{ fontSize: 64, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1 }}>€0</span>
              <span style={{ color: "var(--ink-3)", fontSize: 14 }}>/month</span>
            </div>
            <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 13.5, lineHeight: 1.55 }}>
              The full calculator, the IB guide, and 10 chat questions a day. Plenty for most filings.
            </p>
            <button className="btn btn-ghost btn-lg" style={{ width: "100%", marginTop: 22 }}>Start free</button>
            <div className="dots" style={{ margin: "22px 0" }} />
            <PricingList rows={PRICING_ROWS.map(r => [r[0], r[1]])} />
          </div>

          {/* Premium */}
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: -12, left: 28, display: "inline-flex", padding: "5px 12px", borderRadius: 999, background: "var(--ink)", color: "var(--paper)", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}>
              ⚡ MOST PICKED
            </div>
            <div style={{
              padding: 32, borderRadius: "var(--r-xl)",
              background: "linear-gradient(180deg, var(--sage-100) 0%, var(--paper) 70%)",
              border: "1px solid var(--sage-300)",
              boxShadow: "var(--shadow-lg)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="pill pill-accent">Premium</span>
                <span style={{ fontSize: 11.5, color: "var(--sage-700)" }}>Cancel anytime</span>
              </div>
              <div style={{ marginTop: 18, display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="font-serif" style={{ fontSize: 64, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1 }}>€9<span style={{ fontSize: 28 }}>.99</span></span>
                <span style={{ color: "var(--ink-3)", fontSize: 14 }}>/month</span>
              </div>
              <p style={{ marginTop: 8, color: "var(--ink-2)", fontSize: 13.5, lineHeight: 1.55 }}>
                Unlimited chat, the full 11-step simulation, PDF export and saved scenarios. The whole brain.
              </p>
              <button className="btn btn-accent btn-lg" style={{ width: "100%", marginTop: 22 }}>Upgrade to Premium <Icon.arrow /></button>
              <div className="dots" style={{ margin: "22px 0" }} />
              <PricingList rows={PRICING_ROWS.map(r => [r[0], r[2]])} accent />
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 760, margin: "60px auto 0" }}>
          <div className="eyebrow eyebrow-accent">Questions</div>
          <h2 style={{ marginTop: 4, fontFamily: "var(--serif)", fontSize: 32, color: "var(--ink)", fontWeight: 400, letterSpacing: "-0.015em" }}>
            Things people ask before they upgrade.
          </h2>
          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
            {[
              ["Can I cancel anytime?",       "Yes — managed by Stripe. Cancel from your billing portal, no email required. Active until the end of the period."],
              ["Is my tax data stored?",      "Anonymous use stays in your browser. Logged-in profiles are encrypted at rest in EU-region Postgres. We never sell or share."],
              ["What payment methods?",       "Credit card, iDEAL, SEPA direct debit, Apple Pay and Google Pay — via Stripe Checkout."],
              ["Do you do my actual return?", "No. TaxWijs is decision support. You file via Mijn Belastingdienst — we generate the numbers and walk you through the fields."],
            ].map(([q, a], i) => (
              <div key={i} style={{ padding: "20px 22px", borderBottom: i < 3 ? "1px solid var(--hairline)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <span style={{ fontSize: 15.5, fontFamily: "var(--serif)", color: "var(--ink)" }}>{q}</span>
                  <Icon.chev style={{ transform: "rotate(90deg)", flexShrink: 0, marginTop: 4 }} />
                </div>
                <p style={{ marginTop: 8, fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.55, maxWidth: 600 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function PricingList({ rows, accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map(([label, val]) => {
        const yes = val === "yes" || val === "unlimited" || val === "all 28";
        const no = val === "no";
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              width: 18, height: 18, borderRadius: 999, display: "grid", placeItems: "center",
              background: no ? "var(--paper-3)" : accent ? "var(--sage-600)" : "var(--ink)",
              color: no ? "var(--ink-4)" : "white", flexShrink: 0,
            }}>
              {no ? <Icon.x style={{ width: 9, height: 9 }} /> : <Icon.check style={{ width: 10, height: 10 }} />}
            </span>
            <span style={{ fontSize: 13.5, color: no ? "var(--ink-4)" : "var(--ink-2)", flex: 1 }}>{label}</span>
            <span style={{ fontSize: 12, color: no ? "var(--ink-4)" : "var(--ink-3)", fontFamily: yes ? "var(--mono)" : "var(--sans)" }}>{val}</span>
          </div>
        );
      })}
    </div>
  );
}

function UpgradeModalDesktop() {
  return (
    <div className="tw" style={{ width: "100%", height: "100%", background: "var(--paper)", position: "relative", overflow: "hidden" }}>
      {/* Dimmed chat in the background */}
      <div style={{ position: "absolute", inset: 0, filter: "blur(3px) brightness(0.92) saturate(0.85)", pointerEvents: "none" }}>
        <ChatDesktopBackdrop />
      </div>
      {/* Backdrop tint */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(20,18,14,0.36)", backdropFilter: "blur(4px)" }} />
      {/* Modal */}
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 20 }}>
        <div className="card" style={{ width: 440, padding: 28, borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-lg)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ width: 40, height: 40, borderRadius: 999, background: "var(--accent-soft)", color: "var(--sage-700)", display: "grid", placeItems: "center", fontSize: 18 }}>⚡</span>
            <button style={{ width: 28, height: 28, borderRadius: 999, border: "1px solid var(--hairline)", background: "var(--paper)", display: "grid", placeItems: "center", cursor: "pointer" }}>
              <Icon.x style={{ width: 11, height: 11 }} />
            </button>
          </div>
          <h2 style={{ marginTop: 18, fontFamily: "var(--serif)", fontSize: 28, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.015em", lineHeight: 1.15 }}>
            Daily limit reached.<br /><em style={{ color: "var(--sage-700)" }}>Unlock everything.</em>
          </h2>
          <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 13.5, lineHeight: 1.55 }}>
            You&apos;ve asked 10 questions today on the free plan. Upgrade for unlimited chat, the full simulation, and PDF export.
          </p>

          <div style={{ marginTop: 18, padding: 14, background: "var(--paper-3)", borderRadius: "var(--r)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span></span><span style={{ textAlign: "center" }}>Free</span><span style={{ textAlign: "center", color: "var(--sage-700)" }}>Premium</span>
            </div>
            {[
              ["Chat questions",      "10/day", "∞"],
              ["Full simulation",     "—",      "✓"],
              ["Saved scenarios",     "1",      "∞"],
              ["PDF export",          "—",      "✓"],
            ].map(([k, a, b]) => (
              <div key={k} style={{ marginTop: 8, padding: "8px 0", borderTop: "1px solid var(--hairline)", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", alignItems: "center", fontSize: 13 }}>
                <span style={{ color: "var(--ink-2)" }}>{k}</span>
                <span className="num" style={{ textAlign: "center", color: "var(--ink-3)" }}>{a}</span>
                <span className="num" style={{ textAlign: "center", color: "var(--sage-700)", fontWeight: 600 }}>{b}</span>
              </div>
            ))}
          </div>

          <button className="btn btn-accent btn-lg" style={{ width: "100%", marginTop: 18 }}>
            Upgrade — €9.99 / month <Icon.arrow />
          </button>
          <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8, height: 36, fontSize: 13 }}>Maybe later</button>
          <p style={{ marginTop: 12, fontSize: 11, color: "var(--ink-4)", textAlign: "center" }}>
            Secure checkout · Stripe · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}

function ChatDesktopBackdrop() {
  // a static visual hint of the chat so the modal feels in-context
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--paper)" }}>
      <div style={{ height: 64, borderBottom: "1px solid var(--hairline)", display: "flex", alignItems: "center", padding: "0 28px", justifyContent: "space-between" }}>
        <Wordmark size={16} />
        <LangSwitch />
      </div>
      <div style={{ padding: 24 }}>
        <div className="image-slot" style={{ height: 70 }}>profile bar</div>
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="image-slot" style={{ height: 100 }}>question card</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Mobile ─────────────────────────────────────────────────
function PricingMobile() {
  return (
    <MobileFrame>
      <MobileTopBar title="Pricing" back />
      <div className="tw" style={{ padding: "20px 16px 28px" }}>
        <div className="eyebrow eyebrow-accent">Free to try</div>
        <h1 style={{ marginTop: 4, fontFamily: "var(--serif)", fontSize: 32, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
          €9.99 <em style={{ color: "var(--sage-700)" }}>when you&apos;re ready.</em>
        </h1>
        <p style={{ marginTop: 6, color: "var(--ink-3)", fontSize: 13 }}>
          One price. Cancel any time.
        </p>

        {/* Premium first on mobile */}
        <div style={{ marginTop: 22, padding: 22, borderRadius: "var(--r-xl)", background: "linear-gradient(180deg, var(--sage-100) 0%, var(--paper) 75%)", border: "1px solid var(--sage-300)", boxShadow: "var(--shadow)", position: "relative" }}>
          <div style={{ position: "absolute", top: -10, left: 20, padding: "4px 10px", background: "var(--ink)", color: "var(--paper)", fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", borderRadius: 999 }}>
            ⚡ MOST PICKED
          </div>
          <span className="pill pill-accent">Premium</span>
          <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 4 }}>
            <span className="font-serif" style={{ fontSize: 44, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1 }}>€9<span style={{ fontSize: 22 }}>.99</span></span>
            <span style={{ color: "var(--ink-3)", fontSize: 12 }}>/mo</span>
          </div>
          <button className="btn btn-accent btn-lg" style={{ width: "100%", marginTop: 14 }}>Upgrade <Icon.arrow /></button>
          <div className="dots" style={{ margin: "16px 0" }} />
          <PricingList rows={PRICING_ROWS.slice(0, 6).map(r => [r[0], r[2]])} accent />
        </div>

        <div style={{ marginTop: 16, padding: 22, border: "1px solid var(--hairline)", borderRadius: "var(--r-xl)" }}>
          <span className="pill" style={{ background: "var(--paper-3)", color: "var(--ink-3)" }}>Free</span>
          <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 4 }}>
            <span className="font-serif" style={{ fontSize: 44, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1 }}>€0</span>
            <span style={{ color: "var(--ink-3)", fontSize: 12 }}>/mo</span>
          </div>
          <button className="btn btn-ghost btn-lg" style={{ width: "100%", marginTop: 14 }}>Start free</button>
          <div className="dots" style={{ margin: "16px 0" }} />
          <PricingList rows={PRICING_ROWS.slice(0, 6).map(r => [r[0], r[1]])} />
        </div>
      </div>
      <MobileTabBar active="me" />
    </MobileFrame>
  );
}

function UpgradeModalMobile() {
  return (
    <MobileFrame bg="rgba(20,18,14,0.45)">
      {/* skip statusbar */}
      <div className="tw" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", padding: "0 12px 18px" }}>
        <div style={{ width: "100%", background: "var(--paper)", borderRadius: "var(--r-2xl) var(--r-2xl) var(--r) var(--r)", padding: 22, boxShadow: "var(--shadow-lg)" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--hairline-2)", margin: "0 auto 14px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 999, background: "var(--accent-soft)", color: "var(--sage-700)", display: "grid", placeItems: "center", fontSize: 16 }}>⚡</span>
            <div>
              <div className="eyebrow eyebrow-accent">Daily limit reached</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 22, color: "var(--ink)" }}>Unlock everything</div>
            </div>
          </div>
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--ink-3)", lineHeight: 1.5 }}>
            10 free questions used today. Premium gives unlimited chat, full simulation, and PDF export.
          </p>

          <div style={{ marginTop: 14, padding: 12, background: "var(--paper-3)", borderRadius: "var(--r)", fontSize: 12.5 }}>
            {[
              ["Chat questions",  "10/day", "∞"],
              ["Simulation",      "—",      "✓"],
              ["Saved scenarios", "1",      "∞"],
            ].map(([k, a, b], i) => (
              <div key={k} style={{ padding: "7px 0", borderTop: i ? "1px solid var(--hairline)" : "none", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", alignItems: "center" }}>
                <span style={{ color: "var(--ink-2)" }}>{k}</span>
                <span className="num" style={{ textAlign: "center", color: "var(--ink-3)" }}>{a}</span>
                <span className="num" style={{ textAlign: "center", color: "var(--sage-700)", fontWeight: 600 }}>{b}</span>
              </div>
            ))}
          </div>

          <button className="btn btn-accent btn-lg" style={{ width: "100%", marginTop: 14 }}>
            Upgrade — €9.99 / mo
          </button>
          <button className="btn btn-ghost" style={{ width: "100%", marginTop: 6, height: 36, fontSize: 12.5 }}>Maybe later</button>
        </div>
      </div>
    </MobileFrame>
  );
}

Object.assign(window, { PricingDesktop, PricingMobile, UpgradeModalDesktop, UpgradeModalMobile });
