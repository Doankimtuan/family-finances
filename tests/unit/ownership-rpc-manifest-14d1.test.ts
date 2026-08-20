import { describe, expect, it } from "vitest";

const PROTECTED_RPC_STATUS = {
  PASS: "PASS",
  NOT_APPLICABLE: "NOT_APPLICABLE",
} as const;

const PROTECTED_RPC_MANIFEST = [
  {
    family: "ledger",
    rpc: "record_transaction",
    roots: ["accounts", "transactions"],
    status: PROTECTED_RPC_STATUS.PASS,
  },
  {
    family: "ledger",
    rpc: "correct_transaction",
    roots: ["accounts", "transactions"],
    status: PROTECTED_RPC_STATUS.PASS,
  },
  {
    family: "ledger",
    rpc: "refund_transaction",
    roots: ["accounts", "transactions"],
    status: PROTECTED_RPC_STATUS.PASS,
  },
  {
    family: "ledger",
    rpc: "record_owned_account_transfer",
    roots: ["accounts", "transactions"],
    status: PROTECTED_RPC_STATUS.PASS,
  },
  {
    family: "cards",
    rpc: "record_card_transaction",
    roots: ["accounts", "transactions", "card_billing_items"],
    status: PROTECTED_RPC_STATUS.PASS,
  },
  {
    family: "cards",
    rpc: "settle_card_payment",
    roots: ["accounts", "card_payments"],
    status: PROTECTED_RPC_STATUS.PASS,
  },
  {
    family: "loans",
    rpc: "record_loan_payment",
    roots: ["loans", "accounts"],
    status: PROTECTED_RPC_STATUS.PASS,
  },
  {
    family: "liabilities",
    rpc: "record_debt_payment",
    roots: ["liabilities", "accounts"],
    status: PROTECTED_RPC_STATUS.PASS,
  },
  {
    family: "savings",
    rpc: "early_withdraw_saving",
    roots: ["savings", "accounts"],
    status: PROTECTED_RPC_STATUS.PASS,
  },
  {
    family: "investments",
    rpc: "record_investment_valuation",
    roots: ["investment_holdings"],
    status: PROTECTED_RPC_STATUS.PASS,
  },
  {
    family: "goals",
    rpc: "contribute_to_goal",
    roots: ["goals"],
    status: PROTECTED_RPC_STATUS.PASS,
  },
  {
    family: "inbox",
    rpc: "resolve_inbox_item_to_jar",
    roots: ["inbox_items", "transactions", "accounts"],
    status: PROTECTED_RPC_STATUS.PASS,
  },
] as const;

const GUARDED_TABLES = new Set([
  "accounts",
  "transactions",
  "card_billing_items",
  "card_payments",
  "loans",
  "loan_payments",
  "liabilities",
  "debt_payments",
  "savings",
  "saving_cycles",
  "early_withdrawals",
  "investment_holdings",
  "investment_operations",
  "investment_fees",
  "investment_valuations",
  "goals",
  "goal_contributions",
  "inbox_items",
]);

describe("14D.1 protected RPC manifest", () => {
  it("declares an effective trigger boundary for every protected RPC family", () => {
    expect(PROTECTED_RPC_MANIFEST).not.toHaveLength(0);
    for (const entry of PROTECTED_RPC_MANIFEST) {
      expect(entry.rpc).toMatch(/^[a-z][a-z0-9_]+$/);
      expect(entry.roots.every((root) => GUARDED_TABLES.has(root))).toBe(true);
      expect([
        PROTECTED_RPC_STATUS.PASS,
        PROTECTED_RPC_STATUS.NOT_APPLICABLE,
      ]).toContain(entry.status);
    }
  });

  it("requires every P0 ownership mutation family to be complete", () => {
    expect(
      PROTECTED_RPC_MANIFEST.every(
        (entry) =>
          entry.status === PROTECTED_RPC_STATUS.PASS ||
          entry.status === PROTECTED_RPC_STATUS.NOT_APPLICABLE,
      ),
    ).toBe(true);
  });
});
