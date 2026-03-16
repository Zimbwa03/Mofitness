import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--near-black)",
        surface: "var(--surface)",
        elevated: "var(--elevated)",
        lime: "var(--lime)",
        amber: "var(--amber)",
        border: "var(--border-subtle)",
        foreground: "var(--text-primary)",
        muted: "var(--text-secondary)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        info: "var(--info)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        lime: "0 0 60px rgba(200, 241, 53, 0.16)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top, rgba(200,241,53,0.1), transparent 30%), linear-gradient(135deg, rgba(200,241,53,0.08), transparent 40%), radial-gradient(rgba(200,241,53,0.08) 1px, transparent 1px)",
      },
      backgroundSize: {
        "hero-grid": "auto, auto, 18px 18px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
