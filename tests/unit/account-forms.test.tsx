import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountDetailActions } from "@/app/[locale]/(product)/money/accounts/[id]/account-detail-actions";
import { AccountDetailManagement } from "@/app/[locale]/(product)/money/accounts/[id]/account-detail-management";
import { AddAccountForm } from "@/app/[locale]/(product)/money/accounts/add-account-form";
import {
  AccountType,
  DEFAULT_CURRENCY,
} from "@/modules/ledger/application/ledger-constants";
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
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
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

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

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

  it("uses the shared sheet footer for archive confirmation", () => {
    render(<AccountActionsFixture />);

    fireEvent.click(screen.getByTestId("account-archive-open"));

    expect(screen.getByTestId("account-archive-confirm")).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="action-sheet-footer"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("account-archive-confirm-yes"),
    ).toBeInTheDocument();
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

  it("keeps regular account input usable while receipt currency is pending", async () => {
    const currency = createDeferred<string>();
    render(
      <AddAccountForm
        liquidAccounts={[]}
        currency={DEFAULT_CURRENCY}
        currencyPromise={currency.promise}
        hideDefaultTrigger
        presentation="page"
      />,
    );

    const form = screen.getByTestId("account-add-page-form");
    const nameField = screen.getByLabelText(/nameLabel/);
    const openingBalance = screen.getByLabelText("openingBalanceLabel");
    fireEvent.change(nameField, { target: { value: "Household cash" } });
    fireEvent.change(openingBalance, { target: { value: "50000000" } });
    fireEvent.click(screen.getByRole("radio", { name: "personal" }));

    expect(nameField).toBeEnabled();
    expect(openingBalance).toBeEnabled();

    await act(async () => {
      currency.resolve(DEFAULT_CURRENCY);
      await currency.promise;
    });

    expect(screen.getByTestId("account-add-page-form")).toBe(form);
    expect(screen.getByLabelText(/nameLabel/)).toBe(nameField);
    expect(nameField).toHaveValue("Household cash");
    expect(openingBalance).toHaveValue("50,000,000");
    expect(screen.getByRole("radio", { name: "personal" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
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
    expect(screen.getByText("linkedBankDescription")).toBeInTheDocument();
    expect(screen.getByTestId("account-linked-bank")).toBeInTheDocument();
  });

  it("keeps card fields mounted and usable while linked accounts load", async () => {
    const accountData = createDeferred<{
      currency: string;
      liquidAccounts: { id: string; name: string }[];
    }>();

    await act(async () => {
      render(
        <AddAccountForm
          liquidAccounts={[]}
          currency={DEFAULT_CURRENCY}
          accountDataPromise={accountData.promise}
          fixedType={AccountType.CREDIT_CARD}
          hideCreditCardType
          hideDefaultTrigger
          presentation="page"
        />,
      );
    });

    const nameField = screen.getByLabelText(/creditNameLabel/);
    const form = screen.getByTestId("account-add-page-form");
    const limitField = screen.getByLabelText("creditLimitLabel");
    fireEvent.change(nameField, { target: { value: "Daily card" } });
    fireEvent.change(limitField, { target: { value: "25000000" } });
    fireEvent.click(screen.getByRole("radio", { name: "personal" }));
    fireEvent.click(screen.getByLabelText(/statementDayLabel/));
    fireEvent.click(screen.getByRole("option", { name: "12" }));
    fireEvent.click(screen.getByLabelText(/dueDayLabel/));
    fireEvent.click(screen.getByRole("option", { name: "24" }));

    expect(nameField).toBeEnabled();
    expect(limitField).toBeEnabled();
    expect(form).toBeInTheDocument();
    expect(screen.getByText("loading")).toHaveAttribute("role", "status");

    await act(async () => {
      accountData.resolve({
        currency: DEFAULT_CURRENCY,
        liquidAccounts: [{ id: "liquid-account-id", name: "Payment account" }],
      });
      await accountData.promise;
    });

    expect(screen.getByTestId("account-add-page-form")).toBe(form);
    expect(screen.getByLabelText(/creditNameLabel/)).toBe(nameField);
    expect(screen.getByLabelText(/creditNameLabel/)).toHaveValue("Daily card");
    expect(screen.getByLabelText("creditLimitLabel")).toHaveValue("25,000,000");
    expect(screen.getByRole("radio", { name: "personal" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByTestId("account-statement-day")).toHaveTextContent("12");
    expect(screen.getByTestId("account-due-day")).toHaveTextContent("24");
    expect(screen.queryByText("loading")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("linkedBankLabel"));
    expect(
      await screen.findByRole("option", { name: "Payment account" }),
    ).toBeInTheDocument();
  });

  it("renders the dedicated credit route with its zero-debt semantics and in-flow action", () => {
    render(
      <AddAccountForm
        liquidAccounts={[]}
        currency="VND"
        fixedType={AccountType.CREDIT_CARD}
        hideCreditCardType
        hideDefaultTrigger
        presentation="page"
      />,
    );

    expect(screen.getByTestId("account-add-page-form")).toBeInTheDocument();
    expect(screen.queryByTestId("account-type")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("account-opening-balance"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("account-credit-card-settings"),
    ).toBeInTheDocument();
    expect(screen.getByText("creditInitialDebtHint")).toBeInTheDocument();
    expect(screen.getByTestId("account-add-submit")).toBeInTheDocument();
  });

  it("keeps credit-card creation out of the dedicated asset-account selector", () => {
    render(
      <AddAccountForm
        liquidAccounts={[]}
        currency="VND"
        hideCreditCardType
        hideDefaultTrigger
        presentation="page"
      />,
    );

    expect(
      within(screen.getByTestId("account-type")).queryByRole("button", {
        name: AccountType.CREDIT_CARD,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId("account-type")).getByRole("button", {
        name: AccountType.CHECKING,
      }),
    ).toBeInTheDocument();
  });
});
