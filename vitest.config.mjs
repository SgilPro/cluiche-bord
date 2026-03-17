import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: true,
    setupFiles: [path.resolve(__dirname, "src/test/setup.ts")],
    server: {
      deps: { inline: ["phoenix"] },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
