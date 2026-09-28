import { describe, expect, it } from "vitest";
import { colorMath } from "./colorMath";

describe("colorMath", () => {
  it("normalizes and validates HEX", () => {
    expect(colorMath.normalizeHex("fff")).toBe("#FFFFFF");
    expect(colorMath.normalizeHex("#2563eb")).toBe("#2563EB");
    expect(colorMath.normalizeHex("nope")).toBeNull();
  });

  it("converts HEX and RGB", () => {
    expect(colorMath.hexToRgb("#2563EB")).toEqual({ r: 37, g: 99, b: 235 });
    expect(colorMath.rgbToHex(37, 99, 235)).toBe("#2563EB");
  });

  it("round-trips RGB and HSL", () => {
    const hsl = colorMath.rgbToHsl(37, 99, 235);
    const rgb = colorMath.hslToRgb(hsl.h, hsl.s, hsl.l);
    expect(rgb.r).toBeCloseTo(37, 0);
    expect(rgb.g).toBeCloseTo(99, 0);
    expect(rgb.b).toBeCloseTo(235, 0);
  });

  it("calculates WCAG contrast and ratings", () => {
    expect(colorMath.contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(colorMath.wcagRating(7)).toEqual({
      normalAA: true,
      normalAAA: true,
      largeAA: true,
      largeAAA: true,
    });
  });
});
