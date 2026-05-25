/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/admin/**/*.{ts,tsx}",
    "./src/components/admin/**/*.{ts,tsx}",
    "./src/components/ui/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        admin: {
          sidebar: "#0f172a",
          "sidebar-hover": "#1e293b",
          "sidebar-active": "#1d4ed8",
          border: "#e2e8f0",
        },
      },
    },
  },
  plugins: [],
};
