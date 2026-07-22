import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          50: "#EEF2FC",
          100: "#DCE4F9",
          200: "#B4C4EF",
          300: "#7C93D6",
          400: "#3F5CB0",
          500: "#28428F",
          600: "#1E3A8A", // primaire exact (boutons, liens, badges) - échantillonné des maquettes
          700: "#182F6E",
          800: "#122252",
          900: "#0D1118", // fond hero sombre (login) - échantillonné
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F3F7FE", // fond clair dominant, échantillonné sur les 9 écrans
          border: "#E3E8F3",
        },
        status: {
          success: "#16A34A",
          successBg: "#DCFCE7",
          warning: "#D97706",
          warningBg: "#FEF3C7",
          error: "#DC2626",
          errorBg: "#FEE2E2",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
