import { useTranslation } from "react-i18next";
import Wordmark from "./Wordmark";

const L = {
  privacy:     { nl: "Privacybeleid",          en: "Privacy Policy",   fa: "سیاست حریم خصوصی" },
  terms:       { nl: "Algemene voorwaarden",    en: "Terms of Service", fa: "شرایط خدمات" },
  contact:     { nl: "Contact",                 en: "Contact",          fa: "تماس" },
  disclaimer:  {
    nl: "TaxWijs geeft geen officieel belastingadvies — raadpleeg altijd een belastingadviseur voor uw persoonlijke situatie",
    en: "TaxWijs does not provide official tax advice — always consult a qualified tax advisor for your personal situation",
    fa: "TaxWijs مشاوره مالیاتی رسمی ارائه نمی‌دهد — همیشه با یک مشاور مالیاتی مجاز مشورت کنید",
  },
  rights:   { nl: "Alle rechten voorbehouden", en: "All rights reserved", fa: "تمام حقوق محفوظ است" },
  legal:    { nl: "Juridisch",                  en: "Legal",              fa: "حقوقی" },
  company:  { nl: "Bedrijf",                    en: "Company",            fa: "شرکت" },
  kvk:      { nl: "KvK-nummer",                 en: "KvK number",         fa: "شماره KvK" },
  gdpr:     {
    nl: "Uw gegevens worden beschermd conform de AVG (GDPR)",
    en: "Your data is protected under GDPR / AVG",
    fa: "اطلاعات شما طبق GDPR محافظت می‌شود",
  },
};

type Lang = "nl" | "en" | "fa";

function get(obj: Record<string, string>, lang: Lang) {
  return obj[lang] ?? obj.en;
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = href.startsWith("http") || href.startsWith("mailto");
  return (
    <a
      href={href}
      target={isExternal ? "_blank" : "_self"}
      rel={isExternal ? "noopener noreferrer" : undefined}
      style={{
        fontSize: "var(--text-sm)",
        color: "var(--ink-3)",
        textDecoration: "none",
        display: "block",
        padding: "3px 0",
        transition: "color .15s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink-3)"; }}
    >
      {children}
    </a>
  );
}

export default function Footer() {
  const { i18n } = useTranslation();
  const lang = i18n.language as Lang;
  const isRtl = lang === "fa";

  return (
    <footer
      dir={isRtl ? "rtl" : "ltr"}
      aria-label="Site footer"
      style={{
        borderTop: "1px solid var(--hairline)",
        background: "var(--paper-2)",
        flexShrink: 0,
      }}
    >
      {/* Main footer content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "var(--sp-10) var(--sp-8) var(--sp-8)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "var(--sp-10)", alignItems: "flex-start" }}>

          {/* Brand + disclaimer */}
          <div style={{ maxWidth: 320 }}>
            <Wordmark size={14} />
            <p style={{ marginTop: "var(--sp-3)", fontSize: "var(--text-xs)", color: "var(--ink-3)", lineHeight: "var(--leading-relaxed)" }}>
              {get(L.disclaimer, lang)}
            </p>
            <p style={{ marginTop: "var(--sp-2)", fontSize: "var(--text-xs)", color: "var(--ink-4)", lineHeight: "var(--leading-relaxed)" }}>
              {get(L.gdpr, lang)}
            </p>
          </div>

          {/* Legal links */}
          <div>
            <span className="eyebrow" style={{ display: "block", marginBottom: "var(--sp-3)", color: "var(--ink-3)" }}>
              {get(L.legal, lang)}
            </span>
            <FooterLink href="/privacy">{get(L.privacy, lang)}</FooterLink>
            <FooterLink href="/terms">{get(L.terms, lang)}</FooterLink>
          </div>

          {/* Company info */}
          <div>
            <span className="eyebrow" style={{ display: "block", marginBottom: "var(--sp-3)", color: "var(--ink-3)" }}>
              {get(L.company, lang)}
            </span>
            <FooterLink href="mailto:support@taxwijs.nl">{get(L.contact, lang)}</FooterLink>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", padding: "3px 0" }}>
              {get(L.kvk, lang)}: 98765432
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid var(--hairline)" }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "var(--sp-4) var(--sp-8)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--sp-3)",
        }}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>
            © {new Date().getFullYear()} TaxWijs — {get(L.rights, lang)}
          </span>
          <div style={{ display: "flex", gap: "var(--sp-4)", fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>
            <span>🇳🇱 Nederlands</span>
            <span>🇬🇧 English</span>
            <span>🇮🇷 فارسی</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
