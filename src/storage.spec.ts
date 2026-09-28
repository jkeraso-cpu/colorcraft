// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { storage } from "./storage";

describe("storage", () => {
  beforeEach(() => localStorage.clear());

  it("persists saved palettes", () => {
    const palettes = [{
      id: "one",
      name: "Ocean Morning",
      colors: ["#0F172A", "#2563EB", "#F8FAFC"],
      harmony: "triadic",
      createdAt: "2026-09-28T10:00:00.000Z",
    }];
    storage.savePalettes(palettes);
    expect(storage.loadPalettes()).toEqual(palettes);
  });

  it("persists theme preference", () => {
    storage.saveTheme("dark");
    expect(storage.loadTheme()).toBe("dark");
  });
});
