import { describe, it, expect } from "vitest";
import { sanitizeCss, isCssSafe } from "./cssSanitizer.js";

describe("cssSanitizer", () => {
  it("rejects script tags and javascript: URLs", () => {
    const r = sanitizeCss("body { background: url(javascript:alert(1)); } <script>x</script>");
    expect(r.safe).toBe(false);
    expect(r.removed.join(" ")).toMatch(/javascript|script/i);
    expect(r.css).not.toMatch(/javascript:/i);
    expect(r.css).not.toMatch(/<script/i);
  });

  it("rejects expression(), behavior:, -moz-binding, @import", () => {
    expect(isCssSafe("div { width: expression(alert(1)); }")).toBe(false);
    expect(isCssSafe("div { behavior: url(x.htc); }")).toBe(false);
    expect(isCssSafe("div { -moz-binding: url(x); }")).toBe(false);
    expect(isCssSafe("@import url(http://evil.com/x.css);")).toBe(false);
  });

  it("removes global pointer-events:none and broad display:none", () => {
    const r1 = sanitizeCss("body { pointer-events: none; }");
    expect(r1.safe).toBe(false);
    expect(r1.css).not.toMatch(/pointer-events/i);

    const r2 = sanitizeCss("* { display: none; }");
    expect(r2.safe).toBe(false);
    expect(r2.css).not.toMatch(/display:\s*none/i);

    const r3 = sanitizeCss("input { display: none; }");
    expect(r3.safe).toBe(false);
  });

  it("rejects full-screen fixed overlays on non-RiceLayer selectors", () => {
    const r = sanitizeCss(
      ".x { position: fixed; width: 100vw; height: 100vh; z-index: 99; }"
    );
    expect(r.safe).toBe(false);
  });

  it("allows a RiceLayer-owned full-screen element", () => {
    const r = sanitizeCss(
      "#ricelayer-overlay { position: fixed; width: 100vw; height: 100vh; }"
    );
    expect(r.safe).toBe(true);
  });

  it("allows safe theme CSS untouched", () => {
    const safe = `html.ricelayer-active body { background: #0a0c12 !important; color: #fff !important; }
html.ricelayer-active button { border: 1px solid #00f0ff !important; border-radius: 4px; }
@media (prefers-reduced-motion: reduce) { html.ricelayer-active * { transition: none !important; } }`;
    const r = sanitizeCss(safe);
    expect(r.safe).toBe(true);
    expect(r.removed).toHaveLength(0);
    expect(r.css).toMatch(/background/);
  });

  it("preserves safe rules even when stripping dangerous ones", () => {
    const r = sanitizeCss(
      "body { background: black; } .evil { behavior: url(x); } a { color: cyan; }"
    );
    expect(r.css).toMatch(/background:\s*black/);
    expect(r.css).toMatch(/color:\s*cyan/);
    expect(r.safe).toBe(false);
  });
});
