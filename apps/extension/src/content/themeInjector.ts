/**
 * themeInjector — owns the single injected <style> element.
 *
 * Guarantees:
 *  - Injects CSS only, into one <style id="ricelayer-theme-style">.
 *  - Never removes existing site styles or scripts.
 *  - Never modifies event listeners or rebuilds <body>.
 *  - Provides before/after toggle and clean removal.
 */

import {
  THEME_STYLE_ID,
  ACTIVE_CLASS,
  DISABLED_CLASS,
} from "../shared/constants";
import { sanitizeCss } from "../shared/cssSanitizer";

let currentThemeName: string | null = null;
let currentCss = "";

function getOrCreateStyleEl(): HTMLStyleElement {
  let el = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = THEME_STYLE_ID;
    el.setAttribute("type", "text/css");
    // Append last so it can win the cascade without deleting site styles.
    (document.head || document.documentElement).appendChild(el);
  }
  return el;
}

/**
 * Apply a CSS theme. CSS is sanitized again here (defense in depth) before
 * it ever touches the DOM. Returns the sanitization removals (for reporting).
 */
export function applyTheme(css: string, themeName = "Custom"): string[] {
  const { css: clean, removed } = sanitizeCss(css);
  const styleEl = getOrCreateStyleEl();
  styleEl.textContent = clean;
  document.documentElement.classList.add(ACTIVE_CLASS);
  document.documentElement.classList.remove(DISABLED_CLASS);
  currentThemeName = themeName;
  currentCss = clean;
  return removed;
}

/** Remove the RiceLayer theme entirely, restoring the original page. */
export function removeTheme(): void {
  const el = document.getElementById(THEME_STYLE_ID);
  if (el) el.remove();
  document.documentElement.classList.remove(ACTIVE_CLASS, DISABLED_CLASS);
  currentThemeName = null;
  currentCss = "";
}

/**
 * Before/after toggle. When showOriginal=true the theme styles are suspended
 * (the <style> is emptied + active class dropped) but kept in memory so they
 * can be restored instantly.
 */
export function setBeforeAfter(showOriginal: boolean): void {
  const el = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;
  if (showOriginal) {
    if (el) el.textContent = "";
    document.documentElement.classList.remove(ACTIVE_CLASS);
    document.documentElement.classList.add(DISABLED_CLASS);
  } else if (currentCss) {
    const styleEl = el ?? getOrCreateStyleEl();
    styleEl.textContent = currentCss;
    document.documentElement.classList.add(ACTIVE_CLASS);
    document.documentElement.classList.remove(DISABLED_CLASS);
  }
}

export function isThemed(): boolean {
  return document.getElementById(THEME_STYLE_ID) !== null && currentCss !== "";
}

export function isShowingOriginal(): boolean {
  return document.documentElement.classList.contains(DISABLED_CLASS);
}

export function getActiveThemeName(): string | null {
  return currentThemeName;
}

export function getActiveCss(): string {
  return currentCss;
}

/** Re-apply the in-memory CSS (used by the SPA mutation watcher). */
export function reapplyCurrent(): void {
  if (currentCss) {
    const styleEl = getOrCreateStyleEl();
    if (styleEl.textContent !== currentCss) styleEl.textContent = currentCss;
    document.documentElement.classList.add(ACTIVE_CLASS);
  }
}
