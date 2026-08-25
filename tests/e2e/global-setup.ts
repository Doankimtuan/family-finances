import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

type E2EAuthFixture = {
  email: string;
  password: string;
};

export default function globalSetup(): void {
  execFileSync(process.execPath, ["scripts/e2e-auth-fixture.mjs", "setup"], {
    stdio: "inherit",
  });
  const fixture = JSON.parse(
    readFileSync("output/playwright/e2e-auth-fixture.json", "utf8"),
  ) as E2EAuthFixture;
  process.env.E2E_USER_EMAIL = fixture.email;
  process.env.E2E_USER_PASSWORD = fixture.password;
}
