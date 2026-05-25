import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createCheckoutSession, createBillingPortalSession } from "../api/payments";
import { useAuth } from "../context/AuthContext";

const FREE_FEATURES = [
  "5 questions per session",
  "Tax calculator (all user types)",
  "IB return guide",
  "3-language support (NL/EN/FA)",
];

const PREMIUM_FEATURES = [
  "Unlimited questions, every day",
  "Tax calculator (all user types)",
  "IB return guide",
  "3-language support (NL/EN/FA)",
  "Full aangifte IB simulation",
  "Saved conversation history",
  "Priority Claude responses",
  "Cancel anytime",
];

export default function PricingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const check = (s: string) => (
    <li key={s} className="flex items-start gap-2.5 text-[14px] text-[var(--text)]">
      <span className="text-[var(--accent)] font-bold mt-0.5 shrink-0">✓</span>
      {s}
    </li>
  );

  const cross = (s: string) => (
    <li key={s} className="flex items-start gap-2.5 text-[14px] text-[var(--text)] opacity-45">
      <span className="font-bold mt-0.5 shrink-0">✕</span>
      {s}
    </li>
  );

  return (
    <div className="max-w-[860px] mx-auto px-12 py-16 pb-24 flex flex-col gap-12">
      {/* Header */}
      <div className="text-center flex flex-col gap-3">
        <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--accent)]">
          {t("pricing.badge")}
        </span>
        <h1 className="text-[36px] font-extrabold text-[var(--text-h)] m-0 -tracking-wide leading-tight">
          {t("pricing.headline")}
        </h1>
        <p className="text-[16px] text-[var(--text)] opacity-70 m-0 max-w-lg mx-auto leading-relaxed">
          {t("pricing.subheadline")}
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-2 gap-5 max-w-[640px] mx-auto w-full">
        {/* Free card */}
        <div className="border border-[var(--border)] rounded-2xl p-7 flex flex-col gap-5 bg-[var(--bg)]">
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-[var(--text)] opacity-50 mb-1">
              {t("pricing.free_label")}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-[var(--text-h)]">€0</span>
              <span className="text-[14px] text-[var(--text)] opacity-60">/ {t("pricing.month")}</span>
            </div>
          </div>
          <ul className="flex flex-col gap-2.5 m-0 p-0 list-none">
            {FREE_FEATURES.map(check)}
            {["Full simulation", "Saved history", "Priority responses"].map(cross)}
          </ul>
          <button
            className="mt-auto w-full py-2.5 rounded-xl border border-[var(--border)] bg-transparent text-[var(--text)] font-semibold text-[14px] cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors font-[inherit]"
            onClick={() => navigate("/chat")}
          >
            {t("pricing.free_cta")}
          </button>
        </div>

        {/* Premium card */}
        <div className="border-2 border-[var(--accent)] rounded-2xl p-7 flex flex-col gap-5 bg-[var(--accent-bg)] relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="bg-[var(--accent)] text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wide uppercase">
              {t("pricing.popular")}
            </span>
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-[var(--accent)] mb-1">
              {t("pricing.premium_label")}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-[var(--text-h)]">€9.99</span>
              <span className="text-[14px] text-[var(--text)] opacity-60">/ {t("pricing.month")}</span>
            </div>
          </div>
          <ul className="flex flex-col gap-2.5 m-0 p-0 list-none">
            {PREMIUM_FEATURES.map(check)}
          </ul>
          {error && <p className="text-sm text-red-500 m-0">{error}</p>}
          <button
            disabled={loading}
            className="mt-auto w-full py-3 rounded-xl bg-[var(--accent)] text-white font-bold text-[15px] border-none cursor-pointer hover:opacity-85 disabled:opacity-50 transition-opacity font-[inherit]"
            onClick={handlePremiumCta}
          >
            {loading ? "…" : isPremium ? t("pricing.manage_billing") : !user ? t("pricing.cta_register") : t("pricing.cta_upgrade")}
          </button>
          {isPremium && (
            <p className="text-center text-[12px] text-[var(--accent)] font-semibold m-0">
              ✓ {t("pricing.current_plan")}
            </p>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-[540px] mx-auto w-full flex flex-col gap-4">
        <h2 className="text-[18px] font-bold text-[var(--text-h)] m-0 text-center">{t("pricing.faq_title")}</h2>
        {[
          { q: t("pricing.faq_1_q"), a: t("pricing.faq_1_a") },
          { q: t("pricing.faq_2_q"), a: t("pricing.faq_2_a") },
          { q: t("pricing.faq_3_q"), a: t("pricing.faq_3_a") },
        ].map(({ q, a }) => (
          <div key={q} className="border border-[var(--border)] rounded-xl p-5">
            <p className="text-[14px] font-semibold text-[var(--text-h)] m-0 mb-1">{q}</p>
            <p className="text-[13px] text-[var(--text)] opacity-70 m-0 leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
