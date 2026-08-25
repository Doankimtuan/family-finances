import { expect, test, type Page } from "@playwright/test";
import { authenticateE2EUser } from "./support/auth";

const ACCOUNT_DETAIL_SCENARIOS = [
  {
    name: "390-light",
    width: 390,
    height: 844,
    colorScheme: "light" as const,
  },
  {
    name: "440-dark",
    width: 440,
    height: 956,
    colorScheme: "dark" as const,
  },
  {
    name: "768-light",
    width: 768,
    height: 960,
    colorScheme: "light" as const,
  },
  {
    name: "1280-dark",
    width: 1280,
    height: 900,
    colorScheme: "dark" as const,
  },
];

async function signIn(page: Page) {
  await authenticateE2EUser(page);
}

async function accountHrefs(page: Page): Promise<string[]> {
  await page.goto("/en/money/accounts");
  await expect(page).toHaveURL(/\/en\/money$/, { timeout: 20_000 });
  const links = page.locator('a[href^="/en/money/accounts/"]');
  const hrefs: string[] = [];
  const count = await links.count();

  for (let index = 0; index < count; index += 1) {
    const href = await links.nth(index).getAttribute("href");
    if (href && /^\/en\/money\/accounts\/[^/?]+$/.test(href)) {
      hrefs.push(href);
    }
  }

  return [...new Set(hrefs)];
}

async function detailHrefs(page: Page, hrefs: string[]) {
  let normalHref: string | null = null;
  let cardHref: string | null = null;

  for (const href of hrefs) {
    await page.goto(href);
    const isCard =
      (await page
        .getByTestId("money-account-detail")
        .getAttribute("data-account-kind")) === "credit-card";
    if (isCard) {
      cardHref = href;
    } else {
      normalHref = href;
    }
    if (normalHref && cardHref) break;
  }

  return { normalHref, cardHref };
}

test.describe("Account-detail redesign", () => {
  for (const scenario of ACCOUNT_DETAIL_SCENARIOS) {
    test(`keeps account and card detail flows usable at ${scenario.name}`, async ({
      page,
    }) => {
      await signIn(page);
      await page.setViewportSize(scenario);
      await page.emulateMedia({ colorScheme: scenario.colorScheme });

      const hrefs = await accountHrefs(page);
      test.skip(hrefs.length === 0, "No account available for inspection");
      const { normalHref, cardHref } = await detailHrefs(page, hrefs);

      if (normalHref) {
        await page.goto(normalHref);
        await expect(page.getByTestId("money-account-detail")).toBeVisible();
        await expect(page.getByText("Balance")).toBeVisible();
        await expect(page.getByTestId("account-quick-capture")).toBeVisible();
        await expect(page.getByTestId("account-management-open")).toBeVisible();
        await page.screenshot({
          path: `screenshots/account-detail-normal-${scenario.name}.png`,
          fullPage: true,
        });
        await page.getByTestId("account-management-open").click();
        await expect(page.getByTestId("account-edit-open")).toBeVisible();
        await page.keyboard.press("Escape");
      }

      if (cardHref) {
        await page.goto(cardHref);
        await expect(page.getByTestId("credit-card-hero")).toBeVisible();
        await expect(page.getByTestId("card-payment-open")).toBeVisible();
        await expect(page.getByTestId("card-installments")).toBeVisible();
        await page.screenshot({
          path: `screenshots/account-detail-card-${scenario.name}.png`,
          fullPage: true,
        });
        await page.getByTestId("card-payment-open").click();
        const paymentSheet = page.getByRole("dialog");
        await expect(paymentSheet).toBeVisible();
        await expect(
          paymentSheet.getByTestId("card-settle-amount"),
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(paymentSheet).toHaveCount(0);
        await page.getByTestId("account-management-open").click();
        await expect(page.getByTestId("card-refund-open")).toBeVisible();
        await page.keyboard.press("Escape");
      }
    });
  }
});
