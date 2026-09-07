import type { ReactElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import enTogether from "@/messages/en/together.json";
import viTogether from "@/messages/vi/together.json";
import type { HouseholdMemberRow } from "@/modules/tenancy/application/list-household-members";
import {
  EMPTY_MEMBERSHIP_IMPACT,
  type MembershipImpactSummary,
} from "@/modules/tenancy/application/membership-lifecycle";
import {
  HOUSEHOLD_ERROR_CODE,
  HOUSEHOLD_ROLE,
  MEMBERSHIP_LIFECYCLE_ACTION,
  type MembershipLifecycleAction,
} from "@/modules/tenancy/application/tenancy-constants";
import {
  StatusAlertHost,
  StatusAlertProvider,
} from "@/providers/status-alert-provider";
import { ButtonVariant } from "@/shared/ui/button";

const {
  leaveHouseholdActionMock,
  removeHouseholdMemberActionMock,
  refreshMock,
} = vi.hoisted(() => ({
  leaveHouseholdActionMock: vi.fn(),
  removeHouseholdMemberActionMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/app/[locale]/(product)/together/members/actions", () => ({
  leaveHouseholdAction: leaveHouseholdActionMock,
  removeHouseholdMemberAction: removeHouseholdMemberActionMock,
}));

import { MemberLifecycleAction } from "@/app/[locale]/(product)/together/members/member-lifecycle-action";

const selfMember: HouseholdMemberRow = {
  id: "550e8400-e29b-41d4-a716-446655440101",
  userId: "user-self",
  role: HOUSEHOLD_ROLE.PARTNER,
  email: "self@example.com",
  displayName: "Self Member",
  isSelf: true,
};

const partnerMember: HouseholdMemberRow = {
  id: "550e8400-e29b-41d4-a716-446655440102",
  userId: "user-partner",
  role: HOUSEHOLD_ROLE.PARTNER,
  email: "partner@example.com",
  displayName: "Partner Member",
  isSelf: false,
};

const impactWithObligations: MembershipImpactSummary = {
  accounts: 2,
  savings: 1,
  investments: 0,
  loans: 1,
  liabilities: 0,
  total: 4,
};

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function renderLifecycle({
  action,
  member,
  impact = EMPTY_MEMBERSHIP_IMPACT,
  isLastAdmin = false,
  isSoloAdmin = false,
  locale = "en",
}: {
  action: MembershipLifecycleAction;
  member: HouseholdMemberRow;
  impact?: MembershipImpactSummary;
  isLastAdmin?: boolean;
  isSoloAdmin?: boolean;
  locale?: "en" | "vi";
}) {
  const ui: ReactElement = (
    <NextIntlClientProvider
      locale={locale}
      messages={{ together: locale === "vi" ? viTogether : enTogether }}
    >
      <StatusAlertProvider>
        <MemberLifecycleAction
          action={action}
          member={member}
          impact={impact}
          isLastAdmin={isLastAdmin}
          isSoloAdmin={isSoloAdmin}
        />
        <StatusAlertHost />
      </StatusAlertProvider>
    </NextIntlClientProvider>
  );
  return render(ui);
}

async function openLeaveConfirm() {
  await act(async () => {
    fireEvent.click(screen.getByTestId("together-leave-member"));
  });
  expect(await screen.findByTestId("together-leave-confirm")).toBeVisible();
}

async function openRemoveConfirm() {
  await act(async () => {
    fireEvent.click(screen.getByTestId("together-remove-member"));
  });
  expect(await screen.findByTestId("together-remove-confirm")).toBeVisible();
}

describe("Household leave confirmation (B05)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    leaveHouseholdActionMock.mockResolvedValue({ status: "success" });
    removeHouseholdMemberActionMock.mockResolvedValue({ status: "success" });
  });

  it("opens a danger confirmation sheet without calling the mutation", async () => {
    renderLifecycle({
      action: MEMBERSHIP_LIFECYCLE_ACTION.LEAVE,
      member: selfMember,
    });

    expect(
      screen.queryByTestId("together-leave-confirm"),
    ).not.toBeInTheDocument();
    await openLeaveConfirm();

    expect(leaveHouseholdActionMock).not.toHaveBeenCalled();
    expect(removeHouseholdMemberActionMock).not.toHaveBeenCalled();
    expect(
      screen.getAllByText(enTogether.members.leaveConfirmTitle).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        enTogether.members.leaveConfirmBody.replace("{name}", "Self Member"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: enTogether.members.leaveConfirm }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: enTogether.members.leaveConfirm }),
    ).toHaveClass(`button--${ButtonVariant.DANGER}`);
    expect(
      screen.queryByRole("button", { name: "Confirm" }),
    ).not.toBeInTheDocument();
  });

  it("does not leave when Cancel is pressed", async () => {
    renderLifecycle({
      action: MEMBERSHIP_LIFECYCLE_ACTION.LEAVE,
      member: selfMember,
    });
    await openLeaveConfirm();

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: enTogether.members.cancel }),
      );
    });

    await waitFor(() =>
      expect(
        screen.queryByTestId("together-leave-confirm"),
      ).not.toBeInTheDocument(),
    );
    expect(leaveHouseholdActionMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("does not leave when Escape dismisses the sheet", async () => {
    renderLifecycle({
      action: MEMBERSHIP_LIFECYCLE_ACTION.LEAVE,
      member: selfMember,
    });
    await openLeaveConfirm();

    await act(async () => {
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    });

    await waitFor(() =>
      expect(
        screen.queryByTestId("together-leave-confirm"),
      ).not.toBeInTheDocument(),
    );
    expect(leaveHouseholdActionMock).not.toHaveBeenCalled();
  });

  it("calls the existing leave action exactly once and refreshes on success", async () => {
    let resolveAction: (value: unknown) => void = () => {};
    leaveHouseholdActionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );

    renderLifecycle({
      action: MEMBERSHIP_LIFECYCLE_ACTION.LEAVE,
      member: selfMember,
    });
    await openLeaveConfirm();

    await act(async () => {
      fireEvent.click(screen.getByTestId("together-leave-confirm"));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("together-leave-confirm"));
    });

    expect(leaveHouseholdActionMock).toHaveBeenCalledTimes(1);
    expect(leaveHouseholdActionMock).toHaveBeenCalledWith();
    expect(screen.getByTestId("together-leave-confirm")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: enTogether.members.leaveSubmitting }),
    ).toBeVisible();

    await act(async () => {
      resolveAction({ status: "success" });
    });

    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByTestId("together-leave-confirm"),
    ).not.toBeInTheDocument();
  });

  it("keeps the sheet open and uses the leave error title when leave fails", async () => {
    leaveHouseholdActionMock.mockResolvedValue({
      status: "error",
      code: HOUSEHOLD_ERROR_CODE.UNKNOWN,
    });

    renderLifecycle({
      action: MEMBERSHIP_LIFECYCLE_ACTION.LEAVE,
      member: selfMember,
    });
    await openLeaveConfirm();

    await act(async () => {
      fireEvent.click(screen.getByTestId("together-leave-confirm"));
    });

    expect(
      await screen.findByText(enTogether.members.leaveErrorTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(enTogether.members.errors.unknown),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(enTogether.members.errorTitle),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("together-leave-confirm")).toBeVisible();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("renders Vietnamese leave confirmation copy without raw keys", async () => {
    renderLifecycle({
      action: MEMBERSHIP_LIFECYCLE_ACTION.LEAVE,
      member: selfMember,
      locale: "vi",
    });
    await openLeaveConfirm();

    expect(
      screen.getAllByText(viTogether.members.leaveConfirmTitle).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: viTogether.members.leaveConfirm }),
    ).toBeInTheDocument();
    expect(screen.queryByText("leaveConfirmTitle")).not.toBeInTheDocument();
    expect(screen.queryByText("Xác nhận")).not.toBeInTheDocument();
  });
});

