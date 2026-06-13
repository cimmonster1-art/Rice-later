import { describe, it, expect } from "vitest";
import { PRESETS, getPreset, FALLBACK_PRESET_ID } from "./presets";
import { sanitizeCss } from "./cssSanitizer";

describe("presets", () => {
  it("includes at least 8 presets", () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(8);
  });

  it("every preset includes a prefers-reduced-motion safeguard", () => {
    for (const p of PRESETS) {
      expect(p.css, `${p.name} missing reduced-motion`).toMatch(
        /prefers-reduced-motion/
      );
    }
  });

  it("no preset hides functional elements or disables pointer events", () => {
    for (const p of PRESETS) {
      const r = sanitizeCss(p.css);
      expect(r.safe, `${p.name} flagged by sanitizer: ${r.removed.join(", ")}`).toBe(true);
    }
  });

  it("expected preset ids are present", () => {
    const ids = PRESETS.map((p) => p.id);
    for (const id of [
      "cyberpunk-neon",
      "hacker-terminal",
      "nasa-mission-control",
      "dark-academia",
      "glass-saas",
      "brutalist-mono",
      "low-stim-study",
      "high-contrast-rescue",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("getPreset resolves the fallback preset", () => {
    expect(getPreset(FALLBACK_PRESET_ID)).toBeDefined();
  });
});
