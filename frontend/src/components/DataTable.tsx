import { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown } from "lucide-react";

export interface DataColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortFn?: (a: T, b: T) => number;
  width?: string | number;
  align?: "start" | "center" | "end";
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  getKey: (row: T) => string | number;
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  emptyText?: string;
  onRowClick?: (row: T) => void;
  maxHeight?: string | number;
}

export function DataTable<T>({
  columns, rows, getKey, searchKeys, searchPlaceholder = "Search…",
  emptyText = "No results", onRowClick, maxHeight,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q || !searchKeys?.length) return rows;
    return rows.filter(row =>
      searchKeys.some(k => {
        const v = row[k];
        return v != null && String(v).toLowerCase().includes(q);
      })
    );
  }, [rows, query, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find(c => c.key === sortKey);
    if (!col?.sortFn) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => col.sortFn!(a, b) * dir);
  }, [filtered, sortKey, sortDir, columns]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div>
      {searchKeys && searchKeys.length > 0 && (
        <div style={{ position: "relative", marginBottom: "var(--sp-3)" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", pointerEvents: "none" }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              width: "100%", paddingLeft: 32, paddingRight: 10,
              height: 34, borderRadius: "var(--r-md)",
              border: "1px solid var(--hairline-2)",
              background: "var(--paper-2)", color: "var(--ink)",
              fontSize: "var(--text-sm)", fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      <div style={{ overflowX: "auto", ...(maxHeight ? { maxHeight, overflowY: "auto" } : {}) }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--hairline)" }}>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={col.sortFn ? () => toggleSort(col.key) : undefined}
                  style={{
                    padding: "var(--sp-2) var(--sp-3)",
                    fontWeight: 600, color: "var(--ink-3)",
                    fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.06em",
                    textAlign: col.align ?? "start",
                    cursor: col.sortFn ? "pointer" : "default",
                    userSelect: "none",
                    width: col.width,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {col.label}
                    {col.sortFn && sortKey === col.key && (
                      sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-4)" }}>
                  {emptyText}
                </td>
              </tr>
            ) : sorted.map(row => (
              <tr
                key={getKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{
                  borderBottom: "1px solid var(--hairline)",
                  cursor: onRowClick ? "pointer" : "default",
                }}
                onMouseEnter={onRowClick ? e => { (e.currentTarget as HTMLElement).style.background = "var(--paper-3)"; } : undefined}
                onMouseLeave={onRowClick ? e => { (e.currentTarget as HTMLElement).style.background = ""; } : undefined}
              >
                {columns.map(col => (
                  <td key={col.key} style={{ padding: "var(--sp-3)", textAlign: col.align ?? "start", verticalAlign: "middle" }}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length > 0 && (
        <div style={{ marginTop: "var(--sp-2)", fontSize: "var(--text-xs)", color: "var(--ink-4)", textAlign: "end" }}>
          {sorted.length !== rows.length ? `${sorted.length} / ${rows.length}` : `${rows.length}`} rows
        </div>
      )}
    </div>
  );
}
