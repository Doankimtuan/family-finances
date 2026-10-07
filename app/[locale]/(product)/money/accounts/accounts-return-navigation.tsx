"use client";

import { useLocale } from "next-intl";
import { getPathname, useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { ACCOUNTS_SCROLL_RESTORE_MAX_FRAMES } from "@/modules/ledger/application/accounts-navigation-constants";
import { SHELL_SCROLL_REGION_SLOT } from "@/shared/patterns/shell-scroll-region";
import { TopAppBar, type TopAppBarProps } from "@/shared/patterns/top-app-bar";
import {
  getAccountsScrollPosition,
  type WindowWithAccountsNavigation,
} from "./accounts-navigation-scroll";

function restoreAccountsScrollAfterHistoryReturn(
  navigation: NonNullable<WindowWithAccountsNavigation["navigation"]>,
  entryKey: string,
  position: { left: number; top: number },
) {
  let frames = 0;
  const restoreWhenAccountsIsReady = () => {
    frames += 1;
    const isExpectedEntry = navigation.currentEntry?.key === entryKey;
    const accountsPage = document.querySelector(
      '[data-testid="money-accounts-directory"]',
    );
    const scrollRegion = document.querySelector<HTMLElement>(
      `[data-slot="${SHELL_SCROLL_REGION_SLOT}"]`,
    );

    if (isExpectedEntry && accountsPage && scrollRegion) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (navigation.currentEntry?.key === entryKey) {
            scrollRegion.scrollTo(position.left, position.top);
          }
        }),
      );
      return;
    }

    if (frames < ACCOUNTS_SCROLL_RESTORE_MAX_FRAMES) {
      requestAnimationFrame(restoreWhenAccountsIsReady);
    }
  };

  requestAnimationFrame(restoreWhenAccountsIsReady);
}

export function useAccountsReturn() {
  const router = useRouter();
  const locale = useLocale();

  return () => {
    const navigation = (window as WindowWithAccountsNavigation).navigation;
    const current = navigation?.currentEntry;
    const entries = navigation?.entries();
    const previous =
      current && current.index > 0 ? entries?.[current.index - 1] : undefined;
    const previousKey = previous?.key;
    const destination = new URL(
      getPathname({ href: APP_PATH.MONEY_ACCOUNTS, locale }),
      window.location.href,
    );
    const previousUrl = previous?.url ? new URL(previous.url) : null;

    if (
      navigation?.activation &&
      current?.key !== navigation.activation.entry.key &&
      previous?.sameDocument &&
      previousKey &&
      previousUrl?.origin === destination.origin &&
      previousUrl.pathname === destination.pathname
    ) {
      const savedPosition = getAccountsScrollPosition(previousKey);
      if (savedPosition) {
        navigation.addEventListener(
          "currententrychange",
          () =>
            restoreAccountsScrollAfterHistoryReturn(
              navigation,
              previousKey,
              savedPosition,
            ),
          { once: true },
        );
      }
      router.back();
      return;
    }

    router.replace(APP_PATH.MONEY_ACCOUNTS);
  };
}

type AccountsReturnTopAppBarProps = Omit<TopAppBarProps, "backHref" | "onBack">;

export function AccountsReturnTopAppBar(props: AccountsReturnTopAppBarProps) {
  const onBack = useAccountsReturn();

  return <TopAppBar {...props} onBack={onBack} />;
}
