import { execFileSync } from "node:child_process";

export default function globalTeardown(): void {
  execFileSync(process.execPath, ["scripts/e2e-auth-fixture.mjs", "cleanup"], {
    stdio: "inherit",
  });
}
