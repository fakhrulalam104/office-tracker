import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./types/**/*.{ts,tsx,d.ts}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 12px 40px rgba(15, 23, 42, 0.08)"
      },
      keyframes: {
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        slideDown: "slideDown 220ms ease-out"
      }
    }
  },
  plugins: []
};

export default config;
