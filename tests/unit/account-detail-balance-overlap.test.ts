import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AccountType,
  DEFAULT_CURRENCY,
  LedgerRpcName,
  getAccount,
} from "@/modules/ledger/application";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { OWNER_STATUS } from "@/modules/shared-kernel/application/financial-ownership";
import { MONEY_ACTION_DENIED_REASON } from "@/modules/tenancy/application/tenancy-constants";
import type { MoneyActionAllowance } from "@/modules/tenancy/application/assert-money-action-allowed";

const mocks = vi.hoisted(() => ({
  assertMoneyActionAllowed: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  from: vi.fn(),
  listActiveMembershipIds: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: mocks.assertMoneyActionAllowed,
}));

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

vi.mock("@/modules/tenancy/application/list-active-membership-ids", () => ({
  listActiveMembershipIds: mocks.listActiveMembershipIds,
}));

const ACCOUNT_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const HOUSEHOLD_ID = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const OTHER_HOUSEHOLD_ID = "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const VIEWER_MEMBERSHIP_ID = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const PARTNER_MEMBERSHIP_ID = "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const FORMER_MEMBERSHIP_ID = "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const OPENING_BALANCE = 5_000;
const LEDGER_BALANCE = 17_000;

type AccountRow = {
  id: string;
  name: string;
  type: string;
  icon_key: string | null;
  opening_balance: number | string;
  is_archived: boolean;
  financial_scope: string;
  owner_membership_id: string | null;
  owner_membership: {
    id: unknown;
    household_id: unknown;
    is_active: unknown;
  } | null;
};

type QueryError = { code: string; message: string };
type SingleResponse<T> = { data: T | null; error: QueryError | null };
type RpcResponse = {
  data: Array<{ account_id: string; balance: number | string }> | null;
  error: QueryError | null;
};

