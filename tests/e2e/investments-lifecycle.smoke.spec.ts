import { expect, test, type Page } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { authenticateE2EUser } from "./support/auth";

async function openCreate(page: Page, locale: "en" | "vi", asset: string) {
  await page.goto(`/${locale}${APP_PATH.MONEY_INVESTMENTS_NEW}`);
  await page.getByTestId(`investment-type-${asset}`).first().click();
  await page.getByTestId("investment-opening-next").first().click();
}

async function expectNoConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
}

test.describe("Investments lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await authenticateE2EUser(page);
  });

  test("390px VI light covers list, privacy, historical/live modes, and Fund/CCQ", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto(`/vi${APP_PATH.MONEY_INVESTMENTS}`);
    await expect(page.getByTestId("investment-overview-client")).toBeVisible();
    await expect(
      page.locator("[data-testid^=investment-position-]").first(),
    ).toBeVisible();

    await page.getByRole("button", { name: /Đã đóng/ }).click();
    const closed = page.locator("[data-testid^=investment-closed-position-]");
    await expect(closed).not.toHaveCount(0);
    await closed.first().click();
    await expect(page.getByTestId("investment-detail")).toBeVisible();
    await expect(page.getByText("Lịch sử hoạt động")).toBeVisible();
    await page.goBack();

    await page.goto(`/vi${APP_PATH.HOME}`);
    await page.evaluate(() =>
      localStorage.setItem("vinha.financial-values-hidden", "true"),
    );
    await page.goto(`/vi${APP_PATH.MONEY_INVESTMENTS}`);
    await expect(page.getByText("••••••").first()).toBeVisible();
    await page.evaluate(() =>
      localStorage.setItem("vinha.financial-values-hidden", "false"),
    );

    await openCreate(page, "vi", "fund");
    await page.getByText("Tôi đã sở hữu từ trước").click();
    await expect(page.getByText("Tiền lấy từ đâu?")).toHaveCount(0);
    await page.getByText("Tôi mua / đầu tư ngay bây giờ").click();
    await expect(page.getByText("NAV / CCQ")).toBeVisible();
    await expect(page.getByText("Tiền lấy từ đâu?")).toBeVisible();
    await expectNoConsoleErrors(page);
  });

  test("440px EN dark covers unit assets, Bonds, and privacy off", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 440, height: 900 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await openCreate(page, "en", "stock");
    await page.getByText("I am buying / investing right now").click();
    await expect(page.getByText("Purchase price per share")).toBeVisible();
    await expect(page.getByText("Where is money coming from?")).toBeVisible();
    await openCreate(page, "en", "bond");
    await page.getByText("I am buying / investing right now").click();
    await expect(page.getByText("Total value")).toBeVisible();
    await expect(page.getByText("Where is money coming from?")).toBeVisible();
    await page.getByText("I already owned this before").click();
    await expect(page.getByText("Where is money coming from?")).toHaveCount(0);
    await page.goto(`/en${APP_PATH.MONEY_INVESTMENTS}`);
    await page.evaluate(() =>
      localStorage.setItem("vinha.financial-values-hidden", "true"),
    );
    await page.reload();
    await expect(page.getByText("••••••").first()).toBeVisible();
    await page.evaluate(() =>
      localStorage.setItem("vinha.financial-values-hidden", "false"),
    );
    await page.getByRole("button", { name: /Closed/ }).click();
    const closed = page.locator("[data-testid^=investment-closed-position-]");
    await expect(closed).not.toHaveCount(0);
    await closed.first().click();
    await expect(page.getByTestId("investment-detail")).toBeVisible();
    await expect(page.getByText("Activity history")).toBeVisible();
    await expect(page.getByText("BTC")).toHaveCount(0);
    await expectNoConsoleErrors(page);
  });
});
