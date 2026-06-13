/**
 * Typed wrapper around chrome.storage for RiceLayer state.
 *
 * All site themes are domain-scoped. Falls back to an in-memory store when
 * chrome.storage is unavailable (e.g. unit tests / non-extension context).
 */

import { STORAGE_KEY } from "./constants";
import type { SafetyResult } from "./themeSchema";

export interface SiteThemeRecord {
  enabled: boolean;
  themeName: string;
  prompt?: string;
  css: string;
  createdAt: string;
  updatedAt: string;
  safetyLast?: SafetyResult;
}

export interface RiceLayerState {
  globalEnabled: boolean;
  sites: Record<string, SiteThemeRecord>;
  preferences: {
    reducedMotion: boolean;
    autoApplySavedThemes: boolean;
    denySensitiveSites: boolean;
  };
  /**
   * Optional priority-access key for a self-hosted backend. Stored locally
   * only, never required, and only used by the project owner to bypass the
   * shared AI budget throttle on their own server.
   */
  priorityAccessKey?: string;
}

export const DEFAULT_STATE: RiceLayerState = {
  globalEnabled: true,
  sites: {},
  preferences: {
    reducedMotion: false,
    autoApplySavedThemes: true,
    denySensitiveSites: true,
  },
};

// In-memory fallback used outside the extension runtime.
let memoryStore: RiceLayerState | null = null;

function hasChromeStorage(): boolean {
  return (
    typeof chrome !== "undefined" &&
    !!chrome.storage &&
    !!chrome.storage.local
  );
}

export async function getState(): Promise<RiceLayerState> {
  if (!hasChromeStorage()) {
    return memoryStore ?? structuredClone(DEFAULT_STATE);
  }
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as RiceLayerState | undefined;
  if (!stored) return structuredClone(DEFAULT_STATE);
  // Merge to tolerate older shapes.
  return {
    ...structuredClone(DEFAULT_STATE),
    ...stored,
    preferences: { ...DEFAULT_STATE.preferences, ...stored.preferences },
    sites: stored.sites ?? {},
  };
}

export async function setState(state: RiceLayerState): Promise<void> {
  if (!hasChromeStorage()) {
    memoryStore = structuredClone(state);
    return;
  }
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

export async function updateState(
  mutator: (draft: RiceLayerState) => void
): Promise<RiceLayerState> {
  const state = await getState();
  mutator(state);
  await setState(state);
  return state;
}

export async function getSiteTheme(
  hostname: string
): Promise<SiteThemeRecord | undefined> {
  const state = await getState();
  return state.sites[hostname];
}

export interface SaveSiteResult {
  ok: boolean;
  reason?: string;
}

export async function saveSiteTheme(
  hostname: string,
  record: Omit<SiteThemeRecord, "createdAt" | "updatedAt">
): Promise<SaveSiteResult> {
  const state = await getState();
  const now = new Date().toISOString();
  const existing = state.sites[hostname];

  state.sites[hostname] = {
    ...record,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await setState(state);
  return { ok: true };
}

export async function removeSiteTheme(hostname: string): Promise<void> {
  await updateState((draft) => {
    delete draft.sites[hostname];
  });
}

export async function setSiteEnabled(
  hostname: string,
  enabled: boolean
): Promise<void> {
  await updateState((draft) => {
    if (draft.sites[hostname]) {
      draft.sites[hostname].enabled = enabled;
      draft.sites[hostname].updatedAt = new Date().toISOString();
    }
  });
}

/** Test helper: reset the in-memory fallback store. */
export function __resetMemoryStoreForTests(): void {
  memoryStore = null;
}
