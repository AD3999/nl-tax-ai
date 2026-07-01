import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMobile } from "../hooks/useMobile";
import { apiBase } from "../api/client";

type Lang = "nl" | "en" | "fa";

type Listing = {
  id: number;
  display_name: string;
  bio: string;
  specializations: string[];
  languages: string[];
  hourly_rate_display: string;
  accepts_new_clients: boolean;
  calendly_url: string;
  rating: number | null;
  review_count: number;
};

const TX: Record<Lang, {
  title: string;
  subtitle: string;
  badge: string;
  loading: string;
  empty: string;
  error: string;
  filter_all: string;
  filter_spec: string;
  speaks: string;
  rate: string;
  new_clients: string;
  no_new_clients: string;
  book: string;
  reviews: string;
  rating: string;
  specializations: Record<string, string>;
}> = {
  nl: {
    title: "Vind een belastingadviseur",
    subtitle: "Geverifieerde Nederlandse belastingadviseurs die ook Engels en Farsi spreken",
    badge: "Marktplaats",
    loading: "Adviseurs laden...",
    empty: "Geen adviseurs gevonden met deze filters",
    error: "Adviseurs konden niet worden geladen",
    filter_all: "Alle",
    filter_spec: "Specialisatie",
    speaks: "Spreekt",
    rate: "Tarief",
    new_clients: "Neemt nieuwe klanten aan",
    no_new_clients: "Geen nieuwe klanten",
    book: "Afspraak boeken",
    reviews: "reviews",
    rating: "Beoordeling",
    specializations: { it_tech: "IT & Tech", creative_media: "Creatief & Media", consulting: "Consulting", trades_construction: "Ambacht & Bouw", healthcare_wellness: "Zorg & Wellness", international: "ZZP met internationale achtergrond", other: "Overig" },
  },
  en: {
    title: "Find a Tax Advisor",
    subtitle: "Verified Dutch tax advisors who also speak English and Persian",
    badge: "Marketplace",
    loading: "Loading advisors...",
    empty: "No advisors found matching your filters",
    error: "Could not load advisors",
    filter_all: "All",
    filter_spec: "Specialization",
    speaks: "Speaks",
    rate: "Rate",
    new_clients: "Accepting new clients",
    no_new_clients: "Not accepting clients",
    book: "Book a call",
    reviews: "reviews",
    rating: "Rating",
    specializations: { it_tech: "IT & Tech", creative_media: "Creative & Media", consulting: "Consulting", trades_construction: "Trades / Construction", healthcare_wellness: "Healthcare / Wellness", international: "International-background ZZP", other: "Other" },
  },
  fa: {
    title: "یافتن مشاور مالیاتی",
    subtitle: "مشاوران مالیاتی تأییدشده هلندی که انگلیسی و فارسی هم می‌دانند",
    badge: "بازار",
    loading: "در حال بارگذاری مشاوران...",
    empty: "مشاوری با این فیلترها یافت نشد",
    error: "مشاوران بارگذاری نشدند",
    filter_all: "همه",
    filter_spec: "تخصص",
    speaks: "زبان‌ها",
    rate: "نرخ ساعتی",
    new_clients: "مشتری جدید می‌پذیرد",
    no_new_clients: "مشتری نمی‌پذیرد",
    book: "رزرو جلسه",
    reviews: "نظر",
    rating: "امتیاز",
    specializations: { it_tech: "IT و فناوری", creative_media: "خلاق و رسانه", consulting: "مشاوره", trades_construction: "پیشه و ساختمان", healthcare_wellness: "بهداشت و سلامت", international: "ZZP با پیشینه بین‌المللی", other: "سایر" },
  },
};

const LANG_FLAGS: Record<string, string> = {
  nl: "🇳🇱",
  en: "🇬🇧",
  fa: "🇮🇷",
};

