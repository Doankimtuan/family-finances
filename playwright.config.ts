import { defineConfig, devices } from "@playwright/test";
import {
  assertE2EEnvironmentPolicy,
  hasE2ECredentials,
  printE2EEnvironmentDiagnostic,
} from "./tests/e2e/support/env";
import { E2E_AUTH_STATE_PATH } from "./tests/e2e/support/auth";

assertE2EEnvironmentPolicy();
printE2EEnvironmentDiagnostic();

const e2ePort = process.env.E2E_PORT ?? "3100";
const e2eBaseUrl = process.env.E2E_BASE_URL ?? `http://localhost:${e2ePort}`;
const hasAuth = hasE2ECredentials();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    // Prefer localhost so macOS can reach Next on IPv6 when another process holds IPv4:3000.
    baseURL: e2eBaseUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /auth\.setup\.ts|auth-protected\.smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    ...(hasAuth
      ? [
          {
            name: "auth-setup",
            testMatch: /auth\.setup\.ts/,
            use: { ...devices["Desktop Chrome"] },
          },
          {
            name: "authenticated-chromium",
            dependencies: ["auth-setup"],
            testMatch: /auth-protected\.smoke\.spec\.ts/,
            use: {
              ...devices["Desktop Chrome"],
              storageState: E2E_AUTH_STATE_PATH,
            },
          },
        ]
      : []),
  ],
  webServer: {
    command: `npm run dev -- -p ${e2ePort}`,
    url: e2eBaseUrl,
    reuseExistingServer: true,
  },
});
