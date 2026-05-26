import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Button, Input, Select, Card, CardHeader, CardBody, CardTitle,
  Badge, Alert, Spinner,
} from "@/components/ui/index";
import { getRules } from "@/lib/tax-rules/api";
import type { TaxRule } from "@/lib/tax-rules/types";
import { formatEur, formatPct } from "@/lib/utils";
import { Calculator, Info } from "lucide-react";

const PROFILE_DEFAULTS = {
  user_type: "zzp",
  year: "2026",
  gross_income: "72000",
  hours_per_year: "1400",
  is_starter: "false",
  has_child_under_12: "false",
  is_aow_age: "false",
};

interface MatchedRule {
  rule: TaxRule;
  reason: string;
}

export default function AdminCalculatorPreviewPage() {
  const [profile, setProfile] = useState(PROFILE_DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [matched, setMatched] = useState<MatchedRule[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(key: string, value: string) {
    setProfile(p => ({ ...p, [key]: value }));
  }

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const income = Number(profile.gross_income);
      const hours = Number(profile.hours_per_year);
      const year = Number(profile.year);

      const allRules = await getRules({
        year,
        user_type: profile.user_type === "all" ? "all" : profile.user_type as never,
        verification_status: "verified",
      });

      const results: MatchedRule[] = [];

      for (const rule of allRules) {
        const c = rule.condition;
        const reasons: string[] = [];

        if (c.is_entrepreneur !== undefined) {
          if (c.is_entrepreneur && profile.user_type === "zzp") reasons.push("user is entrepreneur");
          else if (c.is_entrepreneur) continue;
        }
        if (c.hours_gte !== undefined && hours >= c.hours_gte) reasons.push(`hours (${hours}) ≥ ${c.hours_gte}`);
        if (c.hours_gte !== undefined && hours < c.hours_gte) continue;
        if (c.income_lte !== undefined && income <= c.income_lte) reasons.push(`income ≤ €${c.income_lte.toLocaleString()}`);
        if (c.income_lte !== undefined && income > c.income_lte) continue;
        if (c.income_gte !== undefined && income >= c.income_gte) reasons.push(`income ≥ €${c.income_gte.toLocaleString()}`);
        if (c.income_gte !== undefined && income < c.income_gte) continue;
        if (c.is_starter !== undefined && String(c.is_starter) === profile.is_starter) reasons.push("starter status matches");
        if (c.has_child_under_12 !== undefined && String(c.has_child_under_12) === profile.has_child_under_12) reasons.push("child under 12 matches");
        if (c.is_aow_age !== undefined && String(c.is_aow_age) === profile.is_aow_age) reasons.push("AOW age matches");

        if (reasons.length > 0 || Object.keys(c).length === 0) {
          results.push({
            rule,
            reason: reasons.length > 0 ? reasons.join(", ") : "applies to all",
          });
        }
      }

      setMatched(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout title="Calculator Preview" subtitle="Test which verified rules apply to a sample profile">
      <Alert variant="info" className="mb-5 text-xs">
        <Info className="w-4 h-4 flex-shrink-0" />
        <span>This preview shows which <strong>verified</strong> rules match the profile below. The full tax calculator (Phase 3) will apply these rules with deterministic arithmetic.</span>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile form */}
        <Card>
          <CardHeader><CardTitle>Sample Profile</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <Select
              label="User type"
              options={[
                { value: "zzp",      label: "ZZP (freelance)" },
                { value: "employee", label: "Employee" },
                { value: "expat",    label: "Expat" },
                { value: "dga",      label: "DGA" },
              ]}
              value={profile.user_type}
              onChange={e => update("user_type", e.target.value)}
            />
            <Select
              label="Tax year"
              options={[
                { value: "2025", label: "2025" },
                { value: "2026", label: "2026" },
                { value: "2027", label: "2027" },
              ]}
              value={profile.year}
              onChange={e => update("year", e.target.value)}
            />
            <Input
              label="Gross income / profit (€)"
              type="number"
              value={profile.gross_income}
              onChange={e => update("gross_income", e.target.value)}
            />
            <Input
              label="Hours worked per year"
              type="number"
              value={profile.hours_per_year}
              onChange={e => update("hours_per_year", e.target.value)}
            />
            <Select
              label="Starter (1st–3rd year ZZP)"
              options={[{ value: "false", label: "No" }, { value: "true", label: "Yes" }]}
              value={profile.is_starter}
              onChange={e => update("is_starter", e.target.value)}
            />
            <Select
              label="Child under 12 at home"
              options={[{ value: "false", label: "No" }, { value: "true", label: "Yes" }]}
              value={profile.has_child_under_12}
              onChange={e => update("has_child_under_12", e.target.value)}
            />
            <Select
              label="AOW (pension) age"
              options={[{ value: "false", label: "No" }, { value: "true", label: "Yes" }]}
              value={profile.is_aow_age}
              onChange={e => update("is_aow_age", e.target.value)}
            />
            <Button
              type="button"
              variant="default"
              className="w-full gap-2 mt-2"
              onClick={() => void run()}
              disabled={loading}
            >
              {loading ? <Spinner className="h-4 w-4" /> : <Calculator className="w-4 h-4" />}
              Match Rules
            </Button>
          </CardBody>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2">
          {matched === null && !loading && (
            <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-gray-400">
              Configure a profile and click Match Rules →
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <Spinner className="h-6 w-6" />
            </div>
          )}
          {error && <Alert variant="error">{error}</Alert>}
          {matched !== null && !loading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  {matched.length} rule{matched.length !== 1 ? "s" : ""} matched
                </p>
                <Badge variant="success">{profile.user_type.toUpperCase()} · {profile.year}</Badge>
              </div>
              {matched.map(({ rule, reason }) => (
                <Card key={rule.id}>
                  <CardBody className="py-3 px-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs font-semibold text-gray-900">{rule.id}</span>
                          <Badge variant="gray" className="text-[10px] capitalize">{rule.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-700">{rule.plain_en}</p>
                        <p className="text-xs text-gray-400 mt-1">Matched because: {reason}</p>
                        {rule.ai_prompt_hint && (
                          <p className="text-xs text-blue-600 mt-1.5 italic">AI hint: {rule.ai_prompt_hint}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {rule.result.value !== undefined && rule.result.unit === "eur" && (
                          <p className="text-base font-bold text-gray-900">{formatEur(rule.result.value)}</p>
                        )}
                        {rule.result.value !== undefined && rule.result.unit === "pct" && (
                          <p className="text-base font-bold text-gray-900">{formatPct(rule.result.value)}</p>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
