// tailwind.config.native.js
// Pour React Native avec NativeWind
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./screens/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#EEF2FC",
          100: "#DCE4F9",
          200: "#B4C4EF",
          300: "#7C93D6",
          400: "#3F5CB0",
          500: "#28428F",
          600: "#1E3A8A",
          700: "#182F6E",
          800: "#122252",
          900: "#0D1118",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F3F7FE",
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
        serif: ["Georgia"],
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
