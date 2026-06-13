/**
 * contentScript — runs in the page, applies CSS-only themes, validates that
 * the page still functions, and rolls back automatically if it doesn't.
 *
 * Injected programmatically after user activation (activeTab + scripting),
 * or auto-injected on saved sites the user opted into. Guards against double
 * injection with a global flag.
 */

import type {
  RiceMessage,
  RiceResponse,
  PageStatus,
  ApplyThemeResponse,
} from "../shared/messages";
import { analyzePage, tagStructuralRoles } from "./domAnalyzer";
import {
  applyTheme,
  removeTheme,
  setBeforeAfter,
  isThemed,
  isShowingOriginal,
  getActiveThemeName,
} from "./themeInjector";
import { snapshot } from "./pageSnapshot";
import { validate } from "./functionSafetyValidator";
import { startWatching, stopWatching } from "./mutationWatcher";
import { getPreset } from "../shared/presets";
import {
  getSiteTheme,
  saveSiteTheme,
  updateState,
} from "../shared/storage";

declare global {
  interface Window {
    __ricelayerInjected?: boolean;
  }
}

if (window.__ricelayerInjected) {
  // Already present — do nothing on re-injection.
} else {
  window.__ricelayerInjected = true;
  init();
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Apply CSS, measure before/after, validate, and roll back if unsafe. */
async function applyAndValidate(
  css: string,
  themeName: string
): Promise<ApplyThemeResponse> {
  tagStructuralRoles();
  const before = snapshot();
  applyTheme(css, themeName);

  // Let layout settle before measuring.
  await delay(70);
  const after = snapshot();
  const safety = validate(before, after);

  if (safety.severity === "blocked") {
    removeTheme();
    stopWatching();
    return { safety, rolledBack: true, themeName };
  }

  startWatching();
  return { safety, rolledBack: false, themeName };
}

function pageStatus(): PageStatus {
  return {
    hostname: location.hostname,
    themed: isThemed(),
    showingOriginal: isShowingOriginal(),
    activeThemeName: getActiveThemeName(),
  };
}

async function handle(msg: RiceMessage): Promise<RiceResponse> {
  switch (msg.type) {
    case "ANALYZE_PAGE":
      tagStructuralRoles();
      return { ok: true, data: analyzePage() };

    case "GET_PAGE_STATUS":
      return { ok: true, data: { ...pageStatus(), summary: analyzePage() } };

    case "APPLY_PRESET": {
      const preset = getPreset(msg.presetId);
      if (!preset) return { ok: false, error: `Unknown preset: ${msg.presetId}` };
      const res = await applyAndValidate(preset.css, preset.name);
      return { ok: true, data: res };
    }

    case "APPLY_CSS_THEME": {
      const res = await applyAndValidate(msg.css, msg.themeName);
      return { ok: true, data: res };
    }

    case "REMOVE_THEME":
      removeTheme();
      stopWatching();
      return { ok: true, data: pageStatus() };

    case "TOGGLE_THEME":
      setBeforeAfter(msg.showOriginal);
      return { ok: true, data: pageStatus() };

    case "VALIDATE_CURRENT_THEME": {
      // Re-measure against a clean baseline by toggling original briefly.
      const themedSnap = snapshot();
      setBeforeAfter(true);
      await delay(50);
      const originalSnap = snapshot();
      setBeforeAfter(false);
      const safety = validate(originalSnap, themedSnap);
      return { ok: true, data: safety };
    }

    case "SAVE_SITE_THEME": {
      const result = await saveSiteTheme(location.hostname, {
        enabled: true,
        themeName: msg.themeName,
        prompt: msg.prompt,
        css: msg.css,
      });
      if (!result.ok) return { ok: false, error: result.reason };
      return { ok: true, data: pageStatus() };
    }

    case "LOAD_SITE_THEME": {
      const rec = await getSiteTheme(location.hostname);
      if (!rec) return { ok: true, data: { found: false } };
      if (rec.enabled) {
        const res = await applyAndValidate(rec.css, rec.themeName);
        if (res.rolledBack) {
          await updateState((draft) => {
            if (draft.sites[location.hostname]) {
              draft.sites[location.hostname].safetyLast = res.safety;
            }
          });
        }
        return { ok: true, data: { found: true, ...res } };
      }
      return { ok: true, data: { found: true, enabled: false } };
    }

    default:
      return { ok: false, error: "Unknown message type" };
  }
}

function init(): void {
  chrome.runtime.onMessage.addListener((msg: RiceMessage, _sender, sendResponse) => {
    handle(msg)
      .then(sendResponse)
      .catch((err: unknown) =>
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        } satisfies RiceResponse)
      );
    return true; // async response
  });

  // Auto-apply a saved+enabled theme on load (if any).
  void autoApplyOnLoad();
}

async function autoApplyOnLoad(): Promise<void> {
  try {
    const rec = await getSiteTheme(location.hostname);
    if (rec?.enabled && rec.css) {
      await applyAndValidate(rec.css, rec.themeName);
    }
  } catch {
    /* non-fatal */
  }
}
