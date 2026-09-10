import type { ComponentProps } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import enTogether from "@/messages/en/together.json";
import viTogether from "@/messages/vi/together.json";
import type { HouseholdMemberRow } from "@/modules/tenancy/application/list-household-members";
import type { PendingInvitation } from "@/modules/tenancy/application/list-pending-invitations";
import {
  HOUSEHOLD_LOCALE,
  HOUSEHOLD_ROLE,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import { StatusAlertProvider } from "@/providers/status-alert-provider";
import { MemberList } from "@/app/[locale]/(product)/together/member-list";
import { TogetherInvitationPreview } from "@/app/[locale]/(product)/together/together-invitation-preview";
import { TogetherMemberPreview } from "@/app/[locale]/(product)/together/together-member-preview";
import { memberDisplayName } from "@/app/[locale]/(product)/together/together-member-identity";
import {
  householdLocaleLabelKey,
  invitationRowAriaLabel,
  isHouseholdAdmin,
  memberRowAriaLabel,
} from "@/app/[locale]/(product)/together/together-presentations";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/[locale]/(product)/together/members/actions", () => ({
  changeRoleAction: vi.fn(),
  leaveHouseholdAction: vi.fn(),
  removeHouseholdMemberAction: vi.fn(),
}));

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

const adminMember: HouseholdMemberRow = {
  id: "member-admin",
  userId: "user-admin",
  role: HOUSEHOLD_ROLE.ADMIN,
  email: "admin@example.com",
  displayName: "Admin Member",
  isSelf: false,
};

const selfPartner: HouseholdMemberRow = {
  id: "member-self",
  userId: "user-self",
  role: HOUSEHOLD_ROLE.PARTNER,
  email: "self@example.com",
  displayName: null,
  isSelf: true,
};

const unnamedMember: HouseholdMemberRow = {
  id: "member-unnamed",
  userId: "550e8400-e29b-41d4-a716-446655440099",
  role: HOUSEHOLD_ROLE.PARTNER,
  email: null,
  displayName: null,
  isSelf: false,
};

const pendingInvite: PendingInvitation = {
  id: "invite-1",
  email: "partner@example.com",
  token: "token-partner",
  expiresAt: "2026-12-01T00:00:00.000Z",
  createdAt: "2026-09-01T00:00:00.000Z",
};

