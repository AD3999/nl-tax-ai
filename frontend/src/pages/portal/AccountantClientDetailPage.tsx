import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useMobile } from "../../hooks/useMobile";
import { Trash2 } from "lucide-react";
import {
  fetchClient, updateClient, fetchEngagements, createEngagement, archiveClient,
  disconnectClient, reactivateClient, deleteEngagement,
} from "../../api/portal/client";
import type { ClientProfile, TaxEngagement } from "../../api/portal/types";
import { ENGAGEMENT_TYPE_LABELS } from "../../lib/engagementTypes";

const STATUS_COLOR: Record<string, string> = {
  draft: "var(--ink-4)", collecting: "var(--sage-600)",
  waiting_client: "var(--warn)", needs_review: "var(--warn)",
  ready_to_file: "var(--sage-600)", filed: "var(--sage-600)",
  completed: "var(--sage-600)", blocked: "var(--danger)",
};

export default function AccountantClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isMobile = useMobile();

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [engagements, setEngagements] = useState<TaxEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEng, setShowNewEng] = useState(false);
  const [engForm, setEngForm] = useState({ tax_year: 2026, engagement_type: "income_tax" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !id) return;
    load();
  }, [user, id]);

  async function load() {
    setLoading(true);
    try {
      const [p, engs] = await Promise.all([
        fetchClient(Number(id)),
        fetchEngagements(),
      ]);
      setProfile(p);
      setEngagements(engs.filter(e => e.client_profile === Number(id)));
    } catch {
      setError("Failed to load client");
    }
    setLoading(false);
  }

  async function handleStatusChange(newStatus: string) {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await updateClient(profile.id, { status: newStatus as ClientProfile["status"] });
      setProfile(updated);
    } catch {
      setError("Failed to update status");
    }
    setSaving(false);
  }

  async function handleDeleteClient() {
    if (!profile) return;
    if (!window.confirm(`Permanently delete ${profile.display_name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await archiveClient(profile.id);
      showToast("Client permanently removed.", "info");
      navigate("/accountant/portal");
    } catch {
      showToast("Failed to remove client.", "error");
    }
    setDeleting(false);
  }

  async function handleDisconnect() {
    if (!profile) return;
    if (!window.confirm(
      `Disconnect ${profile.display_name}? Their data will be kept for 30 days and can be restored.`
    )) return;
    setDisconnecting(true);
    try {
      const updated = await disconnectClient(profile.id);
      setProfile(updated);
      showToast("Client disconnected. Data retained for 30 days.", "info");
    } catch {
      showToast("Failed to disconnect client.", "error");
    }
    setDisconnecting(false);
  }

  async function handleReactivate() {
    if (!profile) return;
    setReactivating(true);
    try {
      const updated = await reactivateClient(profile.id);
      setProfile(updated);
      showToast("Client reactivated successfully.", "success");
    } catch {
      showToast("Failed to reactivate client.", "error");
    }
    setReactivating(false);
  }

  async function handleCreateEngagement(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError("");
    try {
      const eng = await createEngagement({ ...engForm, client_profile: profile.id });
      setEngagements(prev => [eng, ...prev]);
      setShowNewEng(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating engagement");
    }
    setSaving(false);
  }

  if (loading) return (
    <main style={{ flex: 1, padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-4)" }}>Loading...</main>
  );

  if (!profile) return (
    <main style={{ flex: 1, padding: "var(--sp-8)", textAlign: "center" }}>
      <p style={{ color: "var(--ink-3)" }}>Client not found</p>
      <Link to="/accountant/portal" className="btn btn-ghost btn-sm" style={{ marginTop: 16 }}>← Back</Link>
    </main>
  );

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "var(--sp-8) var(--sp-6)" }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: "var(--sp-5)", fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>
          <Link to="/accountant/portal" style={{ color: "var(--ink-4)", textDecoration: "none" }}>Accountant Portal</Link>
          <span style={{ margin: "0 var(--sp-2)" }}>›</span>
          <span style={{ color: "var(--ink)" }}>{profile.display_name}</span>
        </div>

        {profile.status === "deactivated" && (
          <div className="card" style={{ padding: "var(--sp-4)", background: "var(--warn-subtle, #fff8e1)", border: "1px solid var(--warn)", color: "var(--warn-text, #7a5a00)", marginBottom: "var(--sp-4)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--sp-3)", flexWrap: "wrap" }}>
            <div>
              <strong>Client disconnected</strong>
              {profile.days_until_deletion !== null && (
                <span style={{ marginLeft: 8, fontSize: "var(--text-xs)" }}>
                  — data will be permanently deleted in <strong>{profile.days_until_deletion}</strong> day{profile.days_until_deletion !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <button className="btn btn-accent btn-sm" onClick={handleReactivate} disabled={reactivating}>
              {reactivating ? "Restoring…" : "Reactivate client"}
            </button>
          </div>
        )}

        {error && (
          <div className="card" style={{ padding: "var(--sp-3)", background: "var(--danger-subtle)", color: "var(--danger-text)", marginBottom: "var(--sp-4)", fontSize: "var(--text-sm)" }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr", gap: "var(--sp-6)", alignItems: "start" }}>

          {/* Left: profile card */}
          <div className="card" style={{ padding: "var(--sp-5)" }}>
            <div style={{ marginBottom: "var(--sp-4)" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "var(--sp-3)", fontSize: "var(--text-2xl)", fontFamily: "var(--serif)", color: "var(--sage-600)" }}>
                {(profile.first_name?.[0] || profile.email[0]).toUpperCase()}
              </div>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-2xl)", fontWeight: 400, color: "var(--ink)", margin: 0 }}>{profile.display_name}</h2>
              <p style={{ color: "var(--ink-4)", fontSize: "var(--text-xs)", marginTop: 4 }}>{profile.email}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)", fontSize: "var(--text-xs)" }}>
              {[
                ["Type", profile.client_type.toUpperCase()],
                ["Language", profile.preferred_language.toUpperCase()],
                ["Tax year", String(profile.tax_year)],
                ["Phone", profile.phone || "—"],
                ["Company", profile.company_name || "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "var(--sp-2) 0", borderBottom: "1px solid var(--hairline)" }}>
                  <span style={{ color: "var(--ink-3)" }}>{k}</span>
                  <span style={{ color: "var(--ink)", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "var(--sp-4)" }}>
              <label className="tw-label">Status</label>
              <select
                className="tw-input"
                style={{ width: "100%", fontSize: 14 }}
                value={profile.status}
                onChange={e => handleStatusChange(e.target.value)}
                disabled={saving || profile.status === "deactivated"}
              >
                {["invited","active","collecting","in_review","ready","completed","archived"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
                {profile.status === "deactivated" && <option value="deactivated">deactivated</option>}
              </select>
            </div>

            {profile.notes && (
              <div style={{ marginTop: "var(--sp-4)", padding: "var(--sp-3)", background: "var(--paper-3)", borderRadius: "var(--r-sm)", fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
                {profile.notes}
              </div>
            )}

            <div style={{ marginTop: "var(--sp-4)", display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
              <Link to="/accountant/portal" className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center" }}>← Back to portal</Link>
              {profile.status !== "deactivated" ? (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: "100%", justifyContent: "center", color: "var(--warn-text, #7a5a00)" }}
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? "Disconnecting…" : "Disconnect client"}
                </button>
              ) : (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: "100%", justifyContent: "center", color: "var(--danger)" }}
                  onClick={handleDeleteClient}
                  disabled={deleting}
                >
                  {deleting ? "Deleting…" : "Delete permanently"}
                </button>
              )}
            </div>
          </div>

          {/* Right: engagements */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-2xl)", fontWeight: 400, color: "var(--ink)", margin: 0 }}>
                Tax Engagements
              </h3>
              <button className="btn btn-accent btn-sm" onClick={() => setShowNewEng(s => !s)}>+ New engagement</button>
            </div>

            {showNewEng && (
              <div className="card" style={{ padding: "var(--sp-4)", marginBottom: "var(--sp-4)" }}>
                <form onSubmit={handleCreateEngagement} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr auto", gap: "var(--sp-3)", alignItems: "end" }}>
                  <div>
                    <label className="tw-label">Tax year</label>
                    <select className="tw-input" style={{ width: "100%", fontSize: 14 }} value={engForm.tax_year} onChange={e => setEngForm(f => ({ ...f, tax_year: Number(e.target.value) }))}>
                      {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="tw-label">Type</label>
                    <select className="tw-input" style={{ width: "100%", fontSize: 14 }} value={engForm.engagement_type} onChange={e => setEngForm(f => ({ ...f, engagement_type: e.target.value }))}>
                      {Object.entries(ENGAGEMENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                    <button type="submit" className="btn btn-accent btn-sm" disabled={saving}>{saving ? "..." : "Create"}</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowNewEng(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {engagements.length === 0 ? (
              <div className="card" style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-3)", fontSize: "var(--text-sm)" }}>
                No engagements yet — create the first one above
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                {engagements.map(eng => (
                  <div key={eng.id} className="card" style={{ padding: "var(--sp-4)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "var(--text-sm)" }}>
                        {eng.tax_year} — {ENGAGEMENT_TYPE_LABELS[eng.engagement_type] ?? eng.engagement_type}
                      </div>
                      <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-1)", fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
                        <span style={{ color: STATUS_COLOR[eng.status] }}>{eng.status}</span>
                        <span>Readiness: <strong>{eng.readiness_score}%</strong></span>
                        <span style={{ color: eng.missing_items_count > 0 ? "var(--danger)" : "var(--sage-600)" }}>
                          {eng.missing_items_count} missing
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
                      {eng.status === "draft" && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--danger)", padding: "4px 6px" }}
                          title="Delete draft engagement"
                          onClick={async () => {
                            if (!window.confirm("Delete this draft engagement? This cannot be undone.")) return;
                            try {
                              await deleteEngagement(eng.id);
                              setEngagements(prev => prev.filter(e => e.id !== eng.id));
                              showToast("Engagement deleted.", "info");
                            } catch {
                              showToast("Failed to delete engagement.", "error");
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <Link to={`/accountant/engagements/${eng.id}`} className="btn btn-accent btn-sm">Open →</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
