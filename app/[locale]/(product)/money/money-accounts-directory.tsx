"use client";

import { useEffect } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { SHELL_SCROLL_REGION_SLOT } from "@/shared/patterns/shell-scroll-region";
import {
  getAccountsScrollPosition,
  rememberAccountsScrollPosition,
  type WindowWithAccountsNavigation,
} from "./accounts/accounts-navigation-scroll";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Button } from "@/shared/ui/button";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { MoneyOfflineBanner } from "./money-offline-banner";
import {
  MoneyAccountsScan,
  type MoneyAccountsScanLabels,
  type MoneyHubAccountGroup,
  type MoneyHubCardRow,
} from "./money-accounts-scan";

export type MoneyAccountsDirectoryLabels = Omit<
  MoneyAccountsScanLabels,
  "totalBalanceLabel" | "viewAccounts" | "showAllAccounts" | "showFewerAccounts"
> & {
  pageTitle: string;
  pageSubtitle: string;
  backToMoney: string;
  addAccount: string;
  ownedBalanceLabel: string;
  addCreditCard: string;
};

type Props = {
  labels: MoneyAccountsDirectoryLabels;
  accounts: MoneyHubAccountGroup[];
  creditCards: MoneyHubCardRow[];
  accountsUnavailable: boolean;
  creditCardsUnavailable: boolean;
  ownedBalanceValue: string | null;
  ownedBalanceUnavailable: string;
};

/** Full Money account inventory with links to the existing create commands. */
export function MoneyAccountsDirectory({
  labels,
  accounts,
  creditCards,
  accountsUnavailable,
  creditCardsUnavailable,
  ownedBalanceValue,
  ownedBalanceUnavailable,
}: Props) {
  const router = useRouter();
  const { online } = useOnlineStatusClient();

  useEffect(() => {
    const navigation = (window as WindowWithAccountsNavigation).navigation;
    const entryKey = navigation?.currentEntry?.key;
    const scrollRegion = document.querySelector<HTMLElement>(
      `[data-slot="${SHELL_SCROLL_REGION_SLOT}"]`,
    );
    if (!entryKey || !scrollRegion) return;

    const savedPosition = getAccountsScrollPosition(entryKey);
    const rememberPosition = () => {
      if (navigation?.currentEntry?.key !== entryKey) return;
      rememberAccountsScrollPosition(entryKey, {
        left: scrollRegion.scrollLeft,
        top: scrollRegion.scrollTop,
      });
    };

    rememberPosition();
    scrollRegion.addEventListener("scroll", rememberPosition, {
      passive: true,
    });

    if (savedPosition) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          scrollRegion.scrollTo(savedPosition.left, savedPosition.top);
        }),
      );
    }

    return () => {
      rememberPosition();
      scrollRegion.removeEventListener("scroll", rememberPosition);
    };
  }, []);

  return (
    <Page
      testId="money-accounts-directory"
      contentClassName="gap-(--space-4)"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY}
          backLabel={labels.backToMoney}
          title={labels.pageTitle}
          subtitle={labels.pageSubtitle}
          trailing={
            <Button
              size="sm"
              leadingIcon={
                <AppIcon icon={ACTION_ICONS.add} size={AppIconSize.XS} />
              }
              onPress={() => router.push(APP_PATH.MONEY_ACCOUNTS_NEW)}
              isDisabled={!online}
              data-testid="money-create-account"
              className="min-h-11 shrink-0 px-(--space-3)"
            >
              {labels.addAccount}
            </Button>
          }
        />
      }
    >
      <MoneyOfflineBanner />
      <MoneyAccountsScan
        labels={{
          ...labels,
          ownedBalanceValue,
          ownedBalanceUnavailable,
        }}
        accounts={accounts}
        allAccounts={accounts}
        initiallyExpanded
        creditCards={creditCards}
        accountsUnavailable={accountsUnavailable}
        creditCardsUnavailable={creditCardsUnavailable}
        emptyAction={
          <Link
            href={APP_PATH.MONEY_ACCOUNTS_NEW}
            className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-primary px-(--space-4) text-sm font-semibold text-primary-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {labels.addAccount}
          </Link>
        }
        sectionAction={null}
        showManagementToggle={false}
        showGroupSections
      />
    </Page>
  );
}
