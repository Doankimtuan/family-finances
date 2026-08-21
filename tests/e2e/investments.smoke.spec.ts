import { expect, test, type Page } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

const runId = Date.now().toString();

async function signIn(page: Page, locale: "en" | "vi") {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  test.skip(!email || !password, "E2E credentials not provided");
  await page.goto(`/${locale}/login`);
  await page.getByLabel(locale === "vi" ? "Email" : "Email").fill(email!);
  await page.locator("#login-password").fill(password!);
  await page
    .getByRole("button", { name: locale === "vi" ? "Đăng nhập" : "Log in" })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/${locale}/(home|together/onboard)`),
    { timeout: 20_000 },
  );
  test.skip(page.url().includes(APP_PATH.ONBOARD), "E2E user has no household");
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
}

async function chooseInvestment(page: Page, label: string, option: string) {
  await page.locator(`button[aria-label="${label}"]`).click();
  await page.getByRole("option", { name: option }).click();
}

async function importPosition(
  page: Page,
  locale: "en" | "vi",
  input: {
    name: string;
    symbol: string;
    quantity: string;
    basis: string;
    valuation: string;
  },
) {
  await page.goto(`/${locale}${APP_PATH.MONEY_INVESTMENTS_NEW}`);
  await expect(
    page.getByTestId("investment-opening-form").first(),
  ).toBeVisible();
  await page.getByTestId("investment-type-crypto").first().click();
  await page.getByTestId("investment-opening-next").first().click();
  await page.locator("#investment-name").fill(input.name);
  await page.locator("#investment-symbol").fill(input.symbol);
  await page.locator("#investment-provider").fill("G1 Custodian");
  await page.locator("#investment-quantity").fill(input.quantity);
  await page.locator("#investment-cost-per-unit").fill(input.basis);
  await page
    .locator("#investment-current-unit-valuation")
    .fill(input.valuation);
  await page.getByTestId("investment-opening-review").click();
  await expect(page.getByTestId("investment-opening-preview")).toBeVisible();
  await page.getByTestId("investment-opening-confirm").click();
  await expect(page.getByTestId("investment-detail")).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    page.getByText(new RegExp(`${input.quantity} (units|đơn vị)`)),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
}

test.describe("Investments authenticated money safety", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(240_000);

  test("390px Vietnamese light: opening, fee-inclusive buy, partial and full sell", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await signIn(page, "vi");
    await importPosition(page, "vi", {
      name: `G1 Bitcoin ${runId}`,
      symbol: `GB${runId.slice(-5)}`,
      quantity: "1",
      basis: "1000000",
      valuation: "1200000",
    });

    await page.goto(`/vi${APP_PATH.MONEY}`);
    const beforeCash = await page
      .getByTestId("money-real-position-summary")
      .innerText();
    await page.goto(`/vi${APP_PATH.MONEY_TRANSACTIONS}`);
    const beforeLedgerCount = await page
      .locator("[data-testid^=transaction-row-]")
      .count();
    await page.goto(`/vi${APP_PATH.MONEY_INVESTMENTS}`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .locator("[data-testid^=investment-position-]")
      .filter({ hasText: `GB${runId.slice(-5)}` })
      .click();
    await page.getByRole("link", { name: "Mua" }).click();
    await page.locator("#investment-operation-quantity").fill("0.5");
    await page.locator("#investment-operation-unit-price").fill("1000000");
    await page.getByText("Ghi phí rõ ràng").click();
    await page.locator("#investment-fee-amount").fill("1000");
    await page.locator("#investment-fee-value").fill("1000");
    await page.getByTestId("investment-operation-review").click();
    await page.getByTestId("investment-operation-confirm").click();
    await expect(page.getByText("Đã lưu nghiệp vụ đầu tư")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/Mã liên kết:/).first()).toBeVisible();
    await expect(page.getByText(/1.5 đơn vị/)).toBeVisible();

    for (const quantity of ["0.5", "1"]) {
      await page.getByRole("link", { name: "Bán" }).click();
      if (quantity === "1") {
        await page.getByRole("button", { name: /Bán toàn bộ/ }).click();
      } else {
        await page.locator("#investment-operation-quantity").fill(quantity);
      }
      await page.locator("#investment-operation-unit-price").fill("1200000");
      await expect(page.getByText("Giá trị bán")).toBeVisible();
      await page.getByTestId("investment-operation-review").click();
      await page.getByTestId("investment-operation-confirm").click();
      await expect(page.getByText("Đã lưu nghiệp vụ đầu tư")).toBeVisible({
        timeout: 20_000,
      });
    }
    await expect(page.getByText(/0 đơn vị/)).toBeVisible();
    await expect(page.getByText(/0 ₫|0 ₫/).first()).toBeVisible();
    await page.goto(`/vi${APP_PATH.MONEY_TRANSACTIONS}`);
    const afterLedgerCount = await page
      .locator("[data-testid^=transaction-row-]")
      .count();
    expect(afterLedgerCount).toBeGreaterThan(beforeLedgerCount);
    await page.goto(`/vi${APP_PATH.MONEY}`);
    const afterCash = await page
      .getByTestId("money-real-position-summary")
      .innerText();
    expect(beforeCash.length).toBeGreaterThan(0);
    expect(afterCash.length).toBeGreaterThan(0);
    await expectNoHorizontalOverflow(page);
  });

  test("440px English dark: conversion and valuation create no fabricated cash leg", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 440, height: 900 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await signIn(page, "en");
    await importPosition(page, "en", {
      name: `G1 USDT ${runId}`,
      symbol: `GU${runId.slice(-5)}`,
      quantity: "100",
      basis: "2500000",
      valuation: "2500000",
    });
    await importPosition(page, "en", {
      name: `G1 Ether ${runId}`,
      symbol: `GE${runId.slice(-5)}`,
      quantity: "1",
      basis: "1000000",
      valuation: "1100000",
    });
    await page.goto(`/en${APP_PATH.MONEY}`);
    const beforeCash = await page
      .getByTestId("money-real-position-summary")
      .first()
      .innerText();
    await page.goto(`/en${APP_PATH.MONEY_INVESTMENTS_CONVERT}`);
    await chooseInvestment(page, "Source holding", `GU${runId.slice(-5)}`);
    await chooseInvestment(page, "Destination holding", `GE${runId.slice(-5)}`);
    await page.locator("#investment-operation-quantity").fill("10");
    await page.locator("#investment-destination-quantity").fill("0.1");
    await page.locator("#investment-operation-value").fill("250000");
    await page.getByTestId("investment-operation-review").click();
    await page.getByTestId("investment-operation-confirm").click();
    await expect(page.getByText("Investment operation saved")).toBeVisible({
      timeout: 20_000,
    });
    await page.goto(`/en${APP_PATH.MONEY}`);
    expect(
      await page.getByTestId("money-real-position-summary").first().innerText(),
    ).toBe(beforeCash);
    await page.goto(`/en${APP_PATH.MONEY_INVESTMENTS}`);
    await page
      .locator("[data-testid^=investment-position-]")
      .filter({ hasText: `GE${runId.slice(-5)}` })
      .click();
    await page.getByRole("link", { name: "Update price" }).click();
    await page.locator("#investment-operation-unit-price").fill("1400000");
    await page.getByTestId("investment-operation-review").click();
    await page.getByTestId("investment-operation-confirm").click();
    await expect(page).toHaveURL(/receipt=/, { timeout: 20_000 });
    await page.getByRole("link", { name: "Dividend" }).click();
    await page.locator("#investment-operation-value").fill("10000");
    await page.getByTestId("investment-operation-review").click();
    await page.getByTestId("investment-operation-confirm").click();
    await expect(page).toHaveURL(/receipt=/, { timeout: 20_000 });
    await page.goto(`/en${APP_PATH.MONEY_TRANSACTIONS}`);
    await expect(page.getByRole("main")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
