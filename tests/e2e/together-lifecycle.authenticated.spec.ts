import { expect, test } from "@playwright/test";
import {
  FINANCIAL_PRIVACY_MASK,
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_FALSE,
} from "@/shared/constants/financial-privacy";
import {
  authenticateLifecycleUser,
  hasLifecycleCredentials,
  lifecycleIdentityEmail,
  openLifecycleAccount,
  openLifecycleMembers,
  runLifecycleHarness,
} from "./fixtures/together-lifecycle";

test.describe("Together authenticated lifecycle V1", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(240_000);
  test.skip(
    !hasLifecycleCredentials(),
    "Supabase credentials are not provided for the disposable 20A fixture",
  );

  test.beforeAll(async () => {
    await runLifecycleHarness("together-20a-setup");
  });

  test.afterAll(async () => {
    await runLifecycleHarness("together-20a-cleanup");
  });

  test("certifies isolated invite, ownership, and membership lifecycle", async ({
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
      await expect(admin.getByTestId("together-remove-member")).toHaveCount(0);
      await expect(admin.getByTestId("together-role-admin")).toHaveCount(1);
      await admin.goto("/en/together");
      await expect(
        admin.getByTestId("together-invite-cta").filter({ visible: true }),
      ).toBeVisible();

      await admin.goto("/en/together/invitations/new");
      await admin
        .getByLabel("Partner email")
        .fill(lifecycleIdentityEmail("partner"));
      await admin.getByTestId("invite-send").filter({ visible: true }).click();
      await expect(admin).toHaveURL(/\/en\/together\/invitations$/, {
        timeout: 20_000,
      });
      await expect(
        admin.getByText(lifecycleIdentityEmail("partner")),
      ).toBeVisible();
      await adminContext.grantPermissions([
        "clipboard-read",
        "clipboard-write",
      ]);
      await admin.getByTestId("invite-copy").filter({ visible: true }).click();
      const inviteLink = await admin.evaluate(() =>
        navigator.clipboard.readText(),
      );
      await admin.goto(inviteLink);
      await expect(
        admin.getByRole("button", { name: "Accept and join" }),
      ).toBeVisible();
      await expect(admin.locator("body")).not.toContainText("invitation_id");
      await admin.goto("/en/together/invitations");
      await admin
        .getByTestId("invite-revoke")
        .filter({ visible: true })
        .click();
      await expect(
        admin.getByText(lifecycleIdentityEmail("partner")),
      ).toHaveCount(0);

      await partner.goto("/en/together");
      await expect(partner).toHaveURL(/\/en\/together\/onboard/);

      await admin.goto("/en/together/invitations/new");
      await admin
        .getByLabel("Partner email")
        .fill(lifecycleIdentityEmail("partner"));
      await admin.getByTestId("invite-send").filter({ visible: true }).click();
      await expect(admin).toHaveURL(/\/en\/together\/invitations$/, {
        timeout: 20_000,
      });
      await admin.getByTestId("invite-copy").filter({ visible: true }).click();
      const activeInviteLink = await admin.evaluate(() =>
        navigator.clipboard.readText(),
      );
      const activeInviteToken = activeInviteLink.split("/").pop() ?? "";
      await partner.goto(activeInviteLink);
      await expect(
        partner.getByRole("button", { name: "Accept and join" }),
      ).toBeVisible();
      await partner.getByRole("button", { name: "Accept and join" }).click();
      await expect(partner).toHaveURL(/\/en\/(home|together)/, {
        timeout: 20_000,
      });
      await runLifecycleHarness("together-20a-seed-member");
      await runLifecycleHarness("together-20a-assert-active", {
        invitationToken: activeInviteToken,
      });

      await openLifecycleMembers(admin);
      await expect(admin.getByTestId("together-remove-member")).toBeVisible();
      await expect(admin.getByTestId("together-invite-cta")).toHaveCount(0);
      await expect(admin.getByTestId("together-role-admin")).toHaveCount(1);

      await openLifecycleMembers(partner);
      await expect(partner.getByTestId("together-remove-member")).toHaveCount(
        0,
      );
      await expect(partner.getByTestId("together-change-role")).toHaveCount(0);
      await openLifecycleAccount(partner);
      const activeOwnerAccount = partner.getByRole("link", {
        name: /Ownership former-member account/,
      });
      await expect(
        activeOwnerAccount.getByTestId("financial-ownership-badge"),
      ).toHaveText("Personal · You");

      await partner.setViewportSize({ width: 390, height: 900 });
      await partner.emulateMedia({
        colorScheme: "light",
        reducedMotion: "reduce",
      });
      await partner.goto("/vi/home");
      await partner.evaluate(
        ([key, value]) => localStorage.setItem(key, value),
        [FINANCIAL_PRIVACY_STORAGE_KEY, FINANCIAL_PRIVACY_STORAGE_FALSE],
      );
      await partner.reload();
      const privacyToggle = partner.getByTestId(
        "home-financial-privacy-toggle",
      );
      await privacyToggle.click();
      await expect(privacyToggle).toHaveAttribute("aria-pressed", "true");
      await partner.goto("/vi/inbox");
      await expect(partner.getByTestId("inbox-amount").first()).toContainText(
        FINANCIAL_PRIVACY_MASK,
      );
      await expect
        .poll(() =>
          partner.evaluate(
            () =>
              document.documentElement.scrollWidth <=
              document.documentElement.clientWidth,
          ),
        )
        .toBe(true);
      await partner.goto("/vi/home");
      await partner.getByTestId("home-financial-privacy-toggle").click();
      await expect(
        partner.getByTestId("home-financial-privacy-toggle"),
      ).toHaveAttribute("aria-pressed", "false");
      await partner.goto("/vi/inbox");
      await expect(
        partner.getByTestId("inbox-amount").first(),
      ).not.toContainText(FINANCIAL_PRIVACY_MASK);

      for (const width of [390, 440, 768, 1280]) {
        await admin.setViewportSize({ width, height: 900 });
        await admin.emulateMedia({
          colorScheme: width === 440 ? "dark" : "light",
          reducedMotion: width === 390 ? "reduce" : "no-preference",
        });
        await openLifecycleMembers(admin, width === 390 ? "vi" : "en");
        await expect
          .poll(() =>
            admin.evaluate(
              () =>
                document.documentElement.scrollWidth <=
                document.documentElement.clientWidth,
            ),
          )
          .toBe(true);
        if (width === 440) {
          await expect(admin.locator("body")).not.toContainText(
            /(?:together|inbox)\.[a-z_]+\.[a-z_]+/i,
          );
        }
        await admin.screenshot({
          path: `output/playwright/together-20a-members-${width}.png`,
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
      await expect(
        admin.getByTestId("together-invite-cta").filter({ visible: true }),
      ).toBeVisible();
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
        .fill(lifecycleIdentityEmail("partner"));
      await admin.getByTestId("invite-send").filter({ visible: true }).click();
      await expect(admin).toHaveURL(/\/en\/together\/invitations$/, {
        timeout: 20_000,
      });
      await admin.getByTestId("invite-copy").filter({ visible: true }).click();
      const rejoinInviteLink = await admin.evaluate(() =>
        navigator.clipboard.readText(),
      );
      const rejoinInviteToken = rejoinInviteLink.split("/").pop() ?? "";
      await partner.goto(rejoinInviteLink);
      await partner.getByRole("button", { name: "Accept and join" }).click();
      await expect(partner).toHaveURL(/\/en\/(home|together)/, {
        timeout: 20_000,
      });
      await runLifecycleHarness("together-20a-assert-active", {
        invitationToken: rejoinInviteToken,
      });
      await openLifecycleAccount(partner);
      await expect(
        partner
          .getByRole("link", { name: /Ownership former-member account/ })
          .getByTestId("financial-ownership-badge"),
      ).toHaveText("Personal · You");

      await openLifecycleMembers(admin);
      const partnerMember = admin
        .locator("[data-testid^='together-member-']")
        .filter({ hasText: lifecycleIdentityEmail("partner") });
      await partnerMember.getByTestId("together-change-role").click();
      await admin.getByRole("button", { name: "Confirm role" }).click();
      await expect(
        admin.getByRole("button", { name: "Confirm role" }),
      ).toHaveCount(0, { timeout: 20_000 });
      await admin.reload();
      await expect(admin.getByTestId("together-role-admin")).toHaveCount(2, {
        timeout: 20_000,
      });
      await expect(admin.getByTestId("together-leave-member")).toBeVisible();
      await admin.getByTestId("together-leave-member").click();
      await admin.getByRole("button", { name: "Confirm" }).click();
      await expect(admin).toHaveURL(/\/en\/(home|together)/, {
        timeout: 20_000,
      });
      await runLifecycleHarness("together-20a-assert-final");
    } finally {
      await adminContext.close();
      await partnerContext.close();
    }
  });
});
