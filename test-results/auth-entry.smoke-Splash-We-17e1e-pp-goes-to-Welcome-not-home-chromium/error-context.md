# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-entry.smoke.spec.ts >> Splash + Welcome (ST-E02-001) >> landing Open app goes to Welcome, not home
- Location: tests/e2e/auth-entry.smoke.spec.ts:4:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Open app' })

```

# Page snapshot

```yaml
- generic [ref=e7]:
    - generic [ref=e8]: オイラーシステム
    - generic [ref=e10]:
        - generic [ref=e11]:
            - generic [ref=e12]: 管理者からのお知らせ
            - generic [ref=e13]: Have a good day! update
        - generic [ref=e14]:
            - generic [ref=e15]: "*ログインID"
            - textbox "*ログインID" [ref=e19]:
                - /placeholder: ログインIDを入力してください
        - generic [ref=e20]:
            - generic [ref=e21]: "*パスワード"
            - textbox "*パスワード" [ref=e25]:
                - /placeholder: パスワードを入力してください
        - button "パスワードを忘れた方はこちら" [ref=e26] [cursor=pointer]
        - button "ログイン" [ref=e30] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  |
  3  | test.describe("Splash + Welcome (ST-E02-001)", () => {
  4  |   test("landing Open app goes to Welcome, not home", async ({ page }) => {
  5  |     await page.goto("/en");
> 6  |     await page.getByRole("button", { name: "Open app" }).click();
     |                                                          ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  29 |     await expect(page.getByTestId("auth-splash")).toBeVisible();
  30 |     await expect(page.getByRole("heading", { name: "ViNha" })).toBeVisible();
  31 |     await expect(page).toHaveURL(/\/en\/welcome$/, { timeout: 15_000 });
  32 |     await expect(page.getByTestId("auth-welcome")).toBeVisible();
  33 |   });
  34 | });
  35 |
```
