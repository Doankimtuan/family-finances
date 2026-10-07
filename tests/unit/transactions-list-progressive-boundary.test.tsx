import { Suspense, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routing } from "@/i18n/routing";
import {
  TRANSACTION_ACCOUNT_QUERY_PARAM,
  TRANSACTION_CATEGORY_QUERY_PARAM,
  TRANSACTION_JAR_QUERY_PARAM,
  TRANSACTION_SEARCH_QUERY_PARAM,
  TRANSACTION_TAG_FILTER_QUERY_PARAM,
  TRANSACTION_TYPE_QUERY_PARAM,
  TransactionFilterType,
} from "@/modules/ledger/application/client";
import {
  DEFAULT_CURRENCY,
  createTransactionActivities,
  TransactionLedgerType,
  TransactionReadStatus,
  TransactionStatus,
  type LedgerTransaction,
} from "@/modules/ledger/application";
import {
  TransactionTagColorKey,
  TransactionTagIconKey,
} from "@/modules/ledger/application/transaction-constants";
import { HOUSEHOLD_ROLE } from "@/modules/tenancy/application/tenancy-constants";
import { Amount } from "@/shared/patterns/amount";
import { StatusAlert } from "@/shared/ui/status-alert";
import { TransactionTagEditor } from "@/app/[locale]/(product)/money/transactions/transaction-tag-editor";

const mocks = vi.hoisted(() => ({
  getSessionMembership: vi.fn(),
  redirectSignal: Symbol("redirect"),
  redirect: vi.fn(() => {
    throw mocks.redirectSignal;
  }),
  getTranslations: vi.fn(async () => (key: string) => key),
  listTransactionEvents: vi.fn(),
  listTransactionFilterOptions: vi.fn(),
  listTransactionTags: vi.fn(),
  getTransactionReadResult: vi.fn(),
  getTransactionActivity: vi.fn(),
  getTransactionAuditChain: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/get-session-membership", () => ({
  getSessionMembership: mocks.getSessionMembership,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: "a",
  redirect: mocks.redirect,
}));

vi.mock("@/i18n/set-locale", () => ({ setLocale: vi.fn() }));
vi.mock("next-intl/server", () => ({ getTranslations: mocks.getTranslations }));

vi.mock("@/modules/ledger/application", async () => {
  const actual = await vi.importActual<
    typeof import("@/modules/ledger/application")
  >("@/modules/ledger/application");

  return {
    ...actual,
    listTransactionEvents: mocks.listTransactionEvents,
    listTransactionFilterOptions: mocks.listTransactionFilterOptions,
    listTransactionTags: mocks.listTransactionTags,
    getTransactionReadResult: mocks.getTransactionReadResult,
    getTransactionActivity: mocks.getTransactionActivity,
    getTransactionAuditChain: mocks.getTransactionAuditChain,
  };
});

import { TransactionsFilterBar } from "@/app/[locale]/(product)/money/transactions/transactions-filter-bar";
import TransactionsListPage from "@/app/[locale]/(product)/money/transactions/page";
import MoneyTransactionAddPage from "@/app/[locale]/(product)/money/transactions/new/page";
import TransactionDetailPage from "@/app/[locale]/(product)/money/transactions/[id]/page";

function findElement(
  node: ReactNode,
  predicate: (element: ReactElement) => boolean,
): ReactElement | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, predicate);
      if (match) return match;
    }
    return null;
  }
  if (!node || typeof node !== "object" || !("props" in node)) return null;
  const element = node as ReactElement;
  if (predicate(element)) return element;
  return findElement(element.props.children, predicate);
}

function findElements(
  node: ReactNode,
  predicate: (element: ReactElement) => boolean,
): ReactElement[] {
  if (Array.isArray(node)) {
    return node.flatMap((child) => findElements(child, predicate));
  }
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ReactElement;
  return [
    ...(predicate(element) ? [element] : []),
    ...findElements(element.props.children, predicate),
  ];
}

const TRANSACTION: LedgerTransaction = {
  id: "transaction-id",
  accountId: "account-id",
  accountName: "Cash",
  type: TransactionLedgerType.EXPENSE,
  amount: 100,
  currency: DEFAULT_CURRENCY,
  transactionDate: "2026-10-01",
  note: null,
  categoryId: null,
  categoryName: null,
  categoryIconKey: null,
  jarId: null,
  jarName: null,
  tags: [
    {
      id: "assigned-tag-id",
      name: "Assigned tag",
      iconKey: TransactionTagIconKey.BOOKMARK,
      colorKey: TransactionTagColorKey.SLATE,
      archivedAt: null,
    },
  ],
  status: TransactionStatus.POSTED,
  transferGroupId: null,
  loanPaymentId: null,
  reversesTransactionId: null,
  correctsTransactionId: null,
  isReversal: false,
  createdAt: "2026-10-01T00:00:00.000Z",
};

