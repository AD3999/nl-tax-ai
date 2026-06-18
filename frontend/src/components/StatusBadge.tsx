interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const STATUS_MAP: Record<string, { bg: string; color: string }> = {
  // Engagement
  draft:          { bg: "var(--paper-3)",          color: "var(--ink-4)"             },
  collecting:     { bg: "var(--accent-soft)",       color: "var(--sage-700)"          },
  waiting_client: { bg: "oklch(0.96 0.04 70)",      color: "oklch(0.48 0.13 58)"      },
  needs_review:   { bg: "oklch(0.96 0.04 70)",      color: "oklch(0.48 0.13 58)"      },
  ready_to_file:  { bg: "var(--accent-soft)",       color: "var(--sage-700)"          },
  filed:          { bg: "var(--accent-soft)",       color: "var(--sage-700)"          },
  completed:      { bg: "var(--accent-soft)",       color: "var(--sage-700)"          },
  blocked:        { bg: "oklch(0.96 0.03 25)",      color: "var(--danger)"            },
  // Document review
  candidate:      { bg: "oklch(0.96 0.04 70)",      color: "oklch(0.48 0.13 58)"      },
  approved:       { bg: "var(--accent-soft)",       color: "var(--sage-700)"          },
  rejected:       { bg: "oklch(0.96 0.03 25)",      color: "var(--danger)"            },
  manual:         { bg: "var(--paper-3)",           color: "var(--ink-3)"             },
  // Risk
  low:            { bg: "var(--accent-soft)",       color: "var(--sage-700)"          },
  medium:         { bg: "oklch(0.96 0.04 70)",      color: "oklch(0.48 0.13 58)"      },
  high:           { bg: "oklch(0.96 0.03 25)",      color: "var(--danger)"            },
  // Invitations
  pending:        { bg: "oklch(0.96 0.04 75)",      color: "oklch(0.48 0.14 75)"      },
  accepted:       { bg: "var(--accent-soft)",       color: "var(--sage-700)"          },
  declined:       { bg: "oklch(0.96 0.03 25)",      color: "var(--danger)"            },
  cancelled:      { bg: "var(--paper-3)",           color: "var(--ink-4)"             },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const s = STATUS_MAP[status] ?? { bg: "var(--paper-3)", color: "var(--ink-4)" };
  return (
    <span style={{
      padding: size === "sm" ? "2px 7px" : "3px 10px",
      borderRadius: 99,
      fontSize: size === "sm" ? "var(--text-2xs)" : "var(--text-xs)",
      fontWeight: 600,
      background: s.bg,
      color: s.color,
      display: "inline-block",
      letterSpacing: "0.02em",
      whiteSpace: "nowrap",
    }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
