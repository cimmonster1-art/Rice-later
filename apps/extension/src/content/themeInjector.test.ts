// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  applyTheme,
  removeTheme,
  setBeforeAfter,
  isThemed,
  isShowingOriginal,
  getActiveCss,
} from "./themeInjector";
import { THEME_STYLE_ID, ACTIVE_CLASS, DISABLED_CLASS } from "../shared/constants";

const SAFE = "html.ricelayer-active body { color: cyan !important; }";

describe("themeInjector (rollback mechanism)", () => {
  beforeEach(() => {
    removeTheme();
    document.head.innerHTML = "";
    document.documentElement.className = "";
  });

  it("injects exactly one <style> element with the theme id", () => {
    applyTheme(SAFE, "Test");
    const els = document.querySelectorAll(`#${THEME_STYLE_ID}`);
    expect(els).toHaveLength(1);
    expect(isThemed()).toBe(true);
    expect(document.documentElement.classList.contains(ACTIVE_CLASS)).toBe(true);
  });

  it("rollback (removeTheme) restores the original page: style + classes gone", () => {
    applyTheme(SAFE, "Test");
    expect(isThemed()).toBe(true);

    removeTheme();
    expect(document.getElementById(THEME_STYLE_ID)).toBeNull();
    expect(document.documentElement.classList.contains(ACTIVE_CLASS)).toBe(false);
    expect(document.documentElement.classList.contains(DISABLED_CLASS)).toBe(false);
    expect(isThemed()).toBe(false);
    expect(getActiveCss()).toBe("");
  });

  it("before/after toggle suspends styles but keeps them recoverable", () => {
    applyTheme(SAFE, "Test");

    setBeforeAfter(true); // show original
    const el = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement;
    expect(el.textContent).toBe("");
    expect(isShowingOriginal()).toBe(true);

    setBeforeAfter(false); // back to themed
    expect(el.textContent).toMatch(/color:\s*cyan/);
    expect(isShowingOriginal()).toBe(false);
  });

  it("sanitizes again at injection time: dangerous CSS never reaches the DOM", () => {
    const removed = applyTheme(
      "body { pointer-events: none; } a { color: cyan !important; }",
      "Sneaky"
    );
    const el = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement;
    expect(el.textContent).not.toMatch(/pointer-events/i);
    expect(el.textContent).toMatch(/color:\s*cyan/);
    expect(removed.length).toBeGreaterThan(0);
  });
});
