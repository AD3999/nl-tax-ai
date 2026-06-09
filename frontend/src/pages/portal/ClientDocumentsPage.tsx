import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { fetchClientDocuments, fetchClientEngagement, uploadDocument } from "../../api/portal/client";
import type { ClientDocument, TaxEngagement } from "../../api/portal/types";

const STATUS_COLOR: Record<string, string> = {
  uploaded: "var(--ink-4)", processing: "oklch(0.62 0.13 50)",
  extracted: "oklch(0.62 0.13 50)", needs_review: "oklch(0.62 0.13 50)",
  approved: "var(--sage-600)", rejected: "var(--danger)",
};

const STATUS_LABELS: Record<string, Record<"nl" | "en" | "fa", string>> = {
  uploaded:     { nl: "Geüpload",          en: "Uploaded",      fa: "بارگذاری شده" },
  processing:   { nl: "Verwerken...",      en: "Processing...", fa: "در حال پردازش..." },
  extracted:    { nl: "Geëxtraheerd",      en: "Extracted",     fa: "استخراج شده" },
  needs_review: { nl: "Beoordeling nodig", en: "Needs review",  fa: "نیاز به بررسی" },
  approved:     { nl: "Goedgekeurd",       en: "Approved",      fa: "تأیید شده" },
  rejected:     { nl: "Afgewezen",         en: "Rejected",      fa: "رد شده" },
};

const TX = {
  title:    { nl: "Mijn documenten", en: "My documents", fa: "اسناد من" },
  back:     { nl: "← Terug", en: "← Back", fa: "← بازگشت" },
  upload:   { nl: "Document uploaden", en: "Upload document", fa: "بارگذاری سند" },
  uploading:{ nl: "Bezig...", en: "Uploading...", fa: "در حال بارگذاری..." },
  empty:    { nl: "Geen documenten geüpload.", en: "No documents uploaded yet.", fa: "هنوز سندی بارگذاری نشده." },
  accepted: { nl: "Geaccepteerde typen", en: "Types accepted", fa: "انواع قابل قبول" },
  view:     { nl: "Bekijken", en: "View", fa: "مشاهده" },
  filename: { nl: "Bestandsnaam", en: "Filename", fa: "نام فایل" },
  status:   { nl: "Status", en: "Status", fa: "وضعیت" },
  date:     { nl: "Datum", en: "Date", fa: "تاریخ" },
  size:     { nl: "Grootte", en: "Size", fa: "حجم" },
};

function t(key: keyof typeof TX, lang: "nl" | "en" | "fa") { return TX[key][lang]; }

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClientDocumentsPage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const lang = (["nl", "fa"].includes(i18n.language) ? i18n.language : "en") as "nl" | "en" | "fa";

  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [engagement, setEngagement] = useState<TaxEngagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    void load();
    const id = setInterval(() => void load(true), 10_000);
    return () => clearInterval(id);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [docs, eng] = await Promise.all([
        fetchClientDocuments(),
        fetchClientEngagement(),
      ]);
      setDocuments(docs);
      setEngagement(eng);
      setLastUpdated(new Date());
    } catch { /* silent fail on background refresh */ }
    if (!silent) setLoading(false);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !engagement) return;
    setUploading(true);
    setError("");
    try {
      const doc = await uploadDocument(engagement.id, engagement.client_profile, file);
      setDocuments(prev => [doc, ...prev]);
      // Re-fetch after a short delay to pick up processing status updates
      setTimeout(() => void load(true), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (loading) return (
    <main style={{ flex: 1, padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-4)" }}>Loading...</main>
  );

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "var(--sp-8) var(--sp-6)" }}>

        <Link to="/client" style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", textDecoration: "none" }}>{t("back", lang)}</Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "var(--sp-3) 0 var(--sp-5)" }}>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-3xl)", fontWeight: 400, color: "var(--ink)", margin: 0 }}>{t("title", lang)}</h1>
          <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
            {error && <span style={{ color: "var(--danger)", fontSize: "var(--text-xs)" }}>{error}</span>}
            {lastUpdated && <span style={{ fontSize: 10, color: "var(--ink-4)" }}>{lastUpdated.toLocaleTimeString()}</span>}
            <button onClick={() => void load(true)} title="Refresh" style={{ background: "none", border: "1px solid var(--hairline-2)", borderRadius: 6, cursor: "pointer", color: "var(--ink-4)", fontSize: 13, padding: "2px 7px", lineHeight: 1 }}>↻</button>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.csv,.xlsx" style={{ display: "none" }} onChange={handleFile} />
            <button className="btn btn-accent btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading || !engagement}>
              {uploading ? t("uploading", lang) : t("upload", lang)}
            </button>
          </div>
        </div>

        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", marginBottom: "var(--sp-5)" }}>
          {t("accepted", lang)}: PDF, JPEG, PNG, HEIC, CSV, XLSX · Max 20 MB
        </div>

        {documents.length === 0 ? (
          <div className="card" style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-3)" }}>
            <div style={{ fontSize: "var(--text-3xl)", marginBottom: "var(--sp-3)" }}>📂</div>
            <div>{t("empty", lang)}</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
            {documents.map(doc => (
              <div key={doc.id} className="card" style={{ padding: "var(--sp-3)", display: "flex", gap: "var(--sp-3)", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.original_filename}</div>
                  <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: 4, fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
                    <span>{doc.document_type}</span>
                    <span>{formatSize(doc.file_size)}</span>
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "var(--text-xs)", color: STATUS_COLOR[doc.processing_status] }}>
                    {STATUS_LABELS[doc.processing_status]?.[lang] ?? doc.processing_status}
                  </span>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: "var(--text-2xs)" }}>{t("view", lang)}</a>
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
