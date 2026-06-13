import { describe, it, expect, beforeEach } from "vitest";
import {
  getState,
  setState,
  saveSiteTheme,
  getSiteTheme,
  removeSiteTheme,
  setSiteEnabled,
  __resetMemoryStoreForTests,
  DEFAULT_STATE,
} from "./storage";

describe("storage (per-site themes)", () => {
  beforeEach(() => {
    __resetMemoryStoreForTests();
  });

  it("saves and reloads a per-site theme", async () => {
    const res = await saveSiteTheme("example.com", {
      enabled: true,
      themeName: "Cyberpunk Neon",
      css: "body { color: cyan; }",
    });
    expect(res.ok).toBe(true);

    const rec = await getSiteTheme("example.com");
    expect(rec?.themeName).toBe("Cyberpunk Neon");
    expect(rec?.css).toMatch(/cyan/);
    expect(rec?.createdAt).toBeTruthy();
    expect(rec?.updatedAt).toBeTruthy();
  });

  it("is domain-scoped", async () => {
    const s = await getState();
    s.proStatus = "pro"; // allow multiple
    await setState(s);
    await saveSiteTheme("a.com", { enabled: true, themeName: "A", css: "a{}" });
    await saveSiteTheme("b.com", { enabled: true, themeName: "B", css: "b{}" });
    expect((await getSiteTheme("a.com"))?.themeName).toBe("A");
    expect((await getSiteTheme("b.com"))?.themeName).toBe("B");
  });

  it("enforces free-tier single-site limit", async () => {
    await saveSiteTheme("first.com", { enabled: true, themeName: "X", css: "x{}" });
    const res = await saveSiteTheme("second.com", {
      enabled: true,
      themeName: "Y",
      css: "y{}",
    });
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/Pro/i);
  });

  it("toggles enabled and removes themes", async () => {
    await saveSiteTheme("toggle.com", { enabled: true, themeName: "T", css: "t{}" });
    await setSiteEnabled("toggle.com", false);
    expect((await getSiteTheme("toggle.com"))?.enabled).toBe(false);
    await removeSiteTheme("toggle.com");
    expect(await getSiteTheme("toggle.com")).toBeUndefined();
  });

  it("returns default state shape when empty", async () => {
    const s = await getState();
    expect(s.globalEnabled).toBe(DEFAULT_STATE.globalEnabled);
    expect(s.proStatus).toBe("free");
    expect(s.preferences.denySensitiveSites).toBe(true);
  });
});
