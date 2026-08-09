import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Together settings (Phase F7)", () => {
  test.setTimeout(90_000);

  test("profile, theme, locale, and household preferences remain scoped", async ({
    page,
  }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!email || !password, "E2E credentials not provided");

    await page.goto("/en/login");
    await page.getByLabel("Email").fill(email!);
    await page.locator("#login-password").fill(password!);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/en\/(home|together\/onboard)/, {
      timeout: 20_000,
    });
    test.skip(
      page.url().includes(APP_PATH.ONBOARD),
      "E2E user has no household",
    );

    await page.goto("/en/money");
    const financialStateBefore = await page
      .getByTestId("ledger-balance")
      .innerText();

    await page.goto("/en/together/settings");
    await expect(page.getByTestId("together-settings-page")).toBeVisible();
    await expect(page.getByText(email!)).toBeVisible();

    const darkTheme = page.getByRole("button", { name: "Dark" });
    await darkTheme.click();
    await expect(darkTheme).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(page.getByRole("button", { name: "Dark" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.getByRole("button", { name: /VI.*Vietnamese/i }).click();
    await expect(page).toHaveURL(/\/vi\/together\/settings/);
    await expect(page.getByTestId("together-settings-page")).toBeVisible();

    await page.goto("/vi/together/preferences");
    await expect(page.getByTestId("household-preferences")).toBeVisible();
    await expect(page.getByText("VND", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Asia/Ho_Chi_Minh", { exact: true }),
    ).toBeVisible();

    await page.goto("/vi/money");
    const financialStateAfter = await page
      .getByTestId("ledger-balance")
      .innerText();
    expect(financialStateAfter.replace(/[^\d-]/g, "")).toBe(
      financialStateBefore.replace(/[^\d-]/g, ""),
    );
  });
});
