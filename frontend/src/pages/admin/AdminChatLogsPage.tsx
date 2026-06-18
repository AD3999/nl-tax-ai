import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardBody, Spinner, Button } from "@/components/ui/index";
import { getAdminChatLogs, getAdminChatDetail } from "@/lib/admin/api";
import type { AdminConversation } from "@/lib/admin/api";
import { Search, RefreshCw, MessageSquare, ChevronDown, ChevronRight } from "lucide-react";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("nl-NL", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const LANG_LABELS: Record<string, string> = { nl: "🇳🇱 NL", en: "🇬🇧 EN", fa: "🇮🇷 FA" };

function ConversationRow({ conv }: { conv: AdminConversation }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<AdminConversation | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!open && !detail) {
      setLoading(true);
      try {
        const d = await getAdminChatDetail(conv.id);
        setDetail(d);
      } catch {
        // fallback: show without messages
        setDetail(conv);
      } finally {
        setLoading(false);
      }
    }
    setOpen(o => !o);
  }

  return (
    <>
      <tr
        className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={toggle}
      >
        <td className="px-5 py-3">
          <div className="flex items-center gap-2">
            {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
            <div>
              <p className="font-medium text-gray-900 text-sm">{conv.user_email ?? "Anonymous"}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">{conv.summary || "No summary"}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">{LANG_LABELS[conv.language] ?? conv.language}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MessageSquare className="w-3 h-3" />
            {conv.message_count}
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">{conv.tax_year}</td>
        <td className="px-4 py-3 text-xs text-gray-400">{fmt(conv.updated_at)}</td>
      </tr>

      {open && (
        <tr className="border-b border-gray-100 bg-slate-50">
          <td colSpan={5} className="px-5 py-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Spinner className="h-4 w-4" /> Loading messages…
              </div>
            ) : detail?.messages && detail.messages.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {detail.messages.map(m => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-200 text-gray-800"
                      }`}
                    >
                      <p className={`text-[10px] font-semibold mb-1 ${m.role === "user" ? "text-blue-200" : "text-gray-400"}`}>
                        {m.role === "user" ? "User" : "TaxWijs AI"} · {new Date(m.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No messages stored for this conversation.</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminChatLogsPage() {
  const [convs, setConvs] = useState<AdminConversation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lang, setLang] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminChatLogs({ search, lang });
      setConvs(data.conversations);
      setTotal(data.total);
    } catch {
      setError("Failed to load chat logs");
    } finally {
      setLoading(false);
    }
  }, [search, lang]);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminLayout title="Chat Logs" subtitle="All user conversations across the platform">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full border border-gray-200 rounded-md pl-9 pr-3 py-2 text-sm"
            placeholder="Search by user email or summary…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-200 rounded-md px-3 py-2 text-sm"
          value={lang}
          onChange={e => setLang(e.target.value)}
        >
          <option value="">All languages</option>
          <option value="nl">🇳🇱 Dutch</option>
          <option value="en">🇬🇧 English</option>
          <option value="fa">🇮🇷 Persian</option>
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
          ) : convs.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">No conversations found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User / Summary</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lang</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Messages</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Year</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {convs.map(c => <ConversationRow key={c.id} conv={c} />)}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </AdminLayout>
  );
}
