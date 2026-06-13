interface WordmarkProps {
  size?: number;
  dark?: boolean;
}

export default function Wordmark({ size = 18, dark = false }: WordmarkProps) {
  const iconSize = Math.round(size * 1.55);
  const gradId = `wm-grad-${size}`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.45 }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={dark ? "oklch(0.62 0.11 118)" : "oklch(0.50 0.105 118)"} />
            <stop offset="1" stopColor={dark ? "oklch(0.52 0.09 118)" : "oklch(0.40 0.085 118)"} />
          </linearGradient>
        </defs>
        <path
          d="M32 4 L56 11 V32 C56 46 45.5 56.5 32 60 C18.5 56.5 8 46 8 32 V11 Z"
          fill={`url(#${gradId})`}
        />
        <path
          d="M20 32 L29 41 L46 22"
          stroke="white"
          strokeWidth="4.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span style={{
        fontFamily: "var(--serif)",
        fontSize: size + 4,
        lineHeight: 1,
        fontWeight: 400,
        color: dark ? "white" : "var(--ink)",
        letterSpacing: "-0.02em",
      }}>
        TaxWijs
      </span>
    </div>
  );
}
