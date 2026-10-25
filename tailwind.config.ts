import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Background surfaces — deep blacks, charcoals, elevated panels
        surface: {
          void: "#050608",
          base: "#0A0C0E",
          panel: "#101315",
          elevated: "#161A1D",
          hover: "#1C2126",
          active: "#232A2F",
        },
        // Emerald — primary accent, full scale
        emerald: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
          glow: "#6EE7B7",
        },
        // Text ink — off-whites with a faint emerald undertone
        ink: {
          primary: "#F4FAF7",
          secondary: "#A8B0AC",
          tertiary: "#6B736F",
          quaternary: "#404643",
          muted: "#5C6661",
          emerald: "#34D399",
        },
        // Hairline borders
        line: {
          subtle: "rgba(255,255,255,0.05)",
          default: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.12)",
          emerald: "rgba(16,185,129,0.25)",
          emeraldStrong: "rgba(52,211,153,0.4)",
        },
        // Status colors
        status: {
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight: "-0.02em",
        normal: "0",
        wide: "0.04em",
        wider: "0.08em",
        widest: "0.16em",
        cinematic: "0.32em",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "8px",
        md: "10px",
        lg: "14px",
        xl: "20px",
        "2xl": "28px",
      },
      boxShadow: {
        "elev-1": "0 1px 2px rgba(0,0,0,0.4)",
        "elev-2": "0 4px 12px rgba(0,0,0,0.4)",
        "elev-3": "0 8px 24px rgba(0,0,0,0.45)",
        "elev-4": "0 16px 48px rgba(0,0,0,0.5)",
        "glow-sm": "0 0 12px rgba(16,185,129,0.25)",
        glow:
          "0 0 20px rgba(16,185,129,0.35), 0 0 40px rgba(16,185,129,0.15)",
        "glow-lg":
          "0 0 32px rgba(16,185,129,0.45), 0 0 64px rgba(16,185,129,0.2)",
        "glow-ring":
          "0 0 0 1px rgba(16,185,129,0.4), 0 0 20px rgba(16,185,129,0.25)",
        "inner-glow": "inset 0 0 1px rgba(16,185,129,0.15)",
      },
      backgroundImage: {
        "emerald-aura":
          "radial-gradient(circle at 50% 0%, rgba(16,185,129,0.15), transparent 60%)",
        "grid-fade":
          "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
        "scan-gradient":
          "linear-gradient(to bottom, transparent 0%, rgba(16,185,129,0.4) 50%, transparent 100%)",
      },
      transitionTimingFunction: {
        "emerald-out": "cubic-bezier(0.16, 1, 0.3, 1)",
        "emerald-in": "cubic-bezier(0.7, 0, 0.84, 0)",
        "emerald-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in-up": "fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in-down": "fade-in-down 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
