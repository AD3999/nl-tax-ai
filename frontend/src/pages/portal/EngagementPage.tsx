import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  fetchEngagement, fetchChecklist, fetchDocuments,
  fetchIncome, fetchExpenses, fetchActions, generateActions, fetchRisks,
  fetchAudit, updateChecklistItem, reviewDocument, sendReminder,
  recalculateReadiness, updateAction, updateIncome, updateExpense,
  uploadDocument,
} from "../../api/portal/client";
import type {
  TaxEngagement, ChecklistItem, ClientDocument,
  ExtractedIncome, ExtractedExpense, AccountantAction, ReadinessResult, AuditLog,
} from "../../api/portal/types";

type Tab = "overview" | "checklist" | "documents" | "income" | "expenses" | "risks" | "audit";

const RISK_COLOR: Record<string, string> = {
  low: "var(--sage-600)", medium: "oklch(0.62 0.13 50)", high: "var(--danger)",
};

const CHECKLIST_STATUS_COLOR: Record<string, string> = {
  todo: "var(--ink-4)", waiting_client: "oklch(0.62 0.13 50)",
  uploaded: "var(--sage-600)", needs_review: "oklch(0.62 0.13 50)",
  accepted: "var(--sage-600)", rejected: "var(--danger)", waived: "var(--ink-4)",
};

const REVIEW_STATUS_COLOR: Record<string, string> = {
  candidate: "oklch(0.62 0.13 50)", approved: "var(--sage-600)",
  rejected: "var(--danger)", manual: "var(--ink-3)",
};

function ReadinessRing({ score }: { score: number }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color = score >= 85 ? "var(--sage-600)" : score >= 50 ? "oklch(0.62 0.13 50)" : "var(--danger)";
  return (
    <svg width={90} height={90} viewBox="0 0 90 90" style={{ transform: "rotate(-90deg)" }}>
      <circle cx={45} cy={45} r={r} fill="none" stroke="var(--hairline)" strokeWidth={7} />
      <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      <text x={45} y={49} textAnchor="middle" fill={color} fontSize={16} fontWeight={700} style={{ transform: "rotate(90deg) translate(-90px, 0)" }}>
        {score}%
      </text>
    </svg>
  );
}

