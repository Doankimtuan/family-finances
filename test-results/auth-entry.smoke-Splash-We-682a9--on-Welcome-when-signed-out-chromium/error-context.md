# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-entry.smoke.spec.ts >> Splash + Welcome (ST-E02-001) >> Splash shows brand then lands on Welcome when signed out
- Location: tests/e2e/auth-entry.smoke.spec.ts:25:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('auth-splash')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByTestId('auth-splash')

```

```yaml
- link "logo OILER GROUP":
    - /url: /en
    - img "logo"
    - text: OILER GROUP
- list:
    - listitem:
        - link "login.btn_login":
            - /url: /en/login
            - button "login.btn_login"
    - listitem:
        - button "Register"
- main:
    - heading "404" [level=1]
    - 'heading "Page not found: /en/splash :(" [level=2]'
    - link "Go to home page":
        - /url: /en
- text: © 2026 Nuxt Starter
- link "Style Guide":
    - /url: /style-guide
- link "Admin":
    - /url: /admin
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  |
  3  | test.describe("Splash + Welcome (ST-E02-001)", () => {
  4  |   test("landing Open app goes to Welcome, not home", async ({ page }) => {
  5  |     await page.goto("/en");
  6  |     await page.getByRole("button", { name: "Open app" }).click();
  7  |     await expect(page).toHaveURL(/\/en\/welcome$/);
  8  |     await expect(page.getByTestId("auth-welcome")).toBeVisible();
  9  |     await expect(
  10 |       page.getByRole("heading", { name: "Why join?" }),
  11 |     ).toBeVisible();
  12 |     await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(
  13 |       0,
  14 |     );
  15 |   });
  16 |
  17 |   test("Welcome exposes login and register CTAs", async ({ page }) => {
  18 |     await page.goto("/en/welcome");
  19 |     await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  20 |     await expect(
  21 |       page.getByRole("button", { name: "Create account" }),
  22 |     ).toBeVisible();
  23 |   });
  24 |
  25 |   test("Splash shows brand then lands on Welcome when signed out", async ({
  26 |     page,
  27 |   }) => {
  28 |     await page.goto("/en/splash");
> 29 |     await expect(page.getByTestId("auth-splash")).toBeVisible();
     |                                                   ^ Error: expect(locator).toBeVisible() failed
  30 |     await expect(page.getByRole("heading", { name: "ViNha" })).toBeVisible();
  31 |     await expect(page).toHaveURL(/\/en\/welcome$/, { timeout: 15_000 });
  32 |     await expect(page.getByTestId("auth-welcome")).toBeVisible();
  33 |   });
  34 | });
  35 |
```
