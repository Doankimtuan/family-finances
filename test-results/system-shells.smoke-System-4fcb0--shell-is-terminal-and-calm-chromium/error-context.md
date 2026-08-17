# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: system-shells.smoke.spec.ts >> System shells (ST-E08-001) >> maintenance shell is terminal and calm
- Location: tests/e2e/system-shells.smoke.spec.ts:36:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('system-maintenance')
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for getByTestId('system-maintenance')

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
    - 'heading "Page not found: /en/maintenance :(" [level=2]'
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
  3  | test.describe("System shells (ST-E08-001)", () => {
  4  |   test("error shell renders retry and home", async ({ page }) => {
  5  |     await page.goto("/en/error", { waitUntil: "domcontentloaded" });
  6  |     await expect(page.getByTestId("system-error")).toBeVisible({
  7  |       timeout: 20_000,
  8  |     });
  9  |     await expect(page.getByTestId("system-error-retry")).toBeVisible();
  10 |     await expect(page.getByTestId("system-error-home")).toBeVisible();
  11 |   });
  12 |
  13 |   test("offline shell explains fail-closed mutations", async ({ page }) => {
  14 |     await page.goto("/en/offline", { waitUntil: "domcontentloaded" });
  15 |     await expect(page.getByTestId("system-offline")).toBeVisible({
  16 |       timeout: 20_000,
  17 |     });
  18 |     await expect(
  19 |       page.getByText(/offline writes|ghi ngoại tuyến/i),
  20 |     ).toBeVisible();
  21 |     await expect(page.getByTestId("system-offline-retry")).toBeVisible();
  22 |     await expect(page.getByTestId("system-offline-readonly")).toBeVisible();
  23 |   });
  24 |
  25 |   test("permission shell explains partner vs admin", async ({ page }) => {
  26 |     await page.goto("/en/permission?reason=admin", {
  27 |       waitUntil: "domcontentloaded",
  28 |     });
  29 |     await expect(page.getByTestId("system-permission")).toBeVisible({
  30 |       timeout: 20_000,
  31 |     });
  32 |     await expect(page.getByTestId("system-permission-together")).toBeVisible();
  33 |     await expect(page.getByText(/Admin role|vai Admin/i)).toBeVisible();
  34 |   });
  35 |
  36 |   test("maintenance shell is terminal and calm", async ({ page }) => {
  37 |     await page.goto("/en/maintenance", { waitUntil: "domcontentloaded" });
> 38 |     await expect(page.getByTestId("system-maintenance")).toBeVisible({
     |                                                          ^ Error: expect(locator).toBeVisible() failed
  39 |       timeout: 20_000,
  40 |     });
  41 |     await expect(
  42 |       page.getByText(/Under maintenance|Đang bảo trì/i),
  43 |     ).toBeVisible();
  44 |   });
  45 | });
  46 |
```
