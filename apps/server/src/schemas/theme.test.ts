import { describe, it, expect } from "vitest";
import { ThemeGenerationResultSchema } from "./theme.js";

const valid = {
  themeName: "Cyberpunk",
  description: "neon",
  css: "body { color: cyan; }",
  riskLevel: "low",
  preservationNotes: [],
  accessibilityNotes: [],
  forbiddenChangesAvoided: [],
};

describe("ThemeGenerationResultSchema", () => {
  it("accepts a valid result", () => {
    expect(ThemeGenerationResultSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing css", () => {
    const { css, ...rest } = valid;
    void css;
    expect(ThemeGenerationResultSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects empty css", () => {
    expect(ThemeGenerationResultSchema.safeParse({ ...valid, css: "" }).success).toBe(false);
  });

  it("rejects invalid riskLevel", () => {
    expect(
      ThemeGenerationResultSchema.safeParse({ ...valid, riskLevel: "extreme" }).success
    ).toBe(false);
  });

  it("rejects non-object / non-JSON shapes", () => {
    expect(ThemeGenerationResultSchema.safeParse("not json").success).toBe(false);
    expect(ThemeGenerationResultSchema.safeParse(null).success).toBe(false);
    expect(ThemeGenerationResultSchema.safeParse(42).success).toBe(false);
  });
});
