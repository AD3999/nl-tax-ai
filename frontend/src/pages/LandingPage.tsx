import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./LandingPage.module.css";

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
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.badge}>{t("landing.badge")}</div>
        <h1 className={styles.h1}>{t("landing.headline")}</h1>
        <p className={styles.sub}>{t("landing.subheadline")}</p>
        <div className={styles.cta}>
          <button className={styles.btnPrimary} onClick={() => navigate("/intake")}>
            {t("landing.cta_primary")}
          </button>
          <button className={styles.btnSecondary} onClick={() => navigate("/chat")}>
            {t("landing.cta_secondary")}
          </button>
        </div>
        <p className={styles.note}>{t("landing.no_account_needed")}</p>
      </section>

      <section className={styles.features}>
        {FEATURES.map(f => (
          <div key={f.key} className={styles.featureCard}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <h3 className={styles.featureTitle}>{t(`landing.${f.key}_title`)}</h3>
            <p className={styles.featureDesc}>{t(`landing.${f.key}_desc`)}</p>
          </div>
        ))}
      </section>

      <section className={styles.disclaimer}>
        <p>{t("chat.disclaimer")}</p>
      </section>
    </main>
  );
}