function accountRow(overrides: Partial<AccountRow> = {}): AccountRow {
  return {
    id: ACCOUNT_ID,
    name: "Test account",
    type: AccountType.CASH,
    icon_key: null,
    opening_balance: OPENING_BALANCE,
    is_archived: false,
    financial_scope: FINANCIAL_SCOPE.HOUSEHOLD,
    owner_membership_id: null,
    owner_membership: null,
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function singleQuery<T>(response: Promise<SingleResponse<T>>) {
  const query = {
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    overrideTypes: vi.fn(),
    select: vi.fn(),
    then: response.then.bind(response),
  };
  query.eq.mockImplementation(() => query);
  query.maybeSingle.mockImplementation(() => query);
  query.overrideTypes.mockImplementation(() => query);
  query.select.mockImplementation(() => query);
  return query;
}

function configureQuery(input: {
  accountResponse?: Promise<SingleResponse<AccountRow>>;
  account?: AccountRow | null;
  householdResponse?: Promise<SingleResponse<{ base_currency: string }>>;
  balanceResponse?: Promise<RpcResponse>;
  gate?: MoneyActionAllowance;
}) {
  const accountResult =
    input.accountResponse ??
    Promise.resolve({
      data: input.account === undefined ? accountRow() : input.account,
      error: null,
    });
  const householdResult =
    input.householdResponse ??
    Promise.resolve({ data: { base_currency: DEFAULT_CURRENCY }, error: null });
  const queryQueue = [singleQuery(householdResult), singleQuery(accountResult)];
  const client = { from: mocks.from, rpc: mocks.rpc };

  mocks.from.mockImplementation(() => queryQueue.shift());
  mocks.rpc.mockImplementation(
    () =>
      input.balanceResponse ??
      Promise.resolve({
        data: [{ account_id: ACCOUNT_ID, balance: LEDGER_BALANCE }],
        error: null,
      }),
  );
  mocks.createSupabaseServerClient.mockResolvedValue(client);
  mocks.assertMoneyActionAllowed.mockResolvedValue(
    input.gate ?? {
      ok: true,
      userId: "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      householdId: HOUSEHOLD_ID,
      membershipId: VIEWER_MEMBERSHIP_ID,
    },
  );
}

describe("selected account balance overlap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts one authoritative balance read while account context is pending", async () => {
    const accountResult = deferred<SingleResponse<AccountRow>>();
    const householdResult =
      deferred<SingleResponse<{ base_currency: string }>>();
    const balanceResult = deferred<RpcResponse>();
    configureQuery({
      accountResponse: accountResult.promise,
      householdResponse: householdResult.promise,
      balanceResponse: balanceResult.promise,
    });

    let settled = false;
    const resultPromise = getAccount(ACCOUNT_ID).then((result) => {
      settled = true;
      return result;
    });

    await vi.waitFor(() => expect(mocks.rpc).toHaveBeenCalledTimes(1));
    expect(mocks.from).toHaveBeenCalledTimes(2);
    expect(mocks.listActiveMembershipIds).not.toHaveBeenCalled();

    balanceResult.resolve({
      data: [{ account_id: ACCOUNT_ID, balance: LEDGER_BALANCE }],
      error: null,
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    householdResult.resolve({
      data: { base_currency: DEFAULT_CURRENCY },
      error: null,
    });
    accountResult.resolve({ data: accountRow(), error: null });

    const result = await resultPromise;
    expect(result).toMatchObject({
      currency: DEFAULT_CURRENCY,
      account: {
        id: ACCOUNT_ID,
        name: "Test account",
        type: AccountType.CASH,
        balance: LEDGER_BALANCE,
        isArchived: false,
        financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
        isPersonal: false,
        isOwnedByMe: false,
        canMutate: true,
        ownerStatus: OWNER_STATUS.ACTIVE,
      },
    });
    expect(mocks.listActiveMembershipIds).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledWith(
      LedgerRpcName.GET_ACCOUNT_LEDGER_BALANCES,
      { p_account_ids: [ACCOUNT_ID] },
    );
  });

  it.each([
    { id: ACCOUNT_ID, description: "a missing account" },
    {
      id: "f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      description: "an account outside the authorized context",
    },
  ])("does not return an early balance for $description", async ({ id }) => {
    configureQuery({
      account: null,
      balanceResponse: Promise.resolve({ data: [], error: null }),
    });

    await expect(getAccount(id)).resolves.toBeNull();
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });

  it("ignores an early balance when the selected account is archived", async () => {
    configureQuery({
      account: accountRow({ is_archived: true }),
    });

    await expect(getAccount(ACCOUNT_ID)).resolves.toBeNull();
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });

  it("does not start a balance read for malformed IDs or a denied session", async () => {
    configureQuery({});
    await expect(getAccount("malformed-account-id")).resolves.toBeNull();
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();

    vi.clearAllMocks();
    configureQuery({
      gate: {
        ok: false,
        reason: MONEY_ACTION_DENIED_REASON.UNAUTHENTICATED,
      },
    });

    await expect(getAccount(ACCOUNT_ID)).resolves.toBeNull();
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("keeps balance RPC failures unavailable instead of fabricating zero", async () => {
    configureQuery({
      balanceResponse: Promise.resolve({
        data: null,
        error: { code: "PGRST000", message: "Unavailable" },
      }),
    });

    await expect(getAccount(ACCOUNT_ID)).resolves.toBeNull();
  });

  it.each([
    {
      ownerMembershipId: VIEWER_MEMBERSHIP_ID,
      embeddedOwner: {
        id: VIEWER_MEMBERSHIP_ID,
        household_id: HOUSEHOLD_ID,
        is_active: true,
      },
      isOwnedByMe: true,
      canMutate: true,
      ownerStatus: OWNER_STATUS.ACTIVE,
    },
    {
      ownerMembershipId: PARTNER_MEMBERSHIP_ID,
      embeddedOwner: {
        id: PARTNER_MEMBERSHIP_ID,
        household_id: HOUSEHOLD_ID,
        is_active: true,
      },
      isOwnedByMe: false,
      canMutate: false,
      ownerStatus: OWNER_STATUS.ACTIVE,
    },
    {
      ownerMembershipId: FORMER_MEMBERSHIP_ID,
      embeddedOwner: {
        id: FORMER_MEMBERSHIP_ID,
        household_id: HOUSEHOLD_ID,
        is_active: false,
      },
      isOwnedByMe: false,
      canMutate: false,
      ownerStatus: OWNER_STATUS.FORMER,
    },
    {
      ownerMembershipId: FORMER_MEMBERSHIP_ID,
      embeddedOwner: null,
      isOwnedByMe: false,
      canMutate: false,
      ownerStatus: OWNER_STATUS.FORMER,
    },
    {
      ownerMembershipId: VIEWER_MEMBERSHIP_ID,
      embeddedOwner: {
        id: VIEWER_MEMBERSHIP_ID,
        household_id: OTHER_HOUSEHOLD_ID,
        is_active: true,
      },
      isOwnedByMe: true,
      canMutate: false,
      ownerStatus: OWNER_STATUS.FORMER,
    },
    {
      ownerMembershipId: PARTNER_MEMBERSHIP_ID,
      embeddedOwner: {
        id: VIEWER_MEMBERSHIP_ID,
        household_id: HOUSEHOLD_ID,
        is_active: true,
      },
      isOwnedByMe: false,
      canMutate: false,
      ownerStatus: OWNER_STATUS.FORMER,
    },
    {
      ownerMembershipId: VIEWER_MEMBERSHIP_ID,
      embeddedOwner: {
        id: VIEWER_MEMBERSHIP_ID,
        household_id: HOUSEHOLD_ID,
        is_active: "true",
      },
      isOwnedByMe: true,
      canMutate: false,
      ownerStatus: OWNER_STATUS.FORMER,
    },
    {
      ownerMembershipId: null,
      embeddedOwner: null,
      isOwnedByMe: false,
      canMutate: false,
      ownerStatus: OWNER_STATUS.ACTIVE,
    },
  ])("preserves personal owner capabilities", async (ownership) => {
    configureQuery({
      account: accountRow({
        financial_scope: FINANCIAL_SCOPE.PERSONAL,
        owner_membership_id: ownership.ownerMembershipId,
        owner_membership: ownership.embeddedOwner,
      }),
    });

    const result = await getAccount(ACCOUNT_ID);

    expect(result?.account).toMatchObject({
      id: ACCOUNT_ID,
      name: "Test account",
      type: AccountType.CASH,
      isArchived: false,
      financialScope: FINANCIAL_SCOPE.PERSONAL,
      ownerMembershipId: ownership.ownerMembershipId,
      isPersonal: true,
      isOwnedByMe: ownership.isOwnedByMe,
      canMutate: ownership.canMutate,
      ownerStatus: ownership.ownerStatus,
    });
    expect(result?.currency).toBe(DEFAULT_CURRENCY);
    expect(mocks.listActiveMembershipIds).not.toHaveBeenCalled();
  });

  it("fails the selected account context when the embedded owner query fails", async () => {
    configureQuery({
      accountResponse: Promise.resolve({
        data: null,
        error: { code: "PGRST200", message: "Relationship unavailable" },
      }),
    });

    await expect(getAccount(ACCOUNT_ID)).resolves.toBeNull();
    expect(mocks.from).toHaveBeenCalledTimes(2);
    expect(mocks.listActiveMembershipIds).not.toHaveBeenCalled();
  });

  it("keeps Credit Card Detail on one selected balance RPC", async () => {
    configureQuery({
      account: accountRow({ type: AccountType.CREDIT_CARD }),
    });

    const result = await getAccount(ACCOUNT_ID);

    expect(result?.account.type).toBe(AccountType.CREDIT_CARD);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith(
      LedgerRpcName.GET_ACCOUNT_LEDGER_BALANCES,
      { p_account_ids: [ACCOUNT_ID] },
    );
  });
});
