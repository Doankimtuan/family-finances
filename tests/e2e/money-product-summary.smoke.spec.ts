import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import {
  FINANCIAL_PRIVACY_MASK,
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_TRUE,
} from "@/shared/constants/financial-privacy";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

const viewports = [
  { width: 360, height: 800, locale: "vi" as const, theme: "dark" as const },
  { width: 390, height: 844, locale: "vi" as const, theme: "light" as const },
  { width: 430, height: 932, locale: "en" as const, theme: "dark" as const },
  { width: 440, height: 956, locale: "en" as const, theme: "light" as const },
  { width: 768, height: 1024, locale: "en" as const, theme: "light" as const },
  { width: 1280, height: 720, locale: "en" as const, theme: "dark" as const },
] as const;
const MONEY_EVIDENCE_DIR =
  ".agents/design-redesign/implementation/07-main-screens/evidence/money-overview";

async function login(page: Page) {
  await page.goto(`/en${APP_PATH.LOGIN}`);
  await page.getByLabel("Email").fill(process.env.E2E_USER_EMAIL ?? "");
  await page
    .locator("#login-password:visible")
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

async function captureActionCollidesWithMoneyRows(page: Page) {
  return page.evaluate(() => {
    const action = document.querySelector('[data-testid="money-capture"]');
    if (!(action instanceof HTMLElement)) return false;
    const actionRect = action.getBoundingClientRect();
    return [
      ...document.querySelectorAll(
        '[data-testid="money-hub-account-row"], [data-testid="money-hub-credit-card-row"], [data-testid^="money-link-"]',
      ),
    ].some((row) => {
      const rowRect = row.getBoundingClientRect();
      return (
        actionRect.left < rowRect.right &&
        actionRect.right > rowRect.left &&
        actionRect.top < rowRect.bottom &&
        actionRect.bottom > rowRect.top
      );
    });
  });
}

async function assertMoneySurface(page: Page) {
  await page.addStyleTag({ content: "nextjs-portal { display: none; }" });
  const surface = page.locator("#app-viewport-root");
  const locale = new URL(page.url()).pathname.split("/")[1];
  await expect(surface.getByTestId("money-hub")).toBeVisible();
  await expect(
    surface.getByTestId("money-real-position-summary"),
  ).toBeVisible();
  await expect(
    surface.getByTestId("money-real-position-summary"),
  ).toContainText(/Tracked household assets|Tài sản đang theo dõi/);
  await expect(surface.getByTestId("money-accounts-scan")).toBeVisible();
  await expect(surface.getByTestId("money-see-activity")).toBeVisible();
  await expect(surface.getByTestId("money-see-activity")).toHaveAttribute(
    "href",
    `/${locale}${APP_PATH.MONEY_TRANSACTIONS}`,
  );
  await expect(surface.getByTestId("money-ledger-entry")).toHaveCount(0);
  const navigation = page.locator('[data-slot="bottom-navigation"]');
  await expect(navigation.locator("li")).toHaveCount(5);
  await expect(navigation.getByRole("link")).toHaveCount(4);
  await expect(navigation.getByRole("button")).toHaveCount(1);
  await expect(navigation.locator("svg")).toHaveCount(5);
  await expect(navigation.locator("svg").first()).toBeVisible();
  const accountIcon = surface
    .getByTestId("money-hub-account-row")
    .first()
    .locator("span[aria-hidden='true']")
    .first();
  await expect(accountIcon).toHaveCSS("width", "28px");
  await expect(accountIcon).toHaveCSS("height", "28px");
  await expect(accountIcon.locator("svg")).toHaveCSS("width", "14px");
  const savingsIcon = surface
    .getByTestId("money-link-savings")
    .locator("span[aria-hidden='true']")
    .first();
  await expect(savingsIcon).toHaveCSS("width", "40px");
  await expect(savingsIcon.locator("svg")).toHaveCSS("width", "20px");
  await expect(
    surface
      .getByTestId("money-link-savings")
      .locator('[data-slot="status-badge"]'),
  ).toBeVisible();
  await expect(surface.getByTestId("money-link-savings")).toContainText(
    /active saving|sổ đang gửi/i,
  );
  await expect(
    surface.getByTestId("money-asset-allocation-legend"),
  ).toHaveAttribute("aria-label", /Asset allocation|Phân bổ tài sản/);
  await expect(
    surface.getByTestId("money-asset-allocation-legend"),
  ).toContainText(/Accounts|Tài khoản/);
  await expect(
    surface.getByTestId("money-asset-allocation-legend"),
  ).toContainText(/Savings|Tiết kiệm/);
  await expect(
    surface.getByTestId("money-asset-allocation-legend"),
  ).toContainText(/Investments|Đầu tư/);
  const allocationColors = await surface
    .getByTestId("money-asset-allocation-strip")
    .locator("span")
    .evaluateAll((segments) =>
      segments.map((segment) => getComputedStyle(segment).backgroundColor),
    );
  expect(new Set(allocationColors).size).toBe(3);
  await expect(surface.getByTestId("money-link-investments")).toContainText(
    /\d+ holdings|\d+ vị thế|\d+\s+of\s+\d+ valued|\d+\/\d+ đã định giá/i,
  );
  await expect(
    surface
      .getByTestId("money-link-investments")
      .locator('[data-slot="status-badge"]'),
  ).toBeVisible();
  await expect(surface.getByTestId("money-link-loans")).toContainText(
    /loan in repayment|khoản đang trả/i,
  );
  await expect(surface.getByTestId("money-link-debts")).toContainText(
    /\d+ borrowed · \d+ lent out|\d+ khoản đang mượn · \d+ khoản cho vay/i,
  );
  await expect(surface.getByTestId("money-link-savings")).toBeVisible();
  await expect(surface.getByTestId("money-link-loans")).toBeVisible();
  await expect(surface.getByTestId("money-link-debts")).toBeVisible();
  await expect(surface.getByTestId("money-link-savings")).toHaveAttribute(
    "href",
    `/${locale}${APP_PATH.MONEY_SAVINGS}`,
  );
  await expect(surface.getByTestId("money-link-investments")).toHaveAttribute(
    "href",
    `/${locale}${APP_PATH.MONEY_INVESTMENTS}`,
  );
  await expect(surface.getByTestId("money-link-loans")).toHaveAttribute(
    "href",
    `/${locale}${APP_PATH.MONEY_LOANS}`,
  );
  await expect(surface.getByTestId("money-link-debts")).toHaveAttribute(
    "href",
    `/${locale}${APP_PATH.MONEY_DEBTS}`,
  );
  await expect(
    surface.getByTestId("money-accounts-route-link"),
  ).toHaveAttribute("href", `/${locale}${APP_PATH.MONEY_ACCOUNTS}`);
  await expect(
    surface.getByTestId("money-hub-account-row").first(),
  ).toHaveAttribute(
    "href",
    new RegExp(`^/${locale}${APP_PATH.MONEY_ACCOUNTS}/[^/]+$`),
  );
  await expect(surface.locator("main")).not.toContainText(/money\.|hub\./);
  const captureAction = navigation.getByTestId("money-capture");
  await expect(captureAction).toHaveCSS("flex-direction", "column");
  await expect(captureAction).toHaveAccessibleName(
    /Add transaction|Thêm giao dịch/i,
  );
  await expect(captureAction).toContainText(locale === "en" ? "Add" : "Thêm");
  await expect(
    page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).resolves.toBe(true);
  expect(await captureActionCollidesWithMoneyRows(page)).toBe(false);
}

async function assertNavigationCaptureActionAtPageEnd(page: Page) {
  await page.locator('[data-slot="shell-scroll-region"]').evaluate((region) => {
    region.scrollTop = region.scrollHeight;
  });

  const navigation = page.locator('[data-slot="bottom-navigation"]');
  const action = navigation.getByTestId("money-capture");
  await expect(action).toBeInViewport();
  expect(await captureActionCollidesWithMoneyRows(page)).toBe(false);
  await expect(
    action.evaluate((button) =>
      Boolean(button.closest('[data-slot="bottom-navigation"]')),
    ),
  ).resolves.toBe(true);
}

test.describe("Money product summaries", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  test.beforeAll(() => {
    test.skip(
      !process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD,
      "E2E credentials not provided",
    );
    execFileSync(
      process.execPath,
      ["scripts/home-product-summary-fixture.mjs", "setup"],
      {
        stdio: "inherit",
      },
    );
  });

  test.afterAll(() => {
    if (process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD) {
      execFileSync(
        process.execPath,
        ["scripts/home-product-summary-fixture.mjs", "cleanup"],
        {
          stdio: "inherit",
        },
      );
    }
  });

  for (const viewport of viewports) {
    test(`${viewport.width}px ${viewport.locale}/${viewport.theme} Money summary`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({
        colorScheme: viewport.theme,
        reducedMotion: "reduce",
      });
      await login(page);
      await page.goto(`/${viewport.locale}${APP_PATH.MONEY}`);
      await assertMoneySurface(page);
      await page.screenshot({
        path: `${MONEY_EVIDENCE_DIR}/current-after-${viewport.width}x${viewport.height}-${viewport.locale}-${viewport.theme}.png`,
      });
      await page.getByTestId("money-modules-growing").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `${MONEY_EVIDENCE_DIR}/current-growing-${viewport.width}x${viewport.height}-${viewport.locale}-${viewport.theme}.png`,
      });
      await page.getByTestId("money-modules-owed").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `${MONEY_EVIDENCE_DIR}/current-obligations-${viewport.width}x${viewport.height}-${viewport.locale}-${viewport.theme}.png`,
      });
      const visiblePreviewRowCount =
        (await page
          .locator('[data-testid="money-hub-account-row"]:visible')
          .count()) +
        (await page
          .locator('[data-testid="money-hub-credit-card-row"]:visible')
          .count());
      expect(visiblePreviewRowCount).toBeLessThanOrEqual(5);
      await assertNavigationCaptureActionAtPageEnd(page);
      await page.screenshot({
        path: `${MONEY_EVIDENCE_DIR}/current-after-bottom-${viewport.width}x${viewport.height}-${viewport.locale}-${viewport.theme}.png`,
      });
    });
  }

  test("account total opens the complete account list and keeps it collapsible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await login(page);
    await page.goto(`/en${APP_PATH.MONEY}`);

    const totalLink = page.getByTestId("money-accounts-route-link");
    const headerAlignment = await totalLink.evaluate((link) => {
      const header = link.closest<HTMLElement>('[data-slot="section-heading"]');
      const title = header?.firstElementChild?.getBoundingClientRect();
      const action = link.getBoundingClientRect();
      if (!title) return null;
      return Math.abs(
        title.top + title.height / 2 - action.top - action.height / 2,
      );
    });
    expect(headerAlignment).not.toBeNull();
    expect(headerAlignment).toBeLessThan(2);

    await totalLink.click();
    await expect(page).toHaveURL(new RegExp(`/en${APP_PATH.MONEY_ACCOUNTS}$`));

    const surface = page.locator("#app-viewport-root");
    await expect(surface.getByTestId("money-accounts-directory")).toBeVisible();
    await expect(surface.getByTestId("money-accounts-scan")).toBeVisible();
    await expect(surface.getByTestId("money-create-account")).toBeVisible();
    await page.screenshot({
      path: `${MONEY_EVIDENCE_DIR}/current-accounts-directory-430x932-en-dark.png`,
    });
    await page.getByTestId("money-create-account").click();
    await expect(page.getByTestId("account-add-form")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("Money domain rows use one divider and a subtle hover state", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await login(page);
    for (const theme of ["dark", "light"] as const) {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto(`/en${APP_PATH.MONEY}`);

      const surface = page.locator("#app-viewport-root");
      for (const testId of [
        "money-link-savings",
        "money-link-investments",
        "money-link-loans",
        "money-link-debts",
      ]) {
        await expect(
          surface
            .getByTestId(testId)
            .locator("..")
            .locator(":scope > span[aria-hidden='true']"),
        ).toHaveCount(0);
      }

      const row = surface.getByTestId("money-link-debts");
      await row.hover();
      await expect
        .poll(() =>
          row.evaluate((element) => getComputedStyle(element).backgroundColor),
        )
        .not.toBe("rgba(0, 0, 0, 0)");
      await page.screenshot({
        path: `${MONEY_EVIDENCE_DIR}/current-hover-430x932-en-${theme}.png`,
      });
    }
  });

  test("long labels, expanded copy, and large balances stay in the narrow layout", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await login(page);
    await page.goto(`/en${APP_PATH.MONEY}`);
    await assertMoneySurface(page);
    await page.getByTestId("money-see-activity").focus();
    await page.keyboard.press("Tab");
    const accountsLink = page.getByTestId("money-accounts-route-link");
    await expect(accountsLink).toBeFocused();
    await expect
      .poll(() =>
        accountsLink.evaluate((element) => element.matches(":focus-visible")),
      )
      .toBe(true);

    const layout = await page.evaluate(() => {
      const account = document.querySelector(
        '[data-testid="money-hub-account-row"]',
      );
      const accountLabel = account?.querySelector<HTMLElement>(".truncate");
      const accountAmount = account?.querySelector<HTMLElement>(
        "[data-financial-kind]",
      );
      const savings = document.querySelector(
        '[data-testid="money-link-savings"]',
      );
      const savingsLabel = savings?.querySelector<HTMLElement>(".truncate");
      const savingsAmount = savings?.querySelector<HTMLElement>(
        "[data-financial-kind]",
      );
      const summary = document.querySelector(
        '[data-testid="money-real-position-summary"]',
      );
      const summaryCopy = summary?.querySelector<HTMLElement>(".text-pretty");

      if (
        !(account instanceof HTMLElement) ||
        !accountLabel ||
        !accountAmount ||
        !savingsLabel ||
        !savingsAmount ||
        !summaryCopy
      ) {
        return null;
      }

      accountLabel.textContent =
        "Very Long Household Account and Provider Name for Layout Verification";
      accountAmount.textContent = "₫999,999,999,999";
      savingsLabel.textContent =
        "Savings and Long Term Investment Domain Label for Layout Verification";
      summaryCopy.textContent =
        "Expanded household asset explanation used to confirm that longer supporting copy wraps naturally without covering the privacy control, allocation legend, or transaction link.";

      const textBounds = (element: HTMLElement) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return range.getBoundingClientRect();
      };
      const accountText = accountLabel.getBoundingClientRect();
      const amountText = textBounds(accountAmount);
      const savingsText = savingsLabel.getBoundingClientRect();
      const savingsValue = textBounds(savingsAmount);
      const accountBounds = account.getBoundingClientRect();

      return {
        noPageOverflow:
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
        accountAndAmountSeparated: accountText.right <= amountText.left,
        accountValueWithinRow: amountText.right <= accountBounds.right,
        domainAndAmountSeparated: savingsText.right <= savingsValue.left,
      };
    });

    expect(layout).not.toBeNull();
    expect(layout).toMatchObject({
      noPageOverflow: true,
      accountAndAmountSeparated: true,
      accountValueWithinRow: true,
      domainAndAmountSeparated: true,
    });
    await page.screenshot({
      path: `${MONEY_EVIDENCE_DIR}/current-after-content-stress-360x800-en-dark.png`,
    });
  });

  test("privacy masks Money amounts but keeps holdings count and attention context", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 440, height: 956 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await login(page);
    await page.evaluate(
      ([key, value]) => localStorage.setItem(key, value),
      [FINANCIAL_PRIVACY_STORAGE_KEY, FINANCIAL_PRIVACY_STORAGE_TRUE],
    );
    await page.goto(`/en${APP_PATH.MONEY}`);
    const surface = page.locator("#app-viewport-root");
    await expect(
      surface.getByTestId("money-real-position-summary"),
    ).toContainText(FINANCIAL_PRIVACY_MASK);
    await expect(surface.getByTestId("money-link-investments")).toContainText(
      "3 of 4 valued",
    );
    await expect(surface.getByTestId("money-link-savings")).toContainText(
      /need action|needs action/,
    );
  });
});
