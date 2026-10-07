import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { locales } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  TRANSACTION_ACCOUNT_QUERY_PARAM,
  TRANSACTION_CATEGORY_QUERY_PARAM,
  TRANSACTION_CURSOR_QUERY_PARAM,
  TRANSACTION_JAR_QUERY_PARAM,
  TRANSACTION_SEARCH_QUERY_PARAM,
  TRANSACTION_TAG_FILTER_QUERY_PARAM,
  TRANSACTION_TYPE_QUERY_PARAM,
  TransactionFilterType,
} from "@/modules/ledger/application/client";

const mocks = vi.hoisted(() => ({
  locale: "en",
  back: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next-intl", () => ({ useLocale: () => mocks.locale }));
vi.mock("@/i18n/navigation", () => ({
  Link: "a",
  getPathname: ({ href, locale }: { href: string; locale: string }) =>
    `/${locale}${href}`,
  useRouter: () => mocks,
}));
vi.mock("@/shared/patterns/top-app-bar", () => ({ TopAppBar: "header" }));

import { useTransactionsReturn } from "@/app/[locale]/(product)/money/transactions/[id]/transactions-return-navigation";

type HistoryEntry = {
  key: string;
  url?: string | null;
  sameDocument?: boolean;
};

type NavigationState = {
  currentEntry: { index: number; key: string } | null;
  activation?: { entry: { key: string } } | null;
  entries: () => HistoryEntry[];
};

function installHistory(
  previousUrl: string | null,
  options: {
    activationKey?: string | null;
    currentKey?: string;
    index?: number;
    sameDocument?: boolean;
  } = {},
) {
  const current = {
    index: options.index ?? 1,
    key: options.currentKey ?? "current-entry",
  };
  const previous: HistoryEntry | undefined =
    current.index > 0
      ? {
          key: "previous-entry",
          url: previousUrl,
          sameDocument: options.sameDocument ?? true,
        }
      : undefined;
  const entries = previous ? [previous, current] : [current];
  const navigation: NavigationState = {
    currentEntry: current,
    activation:
      options.activationKey === null
        ? undefined
        : { entry: { key: options.activationKey ?? "document-entry" } },
    entries: () => entries,
  };

  vi.stubGlobal("navigation", navigation);
  return navigation;
}

function returnToTransactions() {
  const { result } = renderHook(() => useTransactionsReturn());
  act(() => result.current());
}

function expectedListUrl(locale: string) {
  return `${window.location.origin}/${locale}${APP_PATH.MONEY_TRANSACTIONS}`;
}

describe("Transactions safe return", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.locale = locales[0];
  });

  afterEach(() => vi.unstubAllGlobals());

  it("restores an unfiltered Transactions List entry", () => {
    installHistory(expectedListUrl(mocks.locale));

    returnToTransactions();

    expect(mocks.back).toHaveBeenCalledOnce();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("restores the exact filtered list entry without rebuilding its query", () => {
    const params = new URLSearchParams({
      [TRANSACTION_ACCOUNT_QUERY_PARAM]: "sample-account",
      [TRANSACTION_SEARCH_QUERY_PARAM]: "Lunch",
      [TRANSACTION_TYPE_QUERY_PARAM]: TransactionFilterType.EXPENSE,
      [TRANSACTION_CATEGORY_QUERY_PARAM]: "sample-category",
      [TRANSACTION_JAR_QUERY_PARAM]: "sample-jar",
      [TRANSACTION_TAG_FILTER_QUERY_PARAM]: "sample-tag",
      [TRANSACTION_CURSOR_QUERY_PARAM]: "next-page",
    });
    const sourceUrl = `${expectedListUrl(mocks.locale)}?${params.toString()}`;
    const navigation = installHistory(sourceUrl);

    returnToTransactions();

    expect(mocks.back).toHaveBeenCalledOnce();
    expect(navigation.entries()[0].url).toBe(sourceUrl);
  });

  it("uses the same return semantics for a Transfer-filtered source list", () => {
    const params = new URLSearchParams({
      [TRANSACTION_TYPE_QUERY_PARAM]: TransactionFilterType.TRANSFER,
    });
    installHistory(`${expectedListUrl(mocks.locale)}?${params.toString()}`);

    returnToTransactions();

    expect(mocks.back).toHaveBeenCalledOnce();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("replaces a direct Detail entry with the localized list", () => {
    installHistory(null, { index: 0 });

    returnToTransactions();

    expect(mocks.replace.mock.calls).toEqual([[APP_PATH.MONEY_TRANSACTIONS]]);
    expect(mocks.back).not.toHaveBeenCalled();
  });

  it("uses the list fallback after Detail refresh", () => {
    installHistory(expectedListUrl(mocks.locale), {
      currentKey: "detail-entry",
      activationKey: "detail-entry",
    });

    returnToTransactions();

    expect(mocks.replace.mock.calls).toEqual([[APP_PATH.MONEY_TRANSACTIONS]]);
    expect(mocks.back).not.toHaveBeenCalled();
  });

  it("does not return to an external predecessor", () => {
    installHistory("https://example.com/transactions", { sameDocument: false });

    returnToTransactions();

    expect(mocks.replace.mock.calls).toEqual([[APP_PATH.MONEY_TRANSACTIONS]]);
    expect(mocks.back).not.toHaveBeenCalled();
  });

  it.each(locales)(
    "keeps the %s locale for history proof and fallback",
    (locale) => {
      mocks.locale = locale;
      installHistory(expectedListUrl(locale));

      returnToTransactions();

      expect(mocks.back).toHaveBeenCalledOnce();
      vi.clearAllMocks();
      installHistory(null, { index: 0 });

      returnToTransactions();

      expect(mocks.replace.mock.calls).toEqual([[APP_PATH.MONEY_TRANSACTIONS]]);
    },
  );

  it("falls back when the prior same-document route is not Transactions", () => {
    installHistory(
      `${window.location.origin}/${mocks.locale}${APP_PATH.MONEY_ACCOUNTS}`,
    );

    returnToTransactions();

    expect(mocks.replace.mock.calls).toEqual([[APP_PATH.MONEY_TRANSACTIONS]]);
    expect(mocks.back).not.toHaveBeenCalled();
  });

  it("falls back when the prior list belongs to another locale", () => {
    const otherLocale = locales.find((locale) => locale !== mocks.locale);
    if (!otherLocale) throw new Error("Expected another configured locale");
    installHistory(expectedListUrl(otherLocale));

    returnToTransactions();

    expect(mocks.replace.mock.calls).toEqual([[APP_PATH.MONEY_TRANSACTIONS]]);
    expect(mocks.back).not.toHaveBeenCalled();
  });

  it("rejects a cross-document Transactions entry", () => {
    installHistory(expectedListUrl(mocks.locale), { sameDocument: false });

    returnToTransactions();

    expect(mocks.replace.mock.calls).toEqual([[APP_PATH.MONEY_TRANSACTIONS]]);
    expect(mocks.back).not.toHaveBeenCalled();
  });

  it("falls back when Navigation API activation evidence is unavailable", () => {
    installHistory(expectedListUrl(mocks.locale), { activationKey: null });

    returnToTransactions();

    expect(mocks.replace.mock.calls).toEqual([[APP_PATH.MONEY_TRANSACTIONS]]);
    expect(mocks.back).not.toHaveBeenCalled();
  });

  it("issues Back without pushing or replacing a list entry", () => {
    installHistory(expectedListUrl(mocks.locale));
    const { result } = renderHook(() => useTransactionsReturn());

    act(() => {
      result.current();
      result.current();
    });

    expect(mocks.back).toHaveBeenCalledTimes(2);
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
