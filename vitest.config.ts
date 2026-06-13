import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Default environment is node; DOM-based tests opt in per-file with
    //   // @vitest-environment jsdom
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    globals: true,
  },
});
