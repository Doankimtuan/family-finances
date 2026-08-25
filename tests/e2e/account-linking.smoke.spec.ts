import { test, expect } from "@playwright/test";
import {
  AUTH_CONFIRM_ERROR_CODE,
  AUTH_CONFIRM_QUERY,
  AUTH_CONFIRM_STATUS,
  localeConfirmPath,
} from "@/modules/tenancy/application/auth-constants";

function confirmErrorPath(locale: string, code: string): string {
  const qs = new URLSearchParams({
    [AUTH_CONFIRM_QUERY.STATUS]: AUTH_CONFIRM_STATUS.ERROR,
    [AUTH_CONFIRM_QUERY.CODE]: code,
  });
  return `${localeConfirmPath(locale)}?${qs.toString()}`;
}

test.describe("Account linking conflict UX (ST-E02-005)", () => {
  test("identity conflict shows fail-closed Alert on confirm", async ({
    page,
  }) => {
    await page.goto(
      confirmErrorPath("en", AUTH_CONFIRM_ERROR_CODE.IDENTITY_CONFLICT),
    );
    await expect(page.getByTestId("auth-confirm")).toBeVisible();
    await expect(page.getByText("Could not link accounts")).toBeVisible();
    await expect(
      page.getByText(/already linked to another account/i),
    ).toBeVisible();
    await expect(page.locator("#app-viewport-root")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(
      0,
    );
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test("linking_disabled and duplicate_account codes render", async ({
    page,
  }) => {
    await page.goto(
      confirmErrorPath("en", AUTH_CONFIRM_ERROR_CODE.LINKING_DISABLED),
    );
    await expect(page.getByText("Could not link accounts")).toBeVisible();
    await expect(
      page.getByText(/This sign-in method can't be linked right now/i),
    ).toBeVisible();

    await page.goto(
      confirmErrorPath("en", AUTH_CONFIRM_ERROR_CODE.DUPLICATE_ACCOUNT),
    );
    await expect(
      page.getByText(/An account with this email already exists/i),
    ).toBeVisible();
  });

  test("vi locale has linking conflict copy", async ({ page }) => {
    await page.goto(
      confirmErrorPath("vi", AUTH_CONFIRM_ERROR_CODE.IDENTITY_CONFLICT),
    );
    await expect(page.getByText("Không thể liên kết tài khoản")).toBeVisible();
  });
});
