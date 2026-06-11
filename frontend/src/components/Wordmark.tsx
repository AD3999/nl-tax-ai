interface WordmarkProps {
  size?: number;
  dark?: boolean;
}

export default function Wordmark({ size = 18, dark = false }: WordmarkProps) {
  const iconSize = Math.round(size * 1.55);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.45 }}>
      {/* Blue square logo mark with triangle */}
      <div style={{
        width: iconSize,
        height: iconSize,
        borderRadius: Math.round(iconSize * 0.28),
        background: "var(--blue)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <svg
          width={Math.round(iconSize * 0.58)}
          height={Math.round(iconSize * 0.58)}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path d="M4 16L10 4l6 12H4z" fill="white" fillOpacity="0.9" />
          <path d="M7 16L10 10.5l3 5.5" fill="white" fillOpacity="0.45" />
        </svg>
      </div>
      <span style={{
        fontFamily: "var(--font)",
        fontSize: size + 4,
        lineHeight: 1,
        fontWeight: 800,
        color: dark ? "white" : "var(--text)",
        letterSpacing: "-0.04em",
      }}>
        Tax<span style={{ color: "var(--blue)" }}>Wijs</span>
      </span>
    </div>
  );
}
