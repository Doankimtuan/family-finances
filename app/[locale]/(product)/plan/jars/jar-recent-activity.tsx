import { getTranslations } from "next-intl/server";
import { listTransactionEvents } from "@/modules/ledger/application";
import { TransactionFilterType } from "@/modules/ledger/application/ledger-constants";
import { TransactionActivityKind } from "@/modules/ledger/application/transaction-activity";
import { PLAN_JAR_RECENT_ACTIVITY_LIMIT } from "@/modules/plan/application/plan-constants";
import { TRANSACTION_JAR_QUERY_PARAM } from "@/modules/ledger/application/transaction-constants";
import { Link } from "@/i18n/navigation";
import { Card } from "@/shared/patterns/card";
import { Heading } from "@/shared/ui/heading";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS, categoryVisualFor } from "@/shared/ui/icon-registry";
import {
  APP_PATH,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import { HOUSEHOLD_TIMEZONE } from "@/modules/tenancy/application/tenancy-constants";
import {
  CatalogGroup,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { TransactionRow } from "@/shared/patterns/transaction-row";
import { Text } from "@/shared/ui/text";

/** Read-only ledger context; Jar intention never creates money movement. */
export async function JarRecentActivity({
  jarId,
  locale,
}: {
  jarId: string;
  locale: string;
}) {
  const [t, tCatalog, result] = await Promise.all([
    getTranslations("plan.jars"),
    getTranslations("catalog"),
    listTransactionEvents({
      type: TransactionFilterType.ALL,
      jarIds: [jarId],
      limit: PLAN_JAR_RECENT_ACTIVITY_LIMIT,
    }),
  ]);
  return (
    <Card
      tone="elevated"
      className="gap-(--space-2) p-(--space-4)"
      data-testid="jar-recent-activity"
    >
      <div className="flex items-center justify-between gap-(--space-2)">
        <Heading level={2} className="text-sm">
          {t("recentActivityTitle")}
        </Heading>
        <Link
          href={`${APP_PATH.MONEY_TRANSACTIONS}?${TRANSACTION_JAR_QUERY_PARAM}=${encodeURIComponent(jarId)}`}
          className="inline-flex min-h-11 items-center gap-(--space-1) text-xs font-medium text-primary"
        >
          {t("detailViewAll")}
          <AppIcon icon={ACTION_ICONS.forward} size="xs" />
        </Link>
      </div>
      {!result || result.activities.length === 0 ? (
        <Text size="sm" tone="secondary">
          {t(result ? "recentActivityEmpty" : "recentActivityUnavailable")}
        </Text>
      ) : (
        <ul>
          {result.activities.map((activity) => {
            const visual = categoryVisualFor({
              categoryId: activity.categoryId,
              categoryName: activity.categoryName,
            });
            const accountNames = [
              activity.sourceAccount?.name,
              activity.destinationAccount?.name,
            ]
              .filter((name): name is string => Boolean(name))
              .map((name) =>
                localizeCatalogName(tCatalog, CatalogGroup.ACCOUNTS, name),
              );
            const categoryName = localizeCatalogName(
              tCatalog,
              CatalogGroup.TAGS,
              activity.categoryName,
            );
            const date = formatDate(
              new Date(`${activity.effectiveDate}T00:00:00Z`),
              locale,
              {
                day: "numeric",
                month: "short",
                timeZone: HOUSEHOLD_TIMEZONE.VIETNAM,
              },
            );
            return (
              <li key={activity.id}>
                <TransactionRow
                  href={moneyTransactionPath(
                    activity.relatedTransactionIds[0] ?? activity.id,
                  )}
                  title={
                    activity.note || categoryName || t("recentActivityFallback")
                  }
                  subtitle={[date, categoryName, accountNames.join(" → ")]
                    .filter(Boolean)
                    .join(" · ")}
                  amountLabel={`${activity.sign}${formatCurrency(activity.amount, activity.currency, locale, { maximumFractionDigits: 0 })}`}
                  icon={visual.icon}
                  iconTone={visual.tone}
                  className="px-0 py-(--space-3)"
                  tone={activity.tone}
                  type={
                    activity.kind === TransactionActivityKind.TRANSFER
                      ? TransactionActivityKind.TRANSFER
                      : undefined
                  }
                  showRail={false}
                />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
