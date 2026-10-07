import {
  Suspense,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AccountType,
  CardBillingMonthStatus,
  DEFAULT_CURRENCY,
  type LedgerAccount,
  type LedgerTransaction,
  type CreditCardDetail,
} from "@/modules/ledger/application";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { OWNER_STATUS } from "@/modules/shared-kernel/application/financial-ownership";
import { routing } from "@/i18n/routing";
import { Balance } from "@/shared/patterns/balance";
import { EmptyState } from "@/shared/patterns/empty-state";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { StatusAlert } from "@/shared/ui/status-alert";
import { formatCurrency } from "@/shared/i18n/formatters";
import { ACCOUNT_DETAIL_PREVIEW_CONFIG } from "@/app/[locale]/(product)/money/accounts/[id]/detail-constants";
import { AccountDetailManagement } from "@/app/[locale]/(product)/money/accounts/[id]/account-detail-management";
import { AccountDetailQuickActions } from "@/app/[locale]/(product)/money/accounts/[id]/account-detail-quick-actions";
import {
  CreditCardChargeAction,
  CreditCardDetailActions,
} from "@/app/[locale]/(product)/money/accounts/[id]/credit-card-detail-actions";
import { CreditCardHero } from "@/app/[locale]/(product)/money/accounts/[id]/credit-card-hero";
import { CreditCardInstallmentsSection } from "@/app/[locale]/(product)/money/accounts/[id]/credit-card-installments-section";

const mocks = vi.hoisted(() => ({
  requireProductSession: vi.fn(
    async ({ localeParam }: { localeParam: string }) => ({
      locale: localeParam,
    }),
  ),
  getTranslations: vi.fn(async () => (key: string) => key),
  getAccount: vi.fn(),
  getAccountType: vi.fn(),
  listRecentTransactions: vi.fn(),
  listAccounts: vi.fn(),
  getCreditCardDetail: vi.fn(),
  listCreditCardBillingItems: vi.fn(),
  listCreditCardInstallments: vi.fn(),
  listEligibleCreditCardPurchases: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/require-product-session", () => ({
  requireProductSession: mocks.requireProductSession,
}));

vi.mock("next-intl/server", () => ({
  getTranslations: mocks.getTranslations,
}));

vi.mock("@/modules/ledger/application", async () => {
  const actual = await vi.importActual<
    typeof import("@/modules/ledger/application")
  >("@/modules/ledger/application");

  return {
    ...actual,
    getAccount: mocks.getAccount,
    getAccountType: mocks.getAccountType,
    listRecentTransactions: mocks.listRecentTransactions,
    listAccounts: mocks.listAccounts,
    getCreditCardDetail: mocks.getCreditCardDetail,
    listCreditCardBillingItems: mocks.listCreditCardBillingItems,
    listCreditCardInstallments: mocks.listCreditCardInstallments,
    listEligibleCreditCardPurchases: mocks.listEligibleCreditCardPurchases,
  };
});

import AccountDetailPage from "@/app/[locale]/(product)/money/accounts/[id]/page";

const ACCOUNT_ID = "account-test-id";
const ACCOUNT_BALANCE = 1_250_000;
const CARD_DETAIL: CreditCardDetail = {
  accountId: ACCOUNT_ID,
  name: "Main card",
  type: AccountType.CREDIT_CARD,
  creditLimit: 20_000_000,
  statementDay: 20,
  dueDay: 5,
  linkedBankAccountId: "linked-account-id",
  outstanding: 4_500_000,
  nextDueRemaining: 3_000_000,
  availableCredit: 15_500_000,
  utilizationPct: 23,
  nextDueDate: "2026-10-05",
  months: [
    {
      id: "billing-month-id",
      cardAccountId: ACCOUNT_ID,
      billingMonth: "2026-09-01",
      statementAmount: 4_000_000,
      paidAmount: 1_000_000,
      dueDate: "2026-10-05",
      status: CardBillingMonthStatus.PARTIAL,
      remaining: 3_000_000,
    },
  ],
};

function accountFixture(overrides: Partial<LedgerAccount> = {}): {
  account: LedgerAccount;
  currency: string;
} {
  return {
    currency: DEFAULT_CURRENCY,
    account: {
      id: ACCOUNT_ID,
      name: "Main account",
      type: AccountType.SAVINGS,
      iconKey: null,
      balance: ACCOUNT_BALANCE,
      isArchived: false,
      financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
      ownerMembershipId: null,
      isPersonal: false,
      isOwnedByMe: false,
      canMutate: true,
      ownerStatus: OWNER_STATUS.ACTIVE,
      ...overrides,
    },
  };
}

type SearchableElementProps = {
  children?: ReactNode;
  fallback?: ReactNode;
  "data-testid"?: string;
};

