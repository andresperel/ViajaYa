import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    ...devices["Desktop Edge"],
    channel: "msedge",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5173",
    // API calls in this suite are intercepted, so an already running local Vite
    // preview can be reused without writing to its backend.
    reuseExistingServer: true,
    timeout: 30000,
  },
});
