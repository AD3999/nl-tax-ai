import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatCard } from "@/components/admin/StatCard";
import { RuleStatusBadge } from "@/components/admin/RuleStatusBadge";
import { Card, CardHeader, CardBody, CardTitle, Spinner, Button, Badge } from "@/components/ui/index";
import { getAdminStats, getRules } from "@/lib/tax-rules/api";
import type { AdminStats, TaxRule } from "@/lib/tax-rules/types";
import { formatDate } from "@/lib/utils";
import {
  CheckCircle,
  Clock,
  FileText,
  AlertTriangle,
  PlusCircle,
  TrendingUp,
} from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  bracket: "bg-purple-100 text-purple-700",
  deduction: "bg-blue-100 text-blue-700",
  credit: "bg-green-100 text-green-700",
  contribution: "bg-orange-100 text-orange-700",
  exemption: "bg-teal-100 text-teal-700",
  rate: "bg-indigo-100 text-indigo-700",
  deadline: "bg-red-100 text-red-700",
  compliance: "bg-yellow-100 text-yellow-700",
  benefit: "bg-pink-100 text-pink-700",
  detection: "bg-gray-100 text-gray-700",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentRules, setRecentRules] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminStats(), getRules()]).then(([s, rules]) => {
      setStats(s);
      setRecentRules(rules.filter(r => r.verification_status === "pending_review" || r.verification_status === "draft").slice(0, 5));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Overview" subtitle="Tax rules dashboard">
        <div className="flex items-center justify-center h-64">
          <Spinner className="h-8 w-8" />
        </div>
      </AdminLayout>
    );
  }

  const years = stats ? Object.entries(stats.by_year).sort((a, b) => Number(b[0]) - Number(a[0])) : [];
  const categories = stats ? Object.entries(stats.by_category).sort((a, b) => b[1] - a[1]) : [];

  return (
    <AdminLayout title="Overview" subtitle="Dutch Tax Rules Management — 2025/2026/2027">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard label="Total Rules"     value={stats?.total ?? 0}          icon={<FileText className="w-4 h-4" />}      color="blue"   />
        <StatCard label="Verified"        value={stats?.verified ?? 0}        icon={<CheckCircle className="w-4 h-4" />}   color="green"  trend="Ready for production" />
        <StatCard label="Pending Review"  value={stats?.pending_review ?? 0}  icon={<Clock className="w-4 h-4" />}        color="yellow" />
        <StatCard label="Draft"           value={stats?.draft ?? 0}           icon={<FileText className="w-4 h-4" />}      color="gray"   />
        <StatCard label="Expired"         value={stats?.expired ?? 0}         icon={<AlertTriangle className="w-4 h-4" />} color="red"    />
        <StatCard label="Expiring Soon"   value={stats?.expiring_soon ?? 0}   icon={<TrendingUp className="w-4 h-4" />}   color="indigo" trend="Next 60 days" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules needing attention */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Needs Attention</CardTitle>
            <Link to="/admin/rules">
              <Button variant="outline" size="sm">View all rules</Button>
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {recentRules.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                All rules are verified ✓
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rule</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Year</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentRules.map(rule => (
                    <tr key={rule.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <div>
                          <p className="font-medium text-gray-900 text-xs font-mono">{rule.id}</p>
                          <p className="text-gray-500 text-xs mt-0.5 truncate max-w-[220px]">{rule.plain_en.slice(0, 60)}…</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="gray">{rule.year}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <RuleStatusBadge status={rule.verification_status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(rule.updated_at)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/rules/${rule.id}`}>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Rules by year */}
          <Card>
            <CardHeader>
              <CardTitle>Rules by Year</CardTitle>
            </CardHeader>
            <CardBody className="py-3">
              <div className="space-y-2">
                {years.map(([year, count]) => (
                  <div key={year} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{year}</span>
                      {Number(year) === new Date().getFullYear() && (
                        <Badge variant="success" className="text-[10px]">Active</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(count / (stats?.total ?? 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Rules by category */}
          <Card>
            <CardHeader>
              <CardTitle>Rules by Category</CardTitle>
            </CardHeader>
            <CardBody className="py-3">
              <div className="flex flex-wrap gap-1.5">
                {categories.map(([cat, count]) => (
                  <Link key={cat} to={`/admin/rules?category=${cat}`}>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${CATEGORY_COLORS[cat] ?? "bg-gray-100 text-gray-600"}`}>
                      {cat} <span className="font-bold">·{count}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardBody className="py-3 space-y-2">
              <Link to="/admin/rules/new" className="block">
                <Button variant="default" size="sm" className="w-full justify-start gap-2">
                  <PlusCircle className="w-3.5 h-3.5" /> New Tax Rule
                </Button>
              </Link>
              <Link to="/admin/calculator-preview" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Test Calculator
                </Button>
              </Link>
              <Link to="/admin/rag-preview" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Test RAG Retrieval
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
