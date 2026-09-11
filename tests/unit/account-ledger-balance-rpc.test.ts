import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_TYPE_LIQUID_VALUES,
  LedgerRpcName,
  TRANSACTION_BALANCE_STATUS_VALUES,
  TRANSACTION_LEDGER_CREDIT_TYPES,
  TRANSACTION_LEDGER_DEBIT_TYPES,
  TransactionLedgerType,
} from "@/modules/ledger/application/ledger-constants";
import { applyTransactionDeltas } from "@/modules/ledger/application/transaction-types";

const MIGRATION = readFileSync(
  "supabase/migrations/20260908114845_get_account_ledger_balances.sql",
  "utf8",
);
const HOME_MIGRATION = readFileSync(
  "supabase/migrations/20260911035150_home_account_ledger_raw_inputs.sql",
  "utf8",
);
const POSITION = readFileSync(
  "modules/ledger/application/queries/get-real-position.ts",
  "utf8",
);
const LIST_ACCOUNTS = readFileSync(
  "modules/ledger/application/queries/list-accounts.ts",
  "utf8",
);
const LIST_GOALS = readFileSync(
  "modules/plan/application/queries/list-goals.ts",
  "utf8",
);
const HELPER = readFileSync(
  "modules/ledger/application/queries/load-account-ledger-balances.ts",
  "utf8",
);

describe("account ledger balance RPC", () => {
  it("keeps SQL credit/debit/status lists identical to applyTransactionDeltas", () => {
    for (const type of TRANSACTION_LEDGER_CREDIT_TYPES) {
      expect(MIGRATION).toContain(`'${type}'`);
    }
    for (const type of TRANSACTION_LEDGER_DEBIT_TYPES) {
      expect(MIGRATION).toContain(`'${type}'`);
    }
    for (const status of TRANSACTION_BALANCE_STATUS_VALUES) {
      expect(MIGRATION).toContain(`'${status}'`);
    }
    expect(MIGRATION).toContain("a.opening_balance + coalesce(sum(");
    expect(MIGRATION).toContain("then t.amount");
    expect(MIGRATION).toContain("then -t.amount");
  });

  it("authorizes through the active household and does not take household_id", () => {
    expect(MIGRATION).toContain("security invoker");
    expect(MIGRATION).toContain("public.investment_active_household()");
    expect(MIGRATION).toContain("a.id = any(p_account_ids)");
    expect(MIGRATION).not.toContain("p_household_id");
    expect(MIGRATION).toContain(
      "revoke all on function public.get_account_ledger_balances(uuid[]) from public",
    );
    expect(MIGRATION).toContain(
      "grant execute on function public.get_account_ledger_balances(uuid[]) to authenticated",
    );
    expect(MIGRATION).not.toContain("to anon");
    expect(MIGRATION).not.toContain("security definer");
  });

  it("keeps the Home raw-input RPC invoker-only and ownership-aware", () => {
    expect(HOME_MIGRATION).toContain("security invoker");
    expect(HOME_MIGRATION).toContain("set search_path to 'public'");
    expect(HOME_MIGRATION).toContain("public.investment_active_household()");
    expect(HOME_MIGRATION).toContain("owner_membership_is_active");
    expect(HOME_MIGRATION).toContain(
      "revoke all on function public.get_home_account_ledger_raw_inputs() from public",
    );
    expect(HOME_MIGRATION).toContain(
      "grant execute on function public.get_home_account_ledger_raw_inputs() to authenticated",
    );
    expect(HOME_MIGRATION).not.toContain("security definer");
    expect(HOME_MIGRATION).not.toContain("to anon");
  });

  it("stops Home/Money/Health position reads from downloading transaction rows", () => {
    expect(HELPER).toContain("LedgerRpcName.GET_ACCOUNT_LEDGER_BALANCES");
    expect(MIGRATION).toContain(
      `function public.${LedgerRpcName.GET_ACCOUNT_LEDGER_BALANCES}`,
    );
    expect(POSITION).toContain("loadHomeAccountLedgerRawInputs");
    expect(POSITION).not.toContain("loadAccountLedgerBalances");
    expect(POSITION).not.toContain('.from("transactions")');
    expect(LIST_ACCOUNTS).not.toContain('.from("transactions")');
    expect(LIST_GOALS).not.toContain('.from("transactions")');
    expect(LIST_ACCOUNTS).toContain("loadAccountLedgerBalances");
    expect(LIST_GOALS).toContain("loadAccountLedgerBalances");
    expect(HELPER).not.toContain('.from("transactions")');
  });

  it("does not constrain the RPC to liquid types so getAccount can reuse it", () => {
    for (const type of ACCOUNT_TYPE_LIQUID_VALUES) {
      expect(MIGRATION).not.toContain(`'${type}'`);
    }
  });

  it("matches applyTransactionDeltas for mixed credit, debit, and ignored accounts", () => {
    const accounts = [
      { id: "cash", balance: 1_000 },
      { id: "bank", balance: 0 },
    ];
    const deltas = [
      { accountId: "cash", type: TransactionLedgerType.INCOME, amount: 500 },
      { accountId: "cash", type: TransactionLedgerType.EXPENSE, amount: 200 },
      {
        accountId: "bank",
        type: TransactionLedgerType.TRANSFER_IN,
        amount: 80,
      },
      {
        accountId: "bank",
        type: TransactionLedgerType.TRANSFER_OUT,
        amount: 30,
      },
      {
        accountId: "missing",
        type: TransactionLedgerType.INCOME,
        amount: 9_999,
      },
    ];
    const fromDeltas = applyTransactionDeltas(accounts, deltas);
    expect(fromDeltas.map((row) => row.balance)).toEqual([1_300, 50]);
  });
});
