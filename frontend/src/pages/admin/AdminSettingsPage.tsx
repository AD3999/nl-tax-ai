import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Button, Select, Card, CardHeader, CardBody, CardTitle,
  Badge, Alert,
} from "@/components/ui/index";
import { AVAILABLE_YEARS } from "@/lib/tax-rules/mock-data";
import { Save, Info } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();

export default function AdminSettingsPage() {
  const [activeYear, setActiveYear] = useState(String(CURRENT_YEAR));
  const [defaultLang, setDefaultLang] = useState("nl");
  const [verificationPolicy, setVerificationPolicy] = useState("manual");
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <AdminLayout title="Settings" subtitle="Admin configuration">
      <div className="max-w-2xl space-y-5">
        {saved && (
          <Alert variant="success">Settings saved (mock — connect to backend in Phase 3).</Alert>
        )}

        <Card>
          <CardHeader><CardTitle>Tax Year Configuration</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <Select
              label="Active tax year"
              helper="The year used by default in the RAG retriever and calculator. Only 'verified' rules for this year are served to users."
              options={AVAILABLE_YEARS.map(y => ({ value: String(y), label: `${y}${y === CURRENT_YEAR ? " (current)" : ""}` }))}
              value={activeYear}
              onChange={e => setActiveYear(e.target.value)}
            />
            <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3">
              <p className="text-xs text-blue-800 font-medium mb-2">Year status</p>
              <div className="flex gap-3 flex-wrap">
                {AVAILABLE_YEARS.map(y => (
                  <div key={y} className="flex items-center gap-1.5">
                    <Badge
                      variant={
                        y === 2026 ? "success"
                        : y === 2025 ? "gray"
                        : "warning"
                      }
                    >
                      {y}
                    </Badge>
                    <span className="text-xs text-blue-700">
                      {y === 2026 ? "active" : y === 2025 ? "historical" : "draft"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Language &amp; Localization</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <Select
              label="Default admin interface language"
              options={[
                { value: "nl", label: "Dutch (NL)" },
                { value: "en", label: "English (EN)" },
                { value: "fa", label: "Persian (FA)" },
              ]}
              value={defaultLang}
              onChange={e => setDefaultLang(e.target.value)}
            />
            <Alert variant="info" className="text-xs">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>Persian is a <strong>first-class language</strong>. All rules must have <code>plain_fa</code> filled in before setting status to verified.</span>
            </Alert>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Verification Policy</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              {[
                {
                  value: "manual",
                  label: "Manual review required",
                  desc: "Rules stay in pending_review until an admin explicitly sets them to verified.",
                },
                {
                  value: "auto_draft",
                  label: "Auto-promote drafts",
                  desc: "Newly created rules with all required fields filled are automatically moved to pending_review.",
                },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                    verificationPolicy === opt.value ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="policy"
                    value={opt.value}
                    checked={verificationPolicy === opt.value}
                    onChange={e => setVerificationPolicy(e.target.value)}
                    className="h-4 w-4 mt-0.5 text-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Data Source</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span>Current backend</span>
                <Badge variant="warning">Mock (in-memory)</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span>Django API</span>
                <Badge variant="gray">Not connected</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span>ChromaDB (RAG)</span>
                <Badge variant="gray">Phase 2 index</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>PostgreSQL (prod)</span>
                <Badge variant="gray">Phase 3+</Badge>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              To switch to the real Django backend, swap the functions in{" "}
              <code className="bg-gray-100 px-1 rounded">src/lib/tax-rules/api.ts</code> from mock to fetch calls.
            </p>
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button variant="default" size="md" className="gap-2" onClick={save}>
            <Save className="w-4 h-4" /> Save Settings
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
