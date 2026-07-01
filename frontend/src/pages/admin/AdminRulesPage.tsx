import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RuleStatusBadge } from "@/components/admin/RuleStatusBadge";
import {
  Button, Badge, Select, Card, Spinner, Alert,
} from "@/components/ui/index";
import { getRules, duplicateRuleToYear, deleteRule } from "@/lib/tax-rules/api";
import { AVAILABLE_YEARS } from "@/lib/tax-rules/mock-data";
import type { TaxRule, RuleFilters, VerificationStatus, UserType, RuleCategory } from "@/lib/tax-rules/types";
import { formatDate } from "@/lib/utils";
import {
  Search, PlusCircle, Copy, Pencil, Trash2, ChevronUp, ChevronDown,
} from "lucide-react";

const USER_TYPE_OPTIONS = [
  { value: "all", label: "All user types" },
  { value: "zzp",       label: "ZZP (freelance)" },
  { value: "accountant",label: "Accountant" },
];

const STATUS_OPTIONS = [
  { value: "all",            label: "All statuses" },
  { value: "verified",       label: "Verified" },
  { value: "pending_review", label: "Pending review" },
  { value: "draft",          label: "Draft" },
  { value: "expired",        label: "Expired" },
];

const CATEGORY_OPTIONS = [
  { value: "all",         label: "All categories" },
  { value: "bracket",     label: "Bracket" },
  { value: "deduction",   label: "Deduction" },
  { value: "credit",      label: "Credit" },
  { value: "contribution",label: "Contribution" },
  { value: "exemption",   label: "Exemption" },
  { value: "rate",        label: "Rate" },
  { value: "deadline",    label: "Deadline" },
  { value: "compliance",  label: "Compliance" },
  { value: "detection",   label: "Detection" },
  { value: "benefit",     label: "Benefit" },
];

type SortField = "id" | "year" | "topic" | "updated_at" | "verification_status";
type SortDir = "asc" | "desc";

interface DuplicateDialog {
  ruleId: string;
  targetYear: number;
}

