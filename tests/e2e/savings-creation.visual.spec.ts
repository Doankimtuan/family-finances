import { test, expect } from "@playwright/test";

test.describe("Savings creation visual contract", () => {
  test.setTimeout(120_000);

  test("three-step flow stays focused and responsive", async ({ page }) => {
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
      page.url().includes("/together/onboard"),
      "E2E user has no household",
    );

    for (const width of [390, 440, 768, 1280]) {
      await page.setViewportSize({ width, height: 860 });
      await page.emulateMedia({
        colorScheme: width === 440 ? "dark" : "light",
        reducedMotion: "reduce",
      });
      const route = `${width === 440 ? "/en" : "/vi"}/money/savings/new`;
      await page.goto(route);
      await expect(page.getByTestId("money-savings-new").first()).toBeVisible({
        timeout: 20_000,
      });
      const wizard = page.getByTestId("savings-create-wizard");
      test.skip(
        (await wizard.count()) === 0,
        "Savings create wizard unavailable",
      );
      await expect(
        page.getByTestId("savings-step-indicator").first(),
      ).toBeVisible();
      await expect(
        page.locator('[data-slot="bottom-navigation"]'),
      ).toBeHidden();
      await expect(
        page.locator('[data-testid^="savings-provider-"]').first(),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid^="savings-package-"]').first(),
      ).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
      await page.screenshot({
        path: test.info().outputPath(`savings-product-${width}.png`),
        fullPage: true,
      });

      await page.locator('[data-testid^="savings-package-"]').first().click();
      await page.getByTestId("savings-wizard-next").first().click();
      await expect(page.getByTestId("savings-estimate").first()).toBeVisible();
      await expect(page.getByText(/Term details|Thông tin kỳ hạn/)).toHaveCount(
        0,
      );
      await page.getByTestId("savings-create-mode-historical").click();
      await expect(
        page.locator('[data-testid^="savings-source-"]'),
      ).toHaveCount(0);
      await expect(
        page.getByText(/No source account|Không có tài khoản nguồn/),
      ).toBeVisible();
      await page.getByTestId("savings-create-mode-live").click();
      await expect(
        page.locator('[data-testid^="savings-source-"]').first(),
      ).toBeVisible();
      await page.locator("#savings-principal").fill("1000000");
      await page.locator("#savings-principal").focus();
      await expect(page.getByTestId("savings-estimate").first()).toContainText(
        width === 440 ? "1,000,000" : "1.000.000",
      );
      await expect(
        page.getByTestId("savings-wizard-next").first(),
      ).toBeVisible();
      await page.screenshot({
        path: test.info().outputPath(`savings-deposit-${width}.png`),
        fullPage: true,
      });

      await page.getByTestId("savings-wizard-next").first().click();
      await expect(
        page.getByTestId("savings-review-summary").first(),
      ).toBeVisible();
      await page.screenshot({
        path: test.info().outputPath(`savings-review-${width}.png`),
        fullPage: true,
      });
    }
  });
});
