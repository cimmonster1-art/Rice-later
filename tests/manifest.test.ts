import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(__dirname, "..");
const sourceManifest = JSON.parse(
  readFileSync(resolve(repoRoot, "apps/extension/manifest.json"), "utf8")
);

const ALLOWED_PERMISSIONS = ["activeTab", "scripting", "storage"];

describe("manifest permission shape (Chrome Web Store safety)", () => {
  it("is Manifest V3", () => {
    expect(sourceManifest.manifest_version).toBe(3);
  });

  it("required permissions are minimal (subset of activeTab/scripting/storage)", () => {
    const perms: string[] = sourceManifest.permissions ?? [];
    for (const p of perms) expect(ALLOWED_PERMISSIONS).toContain(p);
  });

  it("does NOT request <all_urls> as a required host permission", () => {
    const hosts: string[] = sourceManifest.host_permissions ?? [];
    expect(hosts).not.toContain("<all_urls>");
  });

  it("declares optional host permissions for per-site saved auto-apply", () => {
    const optional: string[] = sourceManifest.optional_host_permissions ?? [];
    // Optional broad host access is allowed — it is requested per-origin only.
    expect(optional.length).toBeGreaterThan(0);
  });

  it("uses a service worker (no remote/background page) and a popup", () => {
    expect(sourceManifest.background?.service_worker).toBeTruthy();
    expect(sourceManifest.action?.default_popup).toBeTruthy();
  });

  it("does not declare a content_security_policy that allows remote code", () => {
    const csp = sourceManifest.content_security_policy;
    if (csp) {
      const serialized = JSON.stringify(csp);
      expect(serialized).not.toMatch(/unsafe-eval/i);
      expect(serialized).not.toMatch(/https?:\/\//i);
    }
  });
});
