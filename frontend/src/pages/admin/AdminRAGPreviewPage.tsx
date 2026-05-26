import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Button, Select, Card, CardHeader, CardBody, CardTitle,
  Badge, Alert, Spinner,
} from "@/components/ui/index";
import { getRules } from "@/lib/tax-rules/api";
import type { TaxRule } from "@/lib/tax-rules/types";
import { Search, Info, ExternalLink } from "lucide-react";

interface RetrievedResult {
  rule: TaxRule;
  score: number;
  matchedTerms: string[];
}

function mockSemanticSearch(query: string, rules: TaxRule[]): RetrievedResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const scored: RetrievedResult[] = [];

  for (const rule of rules) {
    const haystack = [
      rule.id, rule.topic, rule.plain_en, rule.plain_nl,
      rule.ai_prompt_hint, ...rule.tags,
    ].join(" ").toLowerCase();

    const matched = terms.filter(t => haystack.includes(t));
    if (matched.length === 0) continue;

    // Simple TF-IDF approximation
    const score = matched.length / terms.length;
    scored.push({ rule, score, matchedTerms: matched });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, 5);
}

export default function AdminRAGPreviewPage() {
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("2026");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RetrievedResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assembledContext, setAssembledContext] = useState<string | null>(null);

  async function runSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const rules = await getRules({
        year: Number(yearFilter),
        user_type: userTypeFilter === "all" ? "all" : userTypeFilter as never,
        verification_status: "verified",
      });

      const retrieved = mockSemanticSearch(query, rules);
      setResults(retrieved);

      // Build assembled context string (mirrors phase2/assembler.py output)
      if (retrieved.length > 0) {
        const lines: string[] = [
          `=== RETRIEVED TAX KNOWLEDGE (verified, ${yearFilter}) ===`,
          "",
        ];
        for (const { rule } of retrieved) {
          lines.push(`[RULE: ${rule.id} | Topic: ${rule.topic} | Source: ${rule.source_url}]`);
          if (rule.ai_prompt_hint) lines.push(`AI INSTRUCTION: ${rule.ai_prompt_hint}`);
          if (language === "nl") lines.push(`Dutch: ${rule.plain_nl}`);
          else if (language === "fa") lines.push(`Persian: ${rule.plain_fa}`);
          else lines.push(`English: ${rule.plain_en}`);
          lines.push("");
        }
        lines.push("=== END RETRIEVED KNOWLEDGE ===");
        lines.push("IMPORTANT: Cite source_url for every factual claim. Use the language the user wrote in.");
        setAssembledContext(lines.join("\n"));
      } else {
        setAssembledContext(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  const SAMPLE_QUERIES = [
    "zelfstandigenaftrek 2026",
    "how much tax does a ZZP pay",
    "zorgtoeslag income limit",
    "VAT deadline quarterly",
    "expat 30% ruling",
    "box 3 savings exemption",
  ];

  return (
    <AdminLayout title="RAG Preview" subtitle="Simulate vector retrieval — see which rules the AI would receive">
      <Alert variant="info" className="mb-5 text-xs">
        <Info className="w-4 h-4 flex-shrink-0" />
        <span>
          This preview uses keyword matching as a proxy for semantic vector search.
          In production (Phase 2), ChromaDB + text-embedding-3-small handles retrieval.
          Results here show which rules <em>contain</em> your query terms.
        </span>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Search panel */}
        <Card>
          <CardHeader><CardTitle>Search Configuration</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Query</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && void runSearch()}
                  placeholder="Ask a tax question…"
                  className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_QUERIES.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuery(q)}
                  className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            <Select
              label="Tax year"
              options={[
                { value: "2025", label: "2025" },
                { value: "2026", label: "2026" },
                { value: "2027", label: "2027" },
              ]}
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
            />
            <Select
              label="User type filter"
              options={[
                { value: "all",      label: "All types" },
                { value: "zzp",      label: "ZZP" },
                { value: "employee", label: "Employee" },
                { value: "expat",    label: "Expat" },
                { value: "dga",      label: "DGA" },
              ]}
              value={userTypeFilter}
              onChange={e => setUserTypeFilter(e.target.value)}
            />
            <Select
              label="Response language"
              options={[
                { value: "en", label: "English" },
                { value: "nl", label: "Dutch (NL)" },
                { value: "fa", label: "Persian (FA)" },
              ]}
              value={language}
              onChange={e => setLanguage(e.target.value)}
            />

            <Button
              type="button"
              variant="default"
              className="w-full gap-2"
              onClick={() => void runSearch()}
              disabled={loading || !query.trim()}
            >
              {loading ? <Spinner className="h-4 w-4" /> : <Search className="w-4 h-4" />}
              Search
            </Button>
          </CardBody>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          {results === null && !loading && (
            <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">
              Enter a query and click Search →
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-[200px]">
              <Spinner className="h-6 w-6" />
            </div>
          )}

          {results !== null && !loading && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Top {results.length} result{results.length !== 1 ? "s" : ""} (simulated retrieval)
                </p>
                {results.length > 0 && (
                  <Badge variant="success">Precision@5 simulation</Badge>
                )}
              </div>

              {results.length === 0 ? (
                <Alert variant="warning">No verified rules matched your query terms. Try different keywords.</Alert>
              ) : (
                results.map(({ rule, score, matchedTerms }, idx) => (
                  <Card key={rule.id}>
                    <CardBody className="py-3 px-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-xs font-semibold text-gray-900">{rule.id}</span>
                            <Badge variant="gray" className="text-[10px] capitalize">{rule.category}</Badge>
                            <Badge variant="info" className="text-[10px]">
                              score: {(score * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">
                            {language === "nl" ? rule.plain_nl : language === "fa" ? rule.plain_fa : rule.plain_en}
                          </p>
                          {rule.ai_prompt_hint && (
                            <p className="text-xs text-blue-600 mt-1.5 italic">
                              AI INSTRUCTION: {rule.ai_prompt_hint}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex flex-wrap gap-1">
                              {matchedTerms.map(t => (
                                <span key={t} className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 text-[10px] font-mono">
                                  {t}
                                </span>
                              ))}
                            </div>
                            <a
                              href={rule.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-500 hover:underline ml-auto"
                            >
                              <ExternalLink className="w-3 h-3" /> Source
                            </a>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}

              {/* Assembled context */}
              {assembledContext && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Assembled AI Context</CardTitle>
                      <Badge variant="gray" className="text-[10px] font-mono">
                        ~{Math.round(assembledContext.length / 4)} tokens
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <pre className="text-[11px] font-mono text-gray-600 whitespace-pre-wrap leading-relaxed overflow-x-auto bg-gray-50 rounded-md p-3 border border-gray-200">
                      {assembledContext}
                    </pre>
                  </CardBody>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
