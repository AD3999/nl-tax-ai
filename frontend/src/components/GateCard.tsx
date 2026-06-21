import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UpgradeModal from "./UpgradeModal";

interface GateCardProps {
  /** Short label for the locked feature */
  featureLabel: string;
  /** Teaser text shown to free users */
  teaserText?: string;
  /** If provided, show this preview content with a blur overlay */
  children?: React.ReactNode;
}

const TX = {
  nl: {
    locked: "Premium functie",
    cta_login: "Gratis account aanmaken",
    cta_upgrade: "Upgraden naar Premium",
    desc_login: "Maak een gratis account aan om te beginnen",
    desc_upgrade: "Upgrade naar Premium voor onbeperkte toegang",
  },
  en: {
    locked: "Premium feature",
    cta_login: "Create free account",
    cta_upgrade: "Upgrade to Premium",
    desc_login: "Create a free account to get started",
    desc_upgrade: "Upgrade to Premium for unlimited access",
  },
  fa: {
    locked: "ویژگی پریمیوم",
    cta_login: "ایجاد حساب رایگان",
    cta_upgrade: "ارتقاء به پریمیوم",
    desc_login: "برای شروع یک حساب رایگان بسازید",
    desc_upgrade: "برای دسترسی نامحدود به پریمیوم ارتقاء دهید",
  },
};

export default function GateCard({ featureLabel, teaserText, children }: GateCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const lang = (document.documentElement.lang as keyof typeof TX) ?? "en";
  const t = TX[lang in TX ? lang : "en"];
  const isLoggedIn = !!user;

  return (
    <>
      <div style={{ position: "relative", borderRadius: "var(--r-xl)", overflow: "hidden" }}>
        {/* Blurred teaser content */}
        {children && (
          <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none", opacity: 0.5 }}>
            {children}
          </div>
        )}

        {/* Lock overlay */}
        <div style={{
          position: children ? "absolute" : "relative",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: children ? "rgba(var(--bg-raw,15,14,13),0.72)" : "var(--paper-3)",
          backdropFilter: children ? "blur(2px)" : undefined,
          padding: "var(--sp-8) var(--sp-6)",
          textAlign: "center",
          borderRadius: children ? 0 : "var(--r-xl)",
          border: children ? undefined : "1px dashed var(--hairline-2)",
        }}>
          <span style={{ fontSize: 28, marginBottom: "var(--sp-3)" }}>🔒</span>
          <p className="eyebrow" style={{ color: "var(--sage-700)", marginBottom: "var(--sp-2)" }}>
            {t.locked}
          </p>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, color: "var(--ink)", marginBottom: "var(--sp-2)" }}>
            {featureLabel}
          </h3>
          {teaserText && (
            <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", marginBottom: "var(--sp-5)", maxWidth: 340 }}>
              {teaserText}
            </p>
          )}
          <button
            className="btn btn-accent"
            onClick={() => isLoggedIn ? setShowUpgrade(true) : navigate("/register")}
          >
            {isLoggedIn ? t.cta_upgrade : t.cta_login}
          </button>
          <p style={{ marginTop: "var(--sp-2)", fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>
            {isLoggedIn ? t.desc_upgrade : t.desc_login}
          </p>
        </div>
      </div>

      {showUpgrade && (
        <UpgradeModal
          reason={isLoggedIn ? "daily_limit" : "register"}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </>
  );
}
