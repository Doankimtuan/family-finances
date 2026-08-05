import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneySavingsEarlyWithdrawPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getSaving,
  listSavingCycles,
  listProviderPackages,
  SavingStatus,
  CycleStatus,
} from "@/modules/savings/application";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Amount } from "@/shared/patterns/amount";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { RenewalPolicyEditor } from "./renewal-policy-editor";

type Props = { params: Promise<{ locale: string; id: string }> };

/** money.savings-detail — timeline + Inbox guidance. */
export default async function SavingsDetailPage({ params }: Props) {
  const { locale: raw, id } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id))) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  const [t, tProducts, item, cycles] = await Promise.all([
    getTranslations("money.savingsDetail"),
    getTranslations("money.products"),
    getSaving(id),
    listSavingCycles(id),
  ]);

  if (!item) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="savings-detail-missing"
      >
        <TopAppBar title={t("title")} />
        <div className="px-(--space-4) pt-(--space-4)">
          <EmptyState
            title={t("notFound")}
            className="flex-none py-(--space-4)"
          />
          <Link
            href={APP_PATH.MONEY_SAVINGS}
            className="text-sm font-medium text-accent"
          >
            {t("back")}
          </Link>
        </div>
      </div>
    );
  }

  const cycle = item.latestCycle;
  const legacyImport = Boolean(
    (item.productSnapshot as { legacyImport?: boolean }).legacyImport,
  );
  const money = (n: number) =>
    formatCurrency(n, DEFAULT_CURRENCY, locale, { maximumFractionDigits: 0 });

  const packages =
    item.status === SavingStatus.ACTIVE || item.status === SavingStatus.MATURED
      ? ((await listProviderPackages(item.providerId)) ?? []).map((p) => ({
          id: p.id,
          packageName: p.packageName,
        }))
      : [];

  return (
    <div className="flex min-h-full flex-col" data-testid="savings-detail">
      <TopAppBar title={item.productName || t("title")} />
      <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <Text size="sm" tone="secondary">
          {tProducts("notBankBalance")}
        </Text>
        {legacyImport ? (
          <StatusAlert variant="info" title={t("legacyBanner")} />
        ) : null}
        <Amount
          label={tProducts("principalLabel")}
          amountLabel={money(cycle?.principal ?? 0)}
          size="lg"
        />
        <Text size="sm" tone="secondary">
          {t("providerLabel")}: {item.providerName}
        </Text>
        <Text size="sm" tone="secondary">
          {t("packageLabel")}: {item.productSnapshot.packageName}
        </Text>
        {cycle ? (
          <>
            <Text size="sm" tone="secondary">
              {t("rateLabel")}: {cycle.lockedRate}%
            </Text>
            <Text size="sm" tone="secondary">
              {t("accruedLabel")}: {money(cycle.accruedInterest)}
            </Text>
            <Text size="sm" tone="secondary">
              {t("maturityDate", { date: cycle.endDate })}
            </Text>
            <Text size="sm" tone="secondary">
              {t("cycleLabel", { number: cycle.cycleNumber })}
            </Text>
          </>
        ) : null}

        <section className="flex flex-col gap-(--space-2)">
          <Text size="sm" className="font-semibold text-text-primary">
            {t("timelineTitle")}
          </Text>
          <ol className="flex flex-col gap-(--space-2) text-sm text-text-secondary">
            <li>
              {t("timelineFunded", {
                account: item.fundingAccountName ?? "—",
              })}
            </li>
            <li>{t("timelineActive")}</li>
            <li>{t("timelineAccrual")}</li>
            <li>
              {t("timelineMaturity", { date: cycle?.endDate ?? "—" })}
            </li>
            {(item.status === SavingStatus.MATURED ||
              cycle?.status === CycleStatus.MATURED) && (
              <li>{t("timelineInbox")}</li>
            )}
            {(item.status === SavingStatus.CLOSED ||
              item.status === SavingStatus.EARLY_CLOSED) && (
              <li>{t("timelineSettled")}</li>
            )}
          </ol>
        </section>

        {cycles && cycles.length > 1 ? (
          <section className="flex flex-col gap-(--space-2)">
            {cycles.map((c) => (
              <Text key={c.id} size="sm" tone="secondary">
                {t("cycleLabel", { number: c.cycleNumber })} · {c.status} ·{" "}
                {money(c.principal)}
              </Text>
            ))}
          </section>
        ) : null}

        <Text size="sm" tone="secondary">
          {t("maturityHint")}
        </Text>

        {(item.status === SavingStatus.ACTIVE ||
          item.status === SavingStatus.MATURED) && (
          <RenewalPolicyEditor
            savingId={item.id}
            renewalPolicy={item.renewalPolicy}
            renewalConfig={item.renewalConfig}
            packages={packages}
          />
        )}

        {item.status === SavingStatus.MATURED ? (
          <Link
            href={APP_PATH.INBOX}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-(--space-4) text-sm font-medium text-accent-fg"
            data-testid="savings-open-inbox"
          >
            {t("handleMaturity")}
          </Link>
        ) : null}

        {item.status === SavingStatus.ACTIVE && cycle ? (
          <Link
            href={moneySavingsEarlyWithdrawPath(item.id)}
            className="text-sm font-medium text-accent"
            data-testid="savings-early-withdraw"
          >
            {t("earlyWithdraw")}
          </Link>
        ) : null}

        <Link
          href={APP_PATH.MONEY_SAVINGS}
          className="text-sm font-medium text-accent"
          data-testid="savings-detail-back"
        >
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
