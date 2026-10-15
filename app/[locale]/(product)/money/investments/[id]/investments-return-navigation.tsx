"use client";

import { useLocale } from "next-intl";
import { getPathname, useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { TopAppBar, type TopAppBarProps } from "@/shared/patterns/top-app-bar";

type InvestmentHistoryEntry = Pick<
  NavigationHistoryEntry,
  "key" | "sameDocument" | "url"
>;

type WindowWithNavigation = Window & {
  navigation?: {
    activation?: { entry: Pick<NavigationHistoryEntry, "key"> } | null;
    currentEntry: { index: number; key: string } | null;
    entries(): InvestmentHistoryEntry[];
  };
};

export function useInvestmentsReturn() {
  const router = useRouter();
  const locale = useLocale();

  return () => {
    const navigation = (window as WindowWithNavigation).navigation;
    const current = navigation?.currentEntry;
    const previous =
      current && current.index > 0
        ? navigation.entries()[current.index - 1]
        : undefined;

    if (
      !navigation?.activation ||
      !current ||
      current.key === navigation.activation.entry.key ||
      !previous?.sameDocument ||
      !previous.url
    ) {
      router.replace(APP_PATH.MONEY_INVESTMENTS);
      return;
    }

    const expectedList = new URL(
      getPathname({ href: APP_PATH.MONEY_INVESTMENTS, locale }),
      window.location.href,
    );
    const previousUrl = new URL(previous.url);

    if (
      previousUrl.origin !== expectedList.origin ||
      previousUrl.pathname !== expectedList.pathname
    ) {
      router.replace(APP_PATH.MONEY_INVESTMENTS);
      return;
    }

    router.back();
  };
}

type InvestmentsReturnTopAppBarProps = Omit<
  TopAppBarProps,
  "backHref" | "onBack"
>;

export function InvestmentsReturnTopAppBar(
  props: InvestmentsReturnTopAppBarProps,
) {
  const onBack = useInvestmentsReturn();
  return <TopAppBar {...props} onBack={onBack} />;
}
