import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  HOUSEHOLD_ROLE,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import {
  TogetherNavAppearance,
  TogetherNavGroup,
  TogetherNavRow,
  TogetherPrimaryLink,
  TogetherStatusStrip,
} from "@/shared/patterns/together-management";
import { NAVIGATION_ICONS, UTILITY_ICONS } from "@/shared/ui/icon-registry";
import { TogetherMemberPreview } from "@/app/[locale]/(product)/together/together-member-preview";
import {
  memberDisplayName,
  memberInitials,
} from "@/app/[locale]/(product)/together/together-member-identity";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

describe("Together member identity", () => {
  it("derives initials and display names from real member fields", () => {
    expect(memberInitials("alex@example.com", "Alex Nguyen")).toBe("AN");
    expect(memberInitials("solo@example.com", null)).toBe("SE");
    expect(
      memberDisplayName(
        {
          displayName: "Alex Nguyen",
          email: "alex@example.com",
        },
        "Member",
      ),
    ).toBe("Alex Nguyen");
    expect(
      memberDisplayName(
        {
          displayName: null,
          email: "alex@example.com",
        },
        "Member",
      ),
    ).toBe("alex@example.com");
    expect(
      memberDisplayName(
        {
          displayName: null,
          email: null,
        },
        "Member",
      ),
    ).toBe("Member");
  });
});

describe("Together UI polish", () => {
  it("renders live members in the overview preview", () => {
    render(
      <TogetherMemberPreview
        members={[
          {
            id: "member-admin",
            userId: "user-admin",
            role: HOUSEHOLD_ROLE.ADMIN,
            email: "admin@example.com",
            displayName: "Admin Member",
            isSelf: false,
          },
          {
            id: "member-self",
            userId: "user-self",
            role: HOUSEHOLD_ROLE.PARTNER,
            email: "self@example.com",
            displayName: null,
            isSelf: true,
          },
        ]}
        youLabel="You"
        unnamedFallback="Member"
        roleAdminLabel="Admin"
        rolePartnerLabel="Partner"
        roleAdminHint="Can manage the household"
        rolePartnerHint="Member access"
      />,
    );

    expect(screen.getByTestId("together-member-preview")).toBeInTheDocument();
    expect(screen.getByText("Admin Member")).toBeInTheDocument();
    expect(screen.getByText("self@example.com")).toBeInTheDocument();
    expect(screen.getByText("(You)")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Partner")).toBeInTheDocument();
  });

  it("groups management destinations without dropping existing test ids", () => {
    render(
      <TogetherNavGroup>
        <TogetherNavRow
          href={TOGETHER_PATH.INVITATIONS}
          appearance={TogetherNavAppearance.GROUPED}
          icon={UTILITY_ICONS.notification}
          title="Pending invitations"
          description="Invite or review someone joining this household."
          badge="2"
          testId="together-invitations-link"
        />
        <TogetherNavRow
          href={TOGETHER_PATH.SETTINGS}
          appearance={TogetherNavAppearance.GROUPED}
          icon={NAVIGATION_ICONS.together}
          title="Settings"
          testId="together-settings-link"
        />
      </TogetherNavGroup>,
    );

    expect(screen.getByTestId("together-invitations-link")).toHaveAttribute(
      "href",
      TOGETHER_PATH.INVITATIONS,
    );
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByTestId("together-settings-link")).toHaveAttribute(
      "href",
      TOGETHER_PATH.SETTINGS,
    );
  });

  it("keeps the invite CTA as a real Together destination", () => {
    render(
      <TogetherPrimaryLink
        href={TOGETHER_PATH.INVITATIONS_NEW}
        testId="together-invite-cta"
      >
        Invite partner
      </TogetherPrimaryLink>,
    );

    expect(screen.getByTestId("together-invite-cta")).toHaveAttribute(
      "href",
      TOGETHER_PATH.INVITATIONS_NEW,
    );
    expect(screen.getByText("Invite partner")).toBeInTheDocument();
  });

  it("keeps lifecycle notices readable on the status strip", () => {
    render(
      <TogetherStatusStrip>
        <p>Household closure is not available yet</p>
      </TogetherStatusStrip>,
    );

    expect(
      screen.getByText("Household closure is not available yet"),
    ).toBeInTheDocument();
  });
});
