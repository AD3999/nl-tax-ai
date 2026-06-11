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
    "Loading your deduction profile…",
    "Connecting to AI engine…",
    "Almost ready…",
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
  const lang = (i18n.language as "nl" | "en" | "fa") in TIPS
    ? (i18n.language as "nl" | "en" | "fa")
    : "en";
  const tips = TIPS[lang];

  const [tipIdx, setTipIdx] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let p = 0;
    const pctTimer = setInterval(() => {
      p += 1;
      if (p >= 100) clearInterval(pctTimer);
      setPct(p);
    }, 32);
    const tipTimer = setInterval(() => setTipIdx(i => (i + 1) % tips.length), 2000);
    return () => { clearInterval(pctTimer); clearInterval(tipTimer); };
  }, []);

  const RING_R = 49;
  const circumference = 2 * Math.PI * RING_R;
  const dashOffset = circumference - circumference * (pct / 100);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      {/* Dot grid */}
      <div className="dot-grid" style={{
        position: "absolute", inset: 0, opacity: 0.35,
        maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 20%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 20%, transparent 75%)",
        pointerEvents: "none",
      }} />

      {/* Ambient blue glow */}
      <div style={{
        position: "absolute", width: 300, height: 300, borderRadius: "50%",
        background: "var(--blue)", filter: "blur(120px)", opacity: 0.08,
        top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }} />

      {/* Logo + progress ring */}
      <div style={{ position: "relative", marginBottom: 36, animation: "logoPop .5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
        {/* SVG ring */}
        <svg width={104} height={104} style={{ position: "absolute", top: -4, left: -4, overflow: "visible" }}>
          <circle cx={52} cy={52} r={RING_R} fill="none" stroke="var(--border-2)" strokeWidth={1} />
          <circle
            cx={52} cy={52} r={RING_R} fill="none"
            stroke="var(--blue)" strokeWidth={1.5}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "52px 52px", transition: "stroke-dashoffset .06s linear" }}
          />
        </svg>

        {/* Orbiting dot */}
        <div style={{
          position: "absolute", top: 0, left: 0, width: 96, height: 96,
          animation: `spin ${Math.max(0.8, 3 - (pct / 50))}s linear infinite`,
        }}>
          <div style={{
            position: "absolute", top: 2, left: "50%",
            transform: "translateX(-50%)",
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--blue)",
            boxShadow: "0 0 8px var(--blue)",
          }} />
        </div>

        {/* Logo mark */}
        <div style={{ width: 96, height: 96, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: Math.round(56 * 0.28),
            background: "var(--blue)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: pct > 30 ? "0 0 44px var(--blue-border), 0 0 22px var(--blue-border)" : "none",
            transition: "box-shadow .4s ease",
          }}>
            <svg width={32} height={32} viewBox="0 0 20 20" fill="none">
              <path d="M4 16L10 4l6 12H4z" fill="white" fillOpacity="0.9" />
              <path d="M7 16L10 10.5l3 5.5" fill="white" fillOpacity="0.45" />
            </svg>
          </div>
        </div>
      </div>

      {/* Wordmark */}
      <div style={{
        fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em",
        color: "var(--text)", marginBottom: 8,
        animation: "fadeUp .4s .3s ease both",
        fontFamily: "var(--font)",
      }}>
        Tax<span style={{ color: "var(--blue)" }}>Wijs</span>
      </div>

      {/* Cycling tip */}
      <div style={{ height: 20, overflow: "hidden", marginBottom: 28, animation: "fadeUp .4s .4s ease both" }}>
        <div key={tipIdx} style={{
          fontSize: 13, color: "var(--text-3)", textAlign: "center",
          animation: "fadeUp .3s ease both",
        }}>
          {tips[tipIdx]}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: 200, animation: "fadeUp .4s .5s ease both" }}>
        <div style={{ height: 3, background: "var(--border-2)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`, borderRadius: 999,
            transition: "width .06s linear",
            background: "linear-gradient(90deg, var(--blue), var(--blue-text))",
            backgroundSize: "60px 100%",
            animation: "barFlow 1s linear infinite",
          }} />
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between",
          marginTop: 8, fontSize: 11, color: "var(--text-4)",
          fontFamily: "var(--mono)",
        }}>
          <span>Initialising</span>
          <span>{pct}%</span>
        </div>
      </div>
    </div>
  );
}
