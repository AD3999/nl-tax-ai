/**
 * TrustStrip — persistent disclaimer bar for Calculator and Chat pages (F15).
 * "Bron: Belastingdienst · Geen officieel belastingadvies"
 * Three-language, always visible, not dismissible.
 */
import { useTranslation } from "react-i18next";
import { ShieldAlert } from "lucide-react";

const COPY: Record<string, { source: string; disclaimer: string }> = {
  nl: {
    source: "Bron: Belastingdienst.nl",
    disclaimer: "Geen officieel belastingadvies — raadpleeg een belastingadviseur voor uw persoonlijke situatie.",
  },
  en: {
    source: "Source: Belastingdienst.nl",
    disclaimer: "Not official tax advice — consult a tax adviser for your personal situation.",
  },
  fa: {
    source: "منبع: Belastingdienst.nl",
    disclaimer: "این مشاوره رسمی مالیاتی نیست — برای وضعیت شخصی خود با مشاور مالیاتی مشورت کنید.",
  },
};

export default function TrustStrip() {
  const { i18n } = useTranslation();
  const lang = (i18n.language ?? "nl").slice(0, 2);
  const copy = COPY[lang] ?? COPY.nl;

  return (
    <div
      role="note"
      aria-label={copy.disclaimer}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        background: "var(--bg-3)",
        borderTop: "1px solid var(--border)",
        fontSize: "var(--text-xs)",
        color: "var(--text-4)",
        flexShrink: 0,
        flexWrap: "wrap",
      }}
    >
      <ShieldAlert size={12} style={{ flexShrink: 0 }} aria-hidden />
      <span style={{ fontWeight: 600 }}>{copy.source}</span>
      <span aria-hidden style={{ color: "var(--border)" }}>·</span>
      <span>{copy.disclaimer}</span>
    </div>
  );
}
