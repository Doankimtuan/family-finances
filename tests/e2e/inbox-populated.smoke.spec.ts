import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import {
  FINANCIAL_PRIVACY_MASK,
  FINANCIAL_PRIVACY_STORAGE_FALSE,
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_TRUE,
} from "@/shared/constants/financial-privacy";
import { THEME_STORAGE_KEY } from "@/providers/theme-provider";

const FIXTURE_COMMAND = ["scripts/inbox-populated-fixture.mjs"];
const ITEM = (index: number) =>
  `18c10000-0000-4000-8000-${String(index).padStart(12, "0")}`;
const TITLE = (index: number) => `INBOX 18C1 ${String(index).padStart(2, "0")}`;
function expectedUnreadBadge() {
  const state = JSON.parse(
    readFileSync("output/playwright/inbox-populated-fixture.json", "utf8"),
  ) as { baselineUnreadCount: number };
  return String(state.baselineUnreadCount + 74);
}

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

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

async function setClientState(
  page: Page,
  privacy: "on" | "off",
  theme: "light" | "dark",
) {
  await page.addInitScript(
    ([privacyKey, privacyValue, themeKey, themeValue]) => {
      if (!window.localStorage.getItem(privacyKey)) {
        window.localStorage.setItem(privacyKey, privacyValue);
      }
      if (!window.localStorage.getItem(themeKey)) {
        window.localStorage.setItem(themeKey, themeValue);
      }
    },
    [
      FINANCIAL_PRIVACY_STORAGE_KEY,
      privacy === "on"
        ? FINANCIAL_PRIVACY_STORAGE_TRUE
        : FINANCIAL_PRIVACY_STORAGE_FALSE,
      THEME_STORAGE_KEY,
      theme,
    ],
  );
}

test.describe("Inbox populated queue", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    test.skip(
      !process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD,
      "E2E credentials not provided",
    );
    execFileSync(process.execPath, [...FIXTURE_COMMAND, "setup"], {
      stdio: "inherit",
    });
  });

  test.afterAll(() => {
    execFileSync(process.execPath, [...FIXTURE_COMMAND, "cleanup"], {
      stdio: "inherit",
    });
  });

  test("390px VI/light: read state, pagination, unavailable source, privacy", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await setClientState(page, "off", "light");
    await signIn(page);
    await page.goto("/vi/inbox");

    await expect(page.getByTestId("inbox-queue")).toBeVisible();
    await expect(page.locator("[data-testid^='inbox-item-link-']")).toHaveCount(
      25,
    );
    await expect(
      page.getByTestId(`inbox-item-link-${ITEM(1)}`),
    ).toHaveAttribute("aria-label", /Chưa đọc/);
    await expect(page.getByTestId("inbox-badge")).toHaveText(
      expectedUnreadBadge(),
    );

    await page.getByTestId(`inbox-item-link-${ITEM(1)}`).click();
    await expect(page.getByTestId("inbox-detail")).toBeVisible();
    await expect(page.getByTestId("inbox-lifecycle-context")).toContainText(
      /Quá hạn|Đến hạn/,
    );
    await page.getByTestId("inbox-read-state").click();
    await expect(page.getByTestId("inbox-read-state")).toHaveText(
      "Đánh dấu chưa đọc",
    );
    await expect(page.getByTestId("inbox-archived-status")).toHaveCount(0);
    await page.getByTestId("inbox-read-state").click();
    await expect(page.getByTestId("inbox-read-state")).toHaveText(
      "Đánh dấu đã đọc",
    );
    await page.goto("/vi/inbox");
    await expect(page.getByTestId("inbox-badge")).toHaveText(
      expectedUnreadBadge(),
    );

    await page.getByTestId("inbox-load-more").click();
    await expect(page.locator("[data-testid^='inbox-item-link-']")).toHaveCount(
      50,
    );
    await page.getByTestId("inbox-load-more").click();
    await expect(page.locator("[data-testid^='inbox-item-link-']")).toHaveCount(
      75,
    );
    await expect(page.getByTestId(`inbox-item-link-${ITEM(75)}`)).toBeVisible();

    await page.getByTestId(`inbox-item-link-${ITEM(4)}`).click();
    await expect(page.getByText("Nguồn không khả dụng")).toBeVisible();
    await expect(page.getByTestId("inbox-dismiss")).toHaveCount(0);
    await page.goto("/vi/inbox");
    await expect(page.getByTestId(`inbox-item-link-${ITEM(1)}`)).toBeVisible();

    await page.goto("/vi/home");
    const viPrivacyToggle = page.getByTestId("home-financial-privacy-toggle");
    await viPrivacyToggle.click();
    await expect(viPrivacyToggle).toHaveAttribute("aria-pressed", "true");
    await page.goto("/vi/inbox");
    await expect(page.getByTestId("inbox-amount").first()).toContainText(
      FINANCIAL_PRIVACY_MASK,
    );
    await expect(page.getByText(TITLE(4))).toBeVisible();
    await noOverflow(page);
  });

  test("440px EN/dark: owner/non-owner capability and privacy", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 440, height: 956 });
    await page.emulateMedia({ colorScheme: "dark" });
    await setClientState(page, "off", "dark");
    await signIn(page);
    await page.goto("/en/inbox");

    await expect(
      page.getByText("Loan payment attention").first(),
    ).toBeVisible();
    await expect(
      page.getByText("Debt payment attention").first(),
    ).toBeVisible();
    await page.getByTestId(`inbox-item-link-${ITEM(1)}`).click();
    await expect(page.getByTestId("inbox-dismiss")).toBeVisible();
    await page.getByTestId("inbox-read-state").click();
    await expect(page.getByTestId("inbox-read-state")).toHaveText(
      "Mark as unread",
    );
    await page.getByTestId("inbox-read-state").click();
    await expect(page.getByTestId("inbox-read-state")).toHaveText(
      "Mark as read",
    );

    await page.goto("/en/inbox");
    await page.getByTestId(`inbox-item-link-${ITEM(2)}`).click();
    await expect(page.getByText("Owner action required")).toBeVisible();
    await expect(page.getByTestId("inbox-dismiss")).toHaveCount(0);
    await expect(page.getByTestId("inbox-read-state")).toBeVisible();
    await noOverflow(page);

    await page.goto("/en/home");
    await page.getByTestId("home-financial-privacy-toggle").click();
    await page.goto("/en/inbox");
    await page.getByTestId(`inbox-item-link-${ITEM(2)}`).click();
    await expect(page.getByTestId("inbox-amount").first()).toContainText(
      FINANCIAL_PRIVACY_MASK,
    );
    await expect(page.getByText("Owner action required")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/inbox\.[a-z]/i);
    await noOverflow(page);
  });

  for (const width of [768, 1280]) {
    test(`${width}px regression: queue, pagination, and detail`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: "light" });
      await setClientState(page, "off", "light");
      await signIn(page);
      await page.goto("/en/inbox");
      await expect(
        page.locator("[data-testid^='inbox-item-link-']"),
      ).toHaveCount(25);
      await page.getByTestId("inbox-load-more").click();
      await expect(
        page.locator("[data-testid^='inbox-item-link-']"),
      ).toHaveCount(50);
      await page.getByTestId(`inbox-item-link-${ITEM(1)}`).click();
      await expect(page.getByTestId("inbox-detail")).toBeVisible();
      await noOverflow(page);
    });
  }
});
