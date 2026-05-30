import { useTranslation } from "react-i18next";
import Wordmark from "./Wordmark";

export default function Footer() {
  const { i18n } = useTranslation();
  const lang = i18n.language as "nl" | "en" | "fa";
  const isRtl = lang === "fa";

  const label = {
    privacy: { nl: "Privacybeleid", en: "Privacy Policy", fa: "سیاست حریم خصوصی" },
    terms:   { nl: "Algemene voorwaarden", en: "Terms of Service", fa: "شرایط خدمات" },
    contact: { nl: "Contact", en: "Contact", fa: "تماس" },
    disclaimer: {
      nl: "TaxWijs geeft geen officieel belastingadvies. Raadpleeg een belastingadviseur voor uw specifieke situatie.",
      en: "TaxWijs does not provide official tax advice. Consult a tax advisor for your specific situation.",
      fa: "TaxWijs مشاوره مالیاتی رسمی ارائه نمی‌دهد. برای وضعیت خاص خود با مشاور مالیاتی مشورت کنید.",
    },
    rights: { nl: "Alle rechten voorbehouden", en: "All rights reserved", fa: "تمام حقوق محفوظ است" },
  };

  return (
    <footer
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        borderTop: "1px solid var(--hairline)",
        background: "var(--paper-2)",
        padding: "28px 28px 20px",
        flexShrink: 0,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-between", alignItems: "flex-start" }}>
          {/* Brand block */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 180 }}>
            <Wordmark size={14} />
            <p style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 4, maxWidth: 240, lineHeight: 1.55 }}>
              {label.disclaimer[lang] ?? label.disclaimer.en}
            </p>
          </div>

          {/* Links */}
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span className="eyebrow" style={{ color: "var(--ink-3)" }}>Legal</span>
              <FooterLink href="/privacy">{label.privacy[lang] ?? label.privacy.en}</FooterLink>
              <FooterLink href="/terms">{label.terms[lang] ?? label.terms.en}</FooterLink>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span className="eyebrow" style={{ color: "var(--ink-3)" }}>Company</span>
              <FooterLink href="mailto:support@taxwijs.nl">{label.contact[lang]}</FooterLink>
              <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>KvK: 98765432</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--ink-4)" }}>
            © {new Date().getFullYear()} TaxWijs — {label.rights[lang] ?? label.rights.en}
          </span>
          <span style={{ fontSize: 11, color: "var(--ink-4)" }}>
            🇳🇱 NL &nbsp;|&nbsp; 🇬🇧 EN &nbsp;|&nbsp; 🇮🇷 FA
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={{ fontSize: 12.5, color: "var(--ink-3)", textDecoration: "none", transition: "color .15s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink-3)"; }}
    >
      {children}
    </a>
  );
}
