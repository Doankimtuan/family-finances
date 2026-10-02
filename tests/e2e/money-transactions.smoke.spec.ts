import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

const TRANSACTION_LIST_VIEWPORT_WIDTHS = [390, 440, 768, 1280] as const;
const TRANSACTION_LIST_VIEWPORT_HEIGHT = 900;
const TRANSACTION_LIST_COLOR_SCHEMES = ["light", "dark"] as const;

test.describe("Money transactions list/detail/edit (ST-E04-003)", () => {
  test.describe.configure({ mode: "serial" });

  test("unauthenticated transactions redirects to login", async ({ page }) => {
    await page.goto("/en/money/transactions", {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 20_000 });
  });

  test("list and detail shell when E2E credentials exist", async ({ page }) => {
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

    await page.goto("/en/money/transactions");
    const appViewport = page.locator("#app-viewport-root");
    await expect(appViewport.getByTestId("money-transactions")).toBeVisible();
    await expect(appViewport.getByTestId("transactions-filter")).toBeVisible();
    await expect(appViewport.getByTestId("money-capture")).toBeVisible();

    for (const colorScheme of TRANSACTION_LIST_COLOR_SCHEMES) {
      await page.emulateMedia({ colorScheme });
      await expect(page.locator("html")).toHaveClass(new RegExp(colorScheme));

      for (const width of TRANSACTION_LIST_VIEWPORT_WIDTHS) {
        await page.setViewportSize({
          width,
          height: TRANSACTION_LIST_VIEWPORT_HEIGHT,
        });
        await expect(
          appViewport.getByTestId("transactions-filter"),
        ).toBeVisible();
        const hasHorizontalOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        expect(hasHorizontalOverflow, `${width}px ${colorScheme}`).toBe(false);

        await appViewport.getByTestId("transactions-open-filters").click();
        const filterSheet = page.getByRole("dialog");
        await expect(filterSheet.getByLabel("Search tags")).toBeVisible();
        await expect(
          filterSheet.getByRole("group", { name: "Tags" }),
        ).toHaveCount(1);

        const tagGroup = filterSheet.getByRole("group", { name: "Tags" });
        const tagRows = tagGroup.locator("button[aria-pressed]");
        if (await tagRows.count()) {
          const [rowWidth, fieldsetWidth] = await Promise.all([
            tagRows
              .first()
              .evaluate((element) => element.getBoundingClientRect().width),
            tagGroup.evaluate(
              (element) => element.getBoundingClientRect().width,
            ),
          ]);
          expect(rowWidth).toBe(fieldsetWidth);
        }

        await page.keyboard.press("Escape");
        await expect(filterSheet).toBeHidden();
      }
    }
  });
});
