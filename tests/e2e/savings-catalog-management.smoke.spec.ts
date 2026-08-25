import { expect, test } from "@playwright/test";

test.describe("Savings catalog management", () => {
  test.setTimeout(120_000);

  test("provider and product CRUD reaches the creation selector", async ({
    page,
  }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!email || !password, "E2E credentials not provided");

    const suffix = Date.now().toString();
    const providerName = `Catalog platform ${suffix}`;
    const editedProviderName = `Edited catalog platform ${suffix}`;
    const productName = `Catalog product ${suffix}`;

    await page.goto("/en/login");
    await page.getByLabel("Email").fill(email!);
    await page.locator("#login-password").fill(password!);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/en\/(home|together\/onboard)/, {
      timeout: 20_000,
    });
    test.skip(
      page.url().includes("/together/onboard"),
      "E2E user has no household",
    );

    await page.goto("/vi/money/savings/providers");
    await expect(
      page.getByTestId("money-savings-providers").first(),
    ).toBeVisible();
    await page.getByRole("button", { name: "Thêm nhà cung cấp" }).click();
    await page.locator("#savings-provider-name").fill(providerName);
    await page.getByRole("button", { name: "Lưu" }).last().click();
    await expect(page.getByTestId("savings-provider-save")).toHaveCount(0, {
      timeout: 30_000,
    });
    await expect(page.getByText(providerName, { exact: true })).toBeVisible();

    let card = page
      .locator(`[data-testid^="savings-provider-card-"]`)
      .filter({ hasText: providerName })
      .first();
    await card.getByTestId("savings-more-actions").last().click();
    await page.getByRole("menuitem", { name: "Chỉnh sửa" }).click();
    await page.locator("#savings-provider-name").fill(editedProviderName);
    await page.getByRole("button", { name: "Lưu" }).last().click();
    await expect(page.getByTestId("savings-provider-save")).toHaveCount(0, {
      timeout: 30_000,
    });
    await expect(
      page.getByText(editedProviderName, { exact: true }).last(),
    ).toBeVisible();

    card = page
      .locator(`[data-testid^="savings-provider-card-"]`)
      .filter({ hasText: editedProviderName })
      .first();
    await card.getByRole("button", { name: "Thêm gói" }).click();
    await expect(page.getByTestId("savings-product-save")).toBeVisible();
    await page.locator("#savings-product-name").fill(productName);
    await page.locator("#savings-product-term").fill("90");
    await page.getByRole("button", { name: "Lưu" }).last().click();
    await expect(page.getByTestId("savings-product-save")).toHaveCount(0, {
      timeout: 30_000,
    });
    await expect(
      card.locator("[data-testid^=savings-product-card-]").last(),
    ).toContainText("90 ngày");

    await page.goto("/vi/money/savings/new");
    await expect(
      page.getByText(editedProviderName, { exact: true }).last(),
    ).toBeVisible();
    await page
      .locator(`[data-testid^="savings-provider-"]`)
      .filter({ hasText: editedProviderName })
      .last()
      .click();
    await expect(
      page
        .locator('[data-testid^="savings-package-"]')
        .filter({ hasText: "90" })
        .first(),
    ).toBeVisible();

    await page.goto("/vi/money/savings/providers");
    card = page
      .locator(`[data-testid^="savings-provider-card-"]`)
      .filter({ hasText: editedProviderName })
      .first();
    const productCard = card
      .locator(`[data-testid^="savings-product-card-"]`)
      .last();
    await expect(productCard).toBeVisible();
    await productCard.getByTestId("savings-more-actions").click();
    await page.getByRole("menuitem", { name: "Lưu trữ" }).click();
    await page.getByTestId("savings-archive-confirm-action").click();
    await expect(
      card
        .locator(`[data-testid^=savings-product-card-]`)
        .filter({ hasText: "90 ngày" }),
    ).toHaveCount(0, { timeout: 30_000 });

    await card.getByTestId("savings-more-actions").last().click();
    await page.getByRole("menuitem", { name: "Lưu trữ" }).click();
    await page.getByTestId("savings-archive-confirm-action").click();
    await expect(
      page.getByText(editedProviderName, { exact: true }),
    ).toHaveCount(0, { timeout: 30_000 });
    await page.goto("/vi/money/savings/new");
    await expect(
      page.getByText(editedProviderName, { exact: true }),
    ).toHaveCount(0);
  });
});
