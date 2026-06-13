/**
 * Extension-side CSS sanitizer (second line of defense).
 *
 * The backend sanitizes CSS first; the extension sanitizes AGAIN before
 * injecting anything into a live page. This module is intentionally
 * dependency-free and self-contained.
 *
 * Philosophy: CSS only. No script, no JS execution vectors, no full-screen
 * hijacking, no hiding of functional UI via broad selectors.
 */

export interface SanitizeResult {
  /** Cleaned CSS safe to inject. May have offending blocks/declarations stripped. */
  css: string;
  /** True when nothing dangerous was found. */
  safe: boolean;
  /** Human-readable notes about what was removed or flagged. */
  removed: string[];
}

/** Selectors that must never be hidden / disabled by a broad rule. */
const PROTECTED_BROAD_SELECTORS = [
  "html",
  "body",
  "*",
  "main",
  "form",
  "input",
  "button",
  "a",
  "nav",
  "select",
  "textarea",
  "label",
  "fieldset",
];

const DANGEROUS_PATTERNS: Array<{ re: RegExp; reason: string }> = [
  { re: /<\s*script/gi, reason: "script tag" },
  { re: /<\/\s*script/gi, reason: "script tag" },
  { re: /javascript\s*:/gi, reason: "javascript: URL" },
  { re: /expression\s*\(/gi, reason: "CSS expression()" },
  { re: /(?<![-\w])behavior\s*:/gi, reason: "IE behavior:" },
  { re: /-moz-binding/gi, reason: "-moz-binding" },
  { re: /vbscript\s*:/gi, reason: "vbscript: URL" },
  { re: /@import/gi, reason: "@import (remote stylesheet)" },
];

/** Strip CSS comments to make pattern matching reliable. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Split top-level CSS into blocks. Naive but sufficient: we only need to
 * inspect selector + declaration pairs and at-rules. Handles nested braces
 * (e.g. @media) by tracking depth.
 */
interface CssBlock {
  prelude: string; // selector or at-rule prelude
  body: string; // raw inner text (declarations or nested rules)
  raw: string;
}

function splitBlocks(css: string): CssBlock[] {
  const blocks: CssBlock[] = [];
  let depth = 0;
  let preludeStart = 0;
  let prelude = "";
  let bodyStart = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === "{") {
      if (depth === 0) {
        prelude = css.slice(preludeStart, i);
        bodyStart = i + 1;
      }
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const body = css.slice(bodyStart, i);
        blocks.push({
          prelude: prelude.trim(),
          body,
          raw: css.slice(preludeStart, i + 1),
        });
        preludeStart = i + 1;
      }
    }
  }
  return blocks;
}

function isRiceLayerOwned(selector: string): boolean {
  return /ricelayer/i.test(selector);
}

/** Detect a declaration that hides/disables content broadly. */
function hasDangerousDeclaration(selector: string, body: string): string | null {
  const decls = body.toLowerCase();
  const selectorList = selector
    .toLowerCase()
    .split(",")
    .map((s) => s.trim());

  const touchesProtectedBroad = selectorList.some((sel) => {
    // exact broad targets like "body", "*", "input" (not ".body" or "#body")
    const normalized = sel.replace(/\s+/g, " ").trim();
    return PROTECTED_BROAD_SELECTORS.includes(normalized);
  });

  if (touchesProtectedBroad) {
    if (/pointer-events\s*:\s*none/.test(decls)) {
      return "global pointer-events:none on protected selector";
    }
    if (/display\s*:\s*none/.test(decls)) {
      return "display:none on broad/protected selector";
    }
    if (/visibility\s*:\s*hidden/.test(decls)) {
      return "visibility:hidden on broad/protected selector";
    }
    if (/opacity\s*:\s*0(\.0+)?\b/.test(decls)) {
      return "opacity:0 on broad/protected selector";
    }
  }

  // Full-screen overlay hijack on non-RiceLayer selectors.
  if (!isRiceLayerOwned(selector)) {
    const fixedOrSticky = /position\s*:\s*(fixed|sticky)/.test(decls);
    const coversViewport =
      /(width|min-width)\s*:\s*100(vw|%)/.test(decls) &&
      /(height|min-height)\s*:\s*100(vh|%)/.test(decls);
    if (fixedOrSticky && coversViewport) {
      return "full-screen fixed overlay on non-RiceLayer selector";
    }
    // Absurd z-index on non-owned selectors.
    const zMatch = decls.match(/z-index\s*:\s*(\d{6,})/);
    if (zMatch) {
      return `excessive z-index (${zMatch[1]}) on non-RiceLayer selector`;
    }
  }

  return null;
}

/**
 * Sanitize a CSS string. Removes dangerous blocks and global escape hatches.
 * Returns cleaned css, a safe flag, and a list of removed items.
 */
export function sanitizeCss(input: string): SanitizeResult {
  const removed: string[] = [];

  if (typeof input !== "string") {
    return { css: "", safe: false, removed: ["css was not a string"] };
  }

  let css = stripComments(input);

  // 1. Hard-reject dangerous textual patterns by stripping them entirely.
  for (const { re, reason } of DANGEROUS_PATTERNS) {
    if (re.test(css)) {
      removed.push(reason);
      css = css.replace(re, "/* removed */");
    }
  }

  // Strip any url(javascript:...) or remote @import leftovers and data: scripts.
  css = css.replace(/url\(\s*['"]?\s*javascript:[^)]*\)/gi, "url()");

  // 2. Walk blocks and drop dangerous rules.
  const blocks = splitBlocks(css);
  const kept: string[] = [];

  for (const block of blocks) {
    if (!block.prelude && !block.body.trim()) continue;

    // At-rules that wrap nested rules (@media, @supports, @layer): recurse.
    if (block.prelude.startsWith("@")) {
      if (/^@import/i.test(block.prelude)) {
        removed.push("@import at-rule");
        continue;
      }
      if (/^@(media|supports|layer|container)/i.test(block.prelude)) {
        const inner = sanitizeCss(block.body);
        if (inner.removed.length) removed.push(...inner.removed);
        if (inner.css.trim()) {
          kept.push(`${block.prelude} {${inner.css}}`);
        }
        continue;
      }
      // Keep @keyframes, @font-face (system stacks only checked below), etc.
      if (/^@font-face/i.test(block.prelude)) {
        // Disallow remote src in @font-face — only allow local()/system.
        if (/src\s*:[^;}]*url\(/i.test(block.body)) {
          removed.push("@font-face with remote url() src");
          continue;
        }
      }
      kept.push(block.raw);
      continue;
    }

    const danger = hasDangerousDeclaration(block.prelude, block.body);
    if (danger) {
      removed.push(`${danger} (selector: ${block.prelude.slice(0, 60)})`);
      continue;
    }
    kept.push(block.raw);
  }

  const cleaned = kept.join("\n").trim();
  return {
    css: cleaned,
    safe: removed.length === 0,
    removed,
  };
}

/** Convenience: returns true if the CSS is fully safe with no modifications. */
export function isCssSafe(css: string): boolean {
  return sanitizeCss(css).safe;
}
