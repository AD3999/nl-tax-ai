/**
 * Renders a structured reminder body (plain-text with • bullets and \n\n blocks)
 * as a nicely formatted message instead of a raw <pre> dump.
 *
 * Expected backend format (any language):
 *   Dear {name},
 *
 *   We still need the following items…:
 *
 *   • Item A
 *   • Item B
 *
 *   Please upload them via the portal.
 *
 *   Kind regards,
 *   {accountant}
 */

interface ReminderBodyProps {
  body: string;
  /** "preview" = inside the confirmation card (small, tight), "bubble" = in a chat bubble */
  variant?: "preview" | "bubble";
  /** The bubble's text colour (inherit when inside a chat bubble) */
  textColor?: string;
}

interface Block {
  lines: string[];
  isList: boolean;
}

function parse(body: string): Block[] {
  return body
    .split(/\n{2,}/)
    .map(block => {
      const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
      const isList = lines.length > 0 && lines.every(l => l.startsWith("•") || l.startsWith("-"));
      return { lines, isList };
    })
    .filter(b => b.lines.length > 0);
}

export default function ReminderBody({ body, variant = "preview", textColor }: ReminderBodyProps) {
  const blocks = parse(body);
  const isBubble  = variant === "bubble";
  const baseColor = textColor ?? (isBubble ? "inherit" : "var(--text-2)");
  const mutedColor = isBubble ? "inherit" : "var(--text-3)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isBubble ? 8 : 6 }}>
      {blocks.map((block, i) => {
        const isFirst = i === 0;
        const isLast  = i === blocks.length - 1;

        // Bullet list block
        if (block.isList) {
          return (
            <ul
              key={i}
              style={{
                margin: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: isBubble ? 5 : 4,
                background: isBubble ? "oklch(0 0 0 / 0.08)" : "var(--bg-2)",
                borderRadius: isBubble ? "8px" : "var(--r-sm)",
                border: isBubble ? "none" : "1px solid var(--border)",
                padding: isBubble ? "8px 10px" : "10px 12px",
              }}
            >
              {block.lines.map((line, j) => {
                const text = line.replace(/^[•\-]\s*/, "");
                return (
                  <li
                    key={j}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      fontSize: isBubble ? "0.875rem" : "var(--text-xs)",
                      color: baseColor,
                      fontWeight: 500,
                    }}
                  >
                    <span style={{
                      flexShrink: 0,
                      width: 18, height: 18,
                      borderRadius: "50%",
                      background: isBubble ? "oklch(1 0 0 / 0.20)" : "var(--accent-soft)",
                      border: isBubble ? "none" : "1px solid var(--accent-line)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 800,
                      color: isBubble ? "inherit" : "var(--accent)",
                      marginTop: 1,
                    }}>
                      {j + 1}
                    </span>
                    {text}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Greeting (first non-list block)
        if (isFirst) {
          return (
            <p key={i} style={{
              margin: 0,
              fontSize: isBubble ? "0.9rem" : "var(--text-xs)",
              fontWeight: 600,
              color: baseColor,
              lineHeight: 1.5,
            }}>
              {block.lines.join(" ")}
            </p>
          );
        }

        // Closing / signature (last non-list block)
        if (isLast) {
          return (
            <div key={i} style={{
              borderTop: isBubble ? "1px solid oklch(1 0 0 / 0.15)" : "1px solid var(--border)",
              paddingTop: isBubble ? 6 : 5,
              marginTop: isBubble ? 2 : 1,
            }}>
              {block.lines.map((line, j) => (
                <p key={j} style={{
                  margin: "1px 0 0",
                  fontSize: isBubble ? "0.8rem" : "var(--text-xs)",
                  fontWeight: j === block.lines.length - 1 ? 600 : 400,
                  color: mutedColor,
                  lineHeight: 1.5,
                  opacity: isBubble ? 0.8 : 1,
                }}>
                  {line}
                </p>
              ))}
            </div>
          );
        }

        // Body paragraph (intro text, etc.)
        return (
          <p key={i} style={{
            margin: 0,
            fontSize: isBubble ? "0.875rem" : "var(--text-xs)",
            color: mutedColor,
            lineHeight: 1.6,
          }}>
            {block.lines.join(" ")}
          </p>
        );
      })}
    </div>
  );
}

/** Returns true if a message body looks like a structured reminder */
export function isReminderBody(body: string): boolean {
  return body.includes("•") || body.includes("- ");
}
