import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import {
  FINANCIAL_PRIVACY_MASK,
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_TRUE,
} from "@/shared/constants/financial-privacy";

const viewports = [
  { width: 390, height: 844, locale: "vi" as const, theme: "light" as const },
  { width: 440, height: 956, locale: "en" as const, theme: "dark" as const },
  { width: 768, height: 1024, locale: "en" as const, theme: "light" as const },
  { width: 1280, height: 720, locale: "en" as const, theme: "dark" as const },
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

async function assertMoneySurface(page: Page) {
  const surface = page.locator("#app-viewport-root");
  await expect(surface.getByTestId("money-hub")).toBeVisible();
  await expect(
    surface.getByTestId("money-real-position-summary"),
  ).toBeVisible();
  await expect(surface.getByTestId("money-accounts-scan")).toBeVisible();
  await expect(surface.getByTestId("money-link-investments")).toContainText(
    /Partial estimate|Giá trị một phần/,
  );
  await expect(surface.getByTestId("money-link-savings")).toContainText(
    /need action|needs action|cần xử lý/,
  );
  await expect(surface.locator("main")).not.toContainText(/money\.|hub\./);
  await expect(
    page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).resolves.toBe(true);
}

test.describe("Money 16B authenticated certification", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

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
      await page.goto(`/${viewport.locale}/money`);
      await assertMoneySurface(page);
    });
  }

  test("privacy masks Money amounts but keeps valuation and attention context", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 440, height: 956 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await login(page);
    await page.evaluate(
      ([key, value]) => localStorage.setItem(key, value),
      [FINANCIAL_PRIVACY_STORAGE_KEY, FINANCIAL_PRIVACY_STORAGE_TRUE],
    );
    await page.goto("/en/money");
    const surface = page.locator("#app-viewport-root");
    await expect(
      surface.getByTestId("money-real-position-summary"),
    ).toContainText(FINANCIAL_PRIVACY_MASK);
    await expect(surface.getByTestId("money-link-investments")).toContainText(
      "Partial estimate",
    );
    await expect(surface.getByTestId("money-link-savings")).toContainText(
      "need action",
    );
  });
});
