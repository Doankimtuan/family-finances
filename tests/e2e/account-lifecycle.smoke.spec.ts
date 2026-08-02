import { test, expect } from "@playwright/test";
import {
  AUTH_ADAPTER_SIGNOUT_PATH,
  HTTP_STATUS,
} from "@/modules/tenancy/application/auth-constants";

test.describe("Sign-out + delete account (ST-E02-006)", () => {
  test("account lifecycle is hidden when signed out", async ({ page }) => {
    await page.goto("/en/together");
    await expect(page.getByTestId("account-lifecycle")).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: "Primary" }),
    ).toBeVisible();
  });

  test("sign-out POST from same origin redirects to login", async ({
    page,
  }) => {
    await page.goto("/en/welcome");
    await page.evaluate((actionPath) => {
      const form = document.createElement("form");
      form.method = "post";
      form.action = actionPath;
      document.body.appendChild(form);
      form.submit();
    }, AUTH_ADAPTER_SIGNOUT_PATH);
    await expect(page).toHaveURL(/\/(en|vi)\/login/);
  });

  test("sign-out GET is rejected", async ({ request }) => {
    const response = await request.get(AUTH_ADAPTER_SIGNOUT_PATH);
    expect(response.status()).toBe(HTTP_STATUS.METHOD_NOT_ALLOWED);
  });

  test("sign-out POST without Origin is forbidden", async ({ request }) => {
    const response = await request.fetch(AUTH_ADAPTER_SIGNOUT_PATH, {
      method: "POST",
      headers: { Origin: "" },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(HTTP_STATUS.FORBIDDEN);
  });

  test("account lifecycle + delete confirm when E2E credentials exist", async ({
    page,
  }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!email || !password, "E2E credentials not provided");

    await page.goto("/en/login");
    await page.getByLabel("Email").fill(email!);
    await page.locator("#login-password").fill(password!);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/en\/home/, { timeout: 20_000 });

    await page.goto("/en/together");
    await expect(page.getByTestId("account-lifecycle")).toBeVisible();
    await expect(page.getByTestId("sign-out")).toBeVisible();
    await page.getByTestId("delete-account").click();
    await expect(page.getByText("Delete your account?")).toBeVisible();
    await expect(page.getByTestId("delete-account-confirm")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByTestId("delete-account")).toBeVisible();
  });
});
