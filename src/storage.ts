export type SavedPalette = {
  id: string;
  name: string;
  colors: string[];
  harmony: string;
  createdAt: string;
};

const PALETTES_KEY = "colorcraft.saved-palettes.v1";
const THEME_KEY = "colorcraft.theme";

export type ThemeMode = "light" | "dark" | "auto";

export const storage = {
  loadPalettes(): SavedPalette[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(PALETTES_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  savePalettes(palettes: SavedPalette[]) {
    localStorage.setItem(PALETTES_KEY, JSON.stringify(palettes));
  },

  loadTheme(): ThemeMode {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" || saved === "auto" ? saved : "auto";
  },

  saveTheme(mode: ThemeMode) {
    localStorage.setItem(THEME_KEY, mode);
  },
};
