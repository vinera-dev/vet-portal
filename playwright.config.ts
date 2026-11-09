import { defineConfig, devices } from "@playwright/test";

const APP_PORT = 3200;
const BACKEND_PORT = 8765;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node fake-backend/server.ts",
      url: `http://127.0.0.1:${BACKEND_PORT}/__health`,
      reuseExistingServer: !isCI,
      env: { FAKE_BACKEND_PORT: String(BACKEND_PORT) },
    },
    {
      command: `npx next dev -p ${APP_PORT} -H 127.0.0.1`,
      url: `http://127.0.0.1:${APP_PORT}/`,
      reuseExistingServer: !isCI,
      timeout: 180_000,
      env: {
        VET_API_URL: `http://127.0.0.1:${BACKEND_PORT}`,
        E2E_AUTH: "1",
        AUTH_SECRET: "e2e-secret-not-for-production",
        AUTH_URL: `http://127.0.0.1:${APP_PORT}`,
      },
    },
  ],
});
