import type { CSSProperties } from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  style?: CSSProperties;
}

export function Skeleton({ width = "100%", height = 16, radius = "var(--r-sm)", style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, var(--paper-3) 25%, var(--paper-2) 50%, var(--paper-3) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/** A card-shaped block of skeletons — use where a card will appear */
export function SkeletonCard({ lines = 3, style }: { lines?: number; style?: CSSProperties }) {
  return (
    <div className="card" style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 10, ...style }}>
      <Skeleton height={10} width="45%" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === lines - 1 ? "60%" : "100%"} />
      ))}
    </div>
  );
}
