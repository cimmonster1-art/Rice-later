import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Builds the popup + options React pages into dist/extension.
// Content script and service worker are bundled separately by build.mjs
// (they must be single, non-module IIFE / module files for the extension).
export default defineConfig({
  plugins: [react()],
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
