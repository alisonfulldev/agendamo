import { defineConfig, devices } from "@playwright/test";

/** Screens sweep against the local demo mode (npm run test:e2e:demo). */
const PORT = Number(process.env.DEMO_E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e/demo",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  timeout: 300_000,
  expect: { timeout: 30_000 },
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  webServer: {
    command: "node scripts/dev-demo.mjs",
    env: { PORT: String(PORT) },
    url: `${baseURL}/api/health`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
