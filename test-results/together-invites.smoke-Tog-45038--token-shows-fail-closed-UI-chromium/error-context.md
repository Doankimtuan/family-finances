# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: together-invites.smoke.spec.ts >> Together members + invitations (ST-E03-002 / F4) >> invite accept invalid token shows fail-closed UI
- Location: tests/e2e/together-invites.smoke.spec.ts:12:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('invite-accept')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByTestId('invite-accept')

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
    - 'heading "Page not found: /en/invite/not-a-valid-uuid :(" [level=2]'
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
  1   | import { test, expect } from "@playwright/test";
  2   | import { APP_PATH } from "@/modules/tenancy/application/app-path";
  3   |
  4   | test.describe("Together members + invitations (ST-E03-002 / F4)", () => {
  5   |   test.setTimeout(90_000);
  6   |
  7   |   test("unauthenticated invitations redirects to login", async ({ page }) => {
  8   |     await page.goto("/en/together/invitations");
  9   |     await expect(page).toHaveURL(/\/en\/login/);
  10  |   });
  11  |
  12  |   test("invite accept invalid token shows fail-closed UI", async ({ page }) => {
  13  |     await page.goto("/en/invite/not-a-valid-uuid");
> 14  |     await expect(page.getByTestId("invite-accept")).toBeVisible();
      |                                                     ^ Error: expect(locator).toBeVisible() failed
  15  |     await expect(
  16  |       page.getByText(/Invitation not found|not valid/i),
  17  |     ).toBeVisible();
  18  |     await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(
  19  |       0,
  20  |     );
  21  |   });
  22  |
  23  |   test("together overview, members, and invite flow when E2E credentials exist", async ({
  24  |     page,
  25  |   }) => {
  26  |     const email = process.env.E2E_USER_EMAIL;
  27  |     const password = process.env.E2E_USER_PASSWORD;
  28  |     test.skip(!email || !password, "E2E credentials not provided");
  29  |
  30  |     await page.goto("/en/login");
  31  |     await page.getByLabel("Email").fill(email!);
  32  |     await page.locator("#login-password").fill(password!);
  33  |     await page.getByRole("button", { name: "Log in" }).click();
  34  |     await expect(page).toHaveURL(/\/en\/(home|together\/onboard)/, {
  35  |       timeout: 20_000,
  36  |     });
  37  |     test.skip(
  38  |       page.url().includes(APP_PATH.ONBOARD),
  39  |       "E2E user has no household — complete onboard first",
  40  |     );
  41  |
  42  |     await page.goto("/en/money");
  43  |     const financialStateBefore = await page
  44  |       .getByTestId("ledger-balance")
  45  |       .innerText();
  46  |
  47  |     await page.goto("/en/together");
  48  |     await expect(page.getByTestId("together-overview-page")).toBeVisible();
  49  |     await page.getByTestId("together-members-link").click();
  50  |     await expect(page.getByTestId("together-members-page")).toBeVisible();
  51  |     await expect(page.getByTestId("together-members")).toBeVisible();
  52  |     await expect(
  53  |       page
  54  |         .locator(
  55  |           "[data-testid='together-role-admin'], [data-testid='together-role-partner']",
  56  |         )
  57  |         .first(),
  58  |     ).toBeVisible();
  59  |     await expect(page.getByTestId("together-ownership-transfer")).toHaveCount(
  60  |       0,
  61  |     );
  62  |     const roleAction = page.getByTestId("together-change-role").first();
  63  |     await expect(roleAction).toBeVisible();
  64  |     await roleAction.click();
  65  |     await expect(
  66  |       page.getByRole("button", { name: "Confirm role" }),
  67  |     ).toBeVisible();
  68  |     await page.getByRole("button", { name: "Cancel" }).click();
  69  |
  70  |     await page.goto("/en/together");
  71  |     const inviteCta = page.getByTestId("together-invite-cta");
  72  |     test.skip(
  73  |       (await inviteCta.count()) === 0,
  74  |       "Household is at member capacity",
  75  |     );
  76  |     await page.getByTestId("together-invite-cta").click();
  77  |     await expect(page).toHaveURL(/\/en\/together\/invitations\/new/);
  78  |     await expect(page.getByTestId("invite-form")).toBeVisible();
  79  |
  80  |     const inviteEmail = `phase-f7-${Date.now()}@example.com`;
  81  |     await page.getByLabel("Partner email").fill(inviteEmail);
  82  |     await page.getByTestId("invite-send").click();
  83  |     await expect(page).toHaveURL(/\/en\/together\/invitations$/, {
  84  |       timeout: 30_000,
  85  |     });
  86  |     await expect(page.getByTestId("together-invitations")).toBeVisible();
  87  |     const createdInvite = page
  88  |       .getByText(inviteEmail)
  89  |       .locator("..")
  90  |       .locator("..");
  91  |     await expect(page.getByText(inviteEmail)).toBeVisible();
  92  |     await createdInvite.getByTestId("invite-revoke").click();
  93  |     await expect(page.getByText(inviteEmail)).toHaveCount(0);
  94  |
  95  |     await page.goto("/en/money");
  96  |     const financialStateAfter = await page
  97  |       .getByTestId("ledger-balance")
  98  |       .innerText();
  99  |     expect(financialStateAfter).toBe(financialStateBefore);
  100 |   });
  101 | });
  102 |
```
