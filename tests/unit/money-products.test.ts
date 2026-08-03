import { describe, expect, it } from "vitest";
import {
  mapLiabilityRow,
  mapSavingsRow,
  mapInstallmentRow,
  LiabilityStatus,
  SavingsProductStatus,
  InstallmentPlanStatus,
} from "@/modules/ledger/application/money-product-types";

describe("money product mappers (ST-E04-004)", () => {
  it("maps liability remaining without inventing bank balance labels", () => {
    const debt = mapLiabilityRow({
      id: "11111111-1111-1111-1111-111111111111",
      name: "Loan",
      creditor: "Bank",
      principal_amount: "10000000",
      remaining_amount: "4000000",
      currency: "vnd",
      due_day: 15,
      note: null,
      is_archived: false,
    });
    expect(debt.remainingAmount).toBe(4_000_000);
    expect(debt.status).toBe(LiabilityStatus.OPEN);
  });

  it("flags savings maturity when due", () => {
    const item = mapSavingsRow({
      id: "22222222-2222-2222-2222-222222222222",
      name: "Term",
      principal_amount: 5_000_000,
      currency: "VND",
      maturity_date: "2020-01-01",
      status: "active",
      note: null,
    });
    expect(item.isMaturityDue).toBe(true);
    expect(item.status).toBe(SavingsProductStatus.ACTIVE);
  });

  it("marks installment complete when paid >= total (AC-011)", () => {
    const plan = mapInstallmentRow({
      id: "33333333-3333-3333-3333-333333333333",
      name: "Phone",
      card_label: "Visa",
      total_amount: 12_000_000,
      installment_amount: 1_000_000,
      currency: "VND",
      num_installments: 12,
      paid_installments: 12,
      status: "active",
      note: null,
    });
    expect(plan.status).toBe(InstallmentPlanStatus.COMPLETED);
    expect(plan.remainingInstallments).toBe(0);
  });
});