describe("Phase 13 Together identity", () => {
  it("falls back to unnamed copy instead of a user id", () => {
    expect(memberDisplayName(unnamedMember, "Member")).toBe("Member");
    expect(memberDisplayName(unnamedMember, "Member")).not.toContain(
      unnamedMember.userId,
    );
    expect(memberDisplayName(unnamedMember, "Member").slice(0, 8)).not.toBe(
      unnamedMember.userId.slice(0, 8),
    );
  });

  it("renders a scan-first member row with identity, you, role, and hint", () => {
    render(
      <TogetherMemberPreview
        members={[adminMember, selfPartner]}
        youLabel="You"
        unnamedFallback="Member"
        roleAdminLabel="Admin"
        rolePartnerLabel="Partner"
        roleAdminHint="Can manage the household"
        rolePartnerHint="Member access"
      />,
    );

    const preview = screen.getByTestId("together-member-preview");
    expect(preview).toBeInTheDocument();
    expect(screen.getByText("Admin Member")).toBeInTheDocument();
    expect(screen.getByText("self@example.com")).toBeInTheDocument();
    expect(screen.getByText("(You)")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Partner")).toBeInTheDocument();
    expect(screen.getByText("Can manage the household")).toBeInTheDocument();
    expect(screen.getByText("Member access")).toBeInTheDocument();
    expect(screen.getByLabelText("Admin Member, Admin")).toBeInTheDocument();
    expect(
      screen.getByLabelText("self@example.com, You, Partner"),
    ).toBeInTheDocument();
  });

  it("does not expose user ids on unnamed member rows", () => {
    render(
      <TogetherMemberPreview
        members={[unnamedMember]}
        youLabel="You"
        unnamedFallback="Member"
        roleAdminLabel="Admin"
        rolePartnerLabel="Partner"
        roleAdminHint="Can manage the household"
        rolePartnerHint="Member access"
      />,
    );

    expect(screen.getByText("Member")).toBeInTheDocument();
    expect(screen.queryByText(unnamedMember.userId)).not.toBeInTheDocument();
    expect(
      screen.queryByText(unnamedMember.userId.slice(0, 8)),
    ).not.toBeInTheDocument();
  });

  it("keeps member management test ids and hides unauthorized admin actions", () => {
    render(
      <NextIntlClientProvider locale="en" messages={{ together: enTogether }}>
        <StatusAlertProvider>
          <MemberList
            members={[adminMember, selfPartner]}
            youLabel="You"
            unnamedFallback="Member"
            roleAdminLabel="Admin"
            rolePartnerLabel="Partner"
            roleAdminHint="Can manage the household"
            rolePartnerHint="Member access"
            activeLabel="Active"
            canManageRoles={false}
            canManageMembers={false}
          />
        </StatusAlertProvider>
      </NextIntlClientProvider>,
    );

    expect(screen.getByTestId("together-members")).toBeInTheDocument();
    expect(
      screen.getByTestId("together-member-member-admin"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("together-role-admin")).toHaveTextContent(
      "Admin",
    );
    expect(screen.getByTestId("together-role-partner")).toHaveTextContent(
      "Partner",
    );
    expect(
      screen.queryByTestId("together-change-role"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("together-remove-member"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("together-leave-member")).toBeInTheDocument();
  });
});

describe("Phase 13 Together invitations", () => {
  it("renders pending invitation identity without inventing expiry or empty cards", () => {
    render(
      <TogetherInvitationPreview
        invitations={[pendingInvite]}
        locale="en"
        pendingLabel="Pending"
        expiresLabel={(date) => `Expires ${date}`}
      />,
    );

    const preview = screen.getByTestId("together-invitation-preview");
    expect(preview).toBeInTheDocument();
    expect(screen.getByText(pendingInvite.email)).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText(/Expires /)).toBeInTheDocument();
    expect(screen.queryByText(pendingInvite.token)).not.toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      TOGETHER_PATH.INVITATIONS,
    );
  });

  it("renders nothing when there are no pending invitations", () => {
    const { container } = render(
      <TogetherInvitationPreview
        invitations={[]}
        locale="en"
        pendingLabel="Pending"
        expiresLabel={(date) => date}
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(
      screen.queryByTestId("together-invitation-preview"),
    ).not.toBeInTheDocument();
  });
});

describe("Phase 13 Together accessibility helpers", () => {
  it("keeps role meaning in labels rather than color alone", () => {
    expect(isHouseholdAdmin(HOUSEHOLD_ROLE.ADMIN)).toBe(true);
    expect(isHouseholdAdmin(HOUSEHOLD_ROLE.PARTNER)).toBe(false);
    expect(
      memberRowAriaLabel({
        name: "Alex",
        isSelf: true,
        youLabel: "You",
        roleLabel: "Admin",
      }),
    ).toBe("Alex, You, Admin");
    expect(
      invitationRowAriaLabel({
        email: "partner@example.com",
        status: "Pending",
        expiry: "Expires 12/1/2026",
      }),
    ).toBe("partner@example.com, Pending, Expires 12/1/2026");
    expect(householdLocaleLabelKey(HOUSEHOLD_LOCALE.ENGLISH_VIETNAM)).toBe(
      "localeEnglish",
    );
    expect(householdLocaleLabelKey(HOUSEHOLD_LOCALE.VIETNAMESE_VIETNAM)).toBe(
      "localeVietnamese",
    );
    expect(householdLocaleLabelKey("fr-FR")).toBeNull();
  });
});

describe("Phase 13 Together contracts", () => {
  it("keeps the identity-first hub hierarchy on existing routes", () => {
    const overview = readProjectFile(
      "app/[locale]/(product)/together/page.tsx",
    );

    expect(overview).toContain("TOGETHER_PATH.MEMBERS");
    expect(overview).toContain("TOGETHER_PATH.INVITATIONS");
    expect(overview).toContain("TOGETHER_PATH.INVITATIONS_NEW");
    expect(overview).toContain("TOGETHER_PATH.POLICIES");
    expect(overview).toContain("TOGETHER_PATH.SETTINGS");
    expect(overview).not.toContain("TOGETHER_PATH.PREFERENCES");
    expect(overview).toContain('title={t("title")}');
    expect(overview).toContain('title={t("membersTitle")}');
    expect(overview).toContain('title={t("invitedTitle")}');
    expect(overview).toContain('title={t("collaborationTitle")}');
    expect(overview).toContain('title={t("settingsSectionTitle")}');
    expect(overview).toContain("together-settings-link");
    expect(overview).toContain("TogetherInvitationPreview");
    expect(overview).toContain("pendingCount > 0");
    expect(overview).not.toContain("Net Worth");
    expect(overview).not.toContain("userId.slice");
  });

  it("groups household preferences under the existing Settings route", () => {
    const settings = readProjectFile(
      "app/[locale]/(product)/together/settings/page.tsx",
    );
    const preferences = readProjectFile(
      "app/[locale]/(product)/together/preferences/page.tsx",
    );

    expect(settings).toContain("HouseholdPreferenceFact");
    expect(settings).toContain("TOGETHER_PATH.PREFERENCES");
    expect(settings).toContain("together-preferences-link");
    expect(settings).toContain("getHouseholdPreferences");
    expect(settings).toContain("TogetherPreferences");
    expect(settings).toContain("TOGETHER_PATH.SETTINGS_ACCOUNT");
    expect(preferences).toContain("TOGETHER_PATH.SETTINGS");
    expect(preferences).toContain("HouseholdPreferencesForm");
  });

  it("preserves invitation and member mutation payloads", () => {
    const inviteForm = readProjectFile(
      "app/[locale]/(product)/together/invitations/new/invitation-form.tsx",
    );
    const inviteActions = readProjectFile(
      "app/[locale]/(product)/together/invite-actions.ts",
    );
    const roleAction = readProjectFile(
      "app/[locale]/(product)/together/members/member-role-action.tsx",
    );
    const lifecycleAction = readProjectFile(
      "app/[locale]/(product)/together/members/member-lifecycle-action.tsx",
    );
    const memberActions = readProjectFile(
      "app/[locale]/(product)/together/members/actions.ts",
    );

    expect(inviteForm).toContain(
      "createInvitationAction({ email: email.trim() })",
    );
    expect(inviteActions).toContain("createInvitation(input)");
    expect(inviteActions).toContain("revokeInvitation(invitationId)");
    expect(roleAction).toContain("membershipId: member.id");
    expect(roleAction).toContain("role: nextRole");
    expect(lifecycleAction).toContain("removeHouseholdMemberAction(member.id)");
    expect(lifecycleAction).toContain("leaveHouseholdAction()");
    expect(memberActions).toContain("changeHouseholdRole(input)");
    expect(memberActions).toContain("leaveHousehold()");
    expect(memberActions).toContain("removeHouseholdMember(membershipId)");
  });

  it("does not invent settings or financial dashboard copy", () => {
    expect(enTogether.policiesLink).toBe("Shared rules");
    expect(viTogether.policiesLink).toBe("Quy tắc chung");
    expect(enTogether.unnamedMember).toBe("Member");
    expect(viTogether.unnamedMember).toBe("Thành viên");
    expect(JSON.stringify(enTogether)).not.toMatch(
      /leaderboard|net worth|workspace administration/i,
    );
    expect(JSON.stringify(viTogether)).not.toMatch(
      /\b(?:Together|Money|Plan|Inbox|Home)\b/,
    );
  });
});
