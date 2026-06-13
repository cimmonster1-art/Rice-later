/**
 * Background service worker (MV3).
 *
 * Responsibilities:
 *  - Ensure the content script is injected into the active tab (activeTab +
 *    scripting), without broad host permissions.
 *  - Relay popup messages to the active tab's content script.
 *  - Perform the cross-origin backend fetch for AI theme generation (content
 *    scripts shouldn't reach the backend directly).
 */

import { GENERATE_THEME_ENDPOINT, PRIORITY_KEY_HEADER } from "../shared/constants";
import type {
  RiceMessage,
  RiceResponse,
  GenerateThemeResponse,
} from "../shared/messages";
import { parseThemeGenerationResult } from "../shared/themeSchema";
import { sanitizeCss } from "../shared/cssSanitizer";
import { getState } from "../shared/storage";

const CONTENT_SCRIPT_FILE = "content.js";

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function ensureContentScript(tabId: number): Promise<void> {
  try {
    // Cheap ping; if it answers, the script is already present.
    await chrome.tabs.sendMessage(tabId, { type: "GET_PAGE_STATUS" });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [CONTENT_SCRIPT_FILE],
    });
  }
}

async function relayToTab(
  tabId: number,
  msg: RiceMessage
): Promise<RiceResponse> {
  return (await chrome.tabs.sendMessage(tabId, msg)) as RiceResponse;
}

/** Fetch a generated theme from the backend, then apply it via the tab. */
async function generateAndApply(
  tabId: number,
  prompt: string
): Promise<RiceResponse<GenerateThemeResponse>> {
  const state = await getState();

  // 1. Analyze (value-free structural summary).
  const analysis = await relayToTab(tabId, { type: "ANALYZE_PAGE" });
  if (!analysis.ok) return { ok: false, error: analysis.error };

  const tab = await chrome.tabs.get(tabId);
  const hostname = tab.url ? new URL(tab.url).hostname : "unknown";

  // 2. Call backend.
  let result;
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    // Optional, owner-only: priority key for a self-hosted backend.
    if (state.priorityAccessKey?.trim()) {
      headers[PRIORITY_KEY_HEADER] = state.priorityAccessKey.trim();
    }
    const resp = await fetch(GENERATE_THEME_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        prompt,
        hostname,
        pageSummary: analysis.data,
      }),
    });
    if (!resp.ok) {
      let detail = "";
      try {
        const errJson = (await resp.json()) as { error?: string };
        if (errJson?.error) detail = `: ${errJson.error}`;
      } catch {
        /* non-JSON error body */
      }
      return { ok: false, error: `Backend error ${resp.status}${detail}` };
    }
    const json = await resp.json();
    result = parseThemeGenerationResult(json);
  } catch (err) {
    return {
      ok: false,
      error: `Could not reach RiceLayer backend: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }

  // 3. Sanitize again (defense in depth) before sending to the page.
  const { css: cleanCss, removed } = sanitizeCss(result.css);

  // 4. Apply via content script (which sanitizes a 3rd time + validates).
  const applied = await relayToTab(tabId, {
    type: "APPLY_CSS_THEME",
    themeName: result.themeName,
    css: cleanCss,
  });
  if (!applied.ok) return { ok: false, error: applied.error };

  const applyData = applied.data as Omit<GenerateThemeResponse, "result" | "sanitizedRemovals">;
  return {
    ok: true,
    data: { ...applyData, result, sanitizedRemovals: removed },
  };
}

chrome.runtime.onMessage.addListener((msg: RiceMessage, _sender, sendResponse) => {
  (async () => {
    const tab = await getActiveTab();
    if (!tab?.id) {
      sendResponse({ ok: false, error: "No active tab" } satisfies RiceResponse);
      return;
    }
    try {
      await ensureContentScript(tab.id);
      if (msg.type === "GENERATE_AND_APPLY_THEME") {
        sendResponse(await generateAndApply(tab.id, msg.prompt));
      } else {
        sendResponse(await relayToTab(tab.id, msg));
      }
    } catch (err) {
      sendResponse({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      } satisfies RiceResponse);
    }
  })();
  return true; // async
});

chrome.runtime.onInstalled.addListener(() => {
  // Reserved for future first-run setup. No broad permissions requested here.
});
