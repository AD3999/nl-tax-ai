interface WordmarkProps {
  size?: number;
  dark?: boolean;
}

export default function Wordmark({ size = 18, dark = false }: WordmarkProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={size + 2} height={size + 2} viewBox="0 0 24 24" fill="none">
        <path
          d="M3 6 L12 3 L21 6 V11 C21 16.5 16.5 20.5 12 22 C7.5 20.5 3 16.5 3 11 Z"
          fill={dark ? "var(--sage-400)" : "var(--sage-600)"}
        />
        <path
          d="M8 11.5 L11 14.5 L16.5 8.5"
          stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
        />
      </svg>
      <span style={{
        fontFamily: "var(--serif)",
        fontSize: size + 4,
        lineHeight: 1,
        color: dark ? "white" : "var(--ink)",
        letterSpacing: "-0.02em",
      }}>
        TaxWijs
      </span>
    </div>
  );
}
