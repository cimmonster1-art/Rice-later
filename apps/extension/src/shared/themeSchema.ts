/**
 * Shared theme/structure types and lightweight runtime validation.
 *
 * NOTE: This mirrors the server-side Zod schema in apps/server but is kept
 * dependency-free here so the extension bundle stays tiny. Both sides validate
 * independently (defense in depth).
 */

export type RiskLevel = "low" | "medium" | "high";

export interface ThemeGenerationResult {
  themeName: string;
  description: string;
  css: string;
  riskLevel: RiskLevel;
  preservationNotes: string[];
  accessibilityNotes: string[];
  forbiddenChangesAvoided: string[];
}

export type UrlPathKind =
  | "home"
  | "dashboard"
  | "article"
  | "docs"
  | "shop"
  | "auth"
  | "checkout"
  | "unknown";

export type LayoutDensity = "sparse" | "normal" | "dense";

export interface PageStructureSummary {
  hostname: string;
  urlPathKind: UrlPathKind;
  counts: {
    buttons: number;
    links: number;
    inputs: number;
    forms: number;
    tables: number;
    cards: number;
    headings: number;
    images: number;
    navs: number;
    modals: number;
  };
  hasPasswordFields: boolean;
  hasPaymentFields: boolean;
  hasSensitiveForms: boolean;
  detectedRoles: string[];
  colorPalette: string[];
  typography: {
    likelyFontFamilies: string[];
    averageFontSizePx: number | null;
  };
  layout: {
    bodyWidth: number;
    scrollWidth: number;
    scrollHeight: number;
    density: LayoutDensity;
  };
}

export interface SafetyCheck {
  id: string;
  label: string;
  passed: boolean;
  before?: number;
  after?: number;
  message: string;
}

export interface SafetyResult {
  passed: boolean;
  severity: "safe" | "warning" | "blocked";
  checks: SafetyCheck[];
}

const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high"];

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

/**
 * Validate an unknown object as a ThemeGenerationResult.
 * Returns the typed value or throws with a descriptive message.
 */
export function parseThemeGenerationResult(value: unknown): ThemeGenerationResult {
  if (typeof value !== "object" || value === null) {
    throw new Error("Theme result must be a JSON object");
  }
  const v = value as Record<string, unknown>;

  if (typeof v.themeName !== "string" || v.themeName.trim() === "") {
    throw new Error("themeName must be a non-empty string");
  }
  if (typeof v.css !== "string" || v.css.trim() === "") {
    throw new Error("css must be a non-empty string");
  }
  if (typeof v.description !== "string") {
    throw new Error("description must be a string");
  }
  if (!RISK_LEVELS.includes(v.riskLevel as RiskLevel)) {
    throw new Error("riskLevel must be one of low|medium|high");
  }
  if (!isStringArray(v.preservationNotes)) {
    throw new Error("preservationNotes must be string[]");
  }
  if (!isStringArray(v.accessibilityNotes)) {
    throw new Error("accessibilityNotes must be string[]");
  }
  if (!isStringArray(v.forbiddenChangesAvoided)) {
    throw new Error("forbiddenChangesAvoided must be string[]");
  }

  return {
    themeName: v.themeName,
    description: v.description,
    css: v.css,
    riskLevel: v.riskLevel as RiskLevel,
    preservationNotes: v.preservationNotes,
    accessibilityNotes: v.accessibilityNotes,
    forbiddenChangesAvoided: v.forbiddenChangesAvoided,
  };
}
