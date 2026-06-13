import { Bot, AlertTriangle, Lightbulb, Zap, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

export type CopilotCardType = "client_summary" | "risk_summary" | "deduction" | "next_action";

interface CopilotCardProps {
  type: CopilotCardType;
  title: string;
  body: string;
  /** Optional sub-items (bullet list) */
  items?: string[];
  /** Optional citation chip labels */
  sources?: string[];
  /** Optional estimated value (for deductions) */
  estimatedSaving?: string;
  /** Confidence label */
  confidence?: "high" | "medium" | "low";
  /** CTA button */
  actionLabel?: string;
  onAction?: () => void;
  /** External rule link */
  ruleUrl?: string;
}

const TYPE_CONFIG: Record<CopilotCardType, { icon: ReactNode; color: string; bg: string; label: string }> = {
  client_summary: {
    icon: <Bot size={14} />,
    color: "var(--blue-text)",
    bg: "var(--blue-subtle)",
    label: "Client Summary",
  },
  risk_summary: {
    icon: <AlertTriangle size={14} />,
    color: "var(--danger-text)",
    bg: "var(--danger-subtle)",
    label: "Risk Summary",
  },
  deduction: {
    icon: <Lightbulb size={14} />,
    color: "var(--ok-text)",
    bg: "var(--ok-subtle)",
    label: "Deduction Opportunity",
  },
  next_action: {
    icon: <Zap size={14} />,
    color: "var(--warn-text)",
    bg: "var(--warn-subtle)",
    label: "Next Action",
  },
};

const CONFIDENCE_MAP = {
  high:   { label: "High confidence",   color: "var(--ok-text)"     },
  medium: { label: "Medium confidence", color: "var(--warn-text)"   },
  low:    { label: "Low confidence",    color: "var(--danger-text)" },
};

const SOURCE_CHIP_COLORS: Record<string, string> = {
  Profile:           "var(--blue)",
  Documents:         "var(--purple)",
  Rules:             "var(--ok)",
  Engagement:        "var(--warn)",
  "Accountant Review": "var(--danger)",
};

export default function CopilotCard({
  type, title, body, items, sources, estimatedSaving, confidence, actionLabel, onAction, ruleUrl,
}: CopilotCardProps) {
  const cfg = TYPE_CONFIG[type];

  return (
    <div style={{
      background: "var(--bg-2)",
      border: "1px solid var(--border-2)",
      borderRadius: "var(--r-lg)",
      overflow: "hidden",
    }}>
      {/* Header strip */}
      <div style={{
        background: cfg.bg,
        padding: "var(--sp-2) var(--sp-4)",
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-2)",
      }}>
        <span style={{ color: cfg.color, display: "flex" }}>{cfg.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {cfg.label}
        </span>
        {confidence && (
          <span style={{
            marginInlineStart: "auto",
            fontSize: 10,
            color: CONFIDENCE_MAP[confidence].color,
            fontWeight: 600,
          }}>
            {CONFIDENCE_MAP[confidence].label}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "var(--sp-4)" }}>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text)", marginBottom: "var(--sp-2)" }}>
          {title}
        </div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-2)", lineHeight: 1.55, marginBottom: items?.length ? "var(--sp-3)" : 0 }}>
          {body}
        </div>

        {/* Bullet items */}
        {items && items.length > 0 && (
          <ul style={{ margin: "0 0 var(--sp-3) 0", paddingInlineStart: "var(--sp-4)", display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
            {items.map((item, i) => (
              <li key={i} style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", lineHeight: 1.5 }}>{item}</li>
            ))}
          </ul>
        )}

        {/* Estimated saving */}
        {estimatedSaving && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--sp-1)",
            background: "var(--ok-subtle)",
            color: "var(--ok-text)",
            borderRadius: "var(--r-sm)",
            padding: "2px 10px",
            fontSize: 12,
            fontWeight: 700,
            marginBottom: "var(--sp-3)",
          }}>
            ≈ {estimatedSaving} potential saving
          </div>
        )}

        {/* Context source chips */}
        {sources && sources.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-1)", marginBottom: "var(--sp-3)" }}>
            {sources.map(src => (
              <span key={src} style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 999,
                background: "var(--bg-3)",
                color: SOURCE_CHIP_COLORS[src] ?? "var(--text-3)",
                border: `1px solid ${SOURCE_CHIP_COLORS[src] ?? "var(--border-2)"}`,
              }}>
                {src}
              </span>
            ))}
          </div>
        )}

        {/* Actions row */}
        {(actionLabel || ruleUrl) && (
          <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", marginTop: "var(--sp-2)" }}>
            {actionLabel && onAction && (
              <button
                onClick={onAction}
                style={{
                  background: cfg.bg,
                  color: cfg.color,
                  border: `1px solid ${cfg.color}`,
                  borderRadius: "var(--r-sm)",
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {actionLabel}
              </button>
            )}
            {ruleUrl && (
              <a href={ruleUrl} target="_blank" rel="noopener noreferrer" style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 11, color: "var(--text-3)", textDecoration: "none",
              }}>
                <ExternalLink size={10} /> Rule source
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
