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
import {
  listRecurring,
  DEFAULT_CURRENCY,
  IncomeAllocateMode,
} from "@/modules/plan/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { PLAN_ICONS } from "@/shared/ui/icon-registry";
import { PlanOfflineBanner } from "../plan-offline-banner";
import { CreateRecurringForm } from "./create-recurring-form";
import { PlanRecurringRow } from "./plan-recurring-row";

type Props = { params: Promise<{ locale: string }> };

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
        />
      }
    >
      <PlanOfflineBanner />

      <Text size="sm" tone="secondary" className="text-pretty">
        {t("incomeModeLabel", { mode: t(`incomeModes.${incomeMode}`) })}
      </Text>
      <Text size="sm" tone="secondary" className="text-pretty">
        {t("incomeModeHint")}
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
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          <ul className="divide-y divide-border-subtle/65 py-(--space-1)">
            {rules.map((rule) => (
              <li key={rule.id}>
                <PlanRecurringRow
                  href={planRecurringPath(rule.id)}
                  testId={`recurring-card-${rule.id}`}
                  name={rule.name}
                  meta={`${t(`direction.${rule.direction}`)} · ${t(`frequency.${rule.frequency}`)}`}
                  amountLabel={formatCurrency(rule.amount, currency, locale, {
                    maximumFractionDigits: 0,
                  })}
                  statusLabel={rule.isActive ? t("active") : t("inactive")}
                  direction={rule.direction}
                  nextRun={
                    rule.nextRunDate
                      ? t("nextRun", { date: rule.nextRunDate })
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <CreateRecurringForm />
    </Page>
  );
}
