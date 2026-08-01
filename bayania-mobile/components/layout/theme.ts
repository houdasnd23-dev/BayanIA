// theme.ts
// Équivalent RN de tes variables Tailwind / globals.css (--background,
// --foreground, navy-*, surface-*...). Importe `colors` et `fonts` partout
// au lieu de dupliquer les valeurs dans chaque écran.

export const colors = {
  // navy scale (bg-navy-600, text-navy-600, etc.)
  navy900: "#0F1B3D",
  navy700: "#1E3A8A",
  navy600: "#27408B",
  navy500: "#4A5A8F",
  navy400: "#6B7699",
  navy300: "#9AA3C2",
  navy100: "#DDE3F5",
  navy50: "#EEF1FB",

  // surface (bg-surface, bg-surface-muted, border-surface-border)
  surface: "#FFFFFF",
  surfaceMuted: "#F4F5F9",
  surfaceBorder: "#E4E6EF",

  white: "#FFFFFF",

  // états / couleurs sémantiques
  emerald500: "#10B981",
  emerald600: "#059669",
  blue600: "#2563EB",
  amber500: "#F59E0B",
  red500: "#EF4444",
  red600: "#DC2626",
};

// Correspond à --font-serif / --font-sans dans globals.css.
// En RN il faut charger ces polices via expo-font ou react-native.config.js
// (les polices système "Iowan Old Style" etc. n'existent pas sur Android).
export const fonts = {
  serif: "Georgia", // fallback multiplateforme le plus proche ; charge une
                     // vraie police serif (ex: PlayfairDisplay) via expo-font
                     // pour un rendu fidèle au site web.
  sans: undefined,  // undefined = police système par défaut (SF sur iOS, Roboto sur Android)
};
