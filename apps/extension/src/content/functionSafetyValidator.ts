/**
 * functionSafetyValidator — the core "don't break the site" guard.
 *
 * Compares an InteractiveSnapshot taken before applying a theme against one
 * taken after, and decides whether the theme is safe, a warning, or blocked.
 *
 * If blocked, the caller (content script) rolls the theme back automatically.
 */

import type { SafetyCheck, SafetyResult } from "../shared/themeSchema";
import type { InteractiveSnapshot } from "./pageSnapshot";

/** Max allowed drop in visible interactive elements (5%). */
const MAX_DROP_RATIO = 0.05;
/** Horizontal scroll may not explode beyond 1.5x what it was, if not already. */
const MAX_HSCROLL_GROWTH = 1.5;

function dropCheck(
  id: string,
  label: string,
  before: number,
  after: number
): SafetyCheck {
  // Allow tiny rounding; only fail when meaningfully dropped.
  const allowed = Math.max(0, Math.floor(before * (1 - MAX_DROP_RATIO)));
  const passed = after >= allowed || before === 0;
  return {
    id,
    label,
    passed,
    before,
    after,
    message: passed
      ? `${label}: ${after}/${before} still visible`
      : `${label} dropped from ${before} to ${after} (>5% hidden)`,
  };
}

export function validate(
  before: InteractiveSnapshot,
  after: InteractiveSnapshot
): SafetyResult {
  const checks: SafetyCheck[] = [];

  checks.push(dropCheck("buttons", "Buttons", before.visibleButtons, after.visibleButtons));
  checks.push(dropCheck("links", "Links", before.visibleLinks, after.visibleLinks));
  checks.push(dropCheck("inputs", "Inputs", before.visibleInputs, after.visibleInputs));
  checks.push(dropCheck("forms", "Forms", before.visibleForms, after.visibleForms));

  // Body must remain visible.
  checks.push({
    id: "body-visible",
    label: "Body visible",
    passed: after.bodyVisible,
    message: after.bodyVisible
      ? "Page body is still visible"
      : "Page body became invisible",
  });

  // Pointer events must not be globally disabled.
  checks.push({
    id: "pointer-events",
    label: "Pointer events",
    passed: !after.bodyPointerEventsNone,
    message: after.bodyPointerEventsNone
      ? "pointer-events:none was applied to body (interaction blocked)"
      : "Pointer events intact",
  });

  // Horizontal scroll must not explode (unless it already overflowed).
  const alreadyOverflowed = before.scrollRatio > 1.05;
  const growth = before.scrollRatio > 0 ? after.scrollRatio / before.scrollRatio : 1;
  const hscrollPassed = alreadyOverflowed || growth <= MAX_HSCROLL_GROWTH;
  checks.push({
    id: "hscroll",
    label: "Horizontal overflow",
    passed: hscrollPassed,
    before: Math.round(before.scrollRatio * 100) / 100,
    after: Math.round(after.scrollRatio * 100) / 100,
    message: hscrollPassed
      ? "No runaway horizontal scrolling"
      : `Horizontal scroll grew ${growth.toFixed(2)}x (layout likely broken)`,
  });

  // Interactive elements should not all collapse to zero area.
  const beforeArea = before.interactiveAreas.reduce((a, b) => a + b, 0);
  const afterArea = after.interactiveAreas.reduce((a, b) => a + b, 0);
  const areaPassed = beforeArea === 0 || afterArea >= beforeArea * 0.4;
  checks.push({
    id: "interactive-area",
    label: "Interactive sizing",
    passed: areaPassed,
    before: beforeArea,
    after: afterArea,
    message: areaPassed
      ? "Interactive elements retain usable size"
      : "Interactive elements shrank drastically",
  });

  // Decide severity.
  const failed = checks.filter((c) => !c.passed);
  const criticalIds = new Set([
    "body-visible",
    "pointer-events",
    "buttons",
    "inputs",
    "forms",
  ]);
  const hasCritical = failed.some((c) => criticalIds.has(c.id));

  let severity: SafetyResult["severity"];
  if (failed.length === 0) severity = "safe";
  else if (hasCritical || failed.length >= 3) severity = "blocked";
  else severity = "warning";

  return {
    passed: severity !== "blocked",
    severity,
    checks,
  };
}
