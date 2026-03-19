import { defineConfig } from "@playwright/test";

// ── Environment ────────────────────────────────────────────────────────────
// Set defaults here (like Postman environment variables).
// Override per-run with env vars:
//   API_ORIGIN=http://localhost:4000 npx playwright test
process.env.APP_URL ??= "http://localhost:3000";
process.env.API_ORIGIN ??= "https://cluiche-bord.zeabur.app";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.APP_URL,
    headless: true,
  },
  webServer: {
    command: "npm run dev",
    url: process.env.APP_URL,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
