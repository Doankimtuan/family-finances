import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { locales } from "@/i18n/routing";
import {
  InvestmentHoldingsTab,
  InvestmentOverviewFilter,
  INVESTMENT_LIST_QUERY_PARAM,
} from "@/modules/investments/application/investment-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

const mocks = vi.hoisted(() => ({
  locale: "en",
  back: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next-intl", () => ({ useLocale: () => mocks.locale }));
vi.mock("@/i18n/navigation", () => ({
  getPathname: ({ href, locale }: { href: string; locale: string }) =>
    `/${locale}${href}`,
  useRouter: () => mocks,
}));
vi.mock("@/shared/patterns/top-app-bar", () => ({ TopAppBar: "header" }));

import { useInvestmentsReturn } from "@/app/[locale]/(product)/money/investments/[id]/investments-return-navigation";

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

function installNavigation(
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
    key: options.currentKey ?? "investment-detail-entry",
  };
  const previous: HistoryEntry | undefined =
    current.index > 0
      ? {
          key: "investments-list-entry",
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

function returnToInvestments() {
  const { result } = renderHook(() => useInvestmentsReturn());
  act(() => result.current());
}

function expectedListUrl(locale: string) {
  return `${window.location.origin}/${locale}${APP_PATH.MONEY_INVESTMENTS}`;
}

describe("Investments safe return", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.locale = locales[0];
  });

  afterEach(() => vi.unstubAllGlobals());

  it("returns to the same Investments List entry with its URL state intact", () => {
    const params = new URLSearchParams({
      [INVESTMENT_LIST_QUERY_PARAM.SEARCH]: "ETF",
      [INVESTMENT_LIST_QUERY_PARAM.TAB]: InvestmentHoldingsTab.CLOSED,
      [INVESTMENT_LIST_QUERY_PARAM.FILTER]: InvestmentOverviewFilter.FUND,
    });
    const sourceUrl = `${expectedListUrl(mocks.locale)}?${params}`;
    const navigation = installNavigation(sourceUrl);

    returnToInvestments();

    expect(mocks.back).toHaveBeenCalledOnce();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(navigation.entries()[0].url).toBe(sourceUrl);
  });

  it("replaces a direct Detail entry with the localized Investments List", () => {
    installNavigation(null, { index: 0 });

    returnToInvestments();

    expect(mocks.replace.mock.calls).toEqual([[APP_PATH.MONEY_INVESTMENTS]]);
    expect(mocks.back).not.toHaveBeenCalled();
  });

  it("uses the list fallback after refreshing Detail", () => {
    installNavigation(expectedListUrl(mocks.locale), {
      currentKey: "investment-detail-entry",
      activationKey: "investment-detail-entry",
    });

    returnToInvestments();

    expect(mocks.replace.mock.calls).toEqual([[APP_PATH.MONEY_INVESTMENTS]]);
    expect(mocks.back).not.toHaveBeenCalled();
  });

  it("falls back when Navigation API activation evidence is missing", () => {
    installNavigation(expectedListUrl(mocks.locale), { activationKey: null });

    returnToInvestments();

    expect(mocks.replace.mock.calls).toEqual([[APP_PATH.MONEY_INVESTMENTS]]);
    expect(mocks.back).not.toHaveBeenCalled();
  });

  it("does not return to a cross-module or external predecessor", () => {
    installNavigation(
      `${window.location.origin}/${mocks.locale}${APP_PATH.MONEY_ACCOUNTS}`,
    );
    returnToInvestments();
    expect(mocks.replace.mock.calls).toEqual([[APP_PATH.MONEY_INVESTMENTS]]);

    vi.clearAllMocks();
    installNavigation("https://example.com/", { sameDocument: false });
    returnToInvestments();
    expect(mocks.replace.mock.calls).toEqual([[APP_PATH.MONEY_INVESTMENTS]]);
    expect(mocks.back).not.toHaveBeenCalled();
  });

  it.each(locales)(
    "preserves the %s locale for proof and fallback",
    (locale) => {
      mocks.locale = locale;
      installNavigation(expectedListUrl(locale));

      returnToInvestments();

      expect(mocks.back).toHaveBeenCalledOnce();
      vi.clearAllMocks();
      installNavigation(null, { index: 0 });
      returnToInvestments();
      expect(mocks.replace.mock.calls).toEqual([[APP_PATH.MONEY_INVESTMENTS]]);
    },
  );
});
