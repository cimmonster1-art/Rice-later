/**
 * Global constants shared across the RiceLayer extension surfaces
 * (popup, options, background service worker, content script).
 */

export const APP_NAME = "RiceLayer";
export const TAGLINE = "Rice any website without breaking it.";

/** DOM id used for the single injected <style> element. */
export const THEME_STYLE_ID = "ricelayer-theme-style";

/** Class added to <html> when a RiceLayer theme is active. */
export const ACTIVE_CLASS = "ricelayer-active";

/** Class added to <html> when the user toggles "show original" (before/after). */
export const DISABLED_CLASS = "ricelayer-disabled";

/** Namespaced data attribute used to tag detected structural roles. */
export const ROLE_ATTR = "data-ricelayer-role";

/** Default backend base URL used for local development. */
export const DEFAULT_API_BASE_URL = "http://localhost:8787";

/**
 * Build-time injected backend base URL.
 *
 * Both bundlers replace this identifier with the value of the VITE_API_URL
 * environment variable at build time:
 *   - Vite (popup/options pages)        — see apps/extension/vite.config.ts
 *   - esbuild (content + service worker) — see apps/extension/build.mjs
 *
 * When VITE_API_URL is unset it is defined as an empty string and we fall back
 * to DEFAULT_API_BASE_URL, so local development keeps working with no config.
 * `typeof` is used so the reference is safe even in a context where the
 * identifier was never defined (it evaluates to "undefined", not a throw).
 */
declare const __RICELAYER_API_BASE__: string;

function readApiBase(): string {
  if (
    typeof __RICELAYER_API_BASE__ === "string" &&
    __RICELAYER_API_BASE__.trim() !== ""
  ) {
    return __RICELAYER_API_BASE__.trim();
  }
  return DEFAULT_API_BASE_URL;
}

export const API_BASE_URL = readApiBase();

export const GENERATE_THEME_ENDPOINT = `${API_BASE_URL}/api/generate-theme`;

/** chrome.storage key under which all RiceLayer state lives. */
export const STORAGE_KEY = "ricelayer_state_v1";

/**
 * Hostname substrings that are treated as sensitive by default.
 * On these pages RiceLayer warns and (per preference) refuses to auto-apply.
 */
export const SENSITIVE_HOST_HINTS = [
  "bank",
  "chase",
  "wellsfargo",
  "paypal",
  "stripe",
  "checkout",
  "payment",
  "billing",
  "wallet",
  "coinbase",
  "health",
  "medical",
  "patient",
  "mychart",
  "login",
  "signin",
  "account",
];
