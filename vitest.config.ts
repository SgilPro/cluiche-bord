import { defineConfig } from "vitest/config";
import path from "path";

// So postcss.config.mjs exports no plugins and Vite does not fail
process.env.VITEST = "1";

export default defineConfig({
  root: __dirname,
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    setupFiles: [path.resolve(__dirname, "src/test/setup.ts")],
    server: {
      deps: {
        inline: ["phoenix"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
