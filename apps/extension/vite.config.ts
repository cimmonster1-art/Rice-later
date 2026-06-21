import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Builds the popup + options React pages into dist/extension.
// Content script and service worker are bundled separately by build.mjs
// (they must be single, non-module IIFE / module files for the extension).
//
// The backend base URL is injected at build time from VITE_API_URL so a
// production build points at the deployed API instead of localhost. esbuild
// injects the same constant for the content script / service worker bundles
// (see build.mjs), keeping every extension surface in sync.
const API_BASE = (process.env.VITE_API_URL ?? "").trim();

export default defineConfig({
  plugins: [react()],
  define: {
    __RICELAYER_API_BASE__: JSON.stringify(API_BASE),
  },
  build: {
    outDir: resolve(__dirname, "../../dist/extension"),
    emptyOutDir: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "index.html"),
        options: resolve(__dirname, "options.html"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
