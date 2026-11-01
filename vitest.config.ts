import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Domain tests don't touch CSS; skip the project's Tailwind v4 postcss
  // config, whose string-form plugin list Vite's loader can't resolve.
  css: {
    postcss: { plugins: [] },
  },
  test: {
    environment: "node",
  },
});
