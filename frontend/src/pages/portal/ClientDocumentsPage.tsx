import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useMobile } from "../../hooks/useMobile";
import {
  fetchClientDocuments, fetchClientEngagement,
  uploadClientDocument, deleteClientDocument,
} from "../../api/portal/client";
import type { ClientDocument, TaxEngagement } from "../../api/portal/types";
import { formatDate } from "../../lib/utils";

const STATUS_COLOR: Record<string, string> = {
  uploaded:     "var(--text-3)",
  processing:   "var(--warn-text)",
  extracted:    "var(--ok-text)",
  needs_review: "var(--warn-text)",
  approved:     "var(--ok-text)",
  rejected:     "var(--danger-text)",
};
const STATUS_BG: Record<string, string> = {
  uploaded:     "var(--bg-3)",
  processing:   "var(--warn-subtle)",
  extracted:    "var(--ok-subtle)",
  needs_review: "var(--warn-subtle)",
  approved:     "var(--ok-subtle)",
  rejected:     "var(--danger-subtle)",
};

const STATUS_LABELS: Record<string, Record<"nl"|"en"|"fa", string>> = {
  uploaded:     { nl: "Geüpload",          en: "Uploaded",      fa: "بارگذاری شده" },
  processing:   { nl: "Verwerken…",        en: "Processing…",   fa: "در حال پردازش…" },
  extracted:    { nl: "Verwerkt",          en: "Processed",     fa: "پردازش شده" },
  needs_review: { nl: "Beoordeling nodig", en: "Needs review",  fa: "نیاز به بررسی" },
  approved:     { nl: "Goedgekeurd",       en: "Approved",      fa: "تأیید شده" },
  rejected:     { nl: "Afgewezen",         en: "Rejected",      fa: "رد شده" },
};

const TX = {
  title:      { nl: "Mijn documenten",      en: "My documents",        fa: "اسناد من" },
  back:       { nl: "← Terug",              en: "← Back",              fa: "← بازگشت" },
  upload:     { nl: "Document uploaden",    en: "Upload document",     fa: "بارگذاری سند" },
  uploading:  { nl: "Bezig…",               en: "Uploading…",          fa: "در حال بارگذاری…" },
  empty:      { nl: "Geen documenten geüpload", en: "No documents uploaded yet", fa: "هنوز سندی بارگذاری نشده" },
  accepted:   { nl: "Typen",                en: "Types accepted",      fa: "انواع قابل قبول" },
  view:       { nl: "Bekijken",             en: "View",                fa: "مشاهده" },
  delete:     { nl: "Verwijderen",          en: "Delete",              fa: "حذف" },
  deleting:   { nl: "Verwijderen…",         en: "Deleting…",           fa: "حذف…" },
  confirm_del:{ nl: "Zeker weten?",         en: "Are you sure?",       fa: "آیا مطمئن هستید؟" },
  modal_title:{ nl: "Document uploaden",    en: "Upload document",     fa: "بارگذاری سند" },
  doc_title:  { nl: "Titel (optioneel)",    en: "Title (optional)",    fa: "عنوان (اختیاری)" },
  doc_note:   { nl: "Notitie (optioneel)",  en: "Note (optional)",     fa: "یادداشت (اختیاری)" },
  choose_file:{ nl: "Bestand kiezen…",      en: "Choose file…",        fa: "انتخاب فایل…" },
  confirm_up: { nl: "Uploaden",             en: "Upload",              fa: "بارگذاری" },
  cancel:     { nl: "Annuleren",            en: "Cancel",              fa: "لغو" },
  file_label: { nl: "Bestand",              en: "File",                fa: "فایل" },
};

function t(key: keyof typeof TX, lang: "nl"|"en"|"fa") { return TX[key][lang]; }

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SkeletonDoc() {
  return (
    <div className="card" style={{ padding: "var(--sp-3) var(--sp-4)", marginBottom: "var(--sp-2)", display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ flex: 1 }}>
        <div className="skel" style={{ height: 13, width: "55%", marginBottom: 8 }} />
        <div className="skel" style={{ height: 10, width: "35%" }} />
      </div>
      <div className="skel" style={{ height: 24, width: 70, borderRadius: 4 }} />
    </div>
  );
}

