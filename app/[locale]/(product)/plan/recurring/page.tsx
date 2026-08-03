import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  planRecurringPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { listRecurring, DEFAULT_CURRENCY } from "@/modules/plan/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Text } from "@/shared/ui/text";
import { PlanOfflineBanner } from "../plan-offline-banner";
import { CreateRecurringForm } from "./create-recurring-form";

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
  const incomeMode = listed?.incomeAllocateMode ?? "suggest";

  return (
    <div className="flex min-h-full flex-col" data-testid="plan-recurring">
      <TopAppBar title={t("listTitle")} subtitle={t("listSubtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <PlanOfflineBanner />

        <Text size="sm" tone="secondary">
          {t("incomeModeLabel", { mode: t(`incomeModes.${incomeMode}`) })}
        </Text>
        <Text size="sm" tone="secondary">
          {t("incomeModeHint")}
        </Text>

        {rules.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            className="flex-none py-(--space-4)"
          />
        ) : (
          <ul className="flex flex-col gap-(--space-2)">
            {rules.map((rule) => (
              <li key={rule.id}>
                <Link href={planRecurringPath(rule.id)} className="block">
                  <Card
                    className="gap-0 p-(--space-4)"
                    data-testid={`recurring-card-${rule.id}`}
                  >
                    <div className="flex items-center justify-between gap-(--space-3)">
                      <div className="min-w-0">
                        <Text
                          size="sm"
                          className="truncate font-medium text-text-primary"
                        >
                          {rule.name}
                        </Text>
                        <Text size="sm" tone="secondary">
                          {t(`direction.${rule.direction}`)} ·{" "}
                          {t(`frequency.${rule.frequency}`)}
                        </Text>
                        {rule.nextRunDate ? (
                          <Text size="sm" tone="secondary">
                            {t("nextRun", { date: rule.nextRunDate })}
                          </Text>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-sm font-semibold tabular-nums text-text-primary">
                          {formatCurrency(rule.amount, currency, locale, {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                        <Text size="sm" tone="secondary">
                          {rule.isActive ? t("active") : t("inactive")}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <CreateRecurringForm />

        <Link
          href={APP_PATH.PLAN}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
        >
          {t("backToPlan")}
        </Link>
      </div>
    </div>
  );
}
