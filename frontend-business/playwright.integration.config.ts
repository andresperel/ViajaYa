import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./integration",
  workers: 1,
  fullyParallel: false,
  reporter: "list",
  timeout: 90000,
  use: {
    baseURL: "http://localhost:5174",
    ...devices["Desktop Edge"],
    channel: "msedge",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm --prefix ../backend run start:business-local",
      url: "http://127.0.0.1:3001/health",
      env: {
        BUSINESS_LOCAL_PORT: "3001",
        BUSINESS_LOCAL_WEB_ORIGIN: "http://localhost:5174",
      },
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: "npm run dev -- --port 5174",
      url: "http://localhost:5174",
      env: { BUSINESS_API_TARGET: "http://127.0.0.1:3001" },
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
});
