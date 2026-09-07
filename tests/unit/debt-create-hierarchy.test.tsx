import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en/money.json";
import { DebtCreateSheet } from "@/app/[locale]/(product)/money/debts/debt-create-sheet";
import {
  DebtCreationMode,
  DebtDirection,
} from "@/modules/ledger/application/ledger-constants";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { ProductActionStatus } from "@/modules/tenancy/application/product-action-error";

const { createDebtMock } = vi.hoisted(() => ({
  createDebtMock: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/shared/hooks/use-online-status", () => ({
  useOnlineStatusClient: () => ({ online: true }),
}));

vi.mock("@/app/[locale]/(product)/money/money-products-actions", () => ({
  createDebtAction: createDebtMock,
}));

const ACCOUNT_ID = "00000000-0000-4000-8000-000000000001";
const accounts = [
  { id: ACCOUNT_ID, name: "Cash", type: "cash", balance: 5_000_000 },
];

function renderDebtCreate(ui: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ money: enMessages }}>
      {ui}
    </NextIntlClientProvider>,
  );
}

function openCreateSheet() {
  fireEvent.click(screen.getByTestId("debt-create-open"));
}

function fillExistingBalanceRecord(counterparty = "An") {
  fireEvent.change(screen.getByLabelText("Who do you owe?"), {
    target: { value: counterparty },
  });
  const principal = document.getElementById("debt-principal");
  expect(principal).toBeTruthy();
  fireEvent.change(principal!, { target: { value: "1000000" } });
}

async function selectDebtAccount() {
  fireEvent.click(screen.getByLabelText("Receive money into"));
  fireEvent.click(await screen.findByRole("option", { name: /Cash/ }));
}

describe("DebtCreateSheet hierarchy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createDebtMock.mockResolvedValue({
      status: ProductActionStatus.SUCCESS,
      debtId: "debt-1",
    });
  });

  it("opens with the redesigned identity and field hierarchy", () => {
    renderDebtCreate(
      <DebtCreateSheet
        accounts={accounts}
        accountsLoadFailed={false}
        currency={DEFAULT_CURRENCY}
        locale="en"
        today="2026-09-07"
      />,
    );

    openCreateSheet();

    expect(screen.getByTestId("debt-financial-scope")).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "I borrowed money" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "I lent money" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Who do you owe?")).toBeInTheDocument();
    expect(document.getElementById("debt-principal")).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Already existed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Money moves now" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("debt-start-date")).toBeInTheDocument();
    expect(screen.getByTestId("debt-due-date")).toBeInTheDocument();
    expect(screen.getByLabelText("Note (optional)")).toBeInTheDocument();
  });

  it("keeps one primary save action in the sheet footer", () => {
    renderDebtCreate(
      <DebtCreateSheet
        accounts={accounts}
        accountsLoadFailed={false}
        currency={DEFAULT_CURRENCY}
        locale="en"
        today="2026-09-07"
      />,
    );

    openCreateSheet();

    const primary = screen.getByTestId("debt-create-submit");
    expect(primary).toHaveTextContent("Save record");
    expect(screen.getAllByRole("button", { name: "Save record" })).toHaveLength(
      1,
    );
    expect(
      document.querySelector('[data-slot="action-sheet-footer"]'),
    ).toBeInTheDocument();
  });

  it("blocks submission when required fields are missing", () => {
    renderDebtCreate(
      <DebtCreateSheet
        accounts={accounts}
        accountsLoadFailed={false}
        currency={DEFAULT_CURRENCY}
        locale="en"
        today="2026-09-07"
      />,
    );

    openCreateSheet();
    fireEvent.click(screen.getByTestId("debt-create-submit"));

    expect(createDebtMock).not.toHaveBeenCalled();
  });

  it("submits an existing-balance record without an account movement", async () => {
    renderDebtCreate(
      <DebtCreateSheet
        accounts={accounts}
        accountsLoadFailed={false}
        currency={DEFAULT_CURRENCY}
        locale="en"
        today="2026-09-07"
      />,
    );

    openCreateSheet();
    fillExistingBalanceRecord();
    fireEvent.click(screen.getByTestId("debt-create-submit"));

    await waitFor(() => expect(createDebtMock).toHaveBeenCalledTimes(1));
    expect(createDebtMock).toHaveBeenCalledWith(
      expect.objectContaining({
        counterparty: "An",
        direction: DebtDirection.BORROWED,
        creationMode: DebtCreationMode.EXISTING_BALANCE,
        principalAmount: 1_000_000,
        accountId: null,
      }),
    );
    expect(screen.queryByTestId("debt-create-preview")).not.toBeInTheDocument();
  });

  it("requires review before saving when money moves now", async () => {
    renderDebtCreate(
      <DebtCreateSheet
        accounts={accounts}
        accountsLoadFailed={false}
        currency={DEFAULT_CURRENCY}
        locale="en"
        today="2026-09-07"
      />,
    );

    openCreateSheet();
    fillExistingBalanceRecord("Binh");
    fireEvent.click(screen.getByRole("radio", { name: "Money moves now" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Receive money into")).toBeInTheDocument();
    });
    await selectDebtAccount();
    fireEvent.click(screen.getByTestId("debt-create-submit"));

    expect(createDebtMock).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByTestId("debt-create-preview")).toBeInTheDocument();
    });
    expect(screen.getByText("Review money movement")).toBeInTheDocument();
    expect(screen.getByText("Borrowed money received")).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
  });
});
