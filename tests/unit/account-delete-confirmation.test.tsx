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
import enAuth from "@/messages/en/auth.json";
import viAuth from "@/messages/vi/auth.json";
import {
  AUTH_ACTION_ERROR_CODE,
  AUTH_LOCALE_WELCOME_SEGMENT,
} from "@/modules/tenancy/application/auth-constants";
import {
  StatusAlertHost,
  StatusAlertProvider,
} from "@/providers/status-alert-provider";

const { deleteAccountActionMock, refreshMock, replaceMock } = vi.hoisted(
  () => ({
    deleteAccountActionMock: vi.fn(),
    refreshMock: vi.fn(),
    replaceMock: vi.fn(),
  }),
);

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, replace: replaceMock }),
}));

vi.mock("@/app/[locale]/(product)/together/actions", () => ({
  deleteAccountAction: deleteAccountActionMock,
}));

import { AccountLifecycleCard } from "@/app/[locale]/(product)/together/account-lifecycle-card";

function renderCard(locale: "en" | "vi" = "en") {
  const ui: ReactElement = (
    <NextIntlClientProvider
      locale={locale}
      messages={{ auth: locale === "vi" ? viAuth : enAuth }}
    >
      <StatusAlertProvider>
        <AccountLifecycleCard />
        <StatusAlertHost />
      </StatusAlertProvider>
    </NextIntlClientProvider>
  );
  return render(ui);
}

async function openDeleteConfirm() {
  await act(async () => {
    fireEvent.click(screen.getByTestId("delete-account"));
  });
  expect(await screen.findByTestId("delete-account-confirm")).toBeVisible();
}

describe("Account deletion confirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteAccountActionMock.mockResolvedValue({ status: "success" });
  });

  it("opens a danger confirmation sheet without calling the mutation", async () => {
    renderCard();

    await openDeleteConfirm();

    expect(deleteAccountActionMock).not.toHaveBeenCalled();
    expect(screen.getByText(enAuth.account.deleteConfirmTitle)).toBeVisible();
    expect(
      screen.getByText(enAuth.account.deleteConfirmDescription),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: enAuth.account.deleteConfirm }),
    ).toBeVisible();
  });

  it("does not delete when Cancel is pressed", async () => {
    renderCard();
    await openDeleteConfirm();

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: enAuth.account.deleteCancel }),
      );
    });

    await waitFor(() =>
      expect(
        screen.queryByTestId("delete-account-confirm"),
      ).not.toBeInTheDocument(),
    );
    expect(deleteAccountActionMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("does not delete when Escape dismisses the sheet", async () => {
    renderCard();
    await openDeleteConfirm();

    await act(async () => {
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    });

    await waitFor(() =>
      expect(
        screen.queryByTestId("delete-account-confirm"),
      ).not.toBeInTheDocument(),
    );
    expect(deleteAccountActionMock).not.toHaveBeenCalled();
  });

  it("calls the existing delete action exactly once and keeps the success navigation", async () => {
    let resolveAction: (value: unknown) => void = () => {};
    deleteAccountActionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );

    renderCard();
    await openDeleteConfirm();

    await act(async () => {
      fireEvent.click(screen.getByTestId("delete-account-confirm"));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("delete-account-confirm"));
    });

    expect(deleteAccountActionMock).toHaveBeenCalledTimes(1);
    expect(deleteAccountActionMock).toHaveBeenCalledWith();
    expect(screen.getByTestId("delete-account-confirm")).toBeDisabled();

    await act(async () => {
      resolveAction({ status: "success" });
    });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        `/${AUTH_LOCALE_WELCOME_SEGMENT}`,
      );
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });
  });

  it("keeps the sheet open and shows the existing error when deletion fails", async () => {
    deleteAccountActionMock.mockResolvedValue({
      status: "error",
      code: AUTH_ACTION_ERROR_CODE.UNKNOWN,
    });

    renderCard();
    await openDeleteConfirm();

    await act(async () => {
      fireEvent.click(screen.getByTestId("delete-account-confirm"));
    });

    expect(
      await screen.findByText(enAuth.account.errors.unknown),
    ).toBeInTheDocument();
    expect(screen.getByTestId("delete-account-confirm")).toBeVisible();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("renders Vietnamese confirmation copy without raw keys", async () => {
    renderCard("vi");
    await openDeleteConfirm();

    expect(screen.getByText(viAuth.account.deleteConfirmTitle)).toBeVisible();
    expect(
      screen.getByText(viAuth.account.deleteConfirmDescription),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: viAuth.account.deleteConfirm }),
    ).toBeInTheDocument();
    expect(screen.queryByText("deleteConfirmTitle")).not.toBeInTheDocument();
  });
});
