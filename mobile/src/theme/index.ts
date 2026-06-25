import { MD3LightTheme, MD3DarkTheme, configureFonts } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";

const fontConfig = {
  fontFamily: "System",
};

const sharedTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  roundness: 12,
  animation: {
    scale: 1.0,
  },
};

export const lightTheme: MD3Theme = {
  ...sharedTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#22C55E",
    primaryContainer: "#B8F5C8",
    onPrimaryContainer: "#00210E",
    secondary: "#3B82F6",
    secondaryContainer: "#D6E4FF",
    onSecondaryContainer: "#001B3D",
    tertiary: "#6B7280",
    tertiaryContainer: "#E5E7EB",
    background: "#FAFAFA",
    surface: "#FFFFFF",
    surfaceVariant: "#F3F4F6",
    error: "#EF4444",
    errorContainer: "#FFDAD6",
    onBackground: "#111111",
    onSurface: "#111111",
    onSurfaceVariant: "#6B7280",
    outline: "#D1D5DB",
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: "transparent",
      level1: "#FFFFFF",
      level2: "#F9FAFB",
    },
  },
};

export const darkTheme: MD3Theme = {
  ...sharedTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#4ADE80",
    primaryContainer: "#003919",
    onPrimaryContainer: "#B8F5C8",
    secondary: "#60A5FA",
    secondaryContainer: "#00325A",
    onSecondaryContainer: "#D6E4FF",
    tertiary: "#9CA3AF",
    tertiaryContainer: "#374151",
    background: "#0A0A0A",
    surface: "#171717",
    surfaceVariant: "#262626",
    error: "#F87171",
    errorContainer: "#93000A",
    onBackground: "#F5F5F5",
    onSurface: "#F5F5F5",
    onSurfaceVariant: "#9CA3AF",
    outline: "#404040",
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: "transparent",
      level1: "#1A1A1A",
      level2: "#242424",
    },
  },
};
