import { describe, expect, it } from "vitest";
import { harmony } from "./harmony";

describe("harmony", () => {
  it("uses standard hue offsets", () => {
    expect(harmony.offsets("complementary")[1]).toBe(180);
    expect(harmony.offsets("triadic").slice(0, 3)).toEqual([0, 120, 240]);
    expect(harmony.offsets("analogous").slice(0, 3)).toEqual([0, 30, 330]);
    expect(harmony.offsets("split").slice(0, 3)).toEqual([0, 150, 210]);
  });

  it("returns requested palette sizes", () => {
    expect(harmony.generate("#2563EB", "triadic", 5).length).toBe(5);
    expect(harmony.generate("#2563EB", "monochromatic", 8).length).toBe(8);
  });
});
