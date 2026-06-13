/**
 * pageSnapshot — captures cheap, value-free measurements of interactive UI
 * so the safety validator can compare before/after applying a theme.
 *
 * No input values, no text content — counts, visibility, and geometry only.
 */

export interface InteractiveSnapshot {
  visibleButtons: number;
  visibleLinks: number;
  visibleInputs: number;
  visibleForms: number;
  bodyVisible: boolean;
  scrollWidth: number;
  clientWidth: number;
  scrollRatio: number;
  /** Bounding boxes (area) of a sample of major interactive elements. */
  interactiveAreas: number[];
  /** Whether global pointer-events resolves to "none" on body. */
  bodyPointerEventsNone: boolean;
}

function isVisible(el: Element): boolean {
  const he = el as HTMLElement;
  const cs = getComputedStyle(he);
  if (cs.display === "none" || cs.visibility === "hidden") return false;
  if (parseFloat(cs.opacity) === 0) return false;
  const rect = he.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function countVisible(selector: string, cap = 1000): number {
  const els = Array.from(document.querySelectorAll(selector)).slice(0, cap);
  let n = 0;
  for (const el of els) if (isVisible(el)) n++;
  return n;
}

export function snapshot(): InteractiveSnapshot {
  const body = document.body;
  const bodyCs = body ? getComputedStyle(body) : null;
  const bodyVisible = !!body && isVisible(body);

  const majorInteractive = Array.from(
    document.querySelectorAll("button, a[href], input, select, [role='button']")
  ).slice(0, 60);
  const interactiveAreas = majorInteractive
    .filter(isVisible)
    .map((el) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      return Math.round(r.width * r.height);
    });

  const scrollWidth = document.documentElement.scrollWidth;
  const clientWidth = document.documentElement.clientWidth || 1;

  return {
    visibleButtons: countVisible("button, [role='button'], input[type='submit']"),
    visibleLinks: countVisible("a[href]"),
    visibleInputs: countVisible("input, textarea, select"),
    visibleForms: countVisible("form"),
    bodyVisible,
    scrollWidth,
    clientWidth,
    scrollRatio: scrollWidth / clientWidth,
    interactiveAreas,
    bodyPointerEventsNone: bodyCs?.pointerEvents === "none",
  };
}
