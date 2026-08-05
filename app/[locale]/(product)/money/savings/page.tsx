import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneySavingsPath,
  moneySavingsNewPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  listSavings,
  SavingStatus,
  detectMaturedSavings,
  backfillLegacySavingsAccounts,
} from "@/modules/savings/application";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Amount } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { MoneyOfflineBanner } from "../money-offline-banner";

type Props = { params: Promise<{ locale: string }> };

/** money.savings — product list (ledger-funded). */
export default async function SavingsPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id))) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  // Phase 5/6: detect maturity + soft-migrate legacy on entry (BR-10 / strangler)
  await backfillLegacySavingsAccounts();
  await detectMaturedSavings();

  const [t, tMoney, tProducts, items] = await Promise.all([
    getTranslations("money.savingsPage"),
    getTranslations("money"),
    getTranslations("money.products"),
    listSavings(),
  ]);

  const loadFailed = items == null;
  const list = items ?? [];

  return (
    <div className="flex min-h-full flex-col" data-testid="money-savings">
      <TopAppBar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <Text size="sm" tone="secondary">
          {tProducts("notBankBalance")}
        </Text>
        <Link
          href={moneySavingsNewPath()}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="savings-add-open"
        >
          {t("add")}
        </Link>
        {loadFailed ? (
          <StatusAlert
            variant="danger"
            title={t("emptyTitle")}
            description={tProducts("errors.unknown")}
          />
        ) : list.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            className="flex-none py-(--space-4)"
          />
        ) : (
          <ul className="flex flex-col gap-(--space-2)">
            {list.map((item) => {
              const cycle = item.latestCycle;
              const principal = cycle?.principal ?? 0;
              const isDue =
                item.status === SavingStatus.MATURED ||
                (cycle != null &&
                  cycle.endDate <= new Date().toISOString().slice(0, 10));
              return (
                <li key={item.id}>
                  <Link
                    href={moneySavingsPath(item.id)}
                    className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <Card
                      className="gap-0 p-(--space-4)"
                      data-testid={`savings-row-${item.id}`}
                    >
                      <div className="flex items-start justify-between gap-(--space-3)">
                        <Text
                          size="sm"
                          className="font-medium text-text-primary"
                        >
                          {item.productName || item.providerName || "Saving"}
                        </Text>
                        {isDue ? (
                          <span className="shrink-0 rounded-md border border-accent/40 bg-accent/10 px-(--space-2) py-(--space-1) text-xs font-medium">
                            {t("maturityBadge")}
                          </span>
                        ) : (
                          <span className="shrink-0 text-xs text-text-secondary">
                            {t(`status.${item.status}`)}
                          </span>
                        )}
                      </div>
                      <Amount
                        className="mt-(--space-2)"
                        label={tProducts("principalLabel")}
                        amountLabel={formatCurrency(
                          principal,
                          DEFAULT_CURRENCY,
                          locale,
                          { maximumFractionDigits: 0 },
                        )}
                      />
                      {cycle ? (
                        <Text size="sm" tone="secondary" className="mt-(--space-1)">
                          {t("rateLabel", { rate: cycle.lockedRate })} ·{" "}
                          {cycle.endDate}
                        </Text>
                      ) : null}
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          href={APP_PATH.MONEY}
          className="text-sm font-medium text-accent"
          data-testid="savings-back-money"
        >
          {tMoney("backToMoney")}
        </Link>
      </div>
    </div>
  );
}
