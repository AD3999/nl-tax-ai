import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const FEATURES = [
  { icon: "💬", key: "feature_chat" },
  { icon: "🧮", key: "feature_calc" },
  { icon: "📋", key: "feature_ib" },
  { icon: "🌍", key: "feature_lang" },
] as const;

export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <main className="px-4 pb-16 text-center">
      {/* Hero */}
      <section className="py-20 px-4 max-w-2xl mx-auto">
        <div className="inline-block px-3.5 py-1.5 bg-[var(--accent-bg)] border border-[var(--accent-border)] rounded-full text-xs font-bold text-[var(--accent)] tracking-widest uppercase mb-6">
          {t("landing.badge")}
        </div>
        <h1 className="text-[clamp(2rem,5vw,3rem)] font-extrabold text-[var(--text-h)] leading-tight m-0 mb-4">
          {t("landing.headline")}
        </h1>
        <p className="text-lg text-[var(--text)] leading-relaxed m-0 mb-8">
          {t("landing.subheadline")}
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            className="px-7 py-3 bg-[var(--accent)] text-white border-none rounded-xl font-[inherit] text-base font-bold cursor-pointer hover:opacity-88 transition-opacity"
            onClick={() => navigate("/intake")}
          >
            {t("landing.cta_primary")}
          </button>
          <button
            className="px-7 py-3 bg-transparent text-[var(--accent)] border border-[var(--accent-border)] rounded-xl font-[inherit] text-base font-semibold cursor-pointer hover:bg-[var(--accent-bg)] transition-colors"
            onClick={() => navigate("/chat")}
          >
            {t("landing.cta_secondary")}
          </button>
        </div>
        <p className="mt-4 text-[0.8rem] text-[var(--text)] opacity-70">
          {t("landing.no_account_needed")}
        </p>
      </section>

      {/* Feature cards */}
      <section className="grid gap-5 max-w-4xl mx-auto mb-12 text-left" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {FEATURES.map(f => (
          <div key={f.key} className="bg-[var(--social-bg)] border border-[var(--border)] rounded-xl p-6">
            <span className="text-3xl block mb-3">{f.icon}</span>
            <h3 className="text-base font-bold text-[var(--text-h)] m-0 mb-1.5">
              {t(`landing.${f.key}_title`)}
            </h3>
            <p className="text-sm text-[var(--text)] leading-relaxed m-0">
              {t(`landing.${f.key}_desc`)}
            </p>
          </div>
        ))}
      </section>

      <p className="text-[0.8rem] text-[var(--text)] opacity-60">{t("chat.disclaimer")}</p>
    </main>
  );
}
