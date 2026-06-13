// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { analyzePage } from "./domAnalyzer";

describe("domAnalyzer (privacy)", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <nav><a href="/a">A</a><a href="/b">B</a></nav>
      <main>
        <h1>Title</h1>
        <form action="/login">
          <input type="text" name="username" value="SECRET_USERNAME" />
          <input type="password" name="password" value="SUPERSECRETPASSWORD" />
          <button type="submit">Go</button>
        </form>
        <div class="card">card</div>
      </main>`;
  });

  it("does NOT include input values in the summary", () => {
    const summary = analyzePage();
    const serialized = JSON.stringify(summary);
    expect(serialized).not.toMatch(/SECRET_USERNAME/);
    expect(serialized).not.toMatch(/SUPERSECRETPASSWORD/);
  });

  it("detects password fields without reading them", () => {
    const summary = analyzePage();
    expect(summary.hasPasswordFields).toBe(true);
    expect(summary.hasSensitiveForms).toBe(true);
  });

  it("counts structural elements", () => {
    const summary = analyzePage();
    expect(summary.counts.links).toBe(2);
    expect(summary.counts.forms).toBe(1);
    expect(summary.counts.inputs).toBe(2);
    expect(summary.counts.buttons).toBeGreaterThanOrEqual(1);
    expect(summary.counts.headings).toBe(1);
  });

  it("classifies auth-ish forms via action, not content", () => {
    const summary = analyzePage();
    expect(summary.detectedRoles).toContain("form");
    expect(summary.detectedRoles).toContain("navigation");
  });
});
