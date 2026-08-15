import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Savings Phase F6 smoke", () => {
  test.describe.configure({ mode: "serial" });

  test("overview, detail, create preview, early-withdraw preview", async ({
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

    await page.goto("/en/money/savings");
    await expect(page.getByTestId("money-savings")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("savings-add-open")).toBeVisible();

    await page.goto("/en/money/savings/new");
    await expect(page.getByTestId("money-savings-new")).toBeVisible({
      timeout: 20_000,
    });
    const wizard = page.getByTestId("savings-create-wizard");
    if ((await wizard.count()) > 0) {
      await expect(wizard).toBeVisible();
      await expect(page.getByTestId("savings-step-indicator")).toBeVisible();
      await expect(
        page.getByTestId(
          "savings-provider-" +
            (
              await page
                .locator("[data-testid^=savings-provider-]")
                .first()
                .getAttribute("data-testid")
            ).replace("savings-provider-", ""),
        ),
      ).toBeVisible();
      const firstPackage = page
        .locator("[data-testid^=savings-package-]")
        .first();
      if ((await firstPackage.count()) > 0) {
        await firstPackage.click();
        await page.screenshot({
          path: test.info().outputPath("savings-product.png"),
          fullPage: true,
        });
        await page.getByTestId("savings-wizard-next").click();
        await expect(page.getByTestId("savings-estimate")).toBeVisible();
        await page.locator("#savings-principal").fill("1000000");
        await expect(page.getByTestId("savings-estimate")).toContainText(
          "1,000,000",
        );
        await page.screenshot({
          path: test.info().outputPath("savings-deposit.png"),
          fullPage: true,
        });
        await page.getByTestId("savings-wizard-next").click();
        await expect(page.getByTestId("savings-review-summary")).toBeVisible();
        await expect(
          page.getByText(/You receive at maturity|Maturity amount/).first(),
        ).toBeVisible();
        await page.screenshot({
          path: test.info().outputPath("savings-review.png"),
          fullPage: true,
        });
      }
    }

    await page.goto("/en/money/savings");
    const firstRow = page.locator("[data-testid^=savings-row-]").first();
    if ((await firstRow.count()) === 0) {
      test.info().annotations.push({
        type: "note",
        description: "No active savings for detail/early-withdraw checks",
      });
      return;
    }

    await firstRow.click();
    await expect(page.getByTestId("savings-detail")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("savings-identity")).toBeVisible();
    await expect(page.getByTestId("savings-cycle-facts")).toBeVisible();

    const earlyLink = page.getByTestId("savings-early-withdraw");
    if ((await earlyLink.count()) > 0) {
      await earlyLink.click();
      await expect(
        page.getByTestId("money-savings-early-withdraw"),
      ).toBeVisible({
        timeout: 20_000,
      });
      await expect(
        page.getByTestId("savings-early-withdraw-preview"),
      ).toBeVisible();
      await expect(
        page.getByTestId("savings-early-withdraw-request"),
      ).toBeVisible();
    }
  });
});