export default function FindAccountantPage() {
  const { i18n } = useTranslation();
  const isMobile = useMobile();
  const lang = (i18n.language.startsWith("fa") ? "fa" : i18n.language.startsWith("nl") ? "nl" : "en") as Lang;
  const isRtl = lang === "fa";
  const tx = TX[lang];

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [spec, setSpec] = useState("all");

  useEffect(() => {
    setLoading(true);
    setError(false);
    const url = new URL(`${apiBase}/users/marketplace/`);
    url.searchParams.set("lang", lang);
    if (spec !== "all") url.searchParams.set("specialization", spec);

    fetch(url.toString())
      .then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<Listing[]>; })
      .then(data => { setListings(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [lang, spec]);

  const specs = ["all", "it_tech", "creative_media", "consulting", "trades_construction", "healthcare_wellness", "international", "other"];

  return (
    <main style={{ background: "var(--paper)", flex: 1 }} dir={isRtl ? "rtl" : "ltr"}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "var(--sp-6) var(--sp-4)" : "var(--sp-10) var(--sp-8)" }}>

        {/* Header */}
        <div style={{ marginBottom: "var(--sp-6)" }}>
          <span className="pill pill-accent" style={{ marginBottom: "var(--sp-3)", display: "inline-block" }}>{tx.badge}</span>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-4xl)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em" }}>
            {tx.title}
          </h1>
          <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", marginTop: "var(--sp-1)" }}>{tx.subtitle}</p>
        </div>

        {/* Specialization filter */}
        <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap", marginBottom: "var(--sp-6)" }}>
          {specs.map(s => (
            <button
              key={s}
              onClick={() => setSpec(s)}
              className={`pill ${spec === s ? "pill-accent" : ""}`}
              style={{ cursor: "pointer", border: "1px solid var(--hairline-2)", background: spec === s ? undefined : "var(--paper)" }}
            >
              {s === "all" ? tx.filter_all : (tx.specializations[s] ?? s)}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "var(--sp-10)", color: "var(--ink-3)" }}>{tx.loading}</div>
        ) : error ? (
          <div className="card" style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--danger)" }}>⚠️ {tx.error}</div>
        ) : listings.length === 0 ? (
          <div className="card" style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-3)" }}>{tx.empty}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(400px,1fr))", gap: "var(--sp-4)" }}>
            {listings.map(l => (
              <div key={l.id} className="card" style={{ padding: "var(--sp-5) var(--sp-6)" }}>
                {/* Name + rating */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--sp-3)", marginBottom: "var(--sp-3)" }}>
                  <div>
                    <h3 style={{ fontWeight: 600, color: "var(--ink)", fontSize: "var(--text-base)", margin: 0 }}>{l.display_name}</h3>
                    {l.rating != null && (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
                        ⭐ {l.rating.toFixed(1)} · {l.review_count} {tx.reviews}
                      </span>
                    )}
                  </div>
                  <span className="pill" style={{
                    fontSize: "var(--text-xs)",
                    background: l.accepts_new_clients ? "var(--ok-soft, oklch(0.92 0.08 140))" : "var(--paper-3)",
                    color: l.accepts_new_clients ? "var(--ok)" : "var(--ink-4)",
                  }}>
                    {l.accepts_new_clients ? tx.new_clients : tx.no_new_clients}
                  </span>
                </div>

                {/* Bio */}
                {l.bio && (
                  <p style={{ color: "var(--ink-2)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)", marginBottom: "var(--sp-3)" }}>
                    {l.bio.slice(0, 200)}{l.bio.length > 200 ? "…" : ""}
                  </p>
                )}

                {/* Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
                  {l.specializations.map(s => (
                    <span key={s} className="pill pill-sm" style={{ background: "var(--accent-soft)", color: "var(--sage-700)" }}>
                      {tx.specializations[s] ?? s}
                    </span>
                  ))}
                  {l.languages.map(lg => (
                    <span key={lg} className="pill pill-sm" style={{ background: "var(--paper-3)", color: "var(--ink-3)" }}>
                      {LANG_FLAGS[lg] ?? ""} {lg.toUpperCase()}
                    </span>
                  ))}
                </div>

                {/* Rate + CTA */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--sp-3)" }}>
                  {l.hourly_rate_display && (
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)" }}>
                      {tx.rate}: <strong style={{ color: "var(--ink)" }}>{l.hourly_rate_display}</strong>
                    </span>
                  )}
                  {l.calendly_url && l.accepts_new_clients && (
                    <a
                      href={l.calendly_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-accent btn-sm"
                      style={{ textDecoration: "none", flexShrink: 0 }}
                    >
                      {tx.book} →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
