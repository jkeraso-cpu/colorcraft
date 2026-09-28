import { describe, expect, it } from "vitest";
import { paletteUtils } from "./paletteUtils";

describe("paletteUtils", () => {
  it("parses valid imports", () => {
    expect(paletteUtils.parseImport("#fff, #000000, 2563eb").colors).toEqual([
      "#FFFFFF",
      "#000000",
      "#2563EB",
    ]);
  });

  it("rejects invalid imports", () => {
    expect(paletteUtils.parseImport("#fff #000").error).toContain("3 and 8");
    expect(paletteUtils.parseImport("#fff nope #000").error).toContain("valid HEX");
  });

  it("assigns deterministic roles", () => {
    const roles = paletteUtils.autoRoles(["#F8FAFC", "#2563EB", "#60A5FA", "#0F172A", "#F97316"]);
    expect(roles.background).toBe("#F8FAFC");
    expect(roles.text).toBe("#0F172A");
  });

  it("sanitizes filenames", () => {
    expect(paletteUtils.filename("Ocean Morning!")).toBe("ocean-morning.png");
  });
});
