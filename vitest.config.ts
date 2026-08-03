import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { fileURLToPath } from "url";

// Separate from vite.config.ts on purpose. That file carries a long postcss
// pipeline built for Safari 14 — logical-property rewrites, cascade-layer
// flattening, a flex-gap polyfill. None of it affects behaviour under jsdom,
// which does not lay anything out, and running it would make every test pay
// for CSS transforms nothing asserts on.
export default defineConfig({
  // svgr because components import icons as `?react` components; without it
  // those imports resolve to a URL string and React refuses to render it.
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
