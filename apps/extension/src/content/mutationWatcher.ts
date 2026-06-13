/**
 * mutationWatcher — keeps a theme applied across SPA navigations / DOM churn.
 *
 * Debounced, bounded, and self-limiting: it re-applies the in-memory theme
 * and re-tags roles, but never loops infinitely (it ignores mutations it
 * caused itself by only reacting to large structural changes).
 */

import { THEME_STYLE_ID } from "../shared/constants";
import { reapplyCurrent, isThemed } from "./themeInjector";
import { tagStructuralRoles } from "./domAnalyzer";

let observer: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastRun = 0;

const DEBOUNCE_MS = 350;
const MIN_INTERVAL_MS = 1000;
const SIGNIFICANT_NODES = 8;

function onMutations(mutations: MutationRecord[]): void {
  if (!isThemed()) return;

  // Ignore mutations that only touch our own style element.
  let addedNodes = 0;
  for (const m of mutations) {
    if (m.target instanceof Element && m.target.id === THEME_STYLE_ID) continue;
    addedNodes += m.addedNodes.length;
  }
  if (addedNodes < SIGNIFICANT_NODES) return;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const now = Date.now();
    if (now - lastRun < MIN_INTERVAL_MS) return;
    lastRun = now;
    tagStructuralRoles();
    reapplyCurrent();
  }, DEBOUNCE_MS);
}

export function startWatching(): void {
  if (observer) return;
  observer = new MutationObserver(onMutations);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

export function stopWatching(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}
