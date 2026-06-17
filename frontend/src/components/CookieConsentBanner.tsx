/**
 * CookieConsentBanner — Dutch AP 2025 compliant.
 *
 * Rules enforced:
 * - "Alles weigeren" and "Alles accepteren" have equal visual weight (same button class).
 * - No pre-ticked boxes, no consent by inaction.
 * - Consent logged to localStorage with ISO timestamp.
 * - Analytics (PostHog) only initialised after explicit acceptance.
 * - Banner suppressed on server-render (SSR guard via typeof window check).
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "taxwijs_cookie_consent";

export type ConsentDecision = "accepted" | "rejected";

export interface ConsentRecord {
  decision: ConsentDecision;
  timestamp: string; // ISO 8601
}

export function getStoredConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentRecord;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return getStoredConsent()?.decision === "accepted";
}

function saveConsent(decision: ConsentDecision): ConsentRecord {
  const record: ConsentRecord = { decision, timestamp: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  return record;
}

// ── Translations ─────────────────────────────────────────────────────────────

const T: Record<string, Record<string, string>> = {
  nl: {
    title: "We gebruiken analytische cookies",
    body: "TaxWijs gebruikt anonieme gebruiksstatistieken (PostHog) om de app te verbeteren. We slaan geen persoonsgegevens op in cookies. U kunt uw keuze later wijzigen via Profiel → Privacy.",
    accept: "Alles accepteren",
    reject: "Alles weigeren",
    learnMore: "Meer informatie",
  },
  en: {
    title: "We use analytical cookies",
    body: "TaxWijs uses anonymous usage statistics (PostHog) to improve the app. No personal data is stored in cookies. You can change your choice later via Profile → Privacy.",
    accept: "Accept all",
    reject: "Reject all",
    learnMore: "Learn more",
  },
  fa: {
    title: "ما از کوکی‌های تحلیلی استفاده می‌کنیم",
    body: "TaxWijs از آمار ناشناس استفاده (PostHog) برای بهبود برنامه استفاده می‌کند. هیچ داده شخصی در کوکی‌ها ذخیره نمی‌شود. می‌توانید انتخاب خود را بعداً از طریق پروفایل ← حریم خصوصی تغییر دهید.",
    accept: "پذیرش همه",
    reject: "رد همه",
    learnMore: "اطلاعات بیشتر",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onDecision: (decision: ConsentDecision) => void;
}

export default function CookieConsentBanner({ onDecision }: Props) {
  const { i18n } = useTranslation();
  const lang = (i18n.language ?? "nl").slice(0, 2) as "nl" | "en" | "fa";
  const copy = T[lang] ?? T.nl;
  const isRtl = lang === "fa";

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Delay by one frame so the banner doesn't flash before hydration
    const id = requestAnimationFrame(() => {
      if (!getStoredConsent()) setVisible(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  if (!visible) return null;

  function decide(decision: ConsentDecision) {
    saveConsent(decision);
    setVisible(false);
    onDecision(decision);
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={copy.title}
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        position: "fixed",
        bottom: 0,
        insetInlineStart: 0,
        insetInlineEnd: 0,
        zIndex: 9999,
        background: "var(--bg-2)",
        borderTop: "1px solid var(--border)",
        boxShadow: "0 -4px 24px oklch(0 0 0 / 0.25)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 780 }}>
        <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text)" }}>
          {copy.title}
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-3)", lineHeight: 1.6 }}>
          {copy.body}
        </span>
      </div>

      {/* Buttons — equal visual weight as required by AP 2025 rules */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          className="btn btn-accent btn-sm"
          style={{ minWidth: 140 }}
          onClick={() => decide("rejected")}
        >
          {copy.reject}
        </button>
        <button
          className="btn btn-accent btn-sm"
          style={{ minWidth: 140 }}
          onClick={() => decide("accepted")}
        >
          {copy.accept}
        </button>
      </div>
    </div>
  );
}
