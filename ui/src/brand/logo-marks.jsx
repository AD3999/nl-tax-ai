/* TaxWijs — Logo system
   Five marks, all built from one idea:
   a checkmark inside a shield/leaf — verified + green + trustworthy.
   Each mark is an SVG component, sized via `size`. */

// 01 · SHIELD CHECK — primary mark. A pointed-bottom shield (trust)
// holding a hand-drawn check (verified). Slight gradient.
function MarkShield({ size = 64, fg = "white", bg = "var(--sage-600)", bg2 = "var(--sage-700)" }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bg} />
          <stop offset="1" stopColor={bg2} />
        </linearGradient>
      </defs>
      <path d="M32 4 L56 11 V32 C56 46 45.5 56.5 32 60 C18.5 56.5 8 46 8 32 V11 Z"
        fill={`url(#g-${id})`} />
      <path d="M20 32 L29 41 L46 22" stroke={fg} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// 02 · LEAF CHECK — softer, more organic. The shield becomes a leaf;
// the check sits across the central vein.
function MarkLeaf({ size = 64, fg = "white", bg = "var(--sage-600)", bg2 = "var(--sage-800)" }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id={`l-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={bg} />
          <stop offset="1" stopColor={bg2} />
        </linearGradient>
      </defs>
      <path d="M54 8 C54 8 30 6 18 18 C6 30 8 54 8 54 C8 54 32 56 44 44 C56 32 54 8 54 8 Z"
        fill={`url(#l-${id})`} />
      <path d="M14 50 L50 12" stroke={fg} strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
      <path d="M21 33 L29 41 L43 23" stroke={fg} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// 03 · MONOGRAM T — a stencil "T" hugged by a check tick.
// The T's crossbar becomes the upper stroke of the check.
function MarkMonogram({ size = 64, fg = "var(--sage-700)", bg = "var(--sage-100)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="2" y="2" width="60" height="60" rx="16" fill={bg} />
      {/* T cross */}
      <rect x="14" y="18" width="36" height="6" rx="2.5" fill={fg} />
      {/* T stem */}
      <rect x="29" y="18" width="6" height="28" rx="2.5" fill={fg} />
      {/* check */}
      <path d="M25 39 L31 45 L48 28" stroke={fg} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85" />
    </svg>
  );
}

// 04 · ENVELOPE — euro symbol whose middle bar is a stylised check.
// Editorial / serif feel.
function MarkEuro({ size = 64, fg = "var(--sage-700)", bg = "var(--paper)", ring = "var(--sage-300)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="29" fill={bg} stroke={ring} strokeWidth="1.5" />
      <path d="M44 18 C40 16 36 15 32 16 C24 18 19 24 18 32 C19 40 24 46 32 48 C36 49 40 48 44 46"
        stroke={fg} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      {/* check serving as the two euro bars */}
      <path d="M14 28 L26 28" stroke={fg} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M14 36 L22 36 L26 40 L34 30" stroke={fg} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// 05 · GEOMETRIC PETAL — six-petal mark, one petal highlighted as the
// "answer". Confident, brand-driven; pairs well with serif type.
function MarkPetal({ size = 64, dark = "var(--sage-800)", mid = "var(--sage-500)", hi = "var(--sage-300)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <g transform="translate(32 32)">
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <ellipse key={i}
            cx="0" cy="-14" rx="9" ry="18"
            fill={i === 0 ? hi : i % 2 === 0 ? mid : dark}
            transform={`rotate(${deg})`}
            opacity={i === 0 ? 1 : 0.92}
          />
        ))}
        <circle r="6" fill="var(--paper)" />
        <path d="M-3 0 L-0.5 3 L3 -2.5" stroke="var(--sage-700)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  );
}

// ─── Lockups (mark + wordmark) ──────────────────────────────
function Lockup({ Mark, size = 56, gap = 14, color = "var(--ink)", weight = "serif" }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap }}>
      <Mark size={size} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{
          fontFamily: weight === "serif" ? "var(--serif)" : "var(--sans)",
          fontSize: size * 0.62,
          color, letterSpacing: weight === "serif" ? "-0.025em" : "-0.015em",
          fontWeight: weight === "serif" ? 400 : 600,
        }}>
          TaxWijs
        </span>
        <span style={{
          fontFamily: "var(--mono)",
          fontSize: Math.max(9, size * 0.13),
          color: "var(--ink-3)",
          letterSpacing: "0.18em", textTransform: "uppercase",
          marginTop: 2,
        }}>
          Dutch Tax · AI
        </span>
      </div>
    </div>
  );
}

Object.assign(window, {
  MarkShield, MarkLeaf, MarkMonogram, MarkEuro, MarkPetal, Lockup
});
