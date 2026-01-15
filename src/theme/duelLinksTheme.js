import { MD3DarkTheme } from "react-native-paper";

export const duelLinksTheme = {
  ...MD3DarkTheme,
  roundness: 14,
  colors: {
    ...MD3DarkTheme.colors,

    // Base “Duel Links”
    background: "#070B14",
    surface: "#0B1222",
    surfaceVariant: "#101B33",

    // Acentos
    primary: "#D6B35D",     // dorado
    secondary: "#6B5BD6",   // violeta
    tertiary: "#2DA8FF",    // azul “neón”
    outline: "#2A3550",

    // Texto
    onSurface: "#EAF0FF",
    onSurfaceVariant: "#B8C4E6",
  },
};
