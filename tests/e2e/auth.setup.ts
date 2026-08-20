import { test } from "@playwright/test";
import {
  authenticateE2EUser,
  ensureE2EAuthDirectories,
  E2E_AUTH_STATE_PATH,
} from "./support/auth";

test("authenticate configured E2E user", async ({ page }) => {
  test.setTimeout(60_000);
  await ensureE2EAuthDirectories();
  await authenticateE2EUser(page);
  await page.context().storageState({ path: E2E_AUTH_STATE_PATH });
});