describe("Transactions progressive filter boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the filtered empty state while reference promises remain pending", async () => {
    const filterOptionsPromise = new Promise<null>(() => {});
    const transactionTagsPromise = new Promise<null>(() => {});
    const accountId = "10000000-0000-4000-8000-000000000000";
    const categoryId = "00000000-0000-4000-8000-000000000000";
    const jarId = "20000000-0000-4000-8000-000000000000";
    const tagId = "30000000-0000-4000-8000-000000000000";
    const locale = routing.locales[0];

    mocks.getSessionMembership.mockResolvedValue({
      user: { id: "user" },
      membership: {
        membershipId: "membership",
        householdId: "household",
        userId: "user",
        role: HOUSEHOLD_ROLE.ADMIN,
      },
    });
    mocks.listTransactionFilterOptions.mockReturnValue(filterOptionsPromise);
    mocks.listTransactionTags.mockReturnValue(transactionTagsPromise);
    mocks.listTransactionEvents.mockResolvedValue({
      activities: [],
      hasMore: false,
      nextCursor: null,
    });

    const page = (await TransactionsListPage({
      params: Promise.resolve({ locale }),
      searchParams: Promise.resolve({
        [TRANSACTION_ACCOUNT_QUERY_PARAM]: accountId,
        [TRANSACTION_CATEGORY_QUERY_PARAM]: categoryId,
        [TRANSACTION_JAR_QUERY_PARAM]: jarId,
        [TRANSACTION_SEARCH_QUERY_PARAM]: "matching note",
        [TRANSACTION_TAG_FILTER_QUERY_PARAM]: tagId,
        [TRANSACTION_TYPE_QUERY_PARAM]: TransactionFilterType.TRANSFER,
      }),
    })) as ReactElement<{ children: ReactNode }>;

    const filterBar = findElement(
      page.props.children,
      (element) => element.type === TransactionsFilterBar,
    );
    const emptyState = findElement(
      page.props.children,
      (element) => element.props["data-testid"] === "transactions-empty",
    );

    expect(filterBar?.props).toMatchObject({
      accountId,
      categoryIds: [categoryId],
      jarIds: [jarId],
      query: "matching note",
      selectedTagIds: [tagId],
      type: TransactionFilterType.TRANSFER,
    });
    expect(filterBar?.props.filterOptionsPromise).toBe(filterOptionsPromise);
    expect(filterBar?.props.transactionTagsPromise).toBe(
      transactionTagsPromise,
    );
    expect(emptyState).not.toBeNull();
    expect(mocks.listTransactionEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId,
        categoryIds: [categoryId],
        jarIds: [jarId],
        q: "matching note",
        tagIds: [tagId],
        type: TransactionFilterType.TRANSFER,
      }),
    );
    expect(mocks.getSessionMembership).toHaveBeenCalledTimes(1);
    expect(mocks.getSessionMembership.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.listTransactionEvents.mock.invocationCallOrder[0],
    );
  });

  it("uses the product session gate on Add and Detail before loading route data", async () => {
    const locale = routing.locales[0];
    mocks.getSessionMembership.mockResolvedValue({
      user: null,
      membership: null,
    });

    const routes = [
      () =>
        TransactionsListPage({
          params: Promise.resolve({ locale }),
          searchParams: Promise.resolve({}),
        }),
      () =>
        MoneyTransactionAddPage({
          params: Promise.resolve({ locale }),
          searchParams: Promise.resolve({}),
        }),
      () =>
        TransactionDetailPage({
          params: Promise.resolve({ locale, id: "transaction" }),
        }),
    ];

    for (const route of routes) {
      await expect(route()).rejects.toBe(mocks.redirectSignal);
    }

    expect(mocks.getSessionMembership).toHaveBeenCalledTimes(routes.length);
    expect(mocks.redirect).toHaveBeenCalledTimes(routes.length);
    expect(mocks.listTransactionEvents).not.toHaveBeenCalled();
    expect(mocks.listTransactionFilterOptions).not.toHaveBeenCalled();
    expect(mocks.listTransactionTags).not.toHaveBeenCalled();
  });

  it("returns an ordinary transaction hero while history and tag reads are pending", async () => {
    const locale = routing.locales[0];
    const pendingHistory = new Promise<null>(() => {});
    const pendingTags = new Promise<null>(() => {});
    const activity = createTransactionActivities([TRANSACTION])[0];
    mocks.getSessionMembership.mockResolvedValue({
      user: { id: "user" },
      membership: {
        membershipId: "membership",
        householdId: "household",
        userId: "user",
        role: HOUSEHOLD_ROLE.ADMIN,
      },
    });
    mocks.getTransactionReadResult.mockResolvedValue({
      status: TransactionReadStatus.OK,
      transaction: TRANSACTION,
    });
    mocks.getTransactionActivity.mockResolvedValue(activity);
    mocks.getTransactionAuditChain.mockReturnValue(pendingHistory);
    mocks.listTransactionTags.mockReturnValue(pendingTags);

    const page = await TransactionDetailPage({
      params: Promise.resolve({ locale, id: TRANSACTION.id }),
    });
    const heroAmount = findElement(page, (element) => element.type === Amount);
    const boundaries = findElements(
      page,
      (element) => element.type === Suspense,
    );

    expect(heroAmount).not.toBeNull();
    expect(boundaries).toHaveLength(2);
    expect(mocks.getTransactionAuditChain).toHaveBeenCalledWith(TRANSACTION.id);
    expect(mocks.listTransactionTags).toHaveBeenCalledWith({
      includeArchived: true,
    });
  });

  it("does not start history or tag reads for Transfer Detail", async () => {
    const locale = routing.locales[0];
    const source: LedgerTransaction = {
      ...TRANSACTION,
      type: TransactionLedgerType.TRANSFER_OUT,
      transferGroupId: "transfer-group-id",
    };
    const destination: LedgerTransaction = {
      ...source,
      id: "destination-transaction-id",
      accountId: "destination-account-id",
      accountName: "Savings",
      type: TransactionLedgerType.TRANSFER_IN,
    };
    const activity = createTransactionActivities([source, destination])[0];
    mocks.getSessionMembership.mockResolvedValue({
      user: { id: "user" },
      membership: {
        membershipId: "membership",
        householdId: "household",
        userId: "user",
        role: HOUSEHOLD_ROLE.ADMIN,
      },
    });
    mocks.getTransactionReadResult.mockResolvedValue({
      status: TransactionReadStatus.OK,
      transaction: source,
    });
    mocks.getTransactionActivity.mockResolvedValue(activity);

    const page = await TransactionDetailPage({
      params: Promise.resolve({ locale, id: source.id }),
    });

    expect(page).toMatchObject({ props: { activity } });
    expect(mocks.getTransactionAuditChain).not.toHaveBeenCalled();
    expect(mocks.listTransactionTags).not.toHaveBeenCalled();
  });

  it("isolates history and tag read failures while preserving assigned tags", async () => {
    const locale = routing.locales[0];
    const activity = createTransactionActivities([TRANSACTION])[0];
    mocks.getSessionMembership.mockResolvedValue({
      user: { id: "user" },
      membership: {
        membershipId: "membership",
        householdId: "household",
        userId: "user",
        role: HOUSEHOLD_ROLE.ADMIN,
      },
    });
    mocks.getTransactionReadResult.mockResolvedValue({
      status: TransactionReadStatus.OK,
      transaction: TRANSACTION,
    });
    mocks.getTransactionActivity.mockResolvedValue(activity);
    mocks.getTransactionAuditChain.mockResolvedValue(null);
    mocks.listTransactionTags.mockResolvedValue(null);

    const page = await TransactionDetailPage({
      params: Promise.resolve({ locale, id: TRANSACTION.id }),
    });
    const boundaries = findElements(
      page,
      (element) => element.type === Suspense,
    );
    const tagSection = boundaries[0].props.children as ReactElement<{
      tx: LedgerTransaction;
      tagOptionsPromise: Promise<null>;
      t: (key: string) => string;
    }>;
    const renderTagSection = tagSection.type as unknown as (
      props: typeof tagSection.props,
    ) => Promise<ReactNode>;
    const tagContent = await renderTagSection({
      ...tagSection.props,
      tagOptionsPromise: Promise.resolve(null),
    });
    const tagEditor = findElement(
      tagContent,
      (element) => element.type === TransactionTagEditor,
    );
    const tagError = findElement(
      tagContent,
      (element) => element.type === StatusAlert,
    );

    expect(tagEditor?.props).toMatchObject({
      initialTags: TRANSACTION.tags,
      availableTags: TRANSACTION.tags,
      disabled: true,
    });
    expect(tagError?.props.title).toBe("detailPage.tagOptionsUnavailableTitle");

    const historySection = boundaries[1].props.children as ReactElement<{
      tx: LedgerTransaction;
      auditChainPromise: Promise<null>;
      locale: string;
      t: (key: string) => string;
      tCatalog: (key: string) => string;
    }>;
    const renderHistory = historySection.type as unknown as (
      props: typeof historySection.props,
    ) => Promise<ReactNode>;
    const historyContent = await renderHistory({
      ...historySection.props,
      auditChainPromise: Promise.resolve(null),
    });

    expect(
      findElement(historyContent, (element) => element.type === StatusAlert)
        ?.props,
    ).toMatchObject({
      title: "detailPage.historyUnavailableTitle",
      description: "detailPage.historyUnavailableBody",
    });
  });
});
