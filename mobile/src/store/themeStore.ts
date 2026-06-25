import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const THEME_STORAGE_KEY = "plantdoc_theme_preference";
export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  resolved: "light" | "dark";
  init: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "system",
  resolved: "light",

  init: async () => {
    try {
      const pref = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
      if (pref === "light" || pref === "dark" || pref === "system") {
        set({ mode: pref });
      }
    } catch {}
  },

  setMode: async (mode) => {
    await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
    set({ mode });
  },
}));