export default function EngagementPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [engagement, setEngagement] = useState<TaxEngagement | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [income, setIncome] = useState<ExtractedIncome[]>([]);
  const [expenses, setExpenses] = useState<ExtractedExpense[]>([]);
  const [actions, setActions] = useState<AccountantAction[]>([]);
  const [risks, setRisks] = useState<{ opportunities: unknown[]; risks: unknown[] } | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);

  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingActions, setGeneratingActions] = useState(false);
  const [reminderPreview, setReminderPreview] = useState<{ subject: string; body: string; missing_count: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const engId = Number(id);

  useEffect(() => {
    if (!user || !engId) return;
    loadAll();
  }, [user, engId]);

  async function loadAll() {
    setLoading(true);
    try {
      const [eng, chk, docs, inc, exp, acts] = await Promise.all([
        fetchEngagement(engId),
        fetchChecklist(engId),
        fetchDocuments(engId),
        fetchIncome(engId),
        fetchExpenses(engId),
        fetchActions(engId),
      ]);
      setEngagement(eng);
      setChecklist(chk);
      setDocuments(docs);
      setIncome(inc);
      setExpenses(exp);
      setActions(acts);
    } catch {
      setError("Failed to load engagement");
    }
    setLoading(false);
  }

  async function loadRisks() {
    if (risks) return;
    const r = await fetchRisks(engId);
    setRisks(r);
  }

  async function loadAudit() {
    if (auditLog.length > 0) return;
    const logs = await fetchAudit(engId);
    setAuditLog(logs);
  }

  async function handleGenerateActions() {
    setGeneratingActions(true);
    const acts = await generateActions(engId);
    setActions(acts);
    setGeneratingActions(false);
  }

  async function handleRecalculate() {
    const r = await recalculateReadiness(engId);
    setReadiness(r);
    const updated = await fetchEngagement(engId);
    setEngagement(updated);
  }

  async function handleActionStatus(actionId: number, status: "done" | "dismissed") {
    await updateAction(actionId, { status });
    setActions(prev => prev.map(a => a.id === actionId ? { ...a, status } : a));
  }

  async function handleChecklistStatus(itemId: number, status: ChecklistItem["status"]) {
    const updated = await updateChecklistItem(itemId, { status });
    setChecklist(prev => prev.map(i => i.id === itemId ? updated : i));
  }

  async function handleReviewDoc(docId: number, newStatus: string) {
    const updated = await reviewDocument(docId, { processing_status: newStatus });
    setDocuments(prev => prev.map(d => d.id === docId ? updated : d));
  }

  async function handleApproveIncome(incomeId: number, status: "approved" | "rejected") {
    const updated = await updateIncome(incomeId, { review_status: status });
    setIncome(prev => prev.map(i => i.id === incomeId ? updated : i));
  }

  async function handleApproveExpense(expenseId: number, status: "approved" | "rejected") {
    const updated = await updateExpense(expenseId, { review_status: status });
    setExpenses(prev => prev.map(e => e.id === expenseId ? updated : e));
  }

  async function handleSendReminder() {
    const result = await sendReminder(engId);
    setReminderPreview(result);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !engagement) return;
    setUploading(true);
    setUploadError("");
    try {
      const doc = await uploadDocument(engId, engagement.client_profile, file);
      setDocuments(prev => [doc, ...prev]);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (loading) return (
    <main style={{ flex: 1, padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-4)" }}>Loading engagement...</main>
  );

  if (!engagement) return (
    <main style={{ flex: 1, padding: "var(--sp-8)", textAlign: "center" }}>
      <p style={{ color: "var(--ink-3)" }}>{error || "Engagement not found"}</p>
      <Link to="/accountant" className="btn btn-ghost btn-sm" style={{ marginTop: 16 }}>← Back</Link>
    </main>
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview",  label: "Overview" },
    { key: "checklist", label: `Checklist (${checklist.length})` },
    { key: "documents", label: `Documents (${documents.length})` },
    { key: "income",    label: `Income (${income.length})` },
    { key: "expenses",  label: `Expenses (${expenses.length})` },
    { key: "risks",     label: "Risks & Deductions" },
    { key: "audit",     label: "Audit log" },
  ];

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "var(--sp-6) var(--sp-6)" }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: "var(--sp-4)", fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>
          <Link to="/accountant" style={{ color: "var(--ink-4)", textDecoration: "none" }}>Accountant Portal</Link>
          <span style={{ margin: "0 var(--sp-2)" }}>›</span>
          <Link to={`/accountant/clients/${engagement.client_profile}`} style={{ color: "var(--ink-4)", textDecoration: "none" }}>{engagement.client_profile_display}</Link>
          <span style={{ margin: "0 var(--sp-2)" }}>›</span>
          <span style={{ color: "var(--ink)" }}>{engagement.tax_year} {engagement.engagement_type}</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--sp-5)", flexWrap: "wrap", gap: "var(--sp-3)" }}>
          <div>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-3xl)", fontWeight: 400, color: "var(--ink)", margin: 0 }}>
              {engagement.client_profile_display}
            </h1>
            <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-2)", fontSize: "var(--text-xs)", alignItems: "center", flexWrap: "wrap" }}>
              <span className="pill">{engagement.tax_year}</span>
              <span className="pill">{engagement.engagement_type}</span>
              <span style={{ color: RISK_COLOR[engagement.risk_level] }}>Risk: {engagement.risk_level}</span>
              <span style={{ color: engagement.missing_items_count > 0 ? "var(--danger)" : "var(--sage-600)" }}>
                {engagement.missing_items_count} missing items
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--sp-2)" }}>
            <button className="btn btn-ghost btn-sm" onClick={handleRecalculate}>Recalculate</button>
            <button className="btn btn-ghost btn-sm" onClick={handleSendReminder}>Send reminder</button>
            <button className="btn btn-accent btn-sm" onClick={handleGenerateActions} disabled={generatingActions}>
              {generatingActions ? "..." : "Generate actions"}
            </button>
          </div>
        </div>

        {/* Reminder preview */}
        {reminderPreview && (
          <div className="card" style={{ padding: "var(--sp-4)", marginBottom: "var(--sp-4)", background: "var(--accent-soft)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--sp-2)" }}>
              <strong style={{ fontSize: "var(--text-sm)" }}>Reminder preview ({reminderPreview.missing_count} missing)</strong>
              <button className="btn btn-ghost btn-sm" onClick={() => setReminderPreview(null)}>×</button>
            </div>
            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: "var(--text-xs)" }}>{reminderPreview.subject}</div>
            <pre style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", whiteSpace: "pre-wrap", margin: 0 }}>{reminderPreview.body}</pre>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--hairline)", marginBottom: "var(--sp-5)", overflowX: "auto" }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                if (t.key === "risks") loadRisks();
                if (t.key === "audit") loadAudit();
              }}
              className="btn btn-ghost btn-sm"
              style={{
                borderRadius: 0,
                fontWeight: tab === t.key ? 600 : 400,
                borderBottom: tab === t.key ? "2px solid var(--sage-600)" : "2px solid transparent",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────── */}
        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "var(--sp-6)", alignItems: "start" }}>
            {/* Readiness ring */}
            <div className="card" style={{ padding: "var(--sp-5)", textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-block", marginBottom: "var(--sp-3)" }}>
                <ReadinessRing score={engagement.readiness_score} />
                <div style={{
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                  fontSize: "var(--text-sm)", fontWeight: 700,
                  color: engagement.readiness_score >= 85 ? "var(--sage-600)" : engagement.readiness_score >= 50 ? "oklch(0.62 0.13 50)" : "var(--danger)",
                }}>
                  {engagement.readiness_score}%
                </div>
              </div>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink)", marginBottom: "var(--sp-2)" }}>Readiness</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>Status: {engagement.status}</div>
              {readiness && (
                <div style={{ marginTop: "var(--sp-3)", textAlign: "start", fontSize: "var(--text-xs)" }}>
                  <div style={{ color: "var(--ink-3)", marginBottom: "var(--sp-2)" }}>
                    <strong>Blocking:</strong>
                    {readiness.blocking_reasons.length === 0 ? " None" : (
                      <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                        {readiness.blocking_reasons.map((r, i) => <li key={i} style={{ color: "var(--danger)" }}>{r}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, margin: 0 }}>Next actions</h3>
                <span className="pill pill-accent" style={{ fontSize: "var(--text-2xs)" }}>{actions.filter(a => a.status === "open").length} open</span>
              </div>
              {actions.length === 0 ? (
                <div className="card" style={{ padding: "var(--sp-4)", textAlign: "center", color: "var(--ink-3)", fontSize: "var(--text-sm)" }}>
                  No actions — click "Generate actions" to analyse the engagement
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                  {actions.filter(a => a.status === "open").slice(0, 8).map(action => (
                    <div key={action.id} className="card" style={{ padding: "var(--sp-3)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--sp-3)", borderInlineStart: `3px solid ${action.priority === "high" ? "var(--danger)" : action.priority === "medium" ? "oklch(0.62 0.13 50)" : "var(--sage-600)"}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--ink)", marginBottom: 4 }}>{action.title}</div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>{action.body}</div>
                      </div>
                      <div style={{ display: "flex", gap: "var(--sp-1)", flexShrink: 0 }}>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: "var(--text-2xs)", padding: "2px 8px" }} onClick={() => handleActionStatus(action.id, "done")}>✓ Done</button>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: "var(--text-2xs)", padding: "2px 8px", color: "var(--ink-4)" }} onClick={() => handleActionStatus(action.id, "dismissed")}>Dismiss</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CHECKLIST ─────────────────────────────────────── */}
        {tab === "checklist" && (
          <div>
            {checklist.length === 0 ? (
              <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--ink-3)" }}>No checklist items</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                {checklist.map(item => (
                  <div key={item.id} className="card" style={{ padding: "var(--sp-3)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--sp-3)" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: item.required ? 600 : 400, fontSize: "var(--text-sm)", color: "var(--ink)" }}>
                        {item.required && <span style={{ color: "var(--danger)", marginInlineEnd: 4 }}>*</span>}
                        {item.title}
                      </div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>{item.description}</div>
                      <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: 4 }}>
                        <span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{item.category}</span>
                        <span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{item.priority}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
                      <span style={{ fontSize: "var(--text-xs)", color: CHECKLIST_STATUS_COLOR[item.status] }}>{item.status}</span>
                      <select
                        value={item.status}
                        onChange={e => handleChecklistStatus(item.id, e.target.value as ChecklistItem["status"])}
                        className="tw-input"
                        style={{ fontSize: 12, padding: "2px 6px", height: 28 }}
                      >
                        {["todo","waiting_client","uploaded","needs_review","accepted","rejected","waived"].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTS ─────────────────────────────────────── */}
        {tab === "documents" && (
          <div>
            <div style={{ marginBottom: "var(--sp-4)", display: "flex", gap: "var(--sp-3)", alignItems: "center" }}>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.csv,.xlsx" style={{ display: "none" }} onChange={handleFileUpload} />
              <button className="btn btn-accent btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload document"}
              </button>
              {uploadError && <span style={{ color: "var(--danger)", fontSize: "var(--text-xs)" }}>{uploadError}</span>}
            </div>

            {documents.length === 0 ? (
              <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--ink-3)" }}>No documents uploaded</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                {documents.map(doc => (
                  <div key={doc.id} className="card" style={{ padding: "var(--sp-3)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--sp-3)" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--ink)" }}>{doc.original_filename}</div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 2 }}>
                          {doc.document_type} · {(doc.file_size / 1024).toFixed(0)} KB · {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                        {doc.extracted_json && (
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 4 }}>
                            Confidence: {((doc.confidence_score || 0) * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
                        <span style={{ fontSize: "var(--text-xs)", color: doc.processing_status === "approved" ? "var(--sage-600)" : doc.processing_status === "rejected" ? "var(--danger)" : "oklch(0.62 0.13 50)" }}>
                          {doc.processing_status}
                        </span>
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: "var(--text-2xs)" }}>View</a>
                        )}
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--sage-600)", fontSize: "var(--text-2xs)" }} onClick={() => handleReviewDoc(doc.id, "approved")}>Approve</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", fontSize: "var(--text-2xs)" }} onClick={() => handleReviewDoc(doc.id, "rejected")}>Reject</button>
                      </div>
                    </div>
                    {doc.extracted_json && (
                      <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-2)", background: "var(--paper-3)", borderRadius: "var(--r-sm)", fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
                        <strong>Extracted:</strong>{" "}
                        {Object.entries(doc.extracted_json).filter(([k, v]) => v && k !== "issues").map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── INCOME ─────────────────────────────────────────── */}
        {tab === "income" && (
          <div>
            {income.length === 0 ? (
              <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--ink-3)" }}>No extracted income rows</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--hairline)" }}>
                      {["Type", "Description", "Gross", "Tax withheld", "Status", ""].map(h => (
                        <th key={h} style={{ padding: "var(--sp-2) var(--sp-3)", fontWeight: 600, color: "var(--ink-3)", fontSize: "var(--text-xs)", textAlign: "start" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {income.map(inc => (
                      <tr key={inc.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)" }}><span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{inc.income_type}</span></td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", color: "var(--ink-3)" }}>{inc.description}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", fontWeight: 600 }}>€{parseFloat(inc.gross_amount).toLocaleString()}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", color: "var(--ink-3)" }}>{inc.tax_withheld ? `€${parseFloat(inc.tax_withheld).toLocaleString()}` : "—"}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)" }}>
                          <span style={{ fontSize: "var(--text-xs)", color: REVIEW_STATUS_COLOR[inc.review_status] }}>{inc.review_status}</span>
                        </td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)" }}>
                          {inc.review_status === "candidate" && (
                            <div style={{ display: "flex", gap: "var(--sp-1)" }}>
                              <button className="btn btn-ghost btn-sm" style={{ color: "var(--sage-600)", fontSize: "var(--text-2xs)" }} onClick={() => handleApproveIncome(inc.id, "approved")}>Approve</button>
                              <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", fontSize: "var(--text-2xs)" }} onClick={() => handleApproveIncome(inc.id, "rejected")}>Reject</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── EXPENSES ─────────────────────────────────────────── */}
        {tab === "expenses" && (
          <div>
            {expenses.length === 0 ? (
              <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--ink-3)" }}>No extracted expense rows</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--hairline)" }}>
                      {["Category", "Supplier", "Gross", "VAT", "Status", ""].map(h => (
                        <th key={h} style={{ padding: "var(--sp-2) var(--sp-3)", fontWeight: 600, color: "var(--ink-3)", fontSize: "var(--text-xs)", textAlign: "start" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(exp => (
                      <tr key={exp.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)" }}><span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{exp.expense_category}</span></td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", color: "var(--ink-3)" }}>{exp.supplier_name || "—"}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", fontWeight: 600 }}>€{parseFloat(exp.amount_gross).toLocaleString()}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", color: "var(--ink-3)" }}>{exp.vat_amount ? `€${parseFloat(exp.vat_amount).toLocaleString()}` : "—"}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)" }}>
                          <span style={{ fontSize: "var(--text-xs)", color: REVIEW_STATUS_COLOR[exp.review_status] }}>{exp.review_status}</span>
                        </td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)" }}>
                          {exp.review_status === "candidate" && (
                            <div style={{ display: "flex", gap: "var(--sp-1)" }}>
                              <button className="btn btn-ghost btn-sm" style={{ color: "var(--sage-600)", fontSize: "var(--text-2xs)" }} onClick={() => handleApproveExpense(exp.id, "approved")}>Approve</button>
                              <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", fontSize: "var(--text-2xs)" }} onClick={() => handleApproveExpense(exp.id, "rejected")}>Reject</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── RISKS ─────────────────────────────────────────── */}
        {tab === "risks" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-5)" }}>
            <div>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, marginBottom: "var(--sp-3)" }}>Deduction opportunities</h3>
              {(!risks || (risks.opportunities as unknown[]).length === 0) ? (
                <div className="card" style={{ padding: "var(--sp-4)", textAlign: "center", color: "var(--ink-3)" }}>Loading...</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                  {(risks.opportunities as Array<{ id: string; title: string; description: string; confidence?: string; rule_id?: string; source_url?: string }>).map(opp => (
                    <div key={opp.id} className="card" style={{ padding: "var(--sp-3)", borderInlineStart: `3px solid ${opp.confidence === "likely" ? "var(--sage-600)" : opp.confidence === "needs_confirmation" ? "oklch(0.62 0.13 50)" : "var(--ink-4)"}` }}>
                      <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{opp.title}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 4 }}>{opp.description}</div>
                      <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)", alignItems: "center" }}>
                        <span className="pill" style={{ fontSize: "var(--text-2xs)", background: opp.confidence === "likely" ? "var(--accent-soft)" : "var(--paper-3)" }}>{opp.confidence || "—"}</span>
                        {opp.source_url && <a href={opp.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "var(--text-2xs)", color: "var(--sage-600)" }}>Source ↗</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, marginBottom: "var(--sp-3)" }}>Risk warnings</h3>
              {(!risks || (risks.risks as unknown[]).length === 0) ? (
                <div className="card" style={{ padding: "var(--sp-4)", textAlign: "center", color: "var(--ink-3)" }}>No risks detected</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                  {(risks.risks as Array<{ id: string; title: string; description: string; level?: string; source_url?: string }>).map(risk => (
                    <div key={risk.id} className="card" style={{ padding: "var(--sp-3)", borderInlineStart: `3px solid ${risk.level === "needs_accountant_review" ? "var(--danger)" : "oklch(0.62 0.13 50)"}` }}>
                      <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{risk.title}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 4 }}>{risk.description}</div>
                      <div style={{ marginTop: "var(--sp-2)" }}>
                        <span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{risk.level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AUDIT ─────────────────────────────────────────── */}
        {tab === "audit" && (
          <div>
            {auditLog.length === 0 ? (
              <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--ink-3)" }}>No audit events</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                {auditLog.map(log => (
                  <div key={log.id} style={{ display: "flex", gap: "var(--sp-3)", padding: "var(--sp-2) 0", borderBottom: "1px solid var(--hairline)", fontSize: "var(--text-xs)" }}>
                    <span style={{ color: "var(--ink-4)", flexShrink: 0, width: 160 }}>{new Date(log.created_at).toLocaleString()}</span>
                    <span style={{ color: "var(--ink-3)", flexShrink: 0 }}>{log.actor_email || "system"}</span>
                    <span style={{ color: "var(--ink)", fontWeight: 500 }}>{log.action}</span>
                    <span style={{ color: "var(--ink-4)" }}>{log.entity_type} #{log.entity_id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
