#!/usr/bin/env node
/**
 * Extension build orchestrator.
 *
 * 1. Builds popup + options React pages with Vite (-> dist/extension).
 * 2. Bundles the content script (IIFE) and service worker (ESM) with esbuild.
 * 3. Copies manifest.json and generates placeholder icons.
 */
import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  mkdirSync,
  copyFileSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const distDir = resolve(root, "../../dist/extension");

const DEFAULT_API_BASE_URL = "http://localhost:8787";

/** Backend base URL injected at build time (empty -> dev default in code). */
const API_BASE = (process.env.VITE_API_URL ?? "").trim();

function log(msg) {
  console.log(`[extension build] ${msg}`);
}

/**
 * Derive a Chrome host-permission match pattern from the backend base URL.
 * e.g. "https://api.example.com"  -> "https://api.example.com/*"
 *      "http://localhost:8787"     -> "http://localhost:8787/*"
 * Falls back to the localhost default if VITE_API_URL is unset or invalid.
 */
function hostPermissionFor(apiUrl) {
  const url = apiUrl && apiUrl.trim() ? apiUrl.trim() : DEFAULT_API_BASE_URL;
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/*`;
  } catch {
    log(`WARNING: VITE_API_URL "${url}" is not a valid URL; using localhost.`);
    const u = new URL(DEFAULT_API_BASE_URL);
    return `${u.protocol}//${u.host}/*`;
  }
}

/**
 * Read the source manifest and rewrite host_permissions so the REQUIRED host
 * permission tracks the configured backend (VITE_API_URL) instead of being
 * permanently pinned to localhost. Optional host permissions (for per-site
 * auto-apply) and everything else are preserved verbatim.
 */
function buildManifest() {
  const manifest = JSON.parse(
    readFileSync(resolve(root, "manifest.json"), "utf8")
  );
  const hostPattern = hostPermissionFor(API_BASE);
  manifest.host_permissions = [hostPattern];
  return { manifest, hostPattern };
}

/** Minimal valid 1x1+ PNG generator for placeholder icons. */
function writePlaceholderIcon(path, size) {
  // A tiny solid-color PNG (cyan square) encoded once; Chrome scales it.
  // 16x16 cyan PNG, base64. Used for all sizes (Chrome rescales).
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAS0lEQVR4nO3OMQ0AIAwEwL9KZ" +
    "GAGFTjAAhKa9JK7+aQ5d2bWzKy7e/cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8MMD" +
    "Cn8B/0nGEZ8AAAAASUVORK5CYII=";
  void size;
  writeFileSync(path, Buffer.from(base64, "base64"));
}

async function run() {
  mkdirSync(distDir, { recursive: true });
  mkdirSync(resolve(distDir, "icons"), { recursive: true });

  log("building popup + options (vite)…");
  await viteBuild({ configFile: resolve(root, "vite.config.ts") });

  // Inject the backend base URL (empty string => code falls back to the dev
  // default). Shared by both bundles and the Vite popup/options build.
  const define = {
    __RICELAYER_API_BASE__: JSON.stringify(API_BASE),
  };

  log("bundling content script + service worker (esbuild)…");
  await esbuild({
    entryPoints: { content: resolve(root, "src/content/contentScript.ts") },
    outfile: resolve(distDir, "content.js"),
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "chrome110",
    minify: true,
    legalComments: "none",
    define,
  });
  await esbuild({
    entryPoints: { background: resolve(root, "src/background/serviceWorker.ts") },
    outfile: resolve(distDir, "background.js"),
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "chrome110",
    minify: true,
    legalComments: "none",
    define,
  });

  log("writing manifest (env-driven host permissions) + icons…");
  const { manifest, hostPattern } = buildManifest();
  writeFileSync(
    resolve(distDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  log(
    `backend: ${API_BASE || `${DEFAULT_API_BASE_URL} (dev default)`} -> ` +
      `host_permissions: ${hostPattern}`
  );
  for (const size of [16, 48, 128]) {
    const iconPath = resolve(distDir, `icons/icon${size}.png`);
    const srcIcon = resolve(root, `icons/icon${size}.png`);
    if (existsSync(srcIcon)) copyFileSync(srcIcon, iconPath);
    else writePlaceholderIcon(iconPath, size);
  }

  log(`done -> ${distDir}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
