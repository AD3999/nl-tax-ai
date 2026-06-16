import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RuleStatusBadge } from "@/components/admin/RuleStatusBadge";
import {
  Button, Input, Textarea, Select, Card, CardHeader, CardBody, CardTitle,
  Badge, Alert, Spinner,
} from "@/components/ui/index";
import { taxRuleSchema, type TaxRuleFormValues } from "@/lib/tax-rules/schema";
import { getRuleById, createRule, updateRule } from "@/lib/tax-rules/api";
import { getAuditLog } from "@/lib/tax-rules/audit";
import type { TaxRule, AuditEntry } from "@/lib/tax-rules/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ChevronLeft, Save, ExternalLink, Clock, AlertTriangle } from "lucide-react";

const TABS = [
  { id: "basic",       label: "Basic Info" },
  { id: "result",      label: "Result / Formula" },
  { id: "languages",   label: "Multilingual" },
  { id: "ai",          label: "AI & RAG" },
  { id: "source",      label: "Source & Verification" },
  { id: "audit",       label: "Audit History" },
] as const;
type TabId = typeof TABS[number]["id"];

const USER_TYPE_OPTS = ["zzp", "employee", "expat", "dga", "accountant", "all"] as const;
const CATEGORY_OPTS = ["bracket","deduction","credit","contribution","exemption","rate","deadline","compliance","detection","benefit"] as const;
const RESULT_TYPE_OPTS = ["fixed_amount","percentage","bracket","formula","cap","threshold","phase_out","boolean","date"] as const;
const STATUS_OPTS = ["draft","pending_review","verified","expired"] as const;

function buildDefaultValues(rule?: TaxRule): TaxRuleFormValues {
  if (rule) return { ...rule };
  const y = new Date().getFullYear();
  return {
    id: "",
    year: y,
    topic: "",
    category: "deduction",
    user_types: ["zzp"],
    condition: {},
    result: { type: "fixed_amount" },
    plain_nl: "",
    plain_en: "",
    plain_fa: "",
    source_url: "",
    verification_status: "draft",
    effective_from: `${y}-01-01`,
    effective_until: null,
    ai_prompt_hint: "",
    tags: [],
    supersedes: undefined,
  };
}

