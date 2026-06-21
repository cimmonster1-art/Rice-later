import { describe, it, expect } from "vitest";
import { sanitizeCss, isCssSafe } from "./cssSanitizer";

/**
 * The extension-side sanitizer is the LAST line of defense before CSS is
 * injected into a live page. These tests assert it rejects the dangerous
 * vectors and preserves safe themes untouched.
 */
describe("cssSanitizer (extension / last line of defense)", () => {
  it("strips script tags and javascript: URLs", () => {
    const r = sanitizeCss(
      "body { background: url(javascript:alert(1)); } <script>x</script>"
    );
    expect(r.safe).toBe(false);
    expect(r.css).not.toMatch(/javascript:/i);
    expect(r.css).not.toMatch(/<script/i);
  });

  it("rejects expression(), behavior:, -moz-binding, vbscript:, @import", () => {
    expect(isCssSafe("div { width: expression(alert(1)); }")).toBe(false);
    expect(isCssSafe("div { behavior: url(x.htc); }")).toBe(false);
    expect(isCssSafe("div { -moz-binding: url(x); }")).toBe(false);
    expect(isCssSafe("a { background: url(vbscript:msgbox); }")).toBe(false);
    expect(isCssSafe("@import url(http://evil.com/x.css);")).toBe(false);
  });

  it("removes global pointer-events:none and broad hiding", () => {
    expect(sanitizeCss("body { pointer-events: none; }").safe).toBe(false);
    expect(sanitizeCss("* { display: none; }").safe).toBe(false);
    expect(sanitizeCss("input { display: none; }").safe).toBe(false);
    expect(sanitizeCss("form { visibility: hidden; }").safe).toBe(false);
    expect(sanitizeCss("button { opacity: 0; }").safe).toBe(false);
  });

  it("rejects full-screen fixed overlays on non-RiceLayer selectors", () => {
    const r = sanitizeCss(
      ".paywall { position: fixed; width: 100vw; height: 100vh; z-index: 999999; }"
    );
    expect(r.safe).toBe(false);
  });

  it("allows a RiceLayer-owned full-screen element", () => {
    const r = sanitizeCss(
      "#ricelayer-overlay { position: fixed; width: 100vw; height: 100vh; }"
    );
    expect(r.safe).toBe(true);
  });

  it("rejects @font-face with a remote url() source", () => {
    const r = sanitizeCss(
      "@font-face { font-family: Evil; src: url(https://evil.com/f.woff2); }"
    );
    expect(r.safe).toBe(false);
    expect(r.css).not.toMatch(/evil\.com/);
  });

  it("keeps safe rules while stripping dangerous ones", () => {
    const r = sanitizeCss(
      "body { background: black; } .evil { behavior: url(x); } a { color: cyan; }"
    );
    expect(r.css).toMatch(/background:\s*black/);
    expect(r.css).toMatch(/color:\s*cyan/);
    expect(r.safe).toBe(false);
  });

  it("leaves a safe theme fully intact", () => {
    const safe = `html.ricelayer-active body { background: #0a0c12 !important; color: #fff !important; }
html.ricelayer-active button { border: 1px solid #00f0ff !important; border-radius: 4px; }
@media (prefers-reduced-motion: reduce) { html.ricelayer-active * { transition: none !important; } }`;
    const r = sanitizeCss(safe);
    expect(r.safe).toBe(true);
    expect(r.removed).toHaveLength(0);
  });

  it("rejects a non-string input safely", () => {
    // @ts-expect-error testing runtime guard
    const r = sanitizeCss(null);
    expect(r.safe).toBe(false);
    expect(r.css).toBe("");
  });
});
