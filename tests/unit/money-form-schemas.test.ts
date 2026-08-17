import { describe, expect, it } from "vitest";
import {
  AccountType,
  DebtCreationMode,
  DebtDirection,
} from "@/modules/ledger/application/ledger-constants";
import { createAccountInputSchema } from "@/modules/ledger/application/commands/create-account.schema";
import {
  createDebtFormSchema,
  recordDebtPaymentFormSchema,
} from "@/modules/ledger/application/commands/debt.schemas";

const ACCOUNT_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("Money account and debt form schemas", () => {
  it("keeps account defaults and requires credit-card settings for cards", () => {
    expect(createAccountInputSchema.parse({ name: "Cash" })).toMatchObject({
      type: AccountType.CASH,
      openingBalance: 0,
    });
    expect(
      createAccountInputSchema.safeParse({
        name: "Card",
        type: AccountType.CREDIT_CARD,
      }).success,
    ).toBe(false);
  });

  it("rejects invalid debt amounts and missing movement accounts", () => {
    const base = {
      counterparty: "Mai",
      direction: DebtDirection.BORROWED,
      creationMode: DebtCreationMode.MONEY_MOVED,
      principalAmount: 1_000,
      startDate: "2026-08-17",
      dueDate: null,
      note: "",
      accountId: null,
    };
    expect(createDebtFormSchema.safeParse(base).success).toBe(false);
    expect(
      createDebtFormSchema.safeParse({ ...base, accountId: ACCOUNT_ID })
        .success,
    ).toBe(true);
    expect(
      createDebtFormSchema.safeParse({
        ...base,
        accountId: ACCOUNT_ID,
        principalAmount: 0,
      }).success,
    ).toBe(false);
  });

  it("prevents debt-payment overpayment at the form boundary", () => {
    const schema = recordDebtPaymentFormSchema(10_000);
    const valid = {
      amount: 10_000,
      accountId: ACCOUNT_ID,
      effectiveDate: "2026-08-17",
      note: "",
    };
    expect(schema.safeParse(valid).success).toBe(true);
    expect(schema.safeParse({ ...valid, amount: 10_001 }).success).toBe(false);
    expect(schema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
  });
});
