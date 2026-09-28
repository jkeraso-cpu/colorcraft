import { colorMath } from "./colorMath";

export type HarmonyMode =
  | "random"
  | "complementary"
  | "analogous"
  | "triadic"
  | "split"
  | "monochromatic"
  | "tetradic";

const wrapHue = (hue: number) => ((hue % 360) + 360) % 360;

const modeOffsets: Record<Exclude<HarmonyMode, "random" | "monochromatic">, number[]> = {
  complementary: [0, 180, 24, 204, 336, 156, 72, 252],
  analogous: [0, 30, 330, 60, 300, 90, 270, 120],
  triadic: [0, 120, 240, 30, 150, 270, 330, 210],
  split: [0, 150, 210, 30, 180, 240, 330, 120],
  tetradic: [0, 90, 180, 270, 30, 120, 210, 300],
};

const toneLightness = [52, 64, 41, 74, 34, 59, 82, 46];
const toneSaturation = [70, 62, 76, 54, 67, 58, 48, 72];

export const harmony = {
  offsets(mode: HarmonyMode) {
    if (mode === "random" || mode === "monochromatic") return [0];
    return [...modeOffsets[mode]];
  },

  generate(baseHex: string, mode: HarmonyMode, count: number, random = Math.random) {
    const size = Math.min(8, Math.max(3, count));
    const base = colorMath.hexToHsl(baseHex) ?? { h: 217, s: 80, l: 56 };

    if (mode === "random") {
      const seed = Math.floor(random() * 360);
      const gap = 42 + Math.floor(random() * 28);
      return Array.from({ length: size }, (_, index) => {
        const hue = wrapHue(seed + gap * index + (random() - 0.5) * 20);
        const saturation = 48 + random() * 34;
        const lightness = 38 + ((index * 17) % 38) + random() * 8;
        return colorMath.hslToHex(hue, saturation, Math.min(84, lightness));
      });
    }

    if (mode === "monochromatic") {
      return Array.from({ length: size }, (_, index) => {
        const lightness = 24 + (index * 58) / Math.max(1, size - 1);
        const saturation = Math.max(26, Math.min(88, base.s + (index % 2 === 0 ? 10 : -12)));
        return colorMath.hslToHex(base.h, saturation, lightness);
      });
    }

    const offsets = modeOffsets[mode];
    return Array.from({ length: size }, (_, index) => {
      const hue = wrapHue(base.h + offsets[index % offsets.length]);
      const lightness = index === 0 ? Math.min(68, Math.max(36, base.l)) : toneLightness[index % toneLightness.length];
      const saturation = index === 0 ? Math.min(86, Math.max(42, base.s)) : toneSaturation[index % toneSaturation.length];
      return colorMath.hslToHex(hue, saturation, lightness);
    });
  },
};
