"use client";

import { useLocale } from "next-intl";
import { getPathname, useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  TopAppBar,
  TopAppBarVariant,
  type TopAppBarProps,
} from "@/shared/patterns/top-app-bar";

// The installed DOM types include history entries but not Window.navigation yet.
type WindowWithNavigation = Window & {
  navigation?: {
    currentEntry: { index: number; key: string } | null;
    activation?: { entry: { key: string } } | null;
    entries(): NavigationHistoryEntry[];
  };
};

export function useSavingsReturn() {
  const router = useRouter();
  const locale = useLocale();

  return () => {
    const navigation = (window as WindowWithNavigation).navigation;
    const previous = navigation?.currentEntry
      ? navigation.entries()[navigation.currentEntry.index - 1]
      : undefined;
    const destination = new URL(
      getPathname({ href: APP_PATH.MONEY_SAVINGS, locale }),
      window.location.href,
    );
    const previousUrl = previous?.url ? new URL(previous.url) : null;

    // Reloads can retain sameDocument entries; require a later in-app entry.
    if (
      navigation?.activation &&
      navigation.currentEntry?.key !== navigation.activation.entry.key &&
      previous?.sameDocument &&
      previousUrl?.origin === destination.origin &&
      previousUrl.pathname === destination.pathname
    ) {
      router.back();
    } else {
      router.replace(APP_PATH.MONEY_SAVINGS);
    }
  };
}

export function CreateSavingTopAppBar(
  props: Pick<TopAppBarProps, "title" | "subtitle">,
) {
  const onBack = useSavingsReturn();
  return (
    <TopAppBar {...props} variant={TopAppBarVariant.DETAIL} onBack={onBack} />
  );
}
