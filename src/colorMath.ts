const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const round = (value: number, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const rgbChannelToLinear = (value: number) => {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
};

export const colorMath = {
  normalizeHex(value: string) {
    const raw = value.trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{3}$/.test(raw)) {
      return `#${raw.split("").map((char) => char + char).join("").toUpperCase()}`;
    }
    if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toUpperCase()}`;
    return null;
  },

  hexToRgb(value: string) {
    const hex = this.normalizeHex(value);
    if (!hex) return null;
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  },

  rgbToHex(r: number, g: number, b: number) {
    const toHex = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0").toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  },

  rgbToHsl(r: number, g: number, b: number) {
    const rr = clamp(r, 0, 255) / 255;
    const gg = clamp(g, 0, 255) / 255;
    const bb = clamp(b, 0, 255) / 255;
    const max = Math.max(rr, gg, bb);
    const min = Math.min(rr, gg, bb);
    const delta = max - min;
    let h = 0;
    const l = (max + min) / 2;
    let s = 0;

    if (delta !== 0) {
      s = delta / (1 - Math.abs(2 * l - 1));
      if (max === rr) h = 60 * (((gg - bb) / delta) % 6);
      else if (max === gg) h = 60 * ((bb - rr) / delta + 2);
      else h = 60 * ((rr - gg) / delta + 4);
    }
    if (h < 0) h += 360;
    return { h: round(h, 1), s: round(s * 100, 1), l: round(l * 100, 1) };
  },

  hslToRgb(h: number, s: number, l: number) {
    const hue = ((h % 360) + 360) % 360;
    const sat = clamp(s, 0, 100) / 100;
    const light = clamp(l, 0, 100) / 100;
    const chroma = (1 - Math.abs(2 * light - 1)) * sat;
    const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = light - chroma / 2;
    let rp = 0, gp = 0, bp = 0;

    if (hue < 60) [rp, gp, bp] = [chroma, x, 0];
    else if (hue < 120) [rp, gp, bp] = [x, chroma, 0];
    else if (hue < 180) [rp, gp, bp] = [0, chroma, x];
    else if (hue < 240) [rp, gp, bp] = [0, x, chroma];
    else if (hue < 300) [rp, gp, bp] = [x, 0, chroma];
    else [rp, gp, bp] = [chroma, 0, x];

    return {
      r: Math.round((rp + m) * 255),
      g: Math.round((gp + m) * 255),
      b: Math.round((bp + m) * 255),
    };
  },

  hexToHsl(value: string) {
    const rgb = this.hexToRgb(value);
    return rgb ? this.rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
  },

  hslToHex(h: number, s: number, l: number) {
    const rgb = this.hslToRgb(h, s, l);
    return this.rgbToHex(rgb.r, rgb.g, rgb.b);
  },

  relativeLuminance(value: string) {
    const rgb = this.hexToRgb(value);
    if (!rgb) return 0;
    return round(
      0.2126 * rgbChannelToLinear(rgb.r) +
      0.7152 * rgbChannelToLinear(rgb.g) +
      0.0722 * rgbChannelToLinear(rgb.b),
      5,
    );
  },

  contrastRatio(foreground: string, background: string) {
    const l1 = this.relativeLuminance(foreground);
    const l2 = this.relativeLuminance(background);
    return round((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05), 2);
  },

  wcagRating(ratio: number) {
    return {
      normalAA: ratio >= 4.5,
      normalAAA: ratio >= 7,
      largeAA: ratio >= 3,
      largeAAA: ratio >= 4.5,
    };
  },

  readableTextColor(background: string) {
    const dark = "#111827";
    const light = "#FFFFFF";
    return this.contrastRatio(dark, background) >= this.contrastRatio(light, background) ? dark : light;
  },

  approximateName(value: string) {
    const hsl = this.hexToHsl(value);
    if (!hsl) return "Unknown";
    if (hsl.s < 9) {
      if (hsl.l < 22) return "Charcoal";
      if (hsl.l > 88) return "Soft White";
      return "Neutral Gray";
    }
    const tone = hsl.l < 34 ? "Deep" : hsl.l > 72 ? "Soft" : hsl.s > 72 ? "Vivid" : "Muted";
    const h = hsl.h;
    const family =
      h < 15 || h >= 345 ? "Red" :
      h < 45 ? "Orange" :
      h < 70 ? "Gold" :
      h < 155 ? "Green" :
      h < 195 ? "Teal" :
      h < 255 ? "Blue" :
      h < 295 ? "Violet" :
      h < 330 ? "Magenta" : "Rose";
    return `${tone} ${family}`;
  },
};
