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

/**
 * Backend base URL. Overridable at build time via VITE_API_URL.
 * The env read is wrapped so the content-script (IIFE) bundle, which has no
 * import.meta, safely falls back to the default without a build warning.
 */
function readApiBase(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (import.meta as any)?.env;
    if (env?.VITE_API_URL) return env.VITE_API_URL as string;
  } catch {
    /* no import.meta in this context */
  }
  return "http://localhost:8787";
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

/** Free-tier limits. */
export const FREE_MAX_SAVED_SITES = 1;
export const FREE_MAX_AI_GENERATIONS = 1;
