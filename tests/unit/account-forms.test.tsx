import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountDetailActions } from "@/app/[locale]/(product)/money/accounts/[id]/account-detail-actions";
import { AccountDetailManagement } from "@/app/[locale]/(product)/money/accounts/[id]/account-detail-management";
import { AddAccountForm } from "@/app/[locale]/(product)/money/accounts/add-account-form";
import { AccountType } from "@/modules/ledger/application/ledger-constants";
import { ACCOUNT_DETAIL_MODE } from "@/app/[locale]/(product)/money/accounts/[id]/detail-constants";

const { updateAccountMock, archiveAccountMock, createAccountMock } = vi.hoisted(
  () => ({
    updateAccountMock: vi.fn(),
    archiveAccountMock: vi.fn(),
    createAccountMock: vi.fn(),
  }),
);

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/shared/hooks/use-online-status", () => ({
  useOnlineStatusClient: () => ({ online: true }),
}));

vi.mock("@/app/[locale]/(product)/money/accounts/actions", () => ({
  updateAccountAction: updateAccountMock,
  archiveAccountAction: archiveAccountMock,
  createAccountAction: createAccountMock,
}));

const ACCOUNT_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

function AccountActionsFixture() {
  const [mode, setMode] = useState(ACCOUNT_DETAIL_MODE.MANAGE);

  return (
    <AccountDetailActions
      accountId={ACCOUNT_ID}
      initialName="VCB"
      initialType={AccountType.CHECKING}
      mode={mode}
      onModeChange={setMode}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  updateAccountMock.mockResolvedValue({ status: "success" });
  archiveAccountMock.mockResolvedValue({ status: "success" });
});

describe("account edit form", () => {
  it("uses one current-mode title for manage and edit", () => {
    render(
      <AccountDetailManagement
        accountId={ACCOUNT_ID}
        initialName="VCB"
        initialType={AccountType.CHECKING}
        canMutate
      />,
    );

    fireEvent.click(screen.getByTestId("account-management-open"));
    expect(screen.getByText("manageTitle")).toBeInTheDocument();
    expect(screen.getByTestId("account-edit-open")).toHaveClass(
      "justify-between",
    );
    expect(screen.getByTestId("account-archive-open")).toHaveClass(
      "text-danger",
    );
    expect(screen.getAllByRole("button")).toHaveLength(3);
    fireEvent.click(screen.getByTestId("account-edit-open"));

    expect(screen.getByText("editTitle")).toBeInTheDocument();
    expect(screen.queryByText("manageTitle")).not.toBeInTheDocument();
  });

  it("discards canceled edits before reopening", () => {
    render(<AccountActionsFixture />);

    fireEvent.click(screen.getByTestId("account-edit-open"));
    expect(
      screen.queryByTestId("account-opening-balance"),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("nameLabel"), {
      target: { value: "Abandoned name" },
    });
    fireEvent.click(screen.getByText("cancel"));
    fireEvent.click(screen.getByTestId("account-edit-open"));

    expect(screen.getByLabelText("nameLabel")).toHaveValue("VCB");
  });
});

describe("account create form", () => {
  it("uses the shared scroll body and sticky footer in a Sheet", () => {
    render(
      <AddAccountForm
        liquidAccounts={[]}
        currency="VND"
        open
        onOpenChange={vi.fn()}
        hideDefaultTrigger
        presentation="sheet"
      />,
    );

    expect(screen.getByTestId("account-add-form")).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="action-sheet-body"]'),
    ).toHaveClass("overflow-y-auto");
    expect(
      document.querySelector('[data-slot="action-sheet-footer"]'),
    ).toBeInTheDocument();
  });

  it("shows opening balance for the default liquid account and resets it on close", () => {
    const { rerender } = render(
      <AddAccountForm
        liquidAccounts={[]}
        currency="VND"
        open
        onOpenChange={vi.fn()}
        hideDefaultTrigger
        presentation="card"
      />,
    );

    const openingBalance = screen.getByLabelText("openingBalanceLabel");
    fireEvent.change(openingBalance, { target: { value: "50000000" } });
    expect(openingBalance).toHaveValue("50,000,000");

    fireEvent.click(screen.getByText("cancel"));
    rerender(
      <AddAccountForm
        liquidAccounts={[]}
        currency="VND"
        open={false}
        onOpenChange={vi.fn()}
        hideDefaultTrigger
        presentation="card"
      />,
    );
    rerender(
      <AddAccountForm
        liquidAccounts={[]}
        currency="VND"
        open
        onOpenChange={vi.fn()}
        hideDefaultTrigger
        presentation="card"
      />,
    );

    expect(screen.getByLabelText("openingBalanceLabel")).toHaveValue("0");
  });

  it("shows card settings instead of opening balance for credit cards", () => {
    render(
      <AddAccountForm
        liquidAccounts={[]}
        currency="VND"
        open
        onOpenChange={vi.fn()}
        hideDefaultTrigger
        presentation="card"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /typeLabel/ }));
    fireEvent.click(screen.getByRole("option", { name: "credit_card" }));

    expect(
      screen.queryByTestId("account-opening-balance"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("account-credit-card-settings"),
    ).toBeInTheDocument();
  });
});
