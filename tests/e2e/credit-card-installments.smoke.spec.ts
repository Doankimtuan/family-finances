import { expect, test, type Page } from "@playwright/test";

const scenarios = [
  {
    name: "390px light",
    width: 390,
    height: 844,
    colorScheme: "light" as const,
  },
  { name: "440px dark", width: 440, height: 956, colorScheme: "dark" as const },
  {
    name: "768px light",
    width: 768,
    height: 960,
    colorScheme: "light" as const,
  },
  {
    name: "1280px dark",
    width: 1280,
    height: 900,
    colorScheme: "dark" as const,
  },
];

async function signIn(page: Page) {
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
    page.url().includes("/together/onboard"),
    "E2E account has no household to inspect",
  );
}

function selectTrigger(scope: ReturnType<Page["getByTestId"]>, testId: string) {
  return scope.getByTestId(testId).getByRole("button");
}

async function openAccountSheet(page: Page, useKeyboard: boolean) {
  await page.goto("/en/money");
  await expect(page).toHaveURL(/\/en\/money$/, { timeout: 20_000 });
  const create = page.locator('[data-testid="money-create-account"]:visible');
  await expect(create).toBeVisible({ timeout: 20_000 });
  const form = page.getByTestId("account-add-form");
  if (useKeyboard) {
    await create.focus();
    await page.keyboard.press("Enter");
    if (!(await form.isVisible())) {
      await page.keyboard.press(" ");
    }
    if (!(await form.isVisible())) {
      await create.click();
    }
  } else {
    await create.click();
  }
  await expect(form).toBeVisible({ timeout: 20_000 });
  return form;
}

async function accountHrefs(page: Page): Promise<string[]> {
  await expect(
    page.locator('[data-testid="money-create-account"]:visible'),
  ).toBeVisible({ timeout: 20_000 });
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

test.describe("Canonical credit-card forms and installment tracker", () => {
  for (const scenario of scenarios) {
    test(`renders canonical account controls at ${scenario.name} without submitting`, async ({
      page,
    }) => {
      await signIn(page);
      await page.setViewportSize(scenario);
      await page.emulateMedia({ colorScheme: scenario.colorScheme });
      const form = await openAccountSheet(page, scenario.width < 1280);

      const type = selectTrigger(form, "account-type");
      await expect(type).toBeVisible();
      await type.press("Enter");
      await page.getByRole("option", { name: "Credit card" }).click();

      const cardSettings = form.getByTestId("account-credit-card-settings");
      await expect(cardSettings).toBeVisible();
      await expect(
        selectTrigger(cardSettings, "account-linked-bank"),
      ).toBeVisible();
      await expect(
        cardSettings.getByTestId("account-statement-day").locator("input"),
      ).toHaveAttribute("aria-label", "Statement day (1–31)");
      await expect(
        cardSettings.getByTestId("account-due-day").locator("input"),
      ).toHaveAttribute("aria-label", "Payment due day (1–31)");
      await expect(page.getByTestId("account-add-submit")).toBeEnabled();

      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(form).toHaveCount(0);
    });
  }

  test("shows canonical account edit type control and transaction-led installment setup without saving", async ({
    page,
  }) => {
    await signIn(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/money/accounts");
    await expect(page).toHaveURL(/\/en\/money$/, { timeout: 20_000 });
    const hrefs = await accountHrefs(page);
    test.skip(
      hrefs.length === 0,
      "No existing account available for non-destructive inspection",
    );

    await page.goto(hrefs[0]!);
    await page.getByTestId("account-management-open").click();
    await page.getByTestId("account-edit-open").click();
    const editForm = page.getByTestId("account-edit-form");
    await expect(selectTrigger(editForm, "account-edit-type")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();

    let cardHref: string | null = null;
    for (const href of hrefs) {
      await page.goto(href);
      if (await page.getByTestId("card-installments").count()) {
        cardHref = href;
        break;
      }
    }
    test.skip(
      !cardHref,
      "No credit-card account available for non-destructive inspection",
    );

    await page.goto(cardHref!);
    await page.getByTestId("card-payment-open").click();
    const paymentSheet = page.getByRole("dialog");
    await expect(paymentSheet).toBeVisible();
    await expect(paymentSheet.getByTestId("card-settle-amount")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(paymentSheet).toHaveCount(0);
    await page.getByTestId("account-management-open").click();
    await expect(page.getByTestId("card-refund-open")).toBeVisible();
    await page.keyboard.press("Escape");
    const installmentSection = page.getByTestId("card-installments");
    const installmentOpen = installmentSection.getByTestId(
      "card-installment-open",
    );
    await expect(installmentOpen).toBeVisible();
    if (await installmentOpen.isDisabled()) {
      await expect(installmentOpen).toBeDisabled();
      return;
    }
    await installmentOpen.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const purchaseChoices = dialog.locator("ul li button");
    if ((await purchaseChoices.count()) === 0) {
      await expect(
        dialog.getByTestId("card-installment-submit"),
      ).toBeDisabled();
    } else {
      await purchaseChoices.first().click();
      await expect(
        selectTrigger(dialog, "card-installment-program"),
      ).toBeVisible();
      await expect(
        selectTrigger(dialog, "card-installment-term"),
      ).toBeVisible();
      await expect(
        dialog.getByTestId("card-installment-first-expected").locator("input"),
      ).toBeVisible();
      await expect(
        dialog.getByTestId("card-installment-preview"),
      ).toBeVisible();
      await expect(dialog.getByTestId("card-installment-submit")).toBeEnabled();
    }

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toHaveCount(0);
  });
});
