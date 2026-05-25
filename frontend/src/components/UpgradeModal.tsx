import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { createCheckoutSession } from "../api/payments";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  { free: "5 questions / session", premium: "Unlimited questions" },
  { free: "Basic calculator", premium: "Full calculator + simulation" },
  { free: "IB return guide", premium: "IB return guide" },
  { free: "—", premium: "Saved conversation history" },
  { free: "—", premium: "Priority responses" },
  { free: "—", premium: "Cancel anytime" },
] as const;

interface Props {
  reason: "session_limit" | "daily_limit" | "register";
  onClose: () => void;
}

export default function UpgradeModal({ reason, onClose }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isAnon = !user;
  const isRegisterPrompt = reason === "register" || isAnon;

  const headlineMap = {
    session_limit: t("upgrade.headline_session"),
    daily_limit: t("upgrade.headline_daily"),
    register: t("upgrade.headline_register"),
  };

  const handleUpgrade = async () => {
    if (isRegisterPrompt) {
      navigate("/register");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const url = await createCheckoutSession();
      window.location.href = url;
    } catch {
      setError(t("upgrade.error"));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col gap-0 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-bg)] border border-[var(--accent)] flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">⚡</span>
          </div>
          <h2 className="text-xl font-bold text-[var(--text-h)] mb-2">
            {headlineMap[reason] ?? headlineMap.session_limit}
          </h2>
          <p className="text-[14px] text-[var(--text)] opacity-70 leading-relaxed">
            {isRegisterPrompt ? t("upgrade.subheadline_register") : t("upgrade.subheadline_upgrade")}
          </p>
        </div>

        {/* Feature comparison */}
        <div className="mx-6 mb-6 border border-[var(--border)] rounded-xl overflow-hidden text-[13px]">
          <div className="grid grid-cols-2 bg-[var(--border)]">
            <div className="px-4 py-2 font-bold text-[var(--text)] opacity-60 uppercase tracking-widest text-[11px]">Free</div>
            <div className="px-4 py-2 font-bold text-[var(--accent)] uppercase tracking-widest text-[11px] bg-[var(--accent-bg)]">Premium</div>
          </div>
          {FEATURES.map((row, i) => (
            <div key={i} className="grid grid-cols-2 border-t border-[var(--border)]">
              <div className={`px-4 py-2.5 text-[var(--text)] ${row.free === "—" ? "opacity-30" : ""}`}>{row.free}</div>
              <div className="px-4 py-2.5 text-[var(--text-h)] bg-[var(--accent-bg)] font-medium">{row.premium}</div>
            </div>
          ))}
        </div>

        {/* Price */}
        {!isRegisterPrompt && (
          <div className="text-center mb-4">
            <span className="text-3xl font-bold text-[var(--text-h)]">€9.99</span>
            <span className="text-[14px] text-[var(--text)] opacity-60"> / {t("upgrade.month")}</span>
          </div>
        )}

        {error && <p className="text-sm text-red-500 text-center mx-6 mb-2">{error}</p>}

        {/* CTAs */}
        <div className="px-6 pb-8 flex flex-col gap-2.5">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-semibold text-[15px] border-none cursor-pointer hover:opacity-85 disabled:opacity-50 transition-opacity"
          >
            {loading ? "…" : isRegisterPrompt ? t("upgrade.cta_register") : t("upgrade.cta_upgrade")}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-transparent border border-[var(--border)] text-[var(--text)] text-[14px] cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors font-[inherit]"
          >
            {t("upgrade.maybe_later")}
          </button>
        </div>
      </div>
    </div>
  );
}
