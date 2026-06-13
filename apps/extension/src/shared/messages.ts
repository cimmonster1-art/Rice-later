/**
 * Typed message contracts for chrome.runtime messaging between
 * popup <-> background <-> content script.
 */

import type {
  PageStructureSummary,
  SafetyResult,
  ThemeGenerationResult,
} from "./themeSchema";

export type MessageType =
  | "ANALYZE_PAGE"
  | "APPLY_PRESET"
  | "GENERATE_AND_APPLY_THEME"
  | "APPLY_CSS_THEME"
  | "REMOVE_THEME"
  | "TOGGLE_THEME"
  | "SAVE_SITE_THEME"
  | "LOAD_SITE_THEME"
  | "VALIDATE_CURRENT_THEME"
  | "GET_PAGE_STATUS";

export interface BaseMessage {
  type: MessageType;
}

export interface AnalyzePageMsg extends BaseMessage {
  type: "ANALYZE_PAGE";
}

export interface ApplyPresetMsg extends BaseMessage {
  type: "APPLY_PRESET";
  presetId: string;
}

export interface GenerateAndApplyThemeMsg extends BaseMessage {
  type: "GENERATE_AND_APPLY_THEME";
  prompt: string;
}

export interface ApplyCssThemeMsg extends BaseMessage {
  type: "APPLY_CSS_THEME";
  themeName: string;
  css: string;
}

export interface RemoveThemeMsg extends BaseMessage {
  type: "REMOVE_THEME";
}

export interface ToggleThemeMsg extends BaseMessage {
  type: "TOGGLE_THEME";
  /** true => show original page (before), false => show themed (after). */
  showOriginal: boolean;
}

export interface SaveSiteThemeMsg extends BaseMessage {
  type: "SAVE_SITE_THEME";
  themeName: string;
  css: string;
  prompt?: string;
}

export interface LoadSiteThemeMsg extends BaseMessage {
  type: "LOAD_SITE_THEME";
}

export interface ValidateCurrentThemeMsg extends BaseMessage {
  type: "VALIDATE_CURRENT_THEME";
}

export interface GetPageStatusMsg extends BaseMessage {
  type: "GET_PAGE_STATUS";
}

export type RiceMessage =
  | AnalyzePageMsg
  | ApplyPresetMsg
  | GenerateAndApplyThemeMsg
  | ApplyCssThemeMsg
  | RemoveThemeMsg
  | ToggleThemeMsg
  | SaveSiteThemeMsg
  | LoadSiteThemeMsg
  | ValidateCurrentThemeMsg
  | GetPageStatusMsg;

/** Standard response envelope. */
export interface RiceResponse<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
}

export interface PageStatus {
  hostname: string;
  themed: boolean;
  showingOriginal: boolean;
  activeThemeName: string | null;
  summary?: PageStructureSummary;
}

export interface ApplyThemeResponse {
  safety: SafetyResult;
  rolledBack: boolean;
  themeName: string;
}

export interface GenerateThemeResponse extends ApplyThemeResponse {
  result: ThemeGenerationResult;
  sanitizedRemovals: string[];
}
