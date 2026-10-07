"use client";

import type { MouseEvent, ReactNode } from "react";
import { useLocale } from "next-intl";
import { Link, getPathname, useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { TopAppBar, type TopAppBarProps } from "@/shared/patterns/top-app-bar";

type TransactionHistoryEntry = Pick<
  NavigationHistoryEntry,
  "key" | "sameDocument" | "url"
>;

type WindowWithNavigation = Window & {
  navigation?: {
    activation?: { entry: Pick<NavigationHistoryEntry, "key"> } | null;
    currentEntry: { index: number; key: string } | null;
    entries(): TransactionHistoryEntry[];
  };
};

export function useTransactionsReturn() {
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
      router.replace(APP_PATH.MONEY_TRANSACTIONS);
      return;
    }

    const expectedList = new URL(
      getPathname({ href: APP_PATH.MONEY_TRANSACTIONS, locale }),
      window.location.href,
    );
    const previousUrl = new URL(previous.url);

    if (
      previousUrl.origin !== expectedList.origin ||
      previousUrl.pathname !== expectedList.pathname
    ) {
      router.replace(APP_PATH.MONEY_TRANSACTIONS);
      return;
    }

    router.back();
  };
}

type TransactionsReturnTopAppBarProps = Omit<
  TopAppBarProps,
  "backHref" | "onBack"
>;

export function TransactionsReturnTopAppBar(
  props: TransactionsReturnTopAppBarProps,
) {
  const onBack = useTransactionsReturn();
  return <TopAppBar {...props} onBack={onBack} />;
}

export function TransactionsReturnLink({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const returnToTransactions = useTransactionsReturn();

  return (
    <Link
      href={APP_PATH.MONEY_TRANSACTIONS}
      className={className}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        event.preventDefault();
        returnToTransactions();
      }}
    >
      {children}
    </Link>
  );
}
