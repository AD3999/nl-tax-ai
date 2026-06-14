import { CheckCircle2, AlertTriangle, Clock, XCircle } from "lucide-react";

export type ReadinessScore = number; // 0–100

interface FactorBreakdown {
  label: string;
  weight: number;   // percentage weight of this factor
  score: number;    // 0–100
}

interface ReadinessCardProps {
  score: ReadinessScore;
  /** Optional per-factor breakdown */
  factors?: FactorBreakdown[];
  /** Compact mode — smaller padding, no factor breakdown */
  compact?: boolean;
}

function getStatus(score: number): { label: string; labelFa: string; labelNl: string; color: string; bg: string; Icon: typeof CheckCircle2 } {
  if (score >= 85) return {
    label: "Ready to File", labelFa: "آماده ارسال", labelNl: "Klaar om in te dienen",
    color: "var(--ok)", bg: "var(--ok-subtle)",
    Icon: CheckCircle2,
  };
  if (score >= 70) return {
    label: "Almost Ready", labelFa: "تقریباً آماده", labelNl: "Bijna klaar",
    color: "var(--blue)", bg: "oklch(from var(--blue) l c h / 0.12)",
    Icon: Clock,
  };
  if (score >= 40) return {
    label: "Needs Work", labelFa: "نیاز به بهبود", labelNl: "Vereist actie",
    color: "var(--warn)", bg: "oklch(from var(--warn) l c h / 0.12)",
    Icon: AlertTriangle,
  };
  return {
    label: "Critical", labelFa: "بحرانی", labelNl: "Kritiek",
    color: "var(--danger)", bg: "var(--danger-subtle)",
    Icon: XCircle,
  };
}

const DEFAULT_FACTORS: FactorBreakdown[] = [
  { label: "Documents",        weight: 40, score: 0 },
  { label: "Checklist",        weight: 25, score: 0 },
  { label: "Verification",     weight: 20, score: 0 },
  { label: "Accountant Review", weight: 15, score: 0 },
];

export default function ReadinessCard({ score, factors, compact = false }: ReadinessCardProps) {
  const status = getStatus(score);
  const { Icon } = status;
  const resolvedFactors = factors ?? DEFAULT_FACTORS;

  return (
    <div style={{
      background: "var(--bg-2)",
      border: `1px solid var(--border-2)`,
      borderRadius: "var(--r-lg)",
      padding: compact ? "var(--sp-3) var(--sp-4)" : "var(--sp-5)",
      display: "flex",
      flexDirection: "column",
      gap: compact ? "var(--sp-2)" : "var(--sp-4)",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--sp-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
          <Icon size={compact ? 14 : 16} style={{ color: status.color, flexShrink: 0 }} />
          <span style={{
            fontSize: compact ? "var(--text-sm)" : "var(--text-base)",
            fontWeight: 700,
            color: status.color,
            letterSpacing: "-0.01em",
          }}>
            {status.label}
          </span>
        </div>
        {/* Score badge */}
        <div style={{
          background: status.bg,
          color: status.color,
          borderRadius: 999,
          padding: "2px 10px",
          fontSize: compact ? 11 : 13,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
        }}>
          {score}%
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: compact ? 4 : 6,
        background: "var(--border-2)",
        borderRadius: 999,
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${score}%`,
          background: status.color,
          borderRadius: 999,
          transition: "width 600ms cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>

      {/* Per-factor breakdown */}
      {!compact && resolvedFactors.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
          {resolvedFactors.map(f => (
            <div key={f.label} style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
              <span style={{
                fontSize: 11,
                color: "var(--text-3)",
                width: 120,
                flexShrink: 0,
              }}>
                {f.label} <span style={{ color: "var(--text-4)" }}>({f.weight}%)</span>
              </span>
              <div style={{ flex: 1, height: 4, background: "var(--border-2)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${f.score}%`,
                  background: getStatus(f.score).color,
                  borderRadius: 999,
                  transition: "width 600ms",
                }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)", width: 28, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {f.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
