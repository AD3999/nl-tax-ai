import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardBody, Spinner, Button } from "@/components/ui/index";
import { getAdminUsers, updateAdminUser, getAdminUser } from "@/lib/admin/api";
import type { AdminUser } from "@/lib/admin/api";
import { Search, RefreshCw, ChevronDown, ChevronUp, Shield, User } from "lucide-react";

const PLAN_COLORS: Record<string, string> = {
  premium: "bg-yellow-100 text-yellow-800",
  free: "bg-gray-100 text-gray-600",
};

const TYPE_COLORS: Record<string, string> = {
  zzp: "bg-blue-100 text-blue-700",
};

import { formatDate } from "../../lib/utils";

function fmt(iso: string | null) {
  if (!iso) return "—";
  return formatDate(iso);
}

function UserDetailDrawer({
  user,
  onClose,
  onSave,
}: {
  user: AdminUser;
  onClose: () => void;
  onSave: (updated: AdminUser) => void;
}) {
  const [form, setForm] = useState({ plan: user.plan, user_type: user.user_type, is_active: user.is_active, is_staff: user.is_staff });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSave() {
    setSaving(true);
    setMsg("");
    try {
      const updated = await updateAdminUser(user.id, form);
      setMsg("Saved ✓");
      onSave(updated);
    } catch {
      setMsg("Save failed — check console");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/30" />
      <div
        className="w-full max-w-[520px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{user.email}</p>
              <p className="text-xs text-gray-400">ID #{user.id} · joined {fmt(user.date_joined)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-5 flex-1">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {user.is_superuser && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium"><Shield className="w-3 h-3" />Superuser</span>}
            {user.is_staff && !user.is_superuser && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700 font-medium"><Shield className="w-3 h-3" />Staff</span>}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[user.plan] ?? "bg-gray-100 text-gray-600"}`}>{user.plan}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[user.user_type] ?? "bg-gray-100 text-gray-600"}`}>{user.user_type || "—"}</span>
          </div>

          {/* Read-only fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-gray-400 mb-0.5">Username</p><p className="font-medium text-gray-800">{user.username}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Language</p><p className="font-medium text-gray-800">{user.preferred_language.toUpperCase()}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Last login</p><p className="font-medium text-gray-800">{fmt(user.last_login)}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Messages today</p><p className="font-medium text-gray-800">{user.daily_message_count}</p></div>
          </div>

          {/* Editable fields */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Edit</p>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Plan</label>
              <select
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                value={form.plan}
                onChange={e => setForm(f => ({ ...f, plan: e.target.value as "free" | "premium" }))}
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">User type</label>
              <select
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                value={form.user_type}
                onChange={e => setForm(f => ({ ...f, user_type: e.target.value }))}
              >
                <option value="">—</option>
                <option value="zzp">ZZP (Freelancer)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Active account</label>
              <button
                onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${form.is_active ? "bg-green-500" : "bg-gray-300"}`}
              >
                <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${form.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Staff (admin access)</label>
              <button
                onClick={() => setForm(f => ({ ...f, is_staff: !f.is_staff }))}
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${form.is_staff ? "bg-blue-500" : "bg-gray-300"}`}
              >
                <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${form.is_staff ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>

          {/* Intake profile */}
          {user.intake_profile && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Intake Profile</p>
              <pre className="bg-gray-50 rounded-md p-3 text-xs text-gray-700 overflow-auto max-h-48">
                {JSON.stringify(user.intake_profile, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          {msg && <span className={`text-xs ${msg.includes("fail") ? "text-red-500" : "text-green-600"}`}>{msg}</span>}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="default" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [userType, setUserType] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [sortField, setSortField] = useState<"date_joined" | "email" | "plan">("date_joined");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers({ search, plan, user_type: userType });
      setUsers(data.users);
      setTotal(data.total);
    } catch {
      setError("Failed to load users — check your connection or session");
    } finally {
      setLoading(false);
    }
  }, [search, plan, userType]);

  useEffect(() => { load(); }, [load]);

  async function openDetail(u: AdminUser) {
    try {
      const full = await getAdminUser(u.id);
      setSelected(full);
    } catch {
      setSelected(u);
    }
  }

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  const sorted = [...users].sort((a, b) => {
    let va: string | number = a[sortField] ?? "";
    let vb: string | number = b[sortField] ?? "";
    if (sortField === "date_joined") { va = new Date(va as string).getTime(); vb = new Date(vb as string).getTime(); }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  function SortIcon({ field }: { field: typeof sortField }) {
    if (sortField !== field) return null;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
  }

  return (
    <AdminLayout title="Users" subtitle="Manage all registered accounts">
      {selected && (
        <UserDetailDrawer
          user={selected}
          onClose={() => setSelected(null)}
          onSave={updated => {
            setUsers(us => us.map(u => u.id === updated.id ? { ...u, ...updated } : u));
            setSelected(null);
          }}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full border border-gray-200 rounded-md pl-9 pr-3 py-2 text-sm"
            placeholder="Search by email or username…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-200 rounded-md px-3 py-2 text-sm"
          value={plan}
          onChange={e => setPlan(e.target.value)}
        >
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
        <select
          className="border border-gray-200 rounded-md px-3 py-2 text-sm"
          value={userType}
          onChange={e => setUserType(e.target.value)}
        >
          <option value="">All types</option>
          <option value="zzp">ZZP</option>
        </select>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <span className="text-sm text-gray-400">{total} total</span>
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48"><Spinner className="h-7 w-7" /></div>
          ) : error ? (
            <div className="px-6 py-10 text-center text-sm text-red-500">{error}</div>
          ) : sorted.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort("email")}>
                      Email <SortIcon field="email" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort("plan")}>
                      Plan <SortIcon field="plan" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lang</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort("date_joined")}>
                      Joined <SortIcon field="date_joined" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {(u.is_staff || u.is_superuser) && <Shield className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                          <div>
                            <p className="font-medium text-gray-900">{u.email}</p>
                            <p className="text-xs text-gray-400">#{u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.user_type ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[u.user_type] ?? "bg-gray-100 text-gray-600"}`}>
                            {u.user_type}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[u.plan] ?? "bg-gray-100 text-gray-600"}`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 uppercase">{u.preferred_language}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{fmt(u.date_joined)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => openDetail(u)}>Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </AdminLayout>
  );
}