describe("Household remove confirmation (B05)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    leaveHouseholdActionMock.mockResolvedValue({ status: "success" });
    removeHouseholdMemberActionMock.mockResolvedValue({ status: "success" });
  });

  it("opens a danger confirmation sheet with consequence copy and an action-specific CTA", async () => {
    renderLifecycle({
      action: MEMBERSHIP_LIFECYCLE_ACTION.REMOVE,
      member: partnerMember,
      impact: impactWithObligations,
    });

    expect(
      screen.queryByTestId("together-remove-confirm"),
    ).not.toBeInTheDocument();
    await openRemoveConfirm();

    expect(removeHouseholdMemberActionMock).not.toHaveBeenCalled();
    expect(leaveHouseholdActionMock).not.toHaveBeenCalled();
    expect(
      screen.getAllByText(enTogether.members.removeConfirmTitle).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        enTogether.members.removeConfirmBody.replace(
          "{name}",
          "Partner Member",
        ),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(enTogether.members.obligationWarning),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: enTogether.members.removeConfirm }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: enTogether.members.removeConfirm }),
    ).toHaveClass(`button--${ButtonVariant.DANGER}`);
    expect(
      screen.queryByRole("button", { name: "Confirm" }),
    ).not.toBeInTheDocument();
  });

  it("does not remove when Cancel is pressed", async () => {
    renderLifecycle({
      action: MEMBERSHIP_LIFECYCLE_ACTION.REMOVE,
      member: partnerMember,
    });
    await openRemoveConfirm();

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: enTogether.members.cancel }),
      );
    });

    await waitFor(() =>
      expect(
        screen.queryByTestId("together-remove-confirm"),
      ).not.toBeInTheDocument(),
    );
    expect(removeHouseholdMemberActionMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("does not remove when Escape dismisses the sheet", async () => {
    renderLifecycle({
      action: MEMBERSHIP_LIFECYCLE_ACTION.REMOVE,
      member: partnerMember,
    });
    await openRemoveConfirm();

    await act(async () => {
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    });

    await waitFor(() =>
      expect(
        screen.queryByTestId("together-remove-confirm"),
      ).not.toBeInTheDocument(),
    );
    expect(removeHouseholdMemberActionMock).not.toHaveBeenCalled();
  });

  it("calls the existing remove action exactly once with the membership id", async () => {
    let resolveAction: (value: unknown) => void = () => {};
    removeHouseholdMemberActionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );

    renderLifecycle({
      action: MEMBERSHIP_LIFECYCLE_ACTION.REMOVE,
      member: partnerMember,
    });
    await openRemoveConfirm();

    await act(async () => {
      fireEvent.click(screen.getByTestId("together-remove-confirm"));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("together-remove-confirm"));
    });

    expect(removeHouseholdMemberActionMock).toHaveBeenCalledTimes(1);
    expect(removeHouseholdMemberActionMock).toHaveBeenCalledWith(
      partnerMember.id,
    );
    expect(screen.getByTestId("together-remove-confirm")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: enTogether.members.removeSubmitting }),
    ).toBeVisible();

    await act(async () => {
      resolveAction({ status: "success" });
    });

    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByTestId("together-remove-confirm"),
    ).not.toBeInTheDocument();
  });

  it("keeps the sheet open and uses the remove error title when remove fails", async () => {
    removeHouseholdMemberActionMock.mockResolvedValue({
      status: "error",
      code: HOUSEHOLD_ERROR_CODE.UNKNOWN,
    });

    renderLifecycle({
      action: MEMBERSHIP_LIFECYCLE_ACTION.REMOVE,
      member: partnerMember,
    });
    await openRemoveConfirm();

    await act(async () => {
      fireEvent.click(screen.getByTestId("together-remove-confirm"));
    });

    expect(
      await screen.findByText(enTogether.members.removeErrorTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(enTogether.members.errors.unknown),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(enTogether.members.errorTitle),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("together-remove-confirm")).toBeVisible();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});

describe("Household lifecycle confirmation pattern (B05)", () => {
  it("uses the canonical destructive SheetActionFooter instead of a hand-rolled footer", () => {
    const lifecycle = readProjectFile(
      "app/[locale]/(product)/together/members/member-lifecycle-action.tsx",
    );
    const role = readProjectFile(
      "app/[locale]/(product)/together/members/member-role-action.tsx",
    );
    const revoke = readProjectFile(
      "app/[locale]/(product)/together/invitations/invite-revoke-confirm-sheet.tsx",
    );

    expect(lifecycle).toContain("SheetActionFooter");
    expect(lifecycle).toContain("ButtonVariant.DANGER");
    expect(lifecycle).toContain("together-leave-confirm");
    expect(lifecycle).toContain("together-remove-confirm");
    expect(lifecycle).not.toContain("confirmLifecycle");
    expect(lifecycle).not.toContain('t("errorTitle")');
    expect(lifecycle).not.toContain("ActionSheetLayout.Footer");

    expect(role).toContain('t("errorTitle")');
    expect(role).toContain('t("confirm")');

    expect(revoke).toContain("SheetActionFooter");
    expect(revoke).toContain("ButtonVariant.DANGER");
    expect(revoke).toContain('t("revokeConfirm")');
    expect(revoke).toContain('primaryTestId="invite-revoke-confirm"');
  });

  it("blocks last-admin leave without opening a destructive confirmation", () => {
    renderLifecycle({
      action: MEMBERSHIP_LIFECYCLE_ACTION.LEAVE,
      member: {
        ...selfMember,
        role: HOUSEHOLD_ROLE.ADMIN,
      },
      isLastAdmin: true,
    });

    expect(
      screen.getByText(enTogether.members.leaveBlockedTitle),
    ).toBeVisible();
    expect(
      screen.queryByTestId("together-leave-member"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("together-leave-confirm"),
    ).not.toBeInTheDocument();
    expect(leaveHouseholdActionMock).not.toHaveBeenCalled();
  });
});