export default function AdminRulesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [rules, setRules] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [yearFilter, setYearFilter] = useState<string>(searchParams.get("year") ?? "all");
  const [userTypeFilter, setUserTypeFilter] = useState<string>(searchParams.get("user_type") ?? "all");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") ?? "all");
  const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.get("category") ?? "all");

  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [duplicateDialog, setDuplicateDialog] = useState<DuplicateDialog | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const yearOptions = [
    { value: "all", label: "All years" },
    ...AVAILABLE_YEARS.map(y => ({ value: String(y), label: String(y) })),
  ];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: RuleFilters = {
        search: search || undefined,
        year: yearFilter === "all" ? "all" : Number(yearFilter),
        user_type: userTypeFilter === "all" ? "all" : userTypeFilter as UserType,
        verification_status: statusFilter === "all" ? "all" : statusFilter as VerificationStatus,
        category: categoryFilter === "all" ? "all" : categoryFilter as RuleCategory,
      };
      const data = await getRules(filters);
      setRules(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load rules");
    } finally {
      setLoading(false);
    }
  }, [search, yearFilter, userTypeFilter, statusFilter, categoryFilter]);

  useEffect(() => { void load(); }, [load]);

  // Sync filters to URL params
  useEffect(() => {
    const p: Record<string, string> = {};
    if (search) p.search = search;
    if (yearFilter !== "all") p.year = yearFilter;
    if (userTypeFilter !== "all") p.user_type = userTypeFilter;
    if (statusFilter !== "all") p.status = statusFilter;
    if (categoryFilter !== "all") p.category = categoryFilter;
    setSearchParams(p, { replace: true });
  }, [search, yearFilter, userTypeFilter, statusFilter, categoryFilter, setSearchParams]);

  const sorted = [...rules].sort((a, b) => {
    let av: string = String(a[sortField] ?? "");
    let bv: string = String(b[sortField] ?? "");
    if (sortField === "year") { av = String(a.year); bv = String(b.year); }
    const cmp = av.localeCompare(bv, undefined, { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  async function handleDuplicate() {
    if (!duplicateDialog) return;
    setDuplicating(true);
    try {
      const created = await duplicateRuleToYear(duplicateDialog.ruleId, duplicateDialog.targetYear);
      setDuplicateDialog(null);
      setSuccessMsg(`Rule duplicated as ${created.id} (draft) — ready to edit`);
      setTimeout(() => setSuccessMsg(null), 5000);
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Duplicate failed");
    } finally {
      setDuplicating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteRule(id);
      setConfirmDelete(null);
      setSuccessMsg(`Rule ${id} deleted`);
      setTimeout(() => setSuccessMsg(null), 4000);
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 text-gray-300" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-blue-500" />
      : <ChevronDown className="w-3 h-3 text-blue-500" />;
  }

  const clearFilters = () => {
    setSearch("");
    setYearFilter("all");
    setUserTypeFilter("all");
    setStatusFilter("all");
    setCategoryFilter("all");
  };

  const hasActiveFilters = search || yearFilter !== "all" || userTypeFilter !== "all" || statusFilter !== "all" || categoryFilter !== "all";

  return (
    <AdminLayout title="Tax Rules" subtitle={`${sorted.length} rule${sorted.length !== 1 ? "s" : ""} shown`}>
      {/* Actions bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {successMsg && (
            <Alert variant="success" className="py-1.5 px-3 text-xs">{successMsg}</Alert>
          )}
          {error && (
            <Alert variant="error" className="py-1.5 px-3 text-xs">{error}</Alert>
          )}
        </div>
        <Link to="/admin/rules/new">
          <Button variant="default" size="sm" className="gap-1.5">
            <PlusCircle className="w-3.5 h-3.5" /> New Rule
          </Button>
        </Link>
      </div>

      <Card className="mb-0">
        {/* Filter bar */}
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap gap-3 items-end bg-gray-50/60">
          <div className="flex-1 min-w-[200px] max-w-sm relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search ID, topic, tags…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <Select
            options={yearOptions}
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="w-32 py-1.5 text-sm"
          />
          <Select
            options={USER_TYPE_OPTIONS}
            value={userTypeFilter}
            onChange={e => setUserTypeFilter(e.target.value)}
            className="w-44 py-1.5 text-sm"
          />
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-40 py-1.5 text-sm"
          />
          <Select
            options={CATEGORY_OPTIONS}
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-40 py-1.5 text-sm"
          />

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-gray-500">
              Clear
            </Button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Spinner className="h-6 w-6" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">
            No rules match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => toggleSort("id")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Rule ID <SortIcon field="id" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => toggleSort("topic")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Topic <SortIcon field="topic" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Users</th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => toggleSort("year")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Year <SortIcon field="year" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => toggleSort("verification_status")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Status <SortIcon field="verification_status" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => toggleSort("updated_at")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Updated <SortIcon field="updated_at" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(rule => (
                  <tr key={rule.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-mono text-xs font-semibold text-gray-900">{rule.id}</p>
                        {rule.supersedes && (
                          <p className="text-[10px] text-gray-400 mt-0.5">supersedes {rule.supersedes}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="text-xs font-medium text-gray-700 truncate">{rule.topic.replace(/_/g, " ")}</p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{rule.plain_en.slice(0, 55)}…</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="gray" className="text-[11px] capitalize">{rule.category}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {rule.user_types.map(ut => (
                          <Badge key={ut} variant="info" className="text-[10px] uppercase">{ut}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="gray">{rule.year}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <RuleStatusBadge status={rule.verification_status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(rule.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/admin/rules/${rule.id}`}>
                          <Button variant="ghost" size="icon" title="Edit rule">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Duplicate to another year"
                          onClick={() => setDuplicateDialog({
                            ruleId: rule.id,
                            targetYear: AVAILABLE_YEARS.find(y => y !== rule.year) ?? rule.year + 1,
                          })}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete rule"
                          className="text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setConfirmDelete(rule.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Duplicate dialog */}
      {duplicateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Duplicate rule</h2>
            <p className="text-sm text-gray-500 mb-4">
              Copying <span className="font-mono font-semibold text-gray-800">{duplicateDialog.ruleId}</span> to a new year.
              The copy will be created as <strong>draft</strong>.
            </p>
            <Select
              label="Target year"
              options={AVAILABLE_YEARS.filter(y => y !== Number(duplicateDialog.ruleId.split("-")[1])).map(y => ({ value: String(y), label: String(y) }))}
              value={String(duplicateDialog.targetYear)}
              onChange={e => setDuplicateDialog(d => d ? { ...d, targetYear: Number(e.target.value) } : null)}
            />
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" size="sm" onClick={() => setDuplicateDialog(null)} disabled={duplicating}>
                Cancel
              </Button>
              <Button variant="default" size="sm" onClick={() => void handleDuplicate()} disabled={duplicating}>
                {duplicating ? <Spinner className="h-3.5 w-3.5" /> : "Duplicate"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Delete rule?</h2>
            <p className="text-sm text-gray-500 mb-4">
              This will permanently delete{" "}
              <span className="font-mono font-semibold text-gray-800">{confirmDelete}</span>.
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)} disabled={!!deleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void handleDelete(confirmDelete)}
                disabled={!!deleting}
              >
                {deleting ? <Spinner className="h-3.5 w-3.5" /> : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