export default function ClientDocumentsPage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isMobile = useMobile();
  const lang = (["nl", "fa"].includes(i18n.language) ? i18n.language : "en") as "nl"|"en"|"fa";

  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [engagement, setEngagement] = useState<TaxEngagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, setLastUpdated] = useState<Date | null>(null);

  // Upload modal state
  const [showModal, setShowModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadNote, setUploadNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    void load();
    const id = setInterval(() => void load(true), 12_000);
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
      if (!silent) setError("");
    } catch {
      if (!silent) setError("Could not load documents.");
    }
    if (!silent) setLoading(false);
  }

  async function fetchDocumentBlob(fileUrl: string): Promise<string | null> {
    const token = localStorage.getItem("access_token") ?? "";
    const res = await fetch(fileUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { detail?: string };
      showToast(data.detail ?? "File not found. Please re-upload.", "error");
      return null;
    }
    return URL.createObjectURL(await res.blob());
  }

  async function viewDocumentFile(fileUrl: string) {
    try {
      const blobUrl = await fetchDocumentBlob(fileUrl);
      if (!blobUrl) return;
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch {
      showToast("Could not open document.", "error");
    }
  }

  async function downloadDocumentFile(fileUrl: string, filename: string) {
    try {
      const blobUrl = await fetchDocumentBlob(fileUrl);
      if (!blobUrl) return;
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
    } catch {
      showToast("Could not download document.", "error");
    }
  }

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, ""));
    setShowModal(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg", "image/jpg", "image/png",
    "image/heic", "image/heif", "image/webp",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];
  const MAX_FILE_SIZE = 20 * 1024 * 1024;

  function validateFile(file: File): string | null {
    if (file.size > MAX_FILE_SIZE) return `File is too large (max 20 MB). Your file: ${(file.size / 1024 / 1024).toFixed(1)} MB`;
    if (!ALLOWED_MIME_TYPES.includes(file.type)) return "File type not supported. Allowed: PDF, JPG, PNG, HEIC, WebP, CSV, XLSX";
    return null;
  }

  async function handleUpload() {
    if (!uploadFile || !engagement) return;
    const validationError = validateFile(uploadFile);
    if (validationError) { showToast(validationError, "error"); return; }
    setUploading(true);
    setUploadProgress(0);
    setUploadError("");
    try {
      const doc = await uploadClientDocument(
        engagement.id,
        engagement.client_profile,
        uploadFile,
        uploadTitle,
        uploadNote,
        undefined,
        (pct) => setUploadProgress(pct),
      );
      setDocuments(prev => [doc, ...prev]);
      setShowModal(false);
      setUploadFile(null);
      setUploadTitle("");
      setUploadNote("");
      setUploadProgress(null);
      setTimeout(() => void load(true), 3000);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setUploadProgress(null);
    }
    setUploading(false);
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteClientDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch {
      /* fail silently */
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  if (loading) return (
    <main style={{ flex: 1, padding: isMobile ? "var(--sp-4) 0" : "var(--sp-5) 0", maxWidth: 740, margin: "0 auto", width: "100%" }}>
      <div className="skel" style={{ height: 12, width: 60, marginBottom: 20 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="skel" style={{ height: 28, width: 180 }} />
        <div className="skel" style={{ height: 36, width: 140, borderRadius: 6 }} />
      </div>
      {[1,2,3].map(i => <SkeletonDoc key={i} />)}
    </main>
  );

  return (
    <>
      {/* Upload modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "oklch(0 0 0 / 0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "var(--sp-4)",
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{
            background: "var(--bg-2)", borderRadius: "var(--r-lg)",
            border: "1px solid var(--border-2)",
            padding: "var(--sp-6)", width: "100%", maxWidth: 440,
            boxShadow: "var(--sh-lg)",
          }}>
            <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--text)", marginBottom: "var(--sp-5)", letterSpacing: "-0.02em" }}>
              {t("modal_title", lang)}
            </h2>

            {/* Form fields — frozen during upload */}
            <div style={{ opacity: uploading ? 0.55 : 1, pointerEvents: uploading ? "none" : "auto", transition: "opacity 0.2s" }}>
              <div style={{ marginBottom: "var(--sp-4)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {t("file_label", lang)}
                </label>
                <div style={{ padding: "var(--sp-3)", background: "var(--bg-3)", borderRadius: "var(--r-sm)", border: "1px solid var(--border)", fontSize: "var(--text-sm)", color: "var(--text-2)", fontWeight: 600 }}>
                  {uploadFile?.name ?? "—"}
                </div>
              </div>

              <div style={{ marginBottom: "var(--sp-4)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {t("doc_title", lang)}
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder={uploadFile?.name ?? ""}
                  style={{ width: "100%", padding: "var(--sp-3)", background: "var(--bg-3)", border: "1px solid var(--border-2)", borderRadius: "var(--r-sm)", color: "var(--text)", fontSize: "var(--text-sm)", fontFamily: "inherit", fontWeight: 600 }}
                />
              </div>

              <div style={{ marginBottom: "var(--sp-5)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {t("doc_note", lang)}
                </label>
                <textarea
                  rows={3}
                  value={uploadNote}
                  onChange={e => setUploadNote(e.target.value)}
                  style={{ width: "100%", padding: "var(--sp-3)", background: "var(--bg-3)", border: "1px solid var(--border-2)", borderRadius: "var(--r-sm)", color: "var(--text)", fontSize: "var(--text-sm)", fontFamily: "inherit", resize: "vertical", fontWeight: 500 }}
                />
              </div>
            </div>

            {/* Progress bar — shown while uploading */}
            {uploading && uploadProgress !== null && (
              <div style={{ marginBottom: "var(--sp-4)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-3)" }}>
                    {uploadProgress < 100 ? (lang === "fa" ? "در حال بارگذاری…" : lang === "nl" ? "Bezig met uploaden…" : "Uploading…") : (lang === "fa" ? "در حال ذخیره‌سازی…" : lang === "nl" ? "Opslaan…" : "Saving…")}
                  </span>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--blue)", fontVariantNumeric: "tabular-nums" }}>
                    {uploadProgress}%
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "var(--bg-3)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 999,
                    background: "linear-gradient(90deg, var(--blue) 0%, var(--blue-text) 100%)",
                    width: `${uploadProgress}%`,
                    transition: "width 0.25s ease",
                  }} />
                </div>
              </div>
            )}

            {/* Error banner — shown when upload fails */}
            {uploadError && (
              <div style={{ marginBottom: "var(--sp-4)", padding: "var(--sp-3) var(--sp-4)", background: "var(--danger-subtle)", borderRadius: "var(--r-sm)", border: "1px solid var(--danger)", display: "flex", gap: "var(--sp-3)", alignItems: "flex-start" }}>
                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "var(--danger-text)", fontSize: "var(--text-sm)", marginBottom: 2 }}>
                    {lang === "fa" ? "بارگذاری ناموفق" : lang === "nl" ? "Upload mislukt" : "Upload failed"}
                  </div>
                  <div style={{ color: "var(--danger-text)", fontSize: "var(--text-xs)", fontWeight: 500 }}>
                    {uploadError}
                  </div>
                </div>
                <button onClick={() => setUploadError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 16, padding: 0, flexShrink: 0 }}>✕</button>
              </div>
            )}

            {/* Action buttons — hidden while uploading */}
            {!uploading && (
              <div style={{ display: "flex", gap: "var(--sp-3)", justifyContent: "flex-end" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowModal(false); setUploadFile(null); setUploadTitle(""); setUploadNote(""); setUploadError(""); }}>
                  {t("cancel", lang)}
                </button>
                <button className="btn btn-accent btn-sm" onClick={handleUpload} disabled={!uploadFile}>
                  {t("confirm_up", lang)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <main style={{ background: "var(--bg)", flex: 1 }}>
        <div style={{ maxWidth: 740, margin: "0 auto", padding: isMobile ? "var(--sp-4) 0" : "var(--sp-5) 0" }}>

          <Link to="/client" style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", textDecoration: "none", fontWeight: 600 }}>{t("back", lang)}</Link>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "var(--sp-3) 0 var(--sp-4)", flexWrap: "wrap", gap: "var(--sp-3)" }}>
            <h1 style={{ fontSize: "clamp(1.4rem, 5vw, var(--text-3xl))", fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.03em" }}>{t("title", lang)}</h1>
            <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexShrink: 0 }}>
              {error && <span style={{ color: "var(--danger-text)", fontSize: "var(--text-xs)", fontWeight: 600 }}>{error}</span>}
              <button onClick={() => void load(true)} title="Refresh" style={{ background: "none", border: "1px solid var(--border-2)", borderRadius: 6, cursor: "pointer", color: "var(--text-3)", fontSize: 14, width: 30, height: 30, display: "grid", placeItems: "center" }}>↻</button>
              <input ref={fileInputRef} type="file" accept="application/pdf,image/*,.csv,.xlsx,.xls" style={{ display: "none" }} onChange={handleFileChosen} />
              <button className="btn btn-accent btn-sm" onClick={() => fileInputRef.current?.click()} disabled={!engagement} style={{ fontWeight: 700 }}>
                {t("upload", lang)}
              </button>
            </div>
          </div>

          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-4)", marginBottom: "var(--sp-5)", fontWeight: 600 }}>
            {t("accepted", lang)}: PDF, JPEG, PNG, HEIC, CSV, XLSX · Max 20 MB
          </div>

          {documents.length === 0 ? (
            <div className="card" style={{ padding: "var(--sp-10)", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: "var(--sp-3)" }}>📂</div>
              <div style={{ color: "var(--text-3)", fontWeight: 600, fontSize: "var(--text-base)" }}>{t("empty", lang)}</div>
              <div style={{ color: "var(--text-4)", fontSize: "var(--text-sm)", marginTop: 6 }}>
                Click "Upload document" to add your first file.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
              {documents.map(doc => (
                <div key={doc.id} className="card" style={{ padding: "var(--sp-3) var(--sp-4)", display: "flex", gap: "var(--sp-3)", alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                    {/* Title / filename */}
                    <div style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.user_title || doc.original_filename}
                    </div>
                    {/* Note */}
                    {doc.user_note && (
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-3)", marginTop: 2, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {doc.user_note}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: 4, fontSize: "var(--text-xs)", color: "var(--text-4)", fontWeight: 600 }}>
                      <span>{formatSize(doc.file_size)}</span>
                      <span>{formatDate(doc.created_at)}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexShrink: 0, marginInlineStart: "auto" }}>
                    {/* Status badge */}
                    <span style={{
                      fontSize: "var(--text-xs)", fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                      color: STATUS_COLOR[doc.processing_status] ?? "var(--text-3)",
                      background: STATUS_BG[doc.processing_status] ?? "var(--bg-3)",
                    }}>
                      {STATUS_LABELS[doc.processing_status]?.[lang] ?? doc.processing_status}
                    </span>

                    {doc.file_url && (
                      <>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: "var(--text-xs)", fontWeight: 700 }} onClick={() => void viewDocumentFile(doc.file_url!)}>
                          {t("view", lang)} ↗
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "0 8px" }} title="Download" onClick={() => void downloadDocumentFile(doc.file_url!, doc.original_filename)}>
                          <Download size={13} />
                        </button>
                      </>
                    )}

                    {/* Delete */}
                    {confirmDeleteId === doc.id ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="btn btn-sm"
                          style={{ background: "var(--danger)", color: "#fff", fontSize: "var(--text-xs)", fontWeight: 700, height: 28, padding: "0 10px" }}
                          disabled={deletingId === doc.id}
                          onClick={() => handleDelete(doc.id)}
                        >
                          {deletingId === doc.id ? t("deleting", lang) : t("confirm_del", lang)}
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: "var(--text-xs)" }} onClick={() => setConfirmDeleteId(null)}>✕</button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: "var(--text-xs)", color: "var(--danger-text)", fontWeight: 700 }}
                        onClick={() => setConfirmDeleteId(doc.id)}
                      >
                        {t("delete", lang)}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
