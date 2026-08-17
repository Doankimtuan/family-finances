# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: oauth-login.smoke.spec.ts >> OAuth-first login (ST-E02-004) >> login hierarchy: Google, Apple, divider, email
- Location: tests/e2e/oauth-login.smoke.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-chrome="auth"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-chrome="auth"]')

```

```yaml
- text: Euler system Message from the administrator Have a good day! update *Login id
- textbox "*Login id":
    - /placeholder: Please enter your login id
- text: "*Password"
- textbox "*Password":
    - /placeholder: Please enter your password
- button "Forgot your password?"
- button "Log in"
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  |
  3  | test.describe("OAuth-first login (ST-E02-004)", () => {
  4  |   test("login hierarchy: Google, Apple, divider, email", async ({ page }) => {
  5  |     await page.goto("/en/login");
> 6  |     await expect(page.locator('[data-chrome="auth"]')).toBeVisible();
     |                                                        ^ Error: expect(locator).toBeVisible() failed
  7  |     await expect(page.getByTestId("auth-login")).toBeVisible();
  8  |     await expect(page.locator("#app-viewport-root")).toBeVisible();
  9  |
  10 |     const google = page.getByTestId("oauth-google");
  11 |     const apple = page.getByTestId("oauth-apple");
  12 |     await expect(google).toBeVisible();
  13 |     await expect(apple).toBeVisible();
  14 |     await expect(google).toHaveText("Continue with Google");
  15 |     await expect(apple).toHaveText("Continue with Apple");
  16 |     await expect(page.getByText("Continue with Email")).toBeVisible();
  17 |     await expect(page.getByLabel("Email")).toBeVisible();
  18 |     await expect(page.locator("#login-password")).toBeVisible();
  19 |     await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  20 |     await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(
  21 |       0,
  22 |     );
  23 |
  24 |     // Google appears before Apple in DOM order
  25 |     const googleBox = await google.boundingBox();
  26 |     const appleBox = await apple.boundingBox();
  27 |     expect(googleBox && appleBox && googleBox.y < appleBox.y).toBeTruthy();
  28 |   });
  29 |
  30 |   test("OAuth google starts IdP flow or fails closed with Alert", async ({
  31 |     page,
  32 |   }) => {
  33 |     await page.goto("/en/login");
  34 |     await page.getByTestId("oauth-google").click();
  35 |     await expect
  36 |       .poll(
  37 |         async () => {
  38 |           const alertVisible = await page
  39 |             .getByText("Could not sign in")
  40 |             .isVisible()
  41 |             .catch(() => false);
  42 |           const leftLogin = !page.url().includes("/en/login");
  43 |           return alertVisible || leftLogin;
  44 |         },
  45 |         { timeout: 15_000 },
  46 |       )
  47 |       .toBe(true);
  48 |   });
  49 | });
  50 |
```
