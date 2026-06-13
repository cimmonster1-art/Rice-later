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
import { mkdirSync, copyFileSync, writeFileSync, existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const distDir = resolve(root, "../../dist/extension");

function log(msg) {
  console.log(`[extension build] ${msg}`);
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
  });

  log("copying manifest + icons…");
  copyFileSync(resolve(root, "manifest.json"), resolve(distDir, "manifest.json"));
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
