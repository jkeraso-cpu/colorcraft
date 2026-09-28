import { colorMath } from "./colorMath";

const adjectives = ["Cobalt", "Quiet", "Bright", "Soft", "Electric", "Fresh", "Deep", "Clear"];
const nouns = ["Studio", "Current", "Canvas", "Signal", "Morning", "Orbit", "Field", "Draft"];

export type Roles = {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
};

export const paletteUtils = {
  parseImport(value: string) {
    const parts = value.split(/[\s,;]+/).map((item) => item.trim()).filter(Boolean);
    const colors = parts.map((part) => colorMath.normalizeHex(part));
    if (parts.length < 3 || parts.length > 8 || colors.some((color) => !color)) {
      return { colors: [] as string[], error: "Enter between 3 and 8 valid HEX colors." };
    }
    return { colors: colors as string[], error: "" };
  },

  autoRoles(colors: string[]): Roles {
    const ranked = [...colors]
      .map((color, index) => ({
        color,
        index,
        luminance: colorMath.relativeLuminance(color),
        saturation: colorMath.hexToHsl(color)?.s ?? 0,
      }))
      .sort((a, b) => a.luminance - b.luminance);

    const text = ranked[0]?.color ?? "#111827";
    const background = ranked[ranked.length - 1]?.color ?? "#FFFFFF";
    const saturated = [...ranked].sort((a, b) => b.saturation - a.saturation);
    const primary = saturated.find((item) => item.color !== text && item.color !== background)?.color ?? colors[0];
    const accent = saturated.find((item) => ![text, background, primary].includes(item.color))?.color ?? colors[Math.min(1, colors.length - 1)];
    const surface = ranked.slice(1, -1).sort((a, b) => b.luminance - a.luminance)[0]?.color ?? background;
    const secondary = colors.find((color) => ![text, background, primary, accent, surface].includes(color)) ?? accent;

    return { background, surface, primary, secondary, accent, text };
  },

  filename(name: string) {
    const safe = name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
    return `${safe || "colorcraft-palette"}.png`;
  },

  name(colors: string[]) {
    const seed = colors.reduce(
      (sum, color) => sum + color.slice(1).split("").reduce((inner, char) => inner + char.charCodeAt(0), 0),
      0,
    );
    return `${adjectives[seed % adjectives.length]} ${nouns[Math.floor(seed / 7) % nouns.length]}`;
  },
};