function findElement(
  node: ReactNode,
  predicate: (element: ReactElement<SearchableElementProps>) => boolean,
): ReactElement<SearchableElementProps> | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, predicate);
      if (found) return found;
    }
    return undefined;
  }

  if (!isValidElement(node)) return undefined;

  const element = node as ReactElement<SearchableElementProps>;
  if (predicate(element)) return element;

  return (
    findElement(element.props.children, predicate) ??
    findElement(element.props.fallback, predicate)
  );
}

function findElementByTestId(node: ReactNode, testId: string) {
  return findElement(
    node,
    (element) => element.props["data-testid"] === testId,
  );
}

describe("liquid account detail progressive rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAccountType.mockResolvedValue(AccountType.SAVINGS);
    mocks.getAccount.mockResolvedValue(accountFixture());
    mocks.listRecentTransactions.mockResolvedValue([]);
    mocks.listAccounts.mockResolvedValue({
      currency: DEFAULT_CURRENCY,
      accounts: [],
    });
    mocks.getCreditCardDetail.mockResolvedValue({ card: CARD_DETAIL });
    mocks.listCreditCardBillingItems.mockResolvedValue([]);
    mocks.listCreditCardInstallments.mockResolvedValue([]);
    mocks.listEligibleCreditCardPurchases.mockResolvedValue([]);
  });

  it("returns the authoritative financial hero while activity is still pending", async () => {
    let resolveActivity!: (value: LedgerTransaction[] | null) => void;
    const pendingActivity = new Promise<LedgerTransaction[] | null>(
      (resolve) => {
        resolveActivity = resolve;
      },
    );
    mocks.listRecentTransactions.mockReturnValue(pendingActivity);

    const page = await AccountDetailPage({
      params: Promise.resolve({
        locale: routing.defaultLocale,
        id: ACCOUNT_ID,
      }),
    });

    expect(mocks.getAccount).toHaveBeenCalledWith(ACCOUNT_ID);
    expect(mocks.listRecentTransactions).toHaveBeenCalledWith(
      ACCOUNT_DETAIL_PREVIEW_CONFIG.RECENT_ACTIVITY_LIMIT,
      ACCOUNT_ID,
    );
    expect(mocks.listAccounts).not.toHaveBeenCalled();
    expect(mocks.getCreditCardDetail).not.toHaveBeenCalled();

    const hero = findElementByTestId(page, "account-detail-hero");
    expect(hero).toBeDefined();

    const balance = findElement(page, (element) => element.type === Balance);
    expect(balance?.props).toMatchObject({
      amountLabel: formatCurrency(
        ACCOUNT_BALANCE,
        DEFAULT_CURRENCY,
        routing.defaultLocale,
        {
          maximumFractionDigits: 0,
        },
      ),
    });

    const ownership = findElement(
      page,
      (element) => element.type === FinancialOwnershipBadge,
    );
    expect(ownership?.props).toMatchObject({
      financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
      isOwnedByMe: false,
      ownerStatus: OWNER_STATUS.ACTIVE,
    });

    const activityBoundary = findElement(
      page,
      (element) =>
        // React's Suspense is represented as a special element type.
        element.type === Suspense,
    );
    expect(activityBoundary?.props.fallback).toBeDefined();

    const activityElement = activityBoundary?.props.children;
    if (!isValidElement(activityElement)) {
      throw new Error("Expected a server activity section under Suspense");
    }
    resolveActivity([]);
    const renderActivity = activityElement.type as (
      props: unknown,
    ) => Promise<ReactNode>;
    const activityContent = await renderActivity(activityElement.props);
    expect(
      findElement(activityContent, (element) => element.type === EmptyState),
    ).toBeDefined();
  });

  it("starts authorized activity while the selected balance is still pending", async () => {
    let resolveAccount!: (
      value: ReturnType<typeof accountFixture> | null,
    ) => void;
    const pendingAccount = new Promise<ReturnType<
      typeof accountFixture
    > | null>((resolve) => {
      resolveAccount = resolve;
    });
    mocks.getAccount.mockReturnValue(pendingAccount);

    const pagePromise = AccountDetailPage({
      params: Promise.resolve({
        locale: routing.defaultLocale,
        id: ACCOUNT_ID,
      }),
    });

    await vi.waitFor(() => {
      expect(mocks.listRecentTransactions).toHaveBeenCalledWith(
        ACCOUNT_DETAIL_PREVIEW_CONFIG.RECENT_ACTIVITY_LIMIT,
        ACCOUNT_ID,
      );
    });
    resolveAccount(accountFixture());

    await expect(pagePromise).resolves.toBeDefined();
  });

  it("does not start activity or optional detail reads when the account is unavailable", async () => {
    mocks.getAccountType.mockResolvedValue(null);

    await AccountDetailPage({
      params: Promise.resolve({
        locale: routing.defaultLocale,
        id: ACCOUNT_ID,
      }),
    });

    expect(mocks.getAccount).toHaveBeenCalledWith(ACCOUNT_ID);
    expect(mocks.listRecentTransactions).not.toHaveBeenCalled();
    expect(mocks.listAccounts).not.toHaveBeenCalled();
    expect(mocks.getCreditCardDetail).not.toHaveBeenCalled();
  });

  it("waits for the authorized account type before starting card summary reads", async () => {
    let resolveAccountType!: (
      accountType: LedgerAccount["type"] | null,
    ) => void;
    mocks.getAccountType.mockReturnValue(
      new Promise((resolve) => {
        resolveAccountType = resolve;
      }),
    );
    mocks.getAccount.mockResolvedValue(accountFixture());

    const pagePromise = AccountDetailPage({
      params: Promise.resolve({
        locale: routing.defaultLocale,
        id: ACCOUNT_ID,
      }),
    });

    await vi.waitFor(() => {
      expect(mocks.getAccountType).toHaveBeenCalledTimes(1);
    });
    expect(mocks.getCreditCardDetail).not.toHaveBeenCalled();

    resolveAccountType(AccountType.SAVINGS);
    await expect(pagePromise).resolves.toBeDefined();
    expect(mocks.getCreditCardDetail).not.toHaveBeenCalled();
  });

  it("keeps a failed account result unavailable even if authorized card summary reads finish", async () => {
    mocks.getAccountType.mockResolvedValue(AccountType.CREDIT_CARD);
    mocks.getAccount.mockResolvedValue(null);

    const page = await AccountDetailPage({
      params: Promise.resolve({
        locale: routing.defaultLocale,
        id: ACCOUNT_ID,
      }),
    });

    expect(
      findElement(page, (element) => element.type === CreditCardHero),
    ).toBeUndefined();
    expect(mocks.listAccounts).not.toHaveBeenCalled();
    expect(mocks.getCreditCardDetail).toHaveBeenCalledTimes(1);
    expect(mocks.listCreditCardBillingItems).not.toHaveBeenCalled();
    expect(mocks.listCreditCardInstallments).not.toHaveBeenCalled();
    expect(mocks.listEligibleCreditCardPurchases).not.toHaveBeenCalled();
  });

  it("keeps an activity failure inside its streamed section", async () => {
    mocks.listRecentTransactions.mockResolvedValue(null);

    const page = await AccountDetailPage({
      params: Promise.resolve({
        locale: routing.defaultLocale,
        id: ACCOUNT_ID,
      }),
    });
    const activityBoundary = findElement(
      page,
      (element) => element.type === Suspense,
    );
    const activityElement = activityBoundary?.props.children;
    if (!isValidElement(activityElement)) {
      throw new Error("Expected a server activity section under Suspense");
    }

    const renderActivity = activityElement.type as (
      props: unknown,
    ) => Promise<ReactNode>;
    const activityContent = await renderActivity(activityElement.props);

    expect(findElementByTestId(page, "account-detail-hero")).toBeDefined();
    expect(
      findElement(activityContent, (element) => element.type === StatusAlert),
    ).toBeDefined();
    expect(mocks.listAccounts).not.toHaveBeenCalled();
  });

  it("starts card-only loaders after authorization and skips unused recent activity", async () => {
    mocks.getAccountType.mockResolvedValue(AccountType.CREDIT_CARD);
    mocks.getAccount.mockResolvedValue(
      accountFixture({ type: AccountType.CREDIT_CARD }),
    );
    await AccountDetailPage({
      params: Promise.resolve({
        locale: routing.defaultLocale,
        id: ACCOUNT_ID,
      }),
    });

    expect(mocks.getAccountType).toHaveBeenCalledTimes(1);
    expect(mocks.getAccount).toHaveBeenCalledTimes(1);
    expect(mocks.listRecentTransactions).not.toHaveBeenCalled();
    expect(mocks.listAccounts).toHaveBeenCalledTimes(1);
    expect(mocks.getCreditCardDetail).toHaveBeenCalledTimes(1);
    expect(mocks.getCreditCardDetail).toHaveBeenCalledWith(
      ACCOUNT_ID,
      expect.any(Promise),
    );
    expect(mocks.listCreditCardInstallments).toHaveBeenCalledTimes(1);
    expect(mocks.listCreditCardInstallments).toHaveBeenCalledWith(ACCOUNT_ID);
    expect(mocks.listEligibleCreditCardPurchases).toHaveBeenCalledTimes(1);
    expect(mocks.listEligibleCreditCardPurchases).toHaveBeenCalledWith(
      ACCOUNT_ID,
    );
    expect(mocks.listCreditCardBillingItems).toHaveBeenCalledTimes(1);
    expect(mocks.listCreditCardBillingItems).toHaveBeenCalledWith(ACCOUNT_ID);
  });

  it("starts card summary reads after the active-card context, before account capability resolves", async () => {
    mocks.getAccountType.mockResolvedValue(AccountType.CREDIT_CARD);
    let resolveAccount!: (
      value: ReturnType<typeof accountFixture> | null,
    ) => void;
    const pendingAccount = new Promise<ReturnType<
      typeof accountFixture
    > | null>((resolve) => {
      resolveAccount = resolve;
    });
    mocks.getAccount.mockReturnValue(pendingAccount);

    const pagePromise = AccountDetailPage({
      params: Promise.resolve({
        locale: routing.defaultLocale,
        id: ACCOUNT_ID,
      }),
    });

    await vi.waitFor(() => {
      expect(mocks.getCreditCardDetail).toHaveBeenCalledTimes(1);
    });
    expect(mocks.getCreditCardDetail).toHaveBeenCalledWith(
      ACCOUNT_ID,
      pendingAccount,
    );

    resolveAccount(accountFixture({ type: AccountType.CREDIT_CARD }));
    await expect(pagePromise).resolves.toBeDefined();
  });

  it("returns the card summary while payment, installment, and activity data remain pending", async () => {
    mocks.getAccountType.mockResolvedValue(AccountType.CREDIT_CARD);
    mocks.getAccount.mockResolvedValue(
      accountFixture({ type: AccountType.CREDIT_CARD }),
    );

    let resolveAccounts!: (value: { currency: string; accounts: [] }) => void;
    let resolveInstallments!: (value: []) => void;
    let resolveEligible!: (value: []) => void;
    let resolveBillingItems!: (value: []) => void;
    mocks.listAccounts.mockReturnValue(
      new Promise((resolve) => {
        resolveAccounts = resolve;
      }),
    );
    mocks.listCreditCardInstallments.mockReturnValue(
      new Promise((resolve) => {
        resolveInstallments = resolve;
      }),
    );
    mocks.listEligibleCreditCardPurchases.mockReturnValue(
      new Promise((resolve) => {
        resolveEligible = resolve;
      }),
    );
    mocks.listCreditCardBillingItems.mockReturnValue(
      new Promise((resolve) => {
        resolveBillingItems = resolve;
      }),
    );

    const page = await AccountDetailPage({
      params: Promise.resolve({
        locale: routing.defaultLocale,
        id: ACCOUNT_ID,
      }),
    });

    expect(
      findElement(page, (element) => element.type === CreditCardHero),
    ).toBeDefined();
    expect(
      findElement(page, (element) => element.type === CreditCardChargeAction),
    ).toBeDefined();
    const paymentBoundary = findElement(
      page,
      (element) =>
        element.type === Suspense &&
        isValidElement(element.props.children) &&
        element.props.children.type === CreditCardDetailActions,
    );
    const installmentBoundary = findElement(
      page,
      (element) =>
        element.type === Suspense &&
        isValidElement(element.props.children) &&
        element.props.children.type === CreditCardInstallmentsSection,
    );
    const activityBoundary = findElement(
      page,
      (element) =>
        element.type === Suspense &&
        isValidElement(element.props.children) &&
        "itemsPromise" in element.props.children.props,
    );
    expect(paymentBoundary?.props.fallback).toBeDefined();
    expect(installmentBoundary?.props.fallback).toBeDefined();
    expect(activityBoundary?.props.fallback).toBeDefined();
    expect(mocks.listRecentTransactions).not.toHaveBeenCalled();

    resolveAccounts({ currency: DEFAULT_CURRENCY, accounts: [] });
    resolveInstallments([]);
    resolveEligible([]);
    resolveBillingItems([]);
  });

  it("keeps former-owner personal accounts read-only in the first summary", async () => {
    mocks.getAccount.mockResolvedValue(
      accountFixture({
        financialScope: FINANCIAL_SCOPE.PERSONAL,
        ownerMembershipId: "former-owner-membership",
        isPersonal: true,
        isOwnedByMe: false,
        canMutate: false,
        ownerStatus: OWNER_STATUS.FORMER,
      }),
    );

    const page = await AccountDetailPage({
      params: Promise.resolve({
        locale: routing.defaultLocale,
        id: ACCOUNT_ID,
      }),
    });

    expect(
      findElement(
        page,
        (element) => element.type === AccountDetailQuickActions,
      ),
    ).toBeUndefined();
    expect(
      findElement(page, (element) => element.type === AccountDetailManagement)
        ?.props,
    ).toMatchObject({ canMutate: false });
  });
});
