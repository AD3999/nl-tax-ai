/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs":   ["11px",  { lineHeight: "1.4" }],
        xs:      ["12px",  { lineHeight: "1.5" }],
        sm:      ["14px",  { lineHeight: "1.5" }],
        base:    ["16px",  { lineHeight: "1.6" }],
        md:      ["18px",  { lineHeight: "1.55" }],
        lg:      ["20px",  { lineHeight: "1.4" }],
        xl:      ["24px",  { lineHeight: "1.3" }],
        "2xl":   ["30px",  { lineHeight: "1.25" }],
        "3xl":   ["38px",  { lineHeight: "1.2" }],
        "4xl":   ["48px",  { lineHeight: "1.1" }],
        "5xl":   ["62px",  { lineHeight: "1.05" }],
        "6xl":   ["72px",  { lineHeight: "1" }],
      },
      colors: {
        accent: "var(--accent)",
        "accent-bg": "var(--accent-bg)",
        "accent-border": "var(--accent-border)",
        "app-bg": "var(--bg)",
        "app-text": "var(--text)",
        "app-text-h": "var(--text-h)",
        "app-border": "var(--border)",
        admin: {
          sidebar: "#0f172a",
          "sidebar-hover": "#1e293b",
          "sidebar-active": "#1d4ed8",
          border: "#e2e8f0",
        },
      },
      keyframes: {
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "slide-up": "slideUp 0.25s ease-out forwards",
        "fade-in": "fadeIn 0.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};
