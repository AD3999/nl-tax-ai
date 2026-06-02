import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const TIPS: Record<string, string[]> = {
  nl: [
    "2026 belastingregels verifiëren…",
    "Uw profiel laden…",
    "Calculatiemodule verbinden…",
    "Bijna klaar…",
  ],
  en: [
    "Verifying 2026 tax rules…",
    "Loading your profile…",
    "Connecting calculator engine…",
    "Almost there…",
  ],
  fa: [
    "در حال تأیید قوانین مالیاتی ۲۰۲۶…",
    "در حال بارگذاری پروفایل شما…",
    "اتصال به موتور محاسبه…",
    "تقریباً آماده…",
  ],
};

export default function LoadingScreen() {
  const { i18n } = useTranslation();
  const lang = (i18n.language as "nl" | "en" | "fa") in TIPS ? i18n.language as "nl" | "en" | "fa" : "en";
  const tips = TIPS[lang];
  const [tip, setTip] = useState(0);
  const [pct, setPct] = useState(12);

  useEffect(() => {
    const tipTimer = setInterval(() => setTip(t => (t + 1) % tips.length), 1700);
    const pctTimer = setInterval(() => setPct(p => p < 88 ? p + Math.random() * 7 : p), 320);
    return () => { clearInterval(tipTimer); clearInterval(pctTimer); };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "var(--paper)",
      display: "grid", placeItems: "center",
      overflow: "hidden",
    }}>
      {/* Subtle radial tint */}
      <div style={{
        position: "absolute", inset: 0,
        background: [
          "radial-gradient(60% 50% at 80% 0%, oklch(0.95 0.05 115 / 0.5), transparent 60%)",
          "radial-gradient(50% 40% at 0% 100%, oklch(0.95 0.03 95 / 0.55), transparent 60%)",
        ].join(", "),
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        {/* Logo mark with breathing rings */}
        <div style={{ position: "relative", width: 96, height: 96, display: "grid", placeItems: "center" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: "absolute",
              width: 96, height: 96, borderRadius: "50%",
              border: "1px solid oklch(0.79 0.110 117 / 0.4)",
              animation: `tw-breath 2.6s ease-out ${i * 0.6}s infinite`,
              opacity: 0,
            }} />
          ))}
          <svg width={96} height={96} viewBox="0 0 64 64" fill="none">
            <defs>
              <linearGradient id="ls-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="oklch(0.50 0.105 118)" />
                <stop offset="1" stopColor="oklch(0.40 0.085 118)" />
              </linearGradient>
            </defs>
            <path d="M32 4 L56 11 V32 C56 46 45.5 56.5 32 60 C18.5 56.5 8 46 8 32 V11 Z" fill="url(#ls-grad)" />
            <path d="M20 32 L29 41 L46 22" stroke="white" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" fill="none"
              strokeDasharray="44" strokeDashoffset="44"
              style={{ animation: "tw-draw 2.4s ease-out forwards infinite" }}
            />
          </svg>
        </div>

        {/* Wordmark */}
        <div style={{ fontFamily: "var(--serif)", fontSize: 30, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
          TaxWijs
        </div>

        {/* Rotating tip */}
        <div style={{ height: 20, width: 260, position: "relative", overflow: "hidden" }}>
          {tips.map((t, i) => (
            <div key={i} style={{
              position: "absolute", inset: 0,
              fontSize: 13, color: "var(--ink-3)", textAlign: "center",
              transform: `translateY(${(i - tip) * 20}px)`,
              opacity: i === tip ? 1 : 0,
              transition: "all .35s ease-out",
            }}>
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom progress bar */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: "var(--paper-3)" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: "var(--sage-600)",
          transition: "width .35s ease-out",
        }} />
      </div>

      <style>{`
        @keyframes tw-breath {
          0%   { transform: scale(.7); opacity: .7; }
          80%  { opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes tw-draw {
          0%  { stroke-dashoffset: 44; }
          60% { stroke-dashoffset: 0; }
          100%{ stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
