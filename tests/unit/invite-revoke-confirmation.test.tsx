import type { ReactElement } from "react";
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
import type { PendingInvitation } from "@/modules/tenancy/application/list-pending-invitations";
import { INVITATION_ERROR_CODE } from "@/modules/tenancy/application/tenancy-constants";
import {
  StatusAlertHost,
  StatusAlertProvider,
} from "@/providers/status-alert-provider";

const { revokeInvitationActionMock, refreshMock } = vi.hoisted(() => ({
  revokeInvitationActionMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/app/[locale]/(product)/together/invite-actions", () => ({
  revokeInvitationAction: revokeInvitationActionMock,
}));

import { InvitationsPanel } from "@/app/[locale]/(product)/together/invitations/invitations-panel";

const firstInvitation: PendingInvitation = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  email: "partner@example.com",
  token: "token-partner",
  expiresAt: "2026-12-01T00:00:00.000Z",
  createdAt: "2026-09-01T00:00:00.000Z",
};

const secondInvitation: PendingInvitation = {
  id: "550e8400-e29b-41d4-a716-446655440002",
  email: "second@example.com",
  token: "token-second",
  expiresAt: "2026-12-02T00:00:00.000Z",
  createdAt: "2026-09-02T00:00:00.000Z",
};

function renderPanel(
  invitations: PendingInvitation[] = [firstInvitation],
  locale: "en" | "vi" = "en",
) {
  const ui: ReactElement = (
    <NextIntlClientProvider
      locale={locale}
      messages={{ together: locale === "vi" ? viTogether : enTogether }}
    >
      <StatusAlertProvider>
        <InvitationsPanel initialInvitations={invitations} />
        <StatusAlertHost />
      </StatusAlertProvider>
    </NextIntlClientProvider>
  );
  return render(ui);
}

async function openRevokeConfirm(index = 0) {
  await act(async () => {
    fireEvent.click(screen.getAllByTestId("invite-revoke")[index]!);
  });
  expect(await screen.findByTestId("invite-revoke-confirm")).toBeVisible();
}

describe("Invitation revoke confirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    revokeInvitationActionMock.mockResolvedValue({ status: "success" });
  });

  it("opens a danger confirmation sheet without calling the mutation", async () => {
    renderPanel();

    await openRevokeConfirm();

    expect(revokeInvitationActionMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("invite-revoke-target")).toHaveTextContent(
      firstInvitation.email,
    );
    expect(
      screen.getByText(enTogether.invitations.revokeConfirmDescription),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: enTogether.invitations.revokeConfirm,
      }),
    ).toBeVisible();
  });

  it("identifies the invitation that was selected after cancel and reopen", async () => {
    renderPanel([firstInvitation, secondInvitation]);

    await openRevokeConfirm(0);
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: enTogether.invitations.revokeCancel,
        }),
      );
    });
    await waitFor(() =>
      expect(
        screen.queryByTestId("invite-revoke-confirm"),
      ).not.toBeInTheDocument(),
    );

    await openRevokeConfirm(1);

    expect(screen.getByTestId("invite-revoke-target")).toHaveTextContent(
      secondInvitation.email,
    );
    expect(revokeInvitationActionMock).not.toHaveBeenCalled();
  });

  it("does not revoke when Cancel is pressed", async () => {
    renderPanel();
    await openRevokeConfirm();

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: enTogether.invitations.revokeCancel,
        }),
      );
    });

    await waitFor(() =>
      expect(
        screen.queryByTestId("invite-revoke-confirm"),
      ).not.toBeInTheDocument(),
    );
    expect(revokeInvitationActionMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("does not revoke when Escape dismisses the sheet", async () => {
    renderPanel();
    await openRevokeConfirm();

    await act(async () => {
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    });

    await waitFor(() =>
      expect(
        screen.queryByTestId("invite-revoke-confirm"),
      ).not.toBeInTheDocument(),
    );
    expect(revokeInvitationActionMock).not.toHaveBeenCalled();
  });

  it("calls the existing revoke action exactly once and refreshes on success", async () => {
    let resolveAction: (value: unknown) => void = () => {};
    revokeInvitationActionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );

    renderPanel();
    await openRevokeConfirm();

    await act(async () => {
      fireEvent.click(screen.getByTestId("invite-revoke-confirm"));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("invite-revoke-confirm"));
    });

    expect(revokeInvitationActionMock).toHaveBeenCalledTimes(1);
    expect(revokeInvitationActionMock).toHaveBeenCalledWith(firstInvitation.id);
    expect(screen.getByTestId("invite-revoke-confirm")).toBeDisabled();

    await act(async () => {
      resolveAction({ status: "success" });
    });

    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByTestId("invite-revoke-confirm"),
    ).not.toBeInTheDocument();
  });

  it("keeps the sheet open and shows the existing error when revoke fails", async () => {
    revokeInvitationActionMock.mockResolvedValue({
      status: "error",
      code: INVITATION_ERROR_CODE.UNKNOWN,
    });

    renderPanel();
    await openRevokeConfirm();

    await act(async () => {
      fireEvent.click(screen.getByTestId("invite-revoke-confirm"));
    });

    expect(
      await screen.findByText(enTogether.invitations.errors.unknown),
    ).toBeInTheDocument();
    expect(screen.getByTestId("invite-revoke-confirm")).toBeVisible();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("renders Vietnamese confirmation copy without raw keys", async () => {
    renderPanel([firstInvitation], "vi");
    await openRevokeConfirm();

    expect(
      screen.getByText(viTogether.invitations.revokeConfirmTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(viTogether.invitations.revokeConfirmDescription),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: viTogether.invitations.revokeConfirm,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("revokeConfirmTitle")).not.toBeInTheDocument();
  });
});
