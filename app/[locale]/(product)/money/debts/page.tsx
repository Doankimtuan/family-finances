import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneyDebtPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { listLiabilities } from "@/modules/ledger/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Amount } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { CreateDebtForm } from "./create-debt-form";

type Props = { params: Promise<{ locale: string }> };

/** money.debts — debt list (ST-E04-004). */
export default async function DebtsPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id))) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  const [t, tMoney, tProducts, debts] = await Promise.all([
    getTranslations("money.debtsPage"),
    getTranslations("money"),
    getTranslations("money.products"),
    listLiabilities(),
  ]);

  const loadFailed = debts == null;
  const items = debts ?? [];

  return (
    <div className="flex min-h-full flex-col" data-testid="money-debts">
      <TopAppBar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <Text size="sm" tone="secondary">
          {tProducts("notBankBalance")}
        </Text>
        <CreateDebtForm />
        {loadFailed ? (
          <StatusAlert
            variant="danger"
            title={t("emptyTitle")}
            description={tProducts("errors.unknown")}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            className="flex-none py-(--space-4)"
          />
        ) : (
          <ul className="flex flex-col gap-(--space-2)">
            {items.map((debt) => (
              <li key={debt.id}>
                <Link
                  href={moneyDebtPath(debt.id)}
                  className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  <Card
                    className="gap-0 p-(--space-4)"
                    data-testid={`debt-row-${debt.id}`}
                  >
                    <Text size="sm" className="font-medium text-text-primary">
                      {debt.name}
                    </Text>
                    {debt.creditor ? (
                      <Text size="sm" tone="secondary">
                        {debt.creditor}
                      </Text>
                    ) : null}
                    <Amount
                      className="mt-(--space-2)"
                      label={t("remaining")}
                      amountLabel={formatCurrency(
                        debt.remainingAmount,
                        debt.currency,
                        locale,
                        { maximumFractionDigits: 0 },
                      )}
                    />
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={APP_PATH.MONEY}
          className="text-sm font-medium text-accent"
          data-testid="debts-back-money"
        >
          {tMoney("backToMoney")}
        </Link>
      </div>
    </div>
  );
}
