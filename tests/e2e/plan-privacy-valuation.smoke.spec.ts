import { execFileSync } from "node:child_process";
import { test, expect, type Page } from "@playwright/test";
import {
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_TRUE,
} from "@/shared/constants/financial-privacy";

const FIXTURE_COMMAND = ["scripts/plan-valuation-fixture.mjs"];
const fixtureGoal = (state: string) => `PLAN 13B.1 ${state}`;

async function signIn(page: Page) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(process.env.E2E_USER_EMAIL!);
  await page.locator("#login-password").fill(process.env.E2E_USER_PASSWORD!);
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/en\/(home|together\/onboard)/, {
    timeout: 20_000,
  });
  test.skip(
    page.url().includes("/together/onboard"),
    "E2E user has no household",
  );
}

async function assertNoOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test.describe("Plan privacy and valuation", () => {
  test.beforeAll(() => {
    test.skip(
      !process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD,
      "E2E credentials not provided",
    );
    execFileSync("node", [...FIXTURE_COMMAND, "setup"], { stdio: "inherit" });
  });

  test.afterAll(() => {
    execFileSync("node", [...FIXTURE_COMMAND, "cleanup"], { stdio: "inherit" });
  });

  test("390px VI/light validates privacy ON and indeterminate funding", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      [FINANCIAL_PRIVACY_STORAGE_KEY, FINANCIAL_PRIVACY_STORAGE_TRUE],
    );
    await signIn(page);

    await page.goto("/vi/plan");
    await expect(page.getByTestId("plan-hub")).toBeVisible();
    await expect(page.getByTestId("plan-home-recommendations")).toBeVisible();
    await assertNoOverflow(page);

    await page.goto("/vi/plan/jars");
    await expect(page.getByTestId("plan-jars")).toBeVisible();
    await assertNoOverflow(page);

    await page.goto("/vi/plan/goals");
    await expect(page.getByTestId("plan-goals")).toBeVisible();
    await expect(page.getByText(fixtureGoal("current"))).toBeVisible();
    await expect(page.getByText(fixtureGoal("stale"))).toBeVisible();
    await expect(page.getByText(fixtureGoal("unknown"))).toBeVisible();
    await expect(page.getByText(fixtureGoal("mixed"))).toBeVisible();
    await expect(page.getByText("••••••").first()).toBeVisible();
    await assertNoOverflow(page);

    const unknownLink = page
      .locator("a")
      .filter({ hasText: fixtureGoal("unknown") })
      .first();
    await unknownLink.click();
    await expect(page.getByTestId("plan-goal-detail")).toBeVisible();
    await expect(
      page
        .getByText(/Chưa xác định được giá trị|Một phần tiến độ chưa thể tính/)
        .first(),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/0\s?₫|0%/);

    await page.goto("/vi/plan/goals");
    await page
      .locator("a")
      .filter({ hasText: fixtureGoal("stale") })
      .first()
      .click();
    await expect(
      page
        .getByText(
          /Gia tri co the da cu|Giá trị có thể đã cũ|Giá trị đầu tư có thể đã cũ/,
        )
        .first(),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      /Chưa xác định được giá trị/,
    );

    await page.goto("/vi/plan/ritual");
    await expect(page.getByTestId("plan-ritual-page")).toBeVisible();
    await expect(page.getByTestId("monthly-review-report")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Quick Close/i);
    await assertNoOverflow(page);
  });

  test("440px EN/dark validates privacy OFF and known/stale/mixed states", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 440, height: 900 });
    await page.emulateMedia({ colorScheme: "dark" });
    await signIn(page);

    await page.goto("/en/plan");
    await expect(page.getByTestId("plan-hub")).toBeVisible();
    await expect(page.getByTestId("plan-home-recommendations")).toBeVisible();
    await assertNoOverflow(page);

    await page.goto("/en/plan/goals");
    await page
      .locator("a")
      .filter({ hasText: fixtureGoal("current") })
      .first()
      .click();
    await expect(page.getByTestId("plan-goal-detail")).toBeVisible();
    await expect(page.getByText("Value updated").first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      /not determined|indeterminate/i,
    );

    await page.goto("/en/plan/goals");
    await page
      .locator("a")
      .filter({ hasText: fixtureGoal("mixed") })
      .first()
      .click();
    await expect(
      page.getByText("Part of this progress cannot be calculated yet").last(),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/0\s?₫|0%/);

    await page.goto("/en/plan/ritual");
    await expect(page.getByTestId("monthly-review-report")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Quick Close/i);
    await expect(page.locator("body")).not.toContainText(
      /[a-z]+\.[a-z]+\.[a-z]+/i,
    );
    await assertNoOverflow(page);
  });
});
