import { useTranslation } from "react-i18next";

const LANGS = ["NL", "EN", "FA"] as const;

export default function LangSwitch() {
  const { i18n } = useTranslation();
  const current = i18n.language.toUpperCase() as typeof LANGS[number];

  const change = (l: string) => {
    void i18n.changeLanguage(l.toLowerCase());
    localStorage.setItem("lang", l.toLowerCase());
  };

  return (
    <div style={{
      display: "inline-flex", padding: 2,
      background: "var(--paper-3)", borderRadius: 999, border: "1px solid var(--hairline)",
    }}>
      {LANGS.map(l => (
        <button
          key={l}
          onClick={() => change(l)}
          style={{
            padding: "4px 10px", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
            borderRadius: 999, border: "none", cursor: "pointer",
            background: l === current ? "var(--ink)" : "transparent",
            color: l === current ? "var(--paper)" : "var(--ink-3)",
            transition: "all .15s",
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
