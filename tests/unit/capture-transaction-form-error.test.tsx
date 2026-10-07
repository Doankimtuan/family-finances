import type { ComponentProps, ReactNode } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { recordTransactionMock, setTransactionTagsMock } = vi.hoisted(() => ({
  recordTransactionMock: vi.fn(),
  setTransactionTagsMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children?: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/app/[locale]/(product)/money/transactions/actions", () => ({
  recordTransactionAction: recordTransactionMock,
}));

vi.mock("@/app/[locale]/(product)/money/transactions/tag-actions", () => ({
  createTransactionTagAction: vi.fn(),
  setTransactionTagsAction: setTransactionTagsMock,
}));

import { CaptureTransactionForm } from "@/app/[locale]/(product)/money/transactions/capture-transaction-form";
import { MoneyCaptureEntry } from "@/app/[locale]/(product)/money/transactions/money-capture-entry";
import {
  StatusAlertHost,
  StatusAlertProvider,
} from "@/providers/status-alert-provider";
import {
  AccountType,
  MoneyCaptureMode,
  TransactionDirection,
  TransactionTagColorKey,
  TransactionTagIconKey,
  type CaptureJarOption,
  type CategoryTag,
  type LedgerAccount,
  type TransactionTag,
} from "@/modules/ledger/application/client";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { OWNER_STATUS } from "@/modules/shared-kernel/application/financial-ownership";
import { formatDate } from "@/shared/i18n/formatters";
import { todayIsoDate } from "@/shared/utils/iso-date";

const account: LedgerAccount = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Wallet",
  type: AccountType.CASH,
  balance: 0,
  isArchived: false,
  financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
  ownerMembershipId: null,
  isPersonal: false,
  isOwnedByMe: true,
  canMutate: true,
  ownerStatus: OWNER_STATUS.ACTIVE,
};

const personalAccount: LedgerAccount = {
  ...account,
  id: "00000000-0000-4000-8000-000000000002",
  financialScope: FINANCIAL_SCOPE.PERSONAL,
  ownerMembershipId: "00000000-0000-4000-8000-000000000009",
  isPersonal: true,
};

const transactionTag: TransactionTag = {
  id: "00000000-0000-4000-8000-000000000003",
  name: "Work",
  iconKey: TransactionTagIconKey.WORK,
  colorKey: TransactionTagColorKey.BLUE,
  archivedAt: null,
};

const expenseCategory: CategoryTag = {
  id: "00000000-0000-4000-8000-000000000010",
  kind: TransactionDirection.EXPENSE,
  name: "Food",
  jarId: "00000000-0000-4000-8000-000000000020",
};

const incomeCategory: CategoryTag = {
  id: "00000000-0000-4000-8000-000000000011",
  kind: TransactionDirection.INCOME,
  name: "Salary",
  jarId: null,
};

const captureJar: CaptureJarOption = {
  id: "00000000-0000-4000-8000-000000000020",
  name: "Essentials",
  kind: "spending",
};

function fillAmount(value = "50000") {
  fireEvent.change(screen.getByLabelText(/^amountLabel/), {
    target: { value },
  });
}

async function reviewCapture() {
  fillAmount();
  await act(async () => {
    fireEvent.submit(screen.getByTestId("money-capture-form"));
  });
  expect(
    await screen.findByTestId("capture-confirm-summary"),
  ).toBeInTheDocument();
}

async function confirmCapture() {
  await act(async () => {
    fireEvent.click(screen.getByTestId("capture-confirm"));
  });
}

