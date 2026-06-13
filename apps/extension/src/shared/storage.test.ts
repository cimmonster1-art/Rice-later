import { describe, it, expect, beforeEach } from "vitest";
import {
  getState,
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
    await saveSiteTheme("a.com", { enabled: true, themeName: "A", css: "a{}" });
    await saveSiteTheme("b.com", { enabled: true, themeName: "B", css: "b{}" });
    expect((await getSiteTheme("a.com"))?.themeName).toBe("A");
    expect((await getSiteTheme("b.com"))?.themeName).toBe("B");
  });

  it("saves unlimited sites for everyone (no tiers)", async () => {
    for (let i = 0; i < 25; i++) {
      const res = await saveSiteTheme(`site${i}.com`, {
        enabled: true,
        themeName: `T${i}`,
        css: "x{}",
      });
      expect(res.ok).toBe(true);
    }
    const s = await getState();
    expect(Object.keys(s.sites).length).toBe(25);
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
    expect(s.preferences.denySensitiveSites).toBe(true);
    expect(s.priorityAccessKey).toBeUndefined();
  });
});
