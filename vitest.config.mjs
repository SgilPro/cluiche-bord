import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  css: false,
  test: {
    environment: "happy-dom",
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
