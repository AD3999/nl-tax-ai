interface ProgressRingProps {
  score: number;           // 0–100
  size?: number;           // outer SVG dimension in px
  strokeWidth?: number;
  color?: string;          // override auto-color
  showLabel?: boolean;
  labelFontSize?: number;
}

function autoColor(score: number): string {
  if (score >= 85) return "var(--sage-600)";
  if (score >= 50) return "oklch(0.62 0.13 50)";
  return "var(--danger)";
}

export function ProgressRing({
  score,
  size = 80,
  strokeWidth = 7,
  color,
  showLabel = true,
  labelFontSize,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(100, score)) / 100);
  const strokeColor = color ?? autoColor(score);
  const cx = size / 2;
  const fontSize = labelFontSize ?? Math.round(size * 0.25);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--hairline)" strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cx} r={r} fill="none"
          stroke={strokeColor} strokeWidth={strokeWidth}
          strokeDasharray={`${circ - offset} ${offset}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.7s ease" }}
        />
      </svg>
      {showLabel && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontFamily: "var(--serif)", fontSize, color: strokeColor, letterSpacing: "-0.02em" }}>
            {Math.round(score)}
          </span>
        </div>
      )}
    </div>
  );
}
