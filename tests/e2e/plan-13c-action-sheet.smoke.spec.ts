import { execFileSync } from "node:child_process";
import { test, expect, type Page } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

type Locale = "en" | "vi";

async function signIn(page: Page, locale: Locale) {
  await page.goto(`/${locale}${APP_PATH.LOGIN}`);
  await page.getByLabel("Email").fill(process.env.E2E_USER_EMAIL!);
  await page.locator("#login-password").fill(process.env.E2E_USER_PASSWORD!);
  await page
    .getByRole("button", { name: locale === "vi" ? "Đăng nhập" : "Log in" })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/${locale}/(home|together/onboard)`),
    { timeout: 20_000 },
  );
  test.skip(page.url().includes(APP_PATH.ONBOARD), "E2E user has no household");
}

async function assertResponsiveSurface(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator("body")).not.toContainText(
    /plan\.(jars|goals|monthlyReview)\./,
  );
}

async function assertActionSheet(page: Page) {
  const body = page.locator('[data-slot="action-sheet-body"]');
  const footer = page.locator('[data-slot="action-sheet-footer"]');
  await expect(body).toBeVisible();
  await expect(footer).toBeVisible();
  await expect(body).toHaveCSS("overflow-y", "auto");

  const primary = footer.getByRole("button").last();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  await expect
    .poll(async () => {
      const box = await primary.boundingBox();
      return box ? viewport!.height - (box.y + box.height) : -1;
    })
    .toBeGreaterThanOrEqual(8);
  await assertResponsiveSurface(page);
}

test.describe("PLAN 13C action-sheet certification", () => {
  test.beforeAll(() => {
    test.skip(
      !process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD,
      "E2E credentials not provided",
    );
    execFileSync("node", ["scripts/plan-13b1-fixture.mjs", "setup"], {
      stdio: "inherit",
    });
  });

  test.afterAll(() => {
    execFileSync("node", ["scripts/plan-13b1-fixture.mjs", "cleanup"], {
      stdio: "inherit",
    });
  });

  test.beforeEach(() => {
    test.skip(
      !process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD,
      "E2E credentials not provided",
    );
  });

  test("390px VI/light: Plan create actions, focus, reduced motion, and Review", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await signIn(page, "vi");

    await page.goto(`/vi${APP_PATH.PLAN}`);
    await expect(page.getByTestId("plan-hub")).toBeVisible();
    await assertResponsiveSurface(page);

    await page.goto(`/vi${APP_PATH.PLAN_JARS}`);
    await page.getByTestId("jar-create-open").click();
    await expect(page.getByTestId("jar-create-form")).toBeVisible();
    await assertActionSheet(page);
    await page.keyboard.press("Tab");
    expect(
      await page
        .locator('[data-slot="action-sheet-body"]')
        .evaluate((node) => node.contains(document.activeElement)),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("jar-create-form")).toBeHidden();

    await page.goto(`/vi${APP_PATH.PLAN_GOALS}`);
    await page.getByTestId("goal-create-open").click();
    await expect(page.getByTestId("goal-create-form")).toBeVisible();
    await assertActionSheet(page);
    await page.keyboard.press("Escape");

    await page.goto(`/vi${APP_PATH.PLAN_RITUAL}`);
    await expect(page.getByTestId("monthly-review-report")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Quick Close/i);
    await assertResponsiveSurface(page);
  });

  test("440px EN/dark: Jar and Goal edit/action sheets", async ({ page }) => {
    await page.setViewportSize({ width: 440, height: 900 });
    await page.emulateMedia({ colorScheme: "dark" });
    await signIn(page, "en");

    await page.goto(`/en${APP_PATH.PLAN_JARS}`);
    const jar = page.locator('[data-testid^="jar-card-"]').first();
    await expect(jar).toBeVisible();
    await jar.click();
    await page.getByTestId("jar-edit-open").click();
    await expect(page.getByTestId("jar-edit-form")).toBeVisible();
    await assertActionSheet(page);
    await page.keyboard.press("Escape");

    const reallocate = page.getByTestId("jar-reallocate-open");
    if (await reallocate.isVisible().catch(() => false)) {
      await reallocate.click();
      await expect(page.getByTestId("jar-reallocate-form")).toBeVisible();
      await assertActionSheet(page);
      await page.keyboard.press("Escape");
    }

    await page.goto(`/en${APP_PATH.PLAN_GOALS}`);
    const goal = page.locator('[data-testid^="goal-card-"]').first();
    await expect(goal).toBeVisible();
    await goal.click();
    await page.getByTestId("goal-edit-open").click();
    await expect(page.getByTestId("goal-edit-form")).toBeVisible();
    await assertActionSheet(page);
    await page.keyboard.press("Escape");

    const link = page.getByTestId("goal-link-open");
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      await assertActionSheet(page);
      await page.keyboard.press("Escape");
    }
  });

  for (const width of [768, 1280]) {
    test(`${width}px regression keeps the centered shell and action footer`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await signIn(page, "en");
      await page.goto(`/en${APP_PATH.PLAN_GOALS}`);
      expect(
        (await page.getByTestId("plan-goals").boundingBox())!.width,
      ).toBeLessThanOrEqual(440);
      await page.getByTestId("goal-create-open").click();
      await assertActionSheet(page);
    });
  }
});
