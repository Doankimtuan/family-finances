import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

const mocks = vi.hoisted(() => ({
  locale: "en",
  back: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
}));
vi.mock("next-intl", () => ({ useLocale: () => mocks.locale }));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => mocks,
  getPathname: ({ href, locale }: { href: string; locale: string }) =>
    `/${locale}${href}`,
}));
vi.mock("@/shared/patterns/top-app-bar", () => ({
  TopAppBar: vi.fn(),
  TopAppBarVariant: { DETAIL: "detail" },
}));

import { useSavingsReturn } from "@/app/[locale]/(product)/money/savings/new/create-saving-navigation";

function previousEntry(url: string | null, sameDocument = true) {
  const navigation = {
    currentEntry: { index: 1, key: "create-entry" },
    activation: { entry: { key: "document-entry" } },
    entries: () => [{ url, sameDocument }, { url: window.location.href }],
  };
  vi.stubGlobal("navigation", navigation);
  return navigation;
}

function leaveCreate() {
  const { result } = renderHook(() => useSavingsReturn());
  act(() => result.current());
}

function expectFallback() {
  expect(mocks.replace).toHaveBeenCalledExactlyOnceWith(APP_PATH.MONEY_SAVINGS);
  expect(mocks.back).not.toHaveBeenCalled();
  expect(mocks.push).not.toHaveBeenCalled();
}

describe("Savings Create safe return", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.locale = "en";
  });
  afterEach(() => vi.unstubAllGlobals());

  it.each(["en", "vi"])(
    "restores the immediately preceding %s Savings entry",
    (locale) => {
      mocks.locale = locale;
      previousEntry(
        `${window.location.origin}/${locale}${APP_PATH.MONEY_SAVINGS}?filter=active`,
      );
      leaveCreate();
      expect(mocks.back).toHaveBeenCalledTimes(1);
      expect(mocks.replace).not.toHaveBeenCalled();
      expect(mocks.push).not.toHaveBeenCalled();
    },
  );

  it.each(["en", "vi"])(
    "uses the localized router's replace fallback on %s direct entry",
    (locale) => {
      mocks.locale = locale;
      vi.stubGlobal("navigation", {
        currentEntry: { index: 0 },
        entries: () => [],
      });
      leaveCreate();
      expectFallback();
    },
  );

  it("does not return to an external origin even with the same route path", () => {
    previousEntry(`https://external.example/en${APP_PATH.MONEY_SAVINGS}`);
    leaveCreate();
    expectFallback();
  });

  it("does not return to a different product route", () => {
    previousEntry(`${window.location.origin}/en${APP_PATH.MONEY}`);
    leaveCreate();
    expectFallback();
  });

  it("does not return to a Savings entry in another locale", () => {
    previousEntry(`${window.location.origin}/vi${APP_PATH.MONEY_SAVINGS}`);
    leaveCreate();
    expectFallback();
  });

  it("replaces Create after a refresh or cross-document entry", () => {
    previousEntry(
      `${window.location.origin}/en${APP_PATH.MONEY_SAVINGS}`,
      false,
    );
    leaveCreate();
    expectFallback();
  });

  it("falls back without the Navigation API", () => {
    vi.stubGlobal("navigation", undefined);
    leaveCreate();
    expectFallback();
  });

  it("replaces a refreshed Create even when the prior entry is same-document", () => {
    const navigation = previousEntry(
      `${window.location.origin}/en${APP_PATH.MONEY_SAVINGS}`,
    );
    navigation.activation.entry.key = "create-entry";
    leaveCreate();
    expectFallback();
  });

  it("falls back when document activation evidence is unavailable", () => {
    vi.stubGlobal("navigation", {
      ...previousEntry(`${window.location.origin}/en${APP_PATH.MONEY_SAVINGS}`),
      activation: undefined,
    });
    leaveCreate();
    expectFallback();
  });

  it("falls back when the previous URL is unavailable", () => {
    previousEntry(null);
    leaveCreate();
    expectFallback();
  });
});
