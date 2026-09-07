import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getRecurring, RecurringDirection } from "@/modules/plan/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Amount, AmountSize, AmountTone } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { PLAN_ICONS } from "@/shared/ui/icon-registry";
import { PlanOfflineBanner } from "../../plan-offline-banner";
import { PlanPrivacyToggle } from "../../plan-privacy-toggle";
import { PlanUnavailable } from "../../plan-unavailable";
import { RecurringDetailForm } from "./recurring-detail-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

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

      <Card tone="hero" className="gap-(--space-4) p-(--space-5)">
        <div className="flex items-start justify-between gap-(--space-3)">
          <Amount
            label={t(`direction.${rule.direction}`)}
            amountLabel={formatCurrency(rule.amount, rule.currency, locale, {
              maximumFractionDigits: 0,
            })}
            tone={
              rule.direction === RecurringDirection.INCOME
                ? AmountTone.CREDIT
                : AmountTone.DEBIT
            }
            size={AmountSize.LG}
            labelClassName="text-hero-muted"
            amountClassName="text-hero-fg"
          />
          <PlanPrivacyToggle testId="plan-recurring-privacy-toggle" />
        </div>
        <Text size="sm" className="text-pretty text-hero-muted">
          {t("incomeModeLabel", {
            mode: t(`incomeModes.${rule.incomeAllocateMode}`),
          })}
        </Text>
      </Card>

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
