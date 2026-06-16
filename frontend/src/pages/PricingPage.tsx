import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createCheckoutSession, createBillingPortalSession } from "../api/payments";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/Icon";
import { useMobile } from "../hooks/useMobile";

const PRICING_ROWS: [string, string, string][] = [
  ["Verified 2026 rules",       "all 28",    "all 28"],
  ["Calculator (Box 1·2·3)",    "yes",       "yes"],
  ["IB Return guide",           "yes",       "yes"],
  ["NL · EN · FA + RTL",        "yes",       "yes"],
  ["Chat questions",            "10/day",    "unlimited"],
  ["Full 11-step simulation",   "no",        "yes"],
  ["Saved scenarios & history", "1",         "unlimited"],
  ["PDF export",                "no",        "yes"],
  ["Priority responses",        "no",        "yes"],
  ["Email reminders",           "no",        "yes"],
];

function PricingList({ rows, accent = false }: { rows: [string, string][]; accent?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map(([label, val]) => {
        const yes = val === "yes" || val === "unlimited" || val === "all 28";
        const no = val === "no" || val === "—";
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 18, height: 18, borderRadius: 999, display: "grid", placeItems: "center", flexShrink: 0,
              background: no ? "var(--paper-3)" : accent ? "var(--sage-600)" : "var(--ink)",
              color: no ? "var(--ink-4)" : "white",
            }}>
              {no
                ? <Icon.x style={{ width: 9, height: 9 }} />
                : <Icon.check style={{ width: 10, height: 10 }} />}
            </span>
            <span style={{ fontSize: 13.5, color: no ? "var(--ink-4)" : "var(--ink-2)", flex: 1 }}>{label}</span>
            <span style={{ fontSize: 12, color: no ? "var(--ink-4)" : "var(--ink-3)", fontFamily: yes ? "var(--mono)" : "var(--sans)" }}>
              {val}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const FAQ_ITEMS = [
  ["Can I cancel anytime?",       "Yes — managed by Stripe. Cancel from your billing portal, no email required. Active until the end of the billing period"],
  ["Is my tax data stored?",      "Anonymous use stays in your browser. Logged-in profiles are encrypted at rest in EU-region Postgres — we never sell or share"],
  ["What payment methods?",       "Credit card, iDEAL, SEPA direct debit, Apple Pay and Google Pay — all via Stripe Checkout"],
  ["Do you do my actual return?", "No — TaxWijs is decision support. You file via Mijn Belastingdienst. We generate the numbers and walk you through every field"],
] as const;

export default function PricingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPremium = user?.plan === "premium";

  const handlePremiumCta = async () => {
    if (!user) { navigate("/register"); return; }
    if (isPremium) {
      setLoading(true);
      try {
        const url = await createBillingPortalSession();
        window.location.href = url;
      } catch {
        setError(t("upgrade.error"));
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const url = await createCheckoutSession();
      window.location.href = url;
    } catch {
      setError(t("upgrade.error"));
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--paper)", overflowX: "hidden" }}>
      {/* Hero */}
      <section style={{ padding: "56px 40px 40px", textAlign: "center" }}>
        <div className="eyebrow eyebrow-accent">Pricing</div>
        <h1 style={{ marginTop: 8, fontFamily: "var(--serif)", fontSize: 56, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1.04 }}>
          Free to try.<br /><em style={{ color: "var(--sage-700)" }}>€9.99</em> when you're ready.
        </h1>
        <p style={{ marginTop: 12, color: "var(--ink-3)", fontSize: 15.5, maxWidth: 540, margin: "12px auto 0" }}>
          One transparent price. No upsells, no surprise add-ons. Cancel any time from your billing portal.
        </p>
      </section>

      {/* Plan cards */}
      <section style={{ padding: "8px 40px 64px" }}>
        <div style={{ maxWidth: 940, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.05fr", gap: 22 }}>
          {/* Free */}
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="pill" style={{ background: "var(--paper-3)", color: "var(--ink-3)" }}>Free</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>No account needed</span>
            </div>
            <div style={{ marginTop: 18, display: "flex", alignItems: "baseline", gap: 6 }}>
              <span className="font-serif" style={{ fontSize: 64, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1 }}>€0</span>
              <span style={{ color: "var(--ink-3)", fontSize: 14 }}>/month</span>
            </div>
            <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 13.5, lineHeight: 1.55 }}>
              The full calculator, the IB guide, and 10 chat questions a day. Plenty for most filings.
            </p>
            <button className="btn btn-ghost btn-lg" style={{ width: "100%", marginTop: 22 }} onClick={() => navigate("/chat")}>
              Start free
            </button>
            <div className="dots" style={{ margin: "22px 0" }} />
            <PricingList rows={PRICING_ROWS.map(r => [r[0], r[1]])} />
          </div>

          {/* Premium */}
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: -12, left: 28, zIndex: 1, display: "inline-flex", padding: "5px 12px", borderRadius: 999, background: "var(--ink)", color: "var(--paper)", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}>
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
                <span className="font-serif" style={{ fontSize: 64, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1 }}>
                  €9<span style={{ fontSize: 28 }}>.99</span>
                </span>
                <span style={{ color: "var(--ink-3)", fontSize: 14 }}>/month</span>
              </div>
              <p style={{ marginTop: 8, color: "var(--ink-2)", fontSize: 13.5, lineHeight: 1.55 }}>
                Unlimited chat, the full 11-step simulation, PDF export and saved scenarios. The whole brain.
              </p>

              {error && (
                <div style={{ marginTop: 10, padding: "8px 12px", background: "var(--danger-soft)", borderRadius: "var(--r-sm)", fontSize: 13, color: "var(--danger)" }}>
                  {error}
                </div>
              )}

              <button
                className="btn btn-accent btn-lg"
                style={{ width: "100%", marginTop: 22 }}
                disabled={loading}
                onClick={handlePremiumCta}
              >
                {loading ? "…"
                  : isPremium ? t("pricing.manage_billing")
                  : !user ? t("pricing.cta_register")
                  : t("pricing.cta_upgrade")}
                {!loading && <Icon.arrow />}
              </button>

              {isPremium && (
                <div style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: "var(--sage-700)", fontWeight: 500 }}>
                  ✓ {t("pricing.current_plan")}
                </div>
              )}

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
          <div style={{ marginTop: 22, border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
            {FAQ_ITEMS.map(([q, a], i) => (
              <div key={q} style={{ padding: "20px 22px", borderBottom: i < FAQ_ITEMS.length - 1 ? "1px solid var(--hairline)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <span style={{ fontSize: 15.5, fontFamily: "var(--serif)", color: "var(--ink)" }}>{q}</span>
                  <Icon.chev style={{ transform: "rotate(90deg)", flexShrink: 0, marginTop: 4, color: "var(--ink-3)" }} />
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
