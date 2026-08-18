import { expect, test } from "@playwright/test";
import {
  authenticateLifecycleUser,
  hasLifecycleCredentials,
  openLifecycleAccount,
  openLifecycleMembers,
  runLifecycleHarness,
} from "./fixtures/together-lifecycle";

test.describe("Together authenticated lifecycle V1", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);
  test.skip(
    !hasLifecycleCredentials(),
    "Dedicated OWNERSHIP_TEST_A/B credentials are not provided",
  );

  test.beforeAll(async () => {
    await runLifecycleHarness("setup");
  });

  test.afterAll(async () => {
    await runLifecycleHarness("cleanup");
  });

  test("covers admin controls, former-member read-only state, and role continuity", async ({
    browser,
  }) => {
    const adminContext = await browser.newContext();
    const partnerContext = await browser.newContext();
    const admin = await adminContext.newPage();
    const partner = await partnerContext.newPage();

    try {
      await authenticateLifecycleUser(admin, "admin");
      await authenticateLifecycleUser(partner, "partner");
      await openLifecycleMembers(admin);
      await expect(admin.getByTestId("together-remove-member")).toBeVisible();
      await expect(admin.getByTestId("together-invite-cta")).toHaveCount(0);

      await openLifecycleMembers(partner);
      await expect(partner.getByTestId("together-remove-member")).toHaveCount(
        0,
      );
      await expect(partner.getByTestId("together-change-role")).toHaveCount(0);

      for (const width of [390, 440, 768, 1280]) {
        await admin.setViewportSize({ width, height: 900 });
        await openLifecycleMembers(admin);
        await admin.screenshot({
          path: `output/playwright/together-14g-members-${width}.png`,
          fullPage: true,
        });
      }

      await admin.setViewportSize({ width: 440, height: 900 });
      await openLifecycleMembers(admin);
      await admin.getByTestId("together-remove-member").click();
      await expect(
        admin.getByRole("button", { name: "Confirm" }),
      ).toBeVisible();
      await admin.screenshot({
        path: "output/playwright/together-14g-remove-confirmation-440.png",
        fullPage: true,
      });
      await admin.getByRole("button", { name: "Confirm" }).click();
      await admin.goto("/en/together");
      await admin.reload();
      await expect(admin.getByTestId("together-invite-cta")).toBeVisible();
      await partner.goto("/en/together");
      await expect(partner).toHaveURL(/\/en\/together\/onboard/);
      await openLifecycleAccount(admin);
      const formerMemberAccount = admin.getByRole("link", {
        name: /Ownership former-member account/,
      });
      await expect(
        formerMemberAccount.getByTestId("financial-ownership-badge"),
      ).toHaveText("Personal · Former member");
      await formerMemberAccount.click();
      await expect(
        admin.getByTestId("financial-former-member-notice"),
      ).toBeVisible();
      await admin.screenshot({
        path: "output/playwright/together-14g-former-member-detail-440.png",
        fullPage: true,
      });
      await admin.setViewportSize({ width: 440, height: 900 });
      await admin.goto("/en/inbox");
      await expect(
        admin.getByText("Owner unavailable · read-only"),
      ).toBeVisible();
      await admin.screenshot({
        path: "output/playwright/together-14g-owner-unavailable-inbox-440.png",
        fullPage: true,
      });

      await admin.goto("/en/together/invitations/new");
      await admin
        .getByLabel("Partner email")
        .fill(process.env.OWNERSHIP_TEST_B_EMAIL ?? "");
      await admin.getByTestId("invite-send").click();
      await expect(admin).toHaveURL(/\/en\/together\/invitations$/);
      await expect(
        admin.getByText(process.env.OWNERSHIP_TEST_B_EMAIL ?? ""),
      ).toBeVisible();
      await admin.getByTestId("invite-revoke").click();
      await expect(
        admin.getByText(process.env.OWNERSHIP_TEST_B_EMAIL ?? ""),
      ).toHaveCount(0);

      await admin.goto("/en/together/invitations/new");
      await admin
        .getByLabel("Partner email")
        .fill(process.env.OWNERSHIP_TEST_B_EMAIL ?? "");
      await admin.getByTestId("invite-send").click();
      await expect(admin).toHaveURL(/\/en\/together\/invitations$/);
      await adminContext.grantPermissions([
        "clipboard-read",
        "clipboard-write",
      ]);
      await admin.getByTestId("invite-copy").click();
      const inviteLink = await admin.evaluate(() =>
        navigator.clipboard.readText(),
      );
      await partner.goto(inviteLink);
      await partner.getByRole("button", { name: "Accept and join" }).click();
      await expect(partner).toHaveURL(/\/en\/(home|together)/, {
        timeout: 20_000,
      });

      await openLifecycleAccount(partner);
      const activeOwnerAccount = partner.getByRole("link", {
        name: /Ownership former-member account/,
      });
      await expect(
        activeOwnerAccount.getByTestId("financial-ownership-badge"),
      ).toHaveText("Personal · You");

      await openLifecycleMembers(admin);
      await admin.getByTestId("together-change-role").last().click();
      await admin.getByRole("button", { name: "Confirm role" }).click();
      await openLifecycleMembers(admin);
      await expect(admin.getByTestId("together-leave-member")).toBeVisible();
      await admin.getByTestId("together-leave-member").click();
      await expect(admin).toHaveURL(/\/en\/(home|together)/, {
        timeout: 20_000,
      });
    } finally {
      await adminContext.close();
      await partnerContext.close();
    }
  });
});
