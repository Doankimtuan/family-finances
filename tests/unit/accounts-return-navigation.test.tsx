import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  APP_PATH,
  moneyAccountPath,
} from "@/modules/tenancy/application/app-path";
import { locales } from "@/i18n/routing";
import {
  getAccountsScrollPosition,
  rememberAccountsScrollPosition,
} from "@/app/[locale]/(product)/money/accounts/accounts-navigation-scroll";

const mocks = vi.hoisted(() => ({
  locale: "en",
  back: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next-intl", () => ({ useLocale: () => mocks.locale }));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => mocks,
  getPathname: ({ href, locale }: { href: string; locale: string }) =>
    `/${locale}${href}`,
}));
vi.mock("@/shared/patterns/top-app-bar", () => ({
  TopAppBar: vi.fn(),
}));

import { useAccountsReturn } from "@/app/[locale]/(product)/money/accounts/accounts-return-navigation";

type NavigationEntry = {
  key?: string;
  url?: string | null;
  sameDocument?: boolean;
};
type NavigationState = {
  currentEntry: { index: number; key: string } | null;
  activation?: { entry: { key: string } } | null;
  entries: () => NavigationEntry[];
};

const createAndDetailRoutes = [
  APP_PATH.MONEY_ACCOUNTS_NEW,
  APP_PATH.MONEY_ACCOUNTS_NEW_CREDIT,
  moneyAccountPath("account-test-id"),
  moneyAccountPath("card-test-id"),
] as const;

function installHistory(
  previousUrl: string | null,
  options: {
    sameDocument?: boolean;
    activationKey?: string | null;
    index?: number;
  } = {},
) {
  const current = { index: options.index ?? 1, key: "current-entry" };
  const navigation: NavigationState = {
    currentEntry: current,
    activation:
      options.activationKey === null
        ? undefined
        : { entry: { key: options.activationKey ?? "document-entry" } },
    entries: () => [
      {
        key: "previous-entry",
        url: previousUrl,
        sameDocument: options.sameDocument ?? true,
      },
      { key: current.key, sameDocument: true },
    ],
    addEventListener: vi.fn(),
  };
  vi.stubGlobal("navigation", navigation);
  return navigation;
}

function returnToAccounts() {
  const { result } = renderHook(() => useAccountsReturn());
  act(() => result.current());
}

function expectLocalizedFallback() {
  expect(mocks.replace).toHaveBeenCalledExactlyOnceWith(
    APP_PATH.MONEY_ACCOUNTS,
  );
  expect(mocks.back).not.toHaveBeenCalled();
}

describe("Accounts safe return", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.locale = locales[0];
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each(
    locales.flatMap((locale) =>
      createAndDetailRoutes.map((route) => ({ locale, route })),
    ),
  )(
    "restores the preceding Accounts entry from $route in $locale",
    ({ locale }) => {
      mocks.locale = locale;
      installHistory(
        `${window.location.origin}/${locale}${APP_PATH.MONEY_ACCOUNTS}?query-state=preserved`,
      );
      returnToAccounts();

      expect(mocks.back).toHaveBeenCalledTimes(1);
      expect(mocks.replace).not.toHaveBeenCalled();
    },
  );

  it.each(
    locales.flatMap((locale) =>
      createAndDetailRoutes.map((route) => ({ locale, route })),
    ),
  )(
    "replaces direct $route entry with localized Accounts in $locale",
    ({ locale }) => {
      mocks.locale = locale;
      installHistory(null, { index: 0 });
      returnToAccounts();
      expectLocalizedFallback();
    },
  );

  it("does not return to a previous external origin", () => {
    installHistory(
      `https://external.example/${locales[0]}${APP_PATH.MONEY_ACCOUNTS}`,
    );
    returnToAccounts();
    expectLocalizedFallback();
  });

  it("falls back when the previous entry is another product route", () => {
    installHistory(`${window.location.origin}/${locales[0]}${APP_PATH.MONEY}`);
    returnToAccounts();
    expectLocalizedFallback();
  });

  it("falls back when the previous Accounts entry uses another locale", () => {
    const otherLocale = locales.find((locale) => locale !== mocks.locale);
    if (!otherLocale) throw new Error("Expected a second configured locale");
    installHistory(
      `${window.location.origin}/${otherLocale}${APP_PATH.MONEY_ACCOUNTS}`,
    );
    returnToAccounts();
    expectLocalizedFallback();
  });

  it("rejects a cross-document previous entry", () => {
    installHistory(
      `${window.location.origin}/${locales[0]}${APP_PATH.MONEY_ACCOUNTS}`,
      { sameDocument: false },
    );
    returnToAccounts();
    expectLocalizedFallback();
  });

  it("rejects refreshed Create or Detail when current entry activated the document", () => {
    installHistory(
      `${window.location.origin}/${locales[0]}${APP_PATH.MONEY_ACCOUNTS}`,
      { activationKey: "current-entry" },
    );
    returnToAccounts();
    expectLocalizedFallback();
  });

  it("falls back when activation evidence is unavailable", () => {
    installHistory(
      `${window.location.origin}/${locales[0]}${APP_PATH.MONEY_ACCOUNTS}`,
      { activationKey: null },
    );
    returnToAccounts();
    expectLocalizedFallback();
  });

  it("falls back when the Navigation API is unavailable", () => {
    vi.stubGlobal("navigation", undefined);
    returnToAccounts();
    expectLocalizedFallback();
  });
});

describe("Accounts history scroll memory", () => {
  it("keeps a scroll position tied to its Navigation API entry", () => {
    const position = { left: 0, top: 446 };

    rememberAccountsScrollPosition("accounts-entry-scroll-test", position);

    expect(getAccountsScrollPosition("accounts-entry-scroll-test")).toEqual(
      position,
    );
    expect(getAccountsScrollPosition("another-accounts-entry")).toBeUndefined();
  });
});
