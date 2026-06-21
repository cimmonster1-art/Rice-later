/**
 * Host-permission helpers and sensitive-site detection.
 *
 * RiceLayer requests NO broad host permissions by default. It relies on
 * activeTab + scripting. When a user opts into "always apply on this site",
 * we request an optional host permission for that origin only.
 */

import { SENSITIVE_HOST_HINTS } from "./constants";

/** Heuristic: is this hostname/path likely sensitive (banking, auth, health)? */
export function isSensitiveHost(hostname: string, pathname = ""): boolean {
  const haystack = `${hostname}${pathname}`.toLowerCase();
  return SENSITIVE_HOST_HINTS.some((hint) => haystack.includes(hint));
}

/** Build an origin match pattern for optional host permission requests. */
export function originPattern(url: string): string | null {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}/*`;
  } catch {
    return null;
  }
}

/** Request optional host permission for a single origin (per-site auto-apply). */
export async function requestHostPermission(url: string): Promise<boolean> {
  const pattern = originPattern(url);
  if (!pattern || typeof chrome === "undefined" || !chrome.permissions) {
    return false;
  }
  try {
    return await chrome.permissions.request({ origins: [pattern] });
  } catch {
    return false;
  }
}

export async function hasHostPermission(url: string): Promise<boolean> {
  const pattern = originPattern(url);
  if (!pattern || typeof chrome === "undefined" || !chrome.permissions) {
    return false;
  }
  try {
    return await chrome.permissions.contains({ origins: [pattern] });
  } catch {
    return false;
  }
}

export async function removeHostPermission(url: string): Promise<boolean> {
  const pattern = originPattern(url);
  if (!pattern || typeof chrome === "undefined" || !chrome.permissions) {
    return false;
  }
  try {
    return await chrome.permissions.remove({ origins: [pattern] });
  } catch {
    return false;
  }
}
