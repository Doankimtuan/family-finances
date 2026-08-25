import { execFileSync } from "node:child_process";
import { test, expect, type Page } from "@playwright/test";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";

const viewports = [
  { width: 390, height: 844, path: "/vi/home", stale: "Định giá đã cũ" },
  { width: 440, height: 956, path: "/en/home", stale: "Valuation stale" },
  { width: 768, height: 1024, path: "/en/home", stale: "Valuation stale" },
  { width: 1280, height: 720, path: "/en/home", stale: "Valuation stale" },
] as const;

async function login(page: Page) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(process.env.E2E_USER_EMAIL ?? "");
  await page
    .locator("#login-password")
    .fill(process.env.E2E_USER_PASSWORD ?? "");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/en\/(home|together\/onboard)/, {
    timeout: 20_000,
  });
  test.skip(
    page.url().includes("/together/onboard"),
    "E2E user has no household",
  );
}

test.describe("Home 14C.1 product summaries", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeAll(() => {
    test.skip(
      !process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD,
      "E2E credentials not provided",
    );
    execFileSync(process.execPath, ["scripts/home-14c1-fixture.mjs", "setup"], {
      stdio: "inherit",
    });
  });
  test.afterAll(() => {
    if (process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD) {
      execFileSync(
        process.execPath,
        ["scripts/home-14c1-fixture.mjs", "cleanup"],
        { stdio: "inherit" },
      );
    }
  });

  for (const viewport of viewports) {
    test(`${viewport.width}px renders product attention truthfully`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await login(page);
      await page.goto(viewport.path);
      const summary = page.getByTestId(HOME_TEST_ID.PRODUCT_SUMMARIES);
      await expect(summary).toBeVisible();
      await expect(summary).toContainText(viewport.stale);
      await expect(summary).toContainText(/partial|một phần|2\/3/);
      await expect(summary).toContainText(/maturity|xử lý|attention|chú ý/i);
      await expect(
        page.getByTestId(HOME_TEST_ID.FINANCIAL_PULSE),
      ).toBeVisible();
      await expect(page.getByTestId(HOME_TEST_ID.CAPTURE_ACTION)).toBeVisible();
      await expect(page.getByTestId(HOME_TEST_ID.PLAN_PULSE)).toBeVisible();
      await expect(
        page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      ).resolves.toBe(true);
      await expect(summary).not.toContainText(/home\.|productSummary\./);
    });
  }

  test("one unavailable Investment read leaves Home usable", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/en/home?homeProductFailure=investments");
    const summary = page.getByTestId(HOME_TEST_ID.PRODUCT_SUMMARIES);
    await expect(summary).toContainText("Investments");
    await expect(summary).toContainText("temporarily unavailable");
    await expect(page.getByTestId(HOME_TEST_ID.FINANCIAL_PULSE)).toBeVisible();
    await expect(page.getByTestId(HOME_TEST_ID.CAPTURE_ACTION)).toBeVisible();
  });

  test("privacy masks product money without hiding attention context", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 440, height: 956 });
    await login(page);
    await page.goto("/en/home");
    const toggle = page.getByTestId(HOME_TEST_ID.FINANCIAL_PRIVACY_TOGGLE);
    await toggle.click();
    await expect(
      page.getByTestId(HOME_TEST_ID.PRODUCT_SUMMARIES),
    ).toContainText("Valuation stale");
    await expect(
      page.getByTestId(HOME_TEST_ID.PRODUCT_SUMMARIES),
    ).toContainText("••••");
  });
});
