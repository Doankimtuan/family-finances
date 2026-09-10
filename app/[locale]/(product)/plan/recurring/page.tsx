import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  planRecurringPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { HOUSEHOLD_TIMEZONE } from "@/modules/tenancy/application/tenancy-constants";
import {
  listRecurring,
  DEFAULT_CURRENCY,
  IncomeAllocateMode,
  type PlanRecurring,
} from "@/modules/plan/application";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { PLAN_ICONS } from "@/shared/ui/icon-registry";
import { PlanOfflineBanner } from "../plan-offline-banner";
import { PlanPrivacyToggle } from "../plan-privacy-toggle";
import { PlanSectionTitle } from "../plan-section-title";
import { PlanDisclosure } from "../plan-disclosure";
import { CreateRecurringForm } from "./create-recurring-form";
import { PlanRecurringRow } from "./plan-recurring-row";
import { partitionRecurringRules } from "./recurring-presentations";

type Props = { params: Promise<{ locale: string }> };

type RecurringTranslator = {
  (key: string, values?: Record<string, string | number>): string;
};

function formatNextRun(date: string | null, locale: string): string | null {
  if (!date) return null;
  return formatDate(new Date(`${date}T00:00:00Z`), locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: HOUSEHOLD_TIMEZONE.VIETNAM,
  });
}

function RecurringCollection({
  rules,
  t,
  currency,
  locale,
}: {
  rules: PlanRecurring[];
  t: RecurringTranslator;
  currency: string;
  locale: string;
}) {
  return (
    <Card tone="elevated" className="gap-0 overflow-hidden p-0">
      <ul className="divide-y divide-border-subtle/65 py-(--space-1)">
        {rules.map((rule) => {
          const nextRun = formatNextRun(rule.nextRunDate, locale);
          return (
            <li key={rule.id}>
              <PlanRecurringRow
                href={planRecurringPath(rule.id)}
                testId={`recurring-card-${rule.id}`}
                name={rule.name}
                cadenceLabel={`${t(`direction.${rule.direction}`)} · ${t(`frequency.${rule.frequency}`)}`}
                amountLabel={formatCurrency(rule.amount, currency, locale, {
                  maximumFractionDigits: 0,
                })}
                statusLabel={rule.isActive ? t("active") : t("inactive")}
                isActive={rule.isActive}
                direction={rule.direction}
                nextRun={nextRun ? t("nextRun", { date: nextRun }) : undefined}
              />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/**
 * plan.recurring — recurring intentions list (ST-E05-003).
 */
export default async function PlanRecurringPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  const membership = await resolveActiveMembership(user.id);
  if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });

  const [t, listed] = await Promise.all([
    getTranslations("plan.recurring"),
    listRecurring(),
  ]);

  const currency = listed?.currency ?? DEFAULT_CURRENCY;
  const rules = listed?.rules ?? [];
  const incomeMode = listed?.incomeAllocateMode ?? IncomeAllocateMode.SUGGEST;
  const { active, paused } = partitionRecurringRules(rules);

  return (
    <Page
      testId="plan-recurring"
      topBar={
        <TopAppBar
          variant={TopAppBarVariant.DETAIL}
          title={t("listTitle")}
          subtitle={t("listSubtitle")}
          backHref={APP_PATH.PLAN}
          backLabel={t("backToPlan")}
          trailing={
            <PlanPrivacyToggle testId="plan-recurring-list-privacy-toggle" />
          }
        />
      }
    >
      <PlanOfflineBanner />

      <Text size="sm" tone="secondary" className="text-pretty">
        {t("listContext")}
      </Text>
      <Text size="sm" tone="muted" className="text-pretty">
        {t("incomeModeLabel", { mode: t(`incomeModes.${incomeMode}`) })}
      </Text>

      {rules.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          icon={
            <AppIcon icon={PLAN_ICONS.recurring} size={AppIconSize.DISPLAY} />
          }
          className="flex-none py-(--space-4)"
        />
      ) : (
        <>
          <Section
            title={<PlanSectionTitle>{t("activeSection")}</PlanSectionTitle>}
            testId="plan-recurring-active"
          >
            {active.length === 0 ? (
              <Text size="sm" tone="secondary">
                {t("activeEmpty")}
              </Text>
            ) : (
              <RecurringCollection
                rules={active}
                t={t as RecurringTranslator}
                currency={currency}
                locale={locale}
              />
            )}
          </Section>
          <Section
            title={<PlanSectionTitle>{t("pausedSection")}</PlanSectionTitle>}
            testId="plan-recurring-paused"
          >
            {paused.length === 0 ? (
              <Text size="sm" tone="secondary">
                {t("pausedEmpty")}
              </Text>
            ) : (
              <PlanDisclosure
                showLabel={t("pausedShow", { count: paused.length })}
                hideLabel={t("pausedHide")}
                testId="plan-recurring-paused-toggle"
              >
                <RecurringCollection
                  rules={paused}
                  t={t as RecurringTranslator}
                  currency={currency}
                  locale={locale}
                />
              </PlanDisclosure>
            )}
          </Section>
        </>
      )}

      <CreateRecurringForm />
    </Page>
  );
}
