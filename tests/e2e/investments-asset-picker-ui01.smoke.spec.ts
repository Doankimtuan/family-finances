import { expect, test } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { authenticateE2EUser } from "./support/auth";

async function openAsset(
  page: import("@playwright/test").Page,
  locale: "vi" | "en",
  asset: string,
) {
  await page.goto(`/${locale}${APP_PATH.MONEY_INVESTMENTS_NEW}`);
  await page.getByTestId(`investment-type-${asset}`).first().click();
  await page.getByTestId("investment-opening-next").first().click();
}

test.describe("Investment asset picker UI 01", () => {
  test.beforeEach(async ({ page }) => {
    await authenticateE2EUser(page);
  });

  test("VI stock picker keeps the custom holding name and supports manual fallback", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await openAsset(page, "vi", "stock");

    await page
      .getByTestId("investment-instrument-picker-trigger")
      .first()
      .click();
    await expect(
      page.getByTestId("investment-instrument-search").first(),
    ).toBeFocused();
    await page.getByTestId("investment-instrument-search").first().fill("FPT");
    await expect(
      page.getByTestId("investment-instrument-FPT").first(),
    ).toBeVisible();
    await page.getByTestId("investment-instrument-FPT").first().click();
    await expect(
      page.getByTestId("investment-instrument-picker-trigger").first(),
    ).toContainText("FPT");
    await expect(page.getByText("Giá tự động")).toBeVisible();

    await page.locator("#investment-name").fill("FPT dài hạn");
    await page.locator("#investment-quantity").fill("10");
    await page.getByTestId("investment-opening-review").first().click();
    await expect(page.getByTestId("investment-opening-preview")).toContainText(
      "FPT dài hạn",
    );
    await expect(page.getByTestId("investment-opening-preview")).toContainText(
      "FPT",
    );

    await page.getByRole("button", { name: "Quay lại" }).click();
    await page
      .getByTestId("investment-instrument-picker-trigger")
      .first()
      .click();
    await page
      .getByTestId("investment-instrument-search")
      .first()
      .fill("ui01-no-match");
    await expect(
      page.getByTestId("investment-instrument-manual").first(),
    ).toBeVisible();
    await page.getByTestId("investment-instrument-manual").first().click();
    await expect(
      page.getByTestId("investment-instrument-picker-trigger").first(),
    ).toContainText("Theo dõi thủ công");
  });

  test("EN crypto, fund, and bond flows expose contract-specific labels", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 440, height: 900 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });

    await openAsset(page, "en", "crypto");
    await page
      .getByTestId("investment-instrument-picker-trigger")
      .first()
      .click();
    await page.getByTestId("investment-instrument-search").first().fill("BTC");
    await expect(
      page.getByTestId("investment-instrument-BTC").first(),
    ).toBeVisible();
    await page.getByTestId("investment-instrument-BTC").first().click();
    await page.getByText("I am buying / investing right now").click();
    await expect(page.getByText("Purchase price / BTC")).toBeVisible();

    await openAsset(page, "en", "fund");
    await page
      .getByTestId("investment-instrument-picker-trigger")
      .first()
      .click();
    await page.getByTestId("investment-instrument-search").first().fill("PVBF");
    await expect(
      page.getByTestId("investment-instrument-PVBF").first(),
    ).toBeVisible();
    await page.getByTestId("investment-instrument-PVBF").first().click();
    await page.getByText("I am buying / investing right now").click();
    await expect(page.getByText("Fund units", { exact: true })).toBeVisible();
    await expect(page.getByText("NAV / unit", { exact: true })).toBeVisible();

    await openAsset(page, "en", "bond");
    await page.getByText("I am buying / investing right now").click();
    await expect(page.getByText("Total value")).toBeVisible();
    await expect(page.getByText("Where is money coming from?")).toBeVisible();
  });

  for (const width of [768, 1280]) {
    test(`preserves the mobile shell at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({
        colorScheme: "light",
        reducedMotion: "reduce",
      });
      await openAsset(page, "vi", "stock");
      await expect(
        page.getByTestId("investment-instrument-picker-trigger").first(),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      ).toBe(true);
    });
  }
});
