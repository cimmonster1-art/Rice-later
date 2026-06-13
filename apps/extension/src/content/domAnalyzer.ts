/**
 * domAnalyzer — builds a privacy-preserving structural summary of the page.
 *
 * PRIVACY RULES (enforced here):
 *  - NEVER read input/textarea/select VALUES.
 *  - NEVER collect global innerText / page copy.
 *  - Inspect computed styles only for color/typography.
 *  - Role detection via tags, ARIA roles, class hints, layout heuristics.
 */

import { ROLE_ATTR } from "../shared/constants";
import type {
  PageStructureSummary,
  UrlPathKind,
  LayoutDensity,
} from "../shared/themeSchema";

function classifyPath(pathname: string, hostname: string): UrlPathKind {
  const p = pathname.toLowerCase();
  if (p === "/" || p === "" || /\/(home|index)/.test(p)) return "home";
  if (/(checkout|cart|payment|pay|order)/.test(p)) return "checkout";
  if (/(login|signin|sign-in|auth|register|signup)/.test(p)) return "auth";
  if (/(dashboard|admin|console|account|portal)/.test(p)) return "dashboard";
  if (/(docs|documentation|guide|reference|manual|wiki)/.test(p)) return "docs";
  if (/(shop|store|product|catalog|collections)/.test(p)) return "shop";
  if (/(article|blog|post|news|story|\d{4}\/\d{2})/.test(p)) return "article";
  void hostname;
  return "unknown";
}

/** Detects payment-ish inputs WITHOUT reading their values. */
function detectPaymentFields(): boolean {
  const inputs = Array.from(document.querySelectorAll("input"));
  return inputs.some((el) => {
    const hints = `${el.getAttribute("name") ?? ""} ${el.getAttribute("id") ?? ""} ${
      el.getAttribute("autocomplete") ?? ""
    } ${el.getAttribute("placeholder") ?? ""}`.toLowerCase();
    return /(card|cardnumber|cc-number|cvc|cvv|exp|credit|iban|routing)/.test(
      hints
    );
  });
}

function detectSensitiveForms(hasPassword: boolean, hasPayment: boolean): boolean {
  if (hasPassword || hasPayment) return true;
  const forms = Array.from(document.querySelectorAll("form"));
  return forms.some((f) => {
    const action = (f.getAttribute("action") ?? "").toLowerCase();
    return /(login|checkout|payment|bank|account|transfer)/.test(action);
  });
}

function detectRoles(): string[] {
  const roles = new Set<string>();
  if (document.querySelector("nav, [role='navigation']")) roles.add("navigation");
  if (document.querySelector("main, [role='main']")) roles.add("main");
  if (document.querySelector("header, [role='banner']")) roles.add("header");
  if (document.querySelector("footer, [role='contentinfo']")) roles.add("footer");
  if (document.querySelector("aside, [role='complementary']")) roles.add("sidebar");
  if (document.querySelector("form")) roles.add("form");
  if (document.querySelector("table, [role='grid']")) roles.add("table");
  if (document.querySelector("[role='dialog'], dialog")) roles.add("modal");
  if (document.querySelector("article")) roles.add("article");
  if (document.querySelector("[role='search'], input[type='search']"))
    roles.add("search");
  return Array.from(roles);
}

/** Heuristic card detection: repeated bordered/box-shadowed containers. */
function countCards(): number {
  const candidates = Array.from(
    document.querySelectorAll(
      "[class*='card'], article, li[class], [class*='tile'], [class*='item']"
    )
  );
  let cards = 0;
  for (const el of candidates.slice(0, 400)) {
    const cs = getComputedStyle(el);
    const hasBox =
      cs.boxShadow !== "none" ||
      (cs.borderStyle !== "none" && parseFloat(cs.borderWidth) > 0) ||
      parseFloat(cs.borderRadius) > 2;
    const rect = (el as HTMLElement).getBoundingClientRect();
    if (hasBox && rect.width > 80 && rect.height > 60) cards++;
  }
  return cards;
}

