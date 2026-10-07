import { beforeEach, describe, expect, it, vi } from "vitest";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { AccountType } from "@/modules/ledger/application";

const mocks = vi.hoisted(() => {
  const redirectSignal = Symbol("redirect");

  return {
    getSessionMembership: vi.fn(),
    getTranslations: vi.fn(async () => (key: string) => key),
    getHouseholdBaseCurrency: vi.fn(),
    redirect: vi.fn(() => {
      throw redirectSignal;
    }),
    redirectSignal,
    getRealPosition: vi.fn(),
    listCreditCards: vi.fn(),
    listAccounts: vi.fn(),
    getAccount: vi.fn(),
    listRecentTransactions: vi.fn(),
    getCreditCardDetail: vi.fn(),
    listCreditCardInstallments: vi.fn(),
    listEligibleCreditCardPurchases: vi.fn(),
  };
});

vi.mock("@/modules/tenancy/application/get-session-membership", () => ({
  getSessionMembership: mocks.getSessionMembership,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: () => null,
  redirect: mocks.redirect,
}));

vi.mock("@/i18n/set-locale", () => ({
  setLocale: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: mocks.getTranslations,
}));

vi.mock("@/modules/tenancy/application/get-household-base-currency", () => ({
  getHouseholdBaseCurrency: mocks.getHouseholdBaseCurrency,
}));

vi.mock("@/modules/ledger/application", async () => {
  const actual = await vi.importActual<
    typeof import("@/modules/ledger/application")
  >("@/modules/ledger/application");

  return {
    ...actual,
    getRealPosition: mocks.getRealPosition,
    listCreditCards: mocks.listCreditCards,
    listAccounts: mocks.listAccounts,
    getAccount: mocks.getAccount,
    listRecentTransactions: mocks.listRecentTransactions,
    getCreditCardDetail: mocks.getCreditCardDetail,
    listCreditCardInstallments: mocks.listCreditCardInstallments,
    listEligibleCreditCardPurchases: mocks.listEligibleCreditCardPurchases,
  };
});

import AccountsPage from "@/app/[locale]/(product)/money/accounts/page";
import { AccountCreatePage } from "@/app/[locale]/(product)/money/accounts/account-create-page";
import AccountDetailPage from "@/app/[locale]/(product)/money/accounts/[id]/page";

describe("Accounts route session gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getHouseholdBaseCurrency.mockResolvedValue("VND");
    mocks.getSessionMembership.mockResolvedValue({
      user: null,
      membership: null,
    });
  });

  it("starts only the receipt currency read after the member gate for accounts", async () => {
    const user = { id: "user-1" };
    const membership = { userId: user.id, householdId: "household-1" };
    mocks.getSessionMembership.mockResolvedValue({ user, membership });

    await expect(
      AccountCreatePage({ locale: routing.locales[0] }),
    ).resolves.toBeDefined();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.getSessionMembership).toHaveBeenCalledTimes(1);
    expect(mocks.getHouseholdBaseCurrency).toHaveBeenCalledWith(
      membership.householdId,
    );
    expect(mocks.getSessionMembership.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.getHouseholdBaseCurrency.mock.invocationCallOrder[0],
    );
    expect(mocks.listAccounts).not.toHaveBeenCalled();
  });

  it("starts the server account read only for the deferred card picker", async () => {
    const user = { id: "user-1" };
    const membership = { userId: user.id, householdId: "household-1" };
    mocks.getSessionMembership.mockResolvedValue({ user, membership });
    mocks.listAccounts.mockResolvedValue({ currency: "VND", accounts: [] });

    await expect(
      AccountCreatePage({
        locale: routing.locales[0],
        fixedType: AccountType.CREDIT_CARD,
      }),
    ).resolves.toBeDefined();

    expect(mocks.listAccounts).toHaveBeenCalledTimes(1);
    expect(mocks.getHouseholdBaseCurrency).not.toHaveBeenCalled();
    expect(mocks.getSessionMembership.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.listAccounts.mock.invocationCallOrder[0],
    );
  });

  it("redirects to localized login before running any account loaders", async () => {
    const locale = routing.locales[0];
    const routes = [
      () => AccountsPage({ params: Promise.resolve({ locale }) }),
      () => AccountCreatePage({ locale }),
      () => AccountCreatePage({ locale, fixedType: AccountType.CREDIT_CARD }),
      () =>
        AccountDetailPage({
          params: Promise.resolve({ locale, id: "unused" }),
        }),
    ];

    for (const route of routes) {
      await expect(route()).rejects.toBe(mocks.redirectSignal);
    }

    expect(mocks.getSessionMembership).toHaveBeenCalledTimes(routes.length);
    expect(mocks.redirect).toHaveBeenCalledTimes(routes.length);
    expect(mocks.redirect).toHaveBeenNthCalledWith(1, {
      href: APP_PATH.LOGIN,
      locale,
    });
    expect(mocks.redirect).toHaveBeenNthCalledWith(2, {
      href: APP_PATH.LOGIN,
      locale,
    });
    expect(mocks.redirect).toHaveBeenNthCalledWith(3, {
      href: APP_PATH.LOGIN,
      locale,
    });
    expect(mocks.redirect).toHaveBeenNthCalledWith(4, {
      href: APP_PATH.LOGIN,
      locale,
    });
    expect(mocks.getRealPosition).not.toHaveBeenCalled();
    expect(mocks.listCreditCards).not.toHaveBeenCalled();
    expect(mocks.listAccounts).not.toHaveBeenCalled();
    expect(mocks.getAccount).not.toHaveBeenCalled();
    expect(mocks.listRecentTransactions).not.toHaveBeenCalled();
    expect(mocks.getCreditCardDetail).not.toHaveBeenCalled();
    expect(mocks.listCreditCardInstallments).not.toHaveBeenCalled();
    expect(mocks.listEligibleCreditCardPurchases).not.toHaveBeenCalled();
  });
});
