import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  APP_PATH,
  moneySavingsPath,
} from "@/modules/tenancy/application/app-path";

const SAVINGS_FIXTURE_PATH = "output/playwright/savings-lifecycle-fixture.json";
const SAVINGS_FIXTURE_PREFIX = "e2e-savings-f6";
const APP_SURFACE_SELECTOR = "#app-viewport-root";

type SavingsFixture = {
  fixtures: { "early-withdrawal": { savingId: string } };
};

function loadSavingsFixture(): SavingsFixture {
  return JSON.parse(
    readFileSync(SAVINGS_FIXTURE_PATH, "utf8"),
  ) as SavingsFixture;
}

function surface(page: Page) {
  return page.locator(APP_SURFACE_SELECTOR);
}

test.describe("Savings overview and creation", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    execFileSync("node", ["scripts/savings-lifecycle-fixture.mjs"], {
      stdio: "inherit",
      env: {
        ...process.env,
        SAVINGS_FIXTURE_PREFIX,
        SAVINGS_FIXTURE_PATH,
      },
    });
  });

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
    await expect(surface(page).getByTestId("money-savings")).toBeVisible({
      timeout: 20_000,
    });
    await expect(surface(page).getByTestId("savings-add-open")).toBeVisible();

    await page.goto("/en/money/savings/new");
    await expect(surface(page).getByTestId("money-savings-new")).toBeVisible({
      timeout: 20_000,
    });
    const wizard = surface(page).getByTestId("savings-create-wizard");
    if ((await wizard.count()) > 0) {
      await expect(wizard).toBeVisible();
      await expect(
        surface(page).getByTestId("savings-step-indicator"),
      ).toBeVisible();
      await expect(
        surface(page).getByTestId(
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
        await surface(page).getByTestId("savings-wizard-next").click();
        await expect(
          surface(page).getByTestId("savings-estimate"),
        ).toBeVisible();
        await page.locator("#savings-principal").fill("1000000");
        await expect(
          surface(page).getByTestId("savings-estimate"),
        ).toContainText("1,000,000");
        await page.screenshot({
          path: test.info().outputPath("savings-deposit.png"),
          fullPage: true,
        });
        await surface(page).getByTestId("savings-wizard-next").click();
        await expect(
          surface(page).getByTestId("savings-review-summary"),
        ).toBeVisible();
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
    const { savingId } = loadSavingsFixture().fixtures["early-withdrawal"];
    await page.goto(`/en${moneySavingsPath(savingId)}`);
    await expect(surface(page).getByTestId("savings-detail")).toBeVisible({
      timeout: 20_000,
    });
    await expect(surface(page).getByTestId("savings-identity")).toBeVisible();
    await expect(
      surface(page).getByTestId("savings-cycle-facts"),
    ).toBeVisible();

    await surface(page).getByTestId("savings-early-withdraw").click();
    await expect(
      surface(page).getByTestId("money-savings-early-withdraw"),
    ).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      surface(page).getByTestId("savings-early-withdraw-preview"),
    ).toBeVisible();
    await expect(
      surface(page).getByTestId("savings-early-withdraw-request"),
    ).toBeVisible();
  });
});
