import { defineConfig, devices } from "@playwright/test";

// E2E は外部 API に依存しない（DATABASE_FILE=prisma/test.db にシード済みデータを使う）
export default defineConfig({
  testDir: "__tests__/e2e",
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- -p 3100",
    url: "http://localhost:3100",
    env: { DATABASE_FILE: "prisma/test.db", DISABLE_VIX: "1" },
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
