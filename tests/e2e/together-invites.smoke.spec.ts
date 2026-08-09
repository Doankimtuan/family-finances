import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Together members + invitations (ST-E03-002 / F4)", () => {
  test.setTimeout(90_000);

  test("unauthenticated invitations redirects to login", async ({ page }) => {
    await page.goto("/en/together/invitations");
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test("invite accept invalid token shows fail-closed UI", async ({ page }) => {
    await page.goto("/en/invite/not-a-valid-uuid");
    await expect(page.getByTestId("invite-accept")).toBeVisible();
    await expect(
      page.getByText(/Invitation not found|not valid/i),
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(
      0,
    );
  });

  test("together overview, members, and invite flow when E2E credentials exist", async ({
    page,
  }) => {
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
      "E2E user has no household — complete onboard first",
    );

    await page.goto("/en/money");
    const financialStateBefore = await page
      .getByTestId("ledger-balance")
      .innerText();

    await page.goto("/en/together");
    await expect(page.getByTestId("together-overview-page")).toBeVisible();
    await page.getByTestId("together-members-link").click();
    await expect(page.getByTestId("together-members-page")).toBeVisible();
    await expect(page.getByTestId("together-members")).toBeVisible();
    await expect(
      page
        .locator(
          "[data-testid='together-role-admin'], [data-testid='together-role-partner']",
        )
        .first(),
    ).toBeVisible();
    await expect(page.getByTestId("together-ownership-transfer")).toHaveCount(
      0,
    );
    const roleAction = page.getByTestId("together-change-role").first();
    await expect(roleAction).toBeVisible();
    await roleAction.click();
    await expect(
      page.getByRole("button", { name: "Confirm role" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();

    await page.goto("/en/together");
    const inviteCta = page.getByTestId("together-invite-cta");
    test.skip(
      (await inviteCta.count()) === 0,
      "Household is at member capacity",
    );
    await page.getByTestId("together-invite-cta").click();
    await expect(page).toHaveURL(/\/en\/together\/invitations\/new/);
    await expect(page.getByTestId("invite-form")).toBeVisible();

    const inviteEmail = `phase-f7-${Date.now()}@example.com`;
    await page.getByLabel("Partner email").fill(inviteEmail);
    await page.getByTestId("invite-send").click();
    await expect(page).toHaveURL(/\/en\/together\/invitations$/, {
      timeout: 30_000,
    });
    await expect(page.getByTestId("together-invitations")).toBeVisible();
    const createdInvite = page
      .getByText(inviteEmail)
      .locator("..")
      .locator("..");
    await expect(page.getByText(inviteEmail)).toBeVisible();
    await createdInvite.getByTestId("invite-revoke").click();
    await expect(page.getByText(inviteEmail)).toHaveCount(0);

    await page.goto("/en/money");
    const financialStateAfter = await page
      .getByTestId("ledger-balance")
      .innerText();
    expect(financialStateAfter).toBe(financialStateBefore);
  });
});
