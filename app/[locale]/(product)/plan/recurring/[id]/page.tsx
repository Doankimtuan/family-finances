import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { HOUSEHOLD_TIMEZONE } from "@/modules/tenancy/application/tenancy-constants";
import { getRecurring, RecurringDirection } from "@/modules/plan/application";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Amount, AmountSize, AmountTone } from "@/shared/patterns/amount";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { Card } from "@/shared/patterns/card";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { PLAN_ICONS } from "@/shared/ui/icon-registry";
import { PlanOfflineBanner } from "../../plan-offline-banner";
import { PlanPrivacyToggle } from "../../plan-privacy-toggle";
import { PlanUnavailable } from "../../plan-unavailable";
import { RecurringDetailForm } from "./recurring-detail-form";
import {
  isWeeklyRecurring,
  weekdayKeyForUtcDay,
} from "../recurring-presentations";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

function formatScheduleDate(date: string, locale: string): string {
  return formatDate(new Date(`${date}T00:00:00Z`), locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: HOUSEHOLD_TIMEZONE.VIETNAM,
  });
}

/**
 * plan.recurring-detail — edit schedule (ST-E05-003).
 */
export default async function PlanRecurringDetailPage({ params }: Props) {
  const { locale: rawLocale, id } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  const membership = await resolveActiveMembership(user.id);
  if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });

  const [t, rule] = await Promise.all([
    getTranslations("plan.recurring"),
    getRecurring(id),
  ]);

  if (!rule) {
    return (
      <Page
        testId="plan-recurring-detail"
        topBar={
          <TopAppBar
            variant={TopAppBarVariant.DETAIL}
            title={t("notFound")}
            backHref={APP_PATH.PLAN_RECURRING}
            backLabel={t("backToList")}
          />
        }
      >
        <PlanUnavailable
          title={t("notFound")}
          description={t("detailSubtitle")}
          actionHref={APP_PATH.PLAN_RECURRING}
          actionLabel={t("backToList")}
          icon={
            <AppIcon icon={PLAN_ICONS.recurring} size={AppIconSize.DISPLAY} />
          }
        />
      </Page>
    );
  }

  const weekdayKey =
    rule.dayOfWeek == null ? null : weekdayKeyForUtcDay(rule.dayOfWeek);
  const cadenceDetail = isWeeklyRecurring(rule.frequency)
    ? weekdayKey
      ? t("cadenceWeeklyOn", { day: t(`weekdayNames.${weekdayKey}`) })
      : t(`frequency.${rule.frequency}`)
    : rule.dayOfMonth
      ? t("cadenceMonthlyOn", { day: rule.dayOfMonth })
      : t(`frequency.${rule.frequency}`);

  return (
    <Page
      testId="plan-recurring-detail"
      topBar={
        <TopAppBar
          variant={TopAppBarVariant.DETAIL}
          title={rule.name}
          subtitle={t("detailSubtitle")}
          backHref={APP_PATH.PLAN_RECURRING}
          backLabel={t("backToList")}
        />
      }
    >
      <PlanOfflineBanner />

      <Card
        tone="hero"
        className="gap-(--space-4) p-(--space-5)"
        data-testid="plan-recurring-hero"
      >
        <div className="flex items-start justify-between gap-(--space-3)">
          <Amount
            label={t("plannedAmountLabel")}
            amountLabel={formatCurrency(rule.amount, rule.currency, locale, {
              maximumFractionDigits: 0,
            })}
            tone={
              rule.direction === RecurringDirection.INCOME
                ? AmountTone.CREDIT
                : AmountTone.DEBIT
            }
            kind={FinancialNumberKind.INTENTION}
            size={AmountSize.LG}
            labelClassName="text-hero-muted"
            amountClassName="text-hero-fg"
          />
          <PlanPrivacyToggle testId="plan-recurring-privacy-toggle" />
        </div>
        <div className="flex flex-wrap items-center gap-(--space-2)">
          <StatusBadge
            tone={
              rule.isActive ? StatusBadgeTone.POSITIVE : StatusBadgeTone.NEUTRAL
            }
          >
            {rule.isActive ? t("active") : t("inactive")}
          </StatusBadge>
          <Text size="sm" className="text-pretty text-hero-muted">
            {t(`direction.${rule.direction}`)} · {cadenceDetail}
          </Text>
        </div>
        <Text size="sm" className="text-pretty text-hero-muted">
          {rule.nextRunDate
            ? t("nextRun", {
                date: formatScheduleDate(rule.nextRunDate, locale),
              })
            : t("nextRunUnset")}
        </Text>
      </Card>

      <Text size="sm" tone="muted" className="text-pretty">
        {t("incomeModeLabel", {
          mode: t(`incomeModes.${rule.incomeAllocateMode}`),
        })}
      </Text>

      <RecurringDetailForm
        ruleId={rule.id}
        name={rule.name}
        direction={rule.direction}
        amount={rule.amount}
        frequency={rule.frequency}
        dayOfMonth={rule.dayOfMonth}
        dayOfWeek={rule.dayOfWeek}
        startDate={rule.startDate}
        nextRunDate={rule.nextRunDate}
        isActive={rule.isActive}
      />
    </Page>
  );
}
