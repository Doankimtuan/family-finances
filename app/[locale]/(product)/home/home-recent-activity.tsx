import { getTranslations } from "next-intl/server";
import {
  listTransactionEvents,
  TransactionActivityKind,
  TransactionFilterType,
} from "@/modules/ledger/application";
import type { TransactionActivity } from "@/modules/ledger/application";
import {
  HOME_RECENT_ACTIVITY_LIMIT,
  HOME_TEST_ID,
  HOME_CURRENCY_FRACTION_DIGITS,
} from "@/modules/home/application/home-constants";
import {
  moneyTransactionPath,
  APP_PATH,
} from "@/modules/tenancy/application/app-path";
import { formatCurrency, formatTime } from "@/shared/i18n/formatters";
import { HOUSEHOLD_TIMEZONE } from "@/modules/tenancy/application/tenancy-constants";
import {
  dateGroupLabel,
  activityIconKey,
  activityIconTone,
  activitySubtitle,
  activityTitle,
  ACTIVITY_TONE_TO_AMOUNT_TONE,
} from "../money/transactions/transactions-list-presentations";
import { TransactionRow } from "@/shared/patterns";
import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { AppIcon, IconContainer, financeIconFor } from "@/shared/ui";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { Section } from "@/shared/patterns/section";
import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";

export async function HomeRecentActivity({ locale }: { locale: string }) {
  const [result, tHome, tTransactions, tCatalog] = await Promise.all([
    listTransactionEvents({
      type: TransactionFilterType.ALL,
      limit: HOME_RECENT_ACTIVITY_LIMIT,
    }),
    getTranslations("home"),
    getTranslations("money.transactionsPage"),
    getTranslations("catalog"),
  ]);
  const labels: Record<TransactionActivityKind, string> = {
    [TransactionActivityKind.INCOME]: tTransactions("activityKind.income"),
    [TransactionActivityKind.EXPENSE]: tTransactions("activityKind.expense"),
    [TransactionActivityKind.TRANSFER]: tTransactions("activityKind.transfer"),
    [TransactionActivityKind.REFUND]: tTransactions("activityKind.refund"),
    [TransactionActivityKind.LIABILITY_PAYMENT]: tTransactions(
      "activityKind.liability_payment",
    ),
    [TransactionActivityKind.LOAN_INTEREST]: tTransactions(
      "activityKind.loan_interest",
    ),
    [TransactionActivityKind.DEBT_BORROWING]: tTransactions(
      "activityKind.debt_borrowing",
    ),
    [TransactionActivityKind.DEBT_LENDING]: tTransactions(
      "activityKind.debt_lending",
    ),
    [TransactionActivityKind.DEBT_RECEIPT]: tTransactions(
      "activityKind.debt_receipt",
    ),
    [TransactionActivityKind.SAVINGS]: tTransactions("activityKind.savings"),
    [TransactionActivityKind.INVESTMENT]: tTransactions(
      "activityKind.investment",
    ),
    [TransactionActivityKind.OTHER]: tTransactions("activityKind.other"),
  };

  return (
    <Section
      title={
        <Heading level={2} className="text-lg leading-snug">
          {tHome("recentActivity.title")}
        </Heading>
      }
      description={
        <Text size="xs" tone="muted" className="leading-relaxed">
          {tHome("recentActivity.hint")}
        </Text>
      }
      action={
        <Link
          href={APP_PATH.MONEY_TRANSACTIONS}
          prefetch={PRODUCT_LINK_PREFETCH}
          className="inline-flex items-center gap-(--space-1)"
        >
          {tHome("recentActivity.viewAll")}
          <AppIcon icon={ACTION_ICONS.forward} size="xs" />
        </Link>
      }
      testId={HOME_TEST_ID.RECENT_ACTIVITY}
      className="gap-(--space-4) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4)"
    >
      {result == null ? (
        <Text size="sm" tone="secondary">
          {tHome("recentActivity.unavailable")}
        </Text>
      ) : result.activities.length === 0 ? (
        <Text size="sm" tone="secondary">
          {tHome("recentActivity.empty")}
        </Text>
      ) : (
        <ul className="m-0 list-none divide-y divide-border-subtle/70 p-0">
          {result.activities.map((activity) => (
            <HomeRecentActivityRow
              key={activity.id}
              activity={activity}
              labels={labels}
              tCatalog={tCatalog}
              locale={locale}
              dateLabels={{
                today: tTransactions("dates.today"),
                yesterday: tTransactions("dates.yesterday"),
              }}
            />
          ))}
        </ul>
      )}
    </Section>
  );
}

function HomeRecentActivityRow({
  activity,
  labels,
  tCatalog,
  locale,
  dateLabels,
}: {
  activity: TransactionActivity;
  labels: Record<TransactionActivityKind, string>;
  tCatalog: Parameters<typeof activityTitle>[2];
  locale: string;
  dateLabels: { today: string; yesterday: string };
}) {
  const title = activityTitle(activity, labels, tCatalog);
  const subtitle = [
    activitySubtitle(activity, title, labels, tCatalog),
    dateGroupLabel(activity.effectiveDate, locale, dateLabels),
  ]
    .filter(Boolean)
    .join(" · ");
  const time = formatTime(new Date(activity.representativeCreatedAt), locale, {
    timeZone: HOUSEHOLD_TIMEZONE.VIETNAM,
    hour12: false,
  });

  return (
    <li>
      <Link
        href={moneyTransactionPath(activity.relatedTransactionIds[0])}
        prefetch={PRODUCT_LINK_PREFETCH}
        className="block focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
      >
        <TransactionRow
          leading={
            <IconContainer tone={activityIconTone(activity)} size="md">
              <AppIcon
                icon={financeIconFor(activityIconKey(activity))}
                size="sm"
              />
            </IconContainer>
          }
          title={title}
          subtitle={subtitle}
          amountLabel={formatCurrency(
            activity.amount,
            activity.currency,
            locale,
            { maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS },
          )}
          amountMeta={time}
          currency=""
          tone={ACTIVITY_TONE_TO_AMOUNT_TONE[activity.tone]}
          className="border-b-0"
          divider="none"
        />
      </Link>
    </li>
  );
}