/** Sample computed colors from a bounded set of elements. */
function samplePalette(): string[] {
  const palette = new Map<string, number>();
  const add = (c: string) => {
    if (!c || c === "rgba(0, 0, 0, 0)" || c === "transparent") return;
    palette.set(c, (palette.get(c) ?? 0) + 1);
  };
  const sample = Array.from(
    document.querySelectorAll("body, header, nav, main, button, a, h1, h2, .card, [class*='card']")
  ).slice(0, 120);
  for (const el of sample) {
    const cs = getComputedStyle(el);
    add(cs.backgroundColor);
    add(cs.color);
  }
  return Array.from(palette.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([c]) => c);
}

function summarizeTypography(): PageStructureSummary["typography"] {
  const families = new Map<string, number>();
  const sizes: number[] = [];
  const sample = Array.from(
    document.querySelectorAll("body, p, h1, h2, h3, a, button, li, span")
  ).slice(0, 150);
  for (const el of sample) {
    const cs = getComputedStyle(el);
    const fam = cs.fontFamily?.split(",")[0]?.replace(/["']/g, "").trim();
    if (fam) families.set(fam, (families.get(fam) ?? 0) + 1);
    const size = parseFloat(cs.fontSize);
    if (!Number.isNaN(size)) sizes.push(size);
  }
  const likelyFontFamilies = Array.from(families.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([f]) => f);
  const averageFontSizePx = sizes.length
    ? Math.round((sizes.reduce((a, b) => a + b, 0) / sizes.length) * 10) / 10
    : null;
  return { likelyFontFamilies, averageFontSizePx };
}

function computeDensity(elementCount: number, area: number): LayoutDensity {
  if (area <= 0) return "normal";
  const perMillionPx = (elementCount / area) * 1_000_000;
  if (perMillionPx > 900) return "dense";
  if (perMillionPx < 250) return "sparse";
  return "normal";
}

/** Tag major structural elements with a safe, namespaced data attribute. */
export function tagStructuralRoles(): void {
  const tag = (selector: string, role: string) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (!el.hasAttribute(ROLE_ATTR)) el.setAttribute(ROLE_ATTR, role);
    });
  };
  tag("nav, [role='navigation']", "nav");
  tag("main, [role='main']", "main");
  tag("aside, [role='complementary']", "sidebar");
  tag("[role='dialog'], dialog", "modal");
  tag("form", "form");
  tag("table, [role='grid']", "table");
  tag("button, [role='button']", "button");
  document
    .querySelectorAll("[class*='card'], [class*='tile']")
    .forEach((el) => {
      if (!el.hasAttribute(ROLE_ATTR)) el.setAttribute(ROLE_ATTR, "card");
    });
}

/** Main entry: produce the structural summary. */
export function analyzePage(): PageStructureSummary {
  const hostname = location.hostname;
  const urlPathKind = classifyPath(location.pathname, hostname);

  const inputs = Array.from(document.querySelectorAll("input"));
  const hasPasswordFields = inputs.some((el) => el.type === "password");
  const hasPaymentFields = detectPaymentFields();
  const hasSensitiveForms = detectSensitiveForms(
    hasPasswordFields,
    hasPaymentFields
  );

  const counts = {
    buttons: document.querySelectorAll("button, [role='button'], input[type='submit']")
      .length,
    links: document.querySelectorAll("a[href]").length,
    inputs: inputs.length,
    forms: document.querySelectorAll("form").length,
    tables: document.querySelectorAll("table, [role='grid']").length,
    cards: countCards(),
    headings: document.querySelectorAll("h1, h2, h3, h4, h5, h6").length,
    images: document.querySelectorAll("img, picture, svg").length,
    navs: document.querySelectorAll("nav, [role='navigation']").length,
    modals: document.querySelectorAll("[role='dialog'], dialog").length,
  };

  const body = document.body;
  const bodyWidth = body?.clientWidth ?? 0;
  const scrollWidth = document.documentElement.scrollWidth;
  const scrollHeight = document.documentElement.scrollHeight;
  const totalElements = document.querySelectorAll("*").length;
  const density = computeDensity(totalElements, bodyWidth * (body?.clientHeight ?? 0));

  return {
    hostname,
    urlPathKind,
    counts,
    hasPasswordFields,
    hasPaymentFields,
    hasSensitiveForms,
    detectedRoles: detectRoles(),
    colorPalette: samplePalette(),
    typography: summarizeTypography(),
    layout: { bodyWidth, scrollWidth, scrollHeight, density },
  };
}