export default function AdminRuleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new" || !id;

  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [tagsInput, setTagsInput] = useState("");

  // Impact analysis — spec: "admin impact analysis and verification workflow support"
  const [impact, setImpact] = useState<{
    affected_users_estimate: number;
    total_users_with_profile: number;
    affected_user_types: string[];
    last_updated: string;
    updated_by: string;
    verification_status: string;
    recommended_action: string;
  } | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<TaxRuleFormValues>({
    resolver: zodResolver(taxRuleSchema),
    defaultValues: buildDefaultValues(),
  });

  const watchedUserTypes = watch("user_types");
  const watchedResultType = watch("result.type");
  const watchedTags = watch("tags");

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    getRuleById(id!).then(rule => {
      if (!rule) { setNotFound(true); setLoading(false); return; }
      reset(buildDefaultValues(rule));
      setTagsInput(rule.tags.join(", "));
      setLoading(false);
      return getAuditLog(id!);
    }).then(log => {
      if (log) setAuditLog(log);
    }).catch(() => setLoading(false));
  }, [id, isNew, reset]);

  function toggleUserType(ut: string) {
    const current = watchedUserTypes ?? [];
    const next = current.includes(ut as never)
      ? current.filter(x => x !== ut)
      : [...current, ut as never];
    setValue("user_types", next as TaxRuleFormValues["user_types"], { shouldDirty: true });
  }

  function handleTagsBlur() {
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    setValue("tags", tags, { shouldDirty: true });
  }

  function fetchImpact(ruleId: string) {
    setImpactLoading(true);
    const token = localStorage.getItem("access_token") ?? "";
    fetch(`/api/tax/rules/${ruleId}/impact/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setImpact(data); })
      .catch(() => null)
      .finally(() => setImpactLoading(false));
  }

  // Load impact on mount for existing rules
  useEffect(() => {
    if (!isNew && id) fetchImpact(id);
  }, [id, isNew]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: TaxRuleFormValues) => {
    setSaving(true);
    setServerError(null);
    try {
      if (isNew) {
        const created = await createRule(data);
        setSuccessMsg(`Rule ${created.id} created successfully`);
        setTimeout(() => navigate(`/admin/rules/${created.id}`), 1200);
      } else {
        const updated = await updateRule(id!, data);
        reset(buildDefaultValues(updated));
        setTagsInput(updated.tags.join(", "));
        setSuccessMsg("Rule saved successfully");
        setTimeout(() => setSuccessMsg(null), 3000);
        const log = await getAuditLog(id!);
        setAuditLog(log);
        // Refresh impact analysis after save
        fetchImpact(id!);
      }
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title={isNew ? "New Rule" : "Edit Rule"}>
        <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8" /></div>
      </AdminLayout>
    );
  }

  if (notFound) {
    return (
      <AdminLayout title="Rule Not Found">
        <Alert variant="error">Rule <code>{id}</code> was not found.</Alert>
        <Link to="/admin/rules" className="mt-4 inline-block">
          <Button variant="outline" size="sm">← Back to Rules</Button>
        </Link>
      </AdminLayout>
    );
  }

  const subtitle = isNew ? "Create a new tax rule" : `Editing rule ${id}`;

  return (
    <AdminLayout title={isNew ? "New Tax Rule" : `Edit: ${id}`} subtitle={subtitle}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <Link to="/admin/rules">
            <Button variant="ghost" size="sm" type="button" className="gap-1.5">
              <ChevronLeft className="w-3.5 h-3.5" /> Rules
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {successMsg && <Alert variant="success" className="py-1 px-3 text-xs">{successMsg}</Alert>}
            {serverError && <Alert variant="error" className="py-1 px-3 text-xs">{serverError}</Alert>}
            {isDirty && !successMsg && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Unsaved changes
              </span>
            )}
            <Button type="submit" size="sm" className="gap-1.5" disabled={saving}>
              {saving ? <Spinner className="h-3.5 w-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {isNew ? "Create Rule" : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-200 mb-5 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
              )}
            >
              {tab.label}
              {tab.id === "audit" && auditLog.length > 0 && (
                <Badge variant="gray" className="ml-1.5 text-[10px]">{auditLog.length}</Badge>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab: Basic Info ──────────────────────────────────────────────── */}
        {activeTab === "basic" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader><CardTitle>Identity</CardTitle></CardHeader>
              <CardBody className="space-y-4">
                <Input
                  id="id"
                  label="Rule ID"
                  placeholder="ZA-2026-001"
                  helper="Format: TOPIC-YEAR-SEQ (e.g. ZA-2026-001)"
                  error={errors.id?.message}
                  disabled={!isNew}
                  {...register("id")}
                />
                <Input
                  id="year"
                  label="Year"
                  type="number"
                  min={2020}
                  max={2030}
                  error={errors.year?.message}
                  {...register("year", { valueAsNumber: true })}
                />
                <Input
                  id="topic"
                  label="Topic slug"
                  placeholder="zelfstandigenaftrek"
                  helper="Lowercase, underscores. Used in search + AI context."
                  error={errors.topic?.message}
                  {...register("topic")}
                />
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="category"
                      label="Category"
                      options={CATEGORY_OPTS.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
                      error={errors.category?.message}
                      {...field}
                    />
                  )}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>User Types</CardTitle></CardHeader>
              <CardBody>
                <p className="text-xs text-gray-500 mb-3">Select all user types this rule applies to.</p>
                <div className="flex flex-wrap gap-2">
                  {USER_TYPE_OPTS.map(ut => {
                    const active = (watchedUserTypes ?? []).includes(ut as never);
                    return (
                      <button
                        key={ut}
                        type="button"
                        onClick={() => toggleUserType(ut)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                          active
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-300 hover:border-blue-400",
                        )}
                      >
                        {ut.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
                {errors.user_types && (
                  <p className="text-xs text-red-600 mt-2">{errors.user_types.message}</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>Effective Dates</CardTitle></CardHeader>
              <CardBody className="space-y-4">
                <Input
                  id="effective_from"
                  label="Effective from"
                  type="date"
                  error={errors.effective_from?.message}
                  {...register("effective_from")}
                />
                <Input
                  id="effective_until"
                  label="Effective until (leave empty = no expiry)"
                  type="date"
                  error={errors.effective_until?.message}
                  {...register("effective_until")}
                />
                <Input
                  id="supersedes"
                  label="Supersedes (optional)"
                  placeholder="ZA-2025-001"
                  helper="Rule ID that this rule replaces"
                  {...register("supersedes")}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
              <CardBody>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    onBlur={handleTagsBlur}
                    placeholder="box1, bracket, income_tax"
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">Press tab or click away to apply.</p>
                </div>
                {(watchedTags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(watchedTags ?? []).map(tag => (
                      <Badge key={tag} variant="gray" className="text-[11px]">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {/* ── Tab: Result / Formula ────────────────────────────────────────── */}
        {activeTab === "result" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader><CardTitle>Result Type &amp; Value</CardTitle></CardHeader>
              <CardBody className="space-y-4">
                <Controller
                  name="result.type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="result-type"
                      label="Result type"
                      options={RESULT_TYPE_OPTS.map(t => ({ value: t, label: t.replace(/_/g, " ") }))}
                      error={errors.result?.type?.message}
                      {...field}
                    />
                  )}
                />
                {(watchedResultType === "fixed_amount" || watchedResultType === "percentage" || watchedResultType === "cap" || watchedResultType === "threshold") && (
                  <Input
                    id="result-value"
                    label="Value"
                    type="number"
                    step="0.01"
                    error={errors.result?.value?.message}
                    {...register("result.value", { valueAsNumber: true })}
                  />
                )}
                <Controller
                  name="result.unit"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="result-unit"
                      label="Unit"
                      options={[
                        { value: "", label: "— none —" },
                        { value: "eur", label: "EUR (€)" },
                        { value: "pct", label: "Percentage (%)" },
                        { value: "hours", label: "Hours" },
                        { value: "date", label: "Date" },
                        { value: "string", label: "String" },
                      ]}
                      value={field.value ?? ""}
                      onChange={e => field.onChange(e.target.value || undefined)}
                    />
                  )}
                />
                <Textarea
                  id="result-formula"
                  label="Formula (optional)"
                  placeholder="profit * 0.127"
                  helper="Mathematical expression. Used for documentation and future calculator."
                  rows={2}
                  {...register("result.formula")}
                />
                <Textarea
                  id="result-notes"
                  label="Notes"
                  placeholder="Additional notes about this result..."
                  {...register("result.notes")}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>Phase-out (optional)</CardTitle></CardHeader>
              <CardBody className="space-y-4">
                <p className="text-xs text-gray-500">Fill in if this rule phases out (e.g. heffingskorting).</p>
                <Input
                  id="po-start"
                  label="Phase-out starts at income (€)"
                  type="number"
                  {...register("result.phase_out.income_start", { valueAsNumber: true })}
                />
                <Input
                  id="po-end"
                  label="Phase-out ends at income (€)"
                  type="number"
                  {...register("result.phase_out.income_end", { valueAsNumber: true })}
                />
                <Input
                  id="po-max"
                  label="Maximum credit/deduction (€)"
                  type="number"
                  {...register("result.phase_out.max_credit", { valueAsNumber: true })}
                />
                <Input
                  id="po-rate"
                  label="Reduction per €1 of income"
                  type="number"
                  step="0.0001"
                  {...register("result.phase_out.reduction_per_euro", { valueAsNumber: true })}
                />
              </CardBody>
            </Card>
          </div>
        )}

        {/* ── Tab: Multilingual ────────────────────────────────────────────── */}
        {activeTab === "languages" && (
          <div className="grid grid-cols-1 gap-5">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Dutch (NL)</CardTitle>
                  <Badge variant="info">Required</Badge>
                </div>
              </CardHeader>
              <CardBody>
                <Textarea
                  id="plain_nl"
                  label="Dutch explanation"
                  rows={3}
                  placeholder="De zelfstandigenaftrek is €1.200 in 2026..."
                  error={errors.plain_nl?.message}
                  {...register("plain_nl")}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>English (EN)</CardTitle>
                  <Badge variant="info">Required</Badge>
                </div>
              </CardHeader>
              <CardBody>
                <Textarea
                  id="plain_en"
                  label="English explanation"
                  rows={3}
                  placeholder="The self-employed deduction is €1,200 in 2026..."
                  error={errors.plain_en?.message}
                  {...register("plain_en")}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Persian (FA)</CardTitle>
                  <Badge variant="info">Required — first-class language</Badge>
                </div>
              </CardHeader>
              <CardBody>
                <Textarea
                  id="plain_fa"
                  label="Persian explanation"
                  rows={3}
                  placeholder="کسر خود اشتغالی در سال ۲۰۲۶..."
                  error={errors.plain_fa?.message}
                  rtl
                  {...register("plain_fa")}
                />
              </CardBody>
            </Card>
          </div>
        )}

        {/* ── Tab: AI & RAG ─────────────────────────────────────────────────── */}
        {activeTab === "ai" && (
          <div className="grid grid-cols-1 gap-5">
            <Card>
              <CardHeader><CardTitle>AI Prompt Hint</CardTitle></CardHeader>
              <CardBody>
                <Textarea
                  id="ai_prompt_hint"
                  label="AI instruction injected into RAG context"
                  rows={3}
                  placeholder="Always check urencriterium (1225 hrs) before applying this deduction."
                  helper="This text appears as 'AI INSTRUCTION: …' in the assembled context block. Keep it concise and directive."
                  error={errors.ai_prompt_hint?.message}
                  {...register("ai_prompt_hint")}
                />
                <Alert variant="info" className="mt-3 text-xs">
                  This hint is embedded alongside the rule text and retrieved together. It tells the AI model what to do or check when this rule is retrieved.
                </Alert>
              </CardBody>
            </Card>
          </div>
        )}

        {/* ── Tab: Source & Verification ───────────────────────────────────── */}
        {activeTab === "source" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader><CardTitle>Source</CardTitle></CardHeader>
              <CardBody className="space-y-4">
                <div className="flex flex-col gap-1">
                  <Input
                    id="source_url"
                    label="Source URL"
                    type="url"
                    placeholder="https://www.belastingdienst.nl/..."
                    helper="Official Belastingdienst or law.nl URL. Required for verified rules."
                    error={errors.source_url?.message}
                    {...register("source_url")}
                  />
                  {watch("source_url") && (
                    <a
                      href={watch("source_url")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Open source
                    </a>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>Verification Status</CardTitle></CardHeader>
              <CardBody className="space-y-4">
                <div className="flex flex-col gap-3">
                  {STATUS_OPTS.map(s => {
                    const current = watch("verification_status");
                    return (
                      <label
                        key={s}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors",
                          current === s ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300",
                        )}
                      >
                        <input
                          type="radio"
                          value={s}
                          {...register("verification_status")}
                          className="h-4 w-4 text-blue-600"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800 capitalize">{s.replace(/_/g, " ")}</p>
                          {s === "verified" && <p className="text-xs text-gray-500">Ready for production. Requires source URL + all 3 translations.</p>}
                          {s === "pending_review" && <p className="text-xs text-gray-500">Content complete, awaiting manual review.</p>}
                          {s === "draft" && <p className="text-xs text-gray-500">Work in progress. Not served to users.</p>}
                          {s === "expired" && <p className="text-xs text-gray-500">No longer active. Kept for historical reference.</p>}
                        </div>
                        <div className="ml-auto">
                          <RuleStatusBadge status={s} />
                        </div>
                      </label>
                    );
                  })}
                </div>
                {errors.verification_status && (
                  <p className="text-xs text-red-600">{errors.verification_status.message}</p>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {/* ── Impact Analysis Panel — spec: "admin impact analysis and verification workflow" */}
        {!isNew && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Impact Analysis
                {impactLoading && <Spinner className="w-3 h-3 ml-1" />}
              </CardTitle>
            </CardHeader>
            <CardBody className="pt-0 pb-4">
              {!impact ? (
                <p className="text-xs text-gray-500">Loading impact data…</p>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-amber-100 text-center">
                      <div className="text-2xl font-semibold text-amber-700">{impact.affected_users_estimate}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Affected users</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-amber-100 text-center">
                      <div className="text-2xl font-semibold text-gray-700">{impact.total_users_with_profile}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Total with profile</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-amber-100 text-center">
                      <div className="text-sm font-semibold text-gray-700 leading-tight mt-1">
                        {impact.affected_user_types.join(", ")}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">User types</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-amber-100">
                    <div className="flex-1 text-xs text-gray-600">{impact.recommended_action}</div>
                    <Badge variant={impact.verification_status === "verified" ? "success" : "warning"} className="text-xs">
                      {impact.verification_status}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-400">
                    Last updated: {impact.last_updated} by {impact.updated_by}
                  </div>

                  {/* Verification workflow — promote from draft → pending_review → verified */}
                  {impact.verification_status !== "verified" && (
                    <div className="p-3 bg-white rounded-lg border border-amber-100">
                      <p className="text-xs font-medium text-gray-700 mb-2">Verification workflow</p>
                      <div className="flex items-center gap-1 text-xs">
                        <span className={`px-2 py-0.5 rounded-full ${impact.verification_status === "draft" ? "bg-gray-200 text-gray-700 font-semibold" : "bg-gray-100 text-gray-400"}`}>Draft</span>
                        <span className="text-gray-300">→</span>
                        <span className={`px-2 py-0.5 rounded-full ${impact.verification_status === "pending_review" ? "bg-amber-200 text-amber-800 font-semibold" : "bg-gray-100 text-gray-400"}`}>Pending review</span>
                        <span className="text-gray-300">→</span>
                        <span className={`px-2 py-0.5 rounded-full ${impact.verification_status === "verified" ? "bg-green-200 text-green-800 font-semibold" : "bg-gray-100 text-gray-400"}`}>Verified</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Set status to <strong>verified</strong> to make this rule live and notify affected users via their next alert refresh.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* ── Tab: Audit History ───────────────────────────────────────────── */}
        {activeTab === "audit" && (
          <Card>
            <CardHeader><CardTitle>Audit History</CardTitle></CardHeader>
            <CardBody className="p-0">
              {auditLog.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-gray-400">No audit entries yet.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {auditLog.map(entry => (
                    <div key={entry.id} className="px-6 py-4 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={
                              entry.action === "created" ? "success"
                              : entry.action === "deleted" ? "error"
                              : entry.action === "status_changed" ? "warning"
                              : "gray"
                            }
                            className="text-[11px] capitalize"
                          >
                            {entry.action}
                          </Badge>
                          <span className="text-xs text-gray-500">by {entry.changed_by}</span>
                          <span className="text-xs text-gray-400">{formatDate(entry.changed_at)}</span>
                        </div>
                        {entry.note && <p className="text-xs text-gray-600 mt-1">{entry.note}</p>}
                        {entry.before && entry.after && (
                          <div className="mt-1 text-xs text-gray-400 font-mono">
                            {Object.keys(entry.after).map(k => {
                              const bv = (entry.before as Record<string, unknown>)[k];
                              const av = (entry.after as Record<string, unknown>)[k];
                              if (bv === av) return null;
                              return (
                                <div key={k}>
                                  <span className="text-gray-500">{k}:</span>{" "}
                                  <span className="line-through text-red-400">{String(bv).slice(0, 40)}</span>
                                  {" → "}
                                  <span className="text-green-600">{String(av).slice(0, 40)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </form>
    </AdminLayout>
  );
}