function renderCaptureForm(
  props: Partial<ComponentProps<typeof CaptureTransactionForm>> = {},
) {
  return render(
    <StatusAlertProvider>
      <CaptureTransactionForm
        accounts={[account]}
        expenseTags={[]}
        incomeTags={[]}
        jars={[]}
        transactionTags={[]}
        currency="VND"
        {...props}
      />
      <StatusAlertHost />
    </StatusAlertProvider>,
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("CaptureTransactionForm save-failure presentation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
    recordTransactionMock.mockResolvedValue({
      status: "error",
      code: PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED,
    });
  });

  it("keeps the preview quiet until useful and uses a split action row", () => {
    renderCaptureForm();

    expect(screen.queryByTestId("capture-preview")).not.toBeInTheDocument();
    expect(screen.getByTestId("capture-save")).toHaveClass("flex-[2]");
    expect(screen.getByTestId("money-capture-fields")).toBeInTheDocument();
    expect(screen.getByTestId("money-capture-form")).toHaveClass("flex-1");
    expect(screen.getByText("cancel")).toHaveAttribute("href", "/money");

    fireEvent.change(screen.getByLabelText(/^amountLabel/), {
      target: { value: "50000" },
    });

    expect(screen.getByTestId("capture-preview")).toBeInTheDocument();
  });

  it("preserves an active draft while server references resolve progressively", async () => {
    const accounts = deferred<LedgerAccount[]>();
    const expenseTags = deferred<CategoryTag[] | null>();
    const incomeTags = deferred<CategoryTag[] | null>();
    const jars = deferred<CaptureJarOption[] | null>();
    const transactionTags = deferred<TransactionTag[] | null>();

    await act(async () => {
      render(
        <StatusAlertProvider>
          <MoneyCaptureEntry
            accountsPromise={accounts.promise}
            expenseTagsPromise={expenseTags.promise}
            incomeTagsPromise={incomeTags.promise}
            jarsPromise={jars.promise}
            transactionTagsPromise={transactionTags.promise}
            currency="VND"
            initialMode={MoneyCaptureMode.INCOME}
          />
          <StatusAlertHost />
        </StatusAlertProvider>,
      );
      await Promise.resolve();
    });

    fireEvent.click(screen.getByTestId("capture-mode-income"));
    fireEvent.change(screen.getByLabelText(/^amountLabel/), {
      target: { value: "50000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "yesterday" }));
    fireEvent.change(screen.getByLabelText("noteLabel"), {
      target: { value: "typed before references" },
    });
    const form = screen.getByTestId("money-capture-form");

    await act(async () => {
      accounts.resolve([account]);
      await Promise.resolve();
    });
    await waitFor(() =>
      expect(screen.getByLabelText(/^incomeAccountLabel/)).toBeEnabled(),
    );

    expect(screen.getByTestId("money-capture-form")).toBe(form);
    expect(screen.getByTestId("capture-mode-income")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByLabelText(/^amountLabel/)).not.toHaveValue("");
    expect(screen.getByLabelText("noteLabel")).toHaveValue(
      "typed before references",
    );
    expect(screen.getByRole("button", { name: "yesterday" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("capture-save")).toBeDisabled();

    fireEvent.submit(form);
    expect(screen.queryByTestId("capture-confirm-summary")).toBeNull();
    expect(recordTransactionMock).not.toHaveBeenCalled();

    await act(async () => {
      incomeTags.resolve([incomeCategory]);
      await Promise.resolve();
    });

    expect(screen.getByTestId("money-capture-form")).toBe(form);
    await waitFor(() =>
      expect(screen.getByTestId("capture-save")).toBeEnabled(),
    );
    expect(screen.getByLabelText(/^amountLabel/)).not.toHaveValue("");
    expect(screen.getByLabelText("noteLabel")).toHaveValue(
      "typed before references",
    );
    expect(screen.getByRole("button", { name: "yesterday" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("keeps credit-card account identity explicit in the dropdown", () => {
    renderCaptureForm({
      accounts: [
        account,
        {
          ...account,
          id: "00000000-0000-4000-8000-000000000004",
          name: "Visa",
          type: AccountType.CREDIT_CARD,
        },
      ],
    });

    fireEvent.click(screen.getByLabelText(/^expenseAccountLabel/));
    expect(
      screen.getByRole("option", { name: /Visa · creditCardLabel/ }),
    ).toBeInTheDocument();
  });

  it("defaults a personal expense outside the family Plan until a jar is chosen", async () => {
    renderCaptureForm({
      accounts: [personalAccount],
      expenseTags: [expenseCategory],
      jars: [captureJar],
    });

    expect(screen.getByTestId("capture-family-jar")).toHaveTextContent(
      "personalJarUnmapped",
    );
    expect(screen.getByText("personalJarHint")).toBeInTheDocument();
  });

  it("keeps credit-card liability visible in the expanded account selector", () => {
    const accounts = [0, 1, 2, 3, 4].map((index) => ({
      ...account,
      id: `00000000-0000-4000-8000-00000000000${index + 1}`,
      name: index === 4 ? "Visa" : `Wallet ${index}`,
      type: index === 4 ? AccountType.CREDIT_CARD : AccountType.CASH,
    }));

    renderCaptureForm({ accounts });

    expect(
      screen
        .getByTestId("capture-account")
        .querySelector("[data-slot='select-value']")?.textContent,
    ).toContain("Wallet 0");

    fireEvent.click(screen.getByLabelText(/^expenseAccountLabel/));
    expect(
      screen.getByRole("option", { name: /Visa · creditCardLabel/ }),
    ).toBeInTheDocument();
  });

  it("discards category search when the picker closes", async () => {
    renderCaptureForm({ expenseTags: [expenseCategory] });
    fireEvent.click(screen.getByTestId("capture-category"));
    fireEvent.change(
      screen.getByRole("searchbox", { name: "categorySearch" }),
      { target: { value: "missing" } },
    );
    expect(screen.getByRole("status")).toHaveTextContent("categoryEmpty");
    fireEvent.click(screen.getByRole("button", { name: "categoryClose" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId("capture-category"));
    expect(
      screen.getByRole("searchbox", { name: "categorySearch" }),
    ).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "tags.food" }),
    ).toBeInTheDocument();
  });

  it("orders amount, account, category, and date before optional details", () => {
    renderCaptureForm({
      expenseTags: [expenseCategory],
      jars: [captureJar],
      transactionTags: [transactionTag],
    });

    const amount = screen.getByTestId("capture-amount");
    const account = screen.getByTestId("capture-account");
    const category = screen.getByTestId("capture-category");
    const date = screen.getByTestId("capture-date");
    const note = screen.getByTestId("capture-note");
    const optional = screen.getByTestId("capture-optional-details");

    expect(
      amount.compareDocumentPosition(account) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      account.compareDocumentPosition(category) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      category.compareDocumentPosition(date) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      date.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      note.compareDocumentPosition(optional) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(optional).not.toHaveAttribute("open");
    expect(screen.getByLabelText(/^amountLabel/)).toHaveAttribute(
      "inputMode",
      "numeric",
    );
  });

  it("uses a true empty tag state without a useless search field", () => {
    renderCaptureForm({ transactionTags: [] });

    fireEvent.click(screen.getByText("moreDetails"));
    fireEvent.click(screen.getByText("choose"));

    expect(screen.getByText("noTagsTitle")).toBeInTheDocument();
    expect(screen.queryByLabelText("searchLabel")).not.toBeInTheDocument();
  });

  it("keeps archived-only tag state distinct", () => {
    renderCaptureForm({
      transactionTags: [{ ...transactionTag, archivedAt: "2026-01-01" }],
    });

    fireEvent.click(screen.getByText("moreDetails"));
    fireEvent.click(screen.getByText("choose"));

    expect(screen.getByText("noActiveTitle")).toBeInTheDocument();
    expect(screen.getByText("manageTags")).toBeInTheDocument();
    expect(screen.queryByLabelText("searchLabel")).not.toBeInTheDocument();
  });

  it("renders one danger alert with the typed code, not a second generic alert", async () => {
    renderCaptureForm();

    await reviewCapture();
    expect(recordTransactionMock).not.toHaveBeenCalled();
    await confirmCapture();

    expect(recordTransactionMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("errors.month_locked")).toBeInTheDocument();
    expect(screen.getAllByText("errorTitle")).toHaveLength(1);
    expect(screen.queryByText("saveFailedBody")).not.toBeInTheDocument();
    expect(screen.getByTestId("money-capture-form")).toBeInTheDocument();
    expect(screen.getByTestId("capture-confirm-summary")).toBeInTheDocument();
  });

  it("keeps validation in the form and does not call the server for invalid input", async () => {
    renderCaptureForm();

    await act(async () => {
      fireEvent.submit(screen.getByTestId("money-capture-form"));
    });

    expect(recordTransactionMock).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId("capture-confirm-summary"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("money-capture-form")).toBeInTheDocument();
  });

  it("does not run tag assignment when the transaction is rejected", async () => {
    renderCaptureForm({ transactionTags: [transactionTag] });

    fireEvent.click(screen.getByText("moreDetails"));
    fireEvent.click(screen.getByText("choose"));
    fireEvent.click(screen.getByRole("button", { name: "Work" }));
    fireEvent.click(screen.getByText("done"));
    await reviewCapture();
    await confirmCapture();

    await screen.findByText("errors.month_locked");
    expect(setTransactionTagsMock).not.toHaveBeenCalled();
  });

  it("shows an immutable success receipt and resets for another transaction", async () => {
    recordTransactionMock.mockResolvedValue({
      status: "success",
      transactionId: "00000000-0000-0000-0000-000000000002",
      inboxItemId: null,
    });

    renderCaptureForm();

    await reviewCapture();
    await confirmCapture();

    expect(await screen.findByText("receipt.title")).toBeInTheDocument();
    expect(screen.getByText(/50,000/)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText("receipt.recordAnother"));
    });

    expect(screen.getByTestId("money-capture-form")).toBeInTheDocument();
    expect(screen.getByLabelText(/^amountLabel/)).toHaveValue("");
  });

  it("shows the receipt with a warning when the required tag follow-up fails", async () => {
    recordTransactionMock.mockResolvedValue({
      status: "success",
      transactionId: "00000000-0000-4000-8000-000000000002",
      inboxItemId: null,
    });
    setTransactionTagsMock.mockResolvedValue({
      status: "error",
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });

    renderCaptureForm({ transactionTags: [transactionTag] });

    fireEvent.click(screen.getByText("moreDetails"));
    fireEvent.click(screen.getByText("choose"));
    fireEvent.click(screen.getByRole("button", { name: "Work" }));
    fireEvent.click(screen.getByText("done"));
    await reviewCapture();
    await confirmCapture();

    expect(await screen.findByText("tagAssignmentFailed")).toBeInTheDocument();
  });
});

describe("CaptureTransactionForm confirmation sheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
    recordTransactionMock.mockResolvedValue({
      status: "success",
      transactionId: "00000000-0000-4000-8000-000000000002",
      inboxItemId: null,
    });
  });

  it("opens confirmation for valid entry without calling the mutation", async () => {
    renderCaptureForm();

    fillAmount();
    await act(async () => {
      fireEvent.click(screen.getByTestId("capture-save"));
    });

    const summary = await screen.findByTestId("capture-confirm-summary");
    expect(recordTransactionMock).not.toHaveBeenCalled();
    expect(summary).toHaveTextContent("50,000");
    expect(summary).toHaveTextContent("direction.expense");
    expect(summary).toHaveTextContent("Wallet");
    expect(summary).toHaveTextContent(
      formatDate(new Date(`${todayIsoDate()}T00:00:00Z`), "en"),
    );
    expect(summary).not.toHaveTextContent("receipt.category");
    expect(summary).not.toHaveTextContent("receipt.jar");
    expect(summary).not.toHaveTextContent("receipt.note");
  });

  it("shows category, jar, and note when those values are present", async () => {
    renderCaptureForm({
      expenseTags: [expenseCategory],
      jars: [captureJar],
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("capture-category"));
    });
    fireEvent.click(screen.getByRole("button", { name: "tags.food" }));
    fireEvent.change(screen.getByTestId("capture-note"), {
      target: { value: "Lunch with a friend" },
    });
    await reviewCapture();

    const summary = screen.getByTestId("capture-confirm-summary");
    expect(summary).toHaveTextContent("tags.food");
    expect(summary).toHaveTextContent("jars.essentials");
    expect(summary).toHaveTextContent("Lunch with a friend");
    expect(recordTransactionMock).not.toHaveBeenCalled();
  });

  it("shows income direction in confirmation", async () => {
    renderCaptureForm({ initialDirection: TransactionDirection.INCOME });

    await reviewCapture();

    expect(screen.getByTestId("capture-confirm-summary")).toHaveTextContent(
      "direction.income",
    );
  });

  it("returns to the preserved entry when confirmation is cancelled", async () => {
    renderCaptureForm();

    await reviewCapture();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "back" }));
    });

    await waitFor(() =>
      expect(screen.getByTestId("capture-save")).not.toBeDisabled(),
    );
    expect(recordTransactionMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("money-capture-form")).toBeInTheDocument();
    expect(screen.getByTestId("capture-preview")).toBeInTheDocument();
    expect(screen.getByLabelText(/^amountLabel/)).not.toHaveValue("");
  });

  it("confirms with the existing payload exactly once and keeps pending disabled", async () => {
    let resolveAction: (value: unknown) => void = () => {};
    recordTransactionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );

    renderCaptureForm();
    await reviewCapture();

    await act(async () => {
      fireEvent.click(screen.getByTestId("capture-confirm"));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("capture-confirm"));
    });

    expect(recordTransactionMock).toHaveBeenCalledTimes(1);
    expect(recordTransactionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: account.id,
        type: TransactionDirection.EXPENSE,
        amount: 50_000,
        transactionDate: todayIsoDate(),
      }),
    );
    expect(recordTransactionMock.mock.calls[0]?.[0]).not.toHaveProperty(
      "transactionTagIds",
    );
    expect(screen.getByTestId("capture-confirm")).toBeDisabled();

    await act(async () => {
      resolveAction({
        status: "success",
        transactionId: "00000000-0000-4000-8000-000000000002",
        inboxItemId: null,
      });
    });

    expect(await screen.findByText("receipt.title")).toBeInTheDocument();
  });
});
