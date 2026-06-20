import { Helmet } from "react-helmet-async";

const SITE_URL = "https://taxwijs.nl";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  lang?: "nl" | "en" | "fa";
  noindex?: boolean;
  jsonLd?: object | object[];
}

export default function SEOHead({
  title,
  description,
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = "website",
  lang = "nl",
  noindex = false,
  jsonLd,
}: SEOHeadProps) {
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="TaxWijs" />
      <meta property="og:locale" content={lang === "nl" ? "nl_NL" : lang === "fa" ? "fa_IR" : "en_GB"} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Hreflang — same-URL multilingual (client-side lang switching) */}
      <link rel="alternate" hrefLang="nl" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="fa" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* JSON-LD structured data */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
