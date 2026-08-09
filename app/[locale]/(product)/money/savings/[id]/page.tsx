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
} from "@/modules/savings/application";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { Amount } from "@/shared/patterns/amount";
import { EmptyState } from "@/shared/patterns/empty-state";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { RenewalPolicyEditor } from "./renewal-policy-editor";

type Props = { params: Promise<{ locale: string; id: string }> };

function formatIsoDate(iso: string, locale: string) {
  return formatDate(new Date(`${iso}T12:00:00`), locale);
}

/** money.savings-detail — principal, maturity, immutable cycle history. */
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
      <Page
        testId="savings-detail-missing"
        topBar={<TopAppBar title={t("title")} />}
      >
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
      </Page>
    );
  }

  const cycle = item.latestCycle;
  const legacyImport = Boolean(
    (item.productSnapshot as { legacyImport?: boolean }).legacyImport,
  );
  const money = (n: number) =>
    formatCurrency(n, DEFAULT_CURRENCY, locale, { maximumFractionDigits: 0 });
  const isTerminal =
    item.status === SavingStatus.CLOSED ||
    item.status === SavingStatus.EARLY_CLOSED;
  const canAct =
    item.status === SavingStatus.ACTIVE || item.status === SavingStatus.MATURED;

  const packages = canAct
    ? ((await listProviderPackages(item.providerId)) ?? []).map((p) => ({
        id: p.id,
        packageName: p.packageName,
      }))
    : [];

  return (
    <Page
      testId="savings-detail"
      topBar={<TopAppBar title={item.productName || t("title")} />}
    >
      <MoneyOfflineBanner />
      <Text size="sm" tone="secondary">
        {tProducts("notBankBalance")}
      </Text>
      {legacyImport ? (
        <StatusAlert variant="info" title={t("legacyBanner")} />
      ) : null}

      <Section title={t("identityTitle")} testId="savings-identity">
        <Amount
          label={tProducts("principalLabel")}
          amountLabel={money(cycle?.principal ?? 0)}
          size="lg"
        />
        <Text size="sm" tone="secondary">
          {t("statusLine", { status: t(`status.${item.status}`) })}
        </Text>
        <Text size="sm" tone="secondary">
          {t("providerLine", { provider: item.providerName || t("title") })}
        </Text>
        <Text size="sm" tone="secondary">
          {t("packageLine", {
            package: item.productSnapshot.packageName || t("title"),
          })}
        </Text>
      </Section>

      {cycle ? (
        <Section title={t("cycleFactsTitle")} testId="savings-cycle-facts">
          <Text size="sm" tone="secondary">
            {t("rateLine", { rate: cycle.lockedRate })}
          </Text>
          <Amount
            label={t("accruedNonPostedLabel")}
            amountLabel={money(cycle.accruedInterest)}
          />
          <Text size="sm" tone="secondary">
            {t("maturityDate", {
              date: formatIsoDate(cycle.endDate, locale),
            })}
          </Text>
          <Text size="sm" tone="secondary">
            {t("cycleLabel", { number: cycle.cycleNumber })}
          </Text>
          <Text size="sm" tone="secondary">
            {t("cycleStatusLine", {
              status: t(`cycleStatus.${cycle.status}`),
            })}
          </Text>
        </Section>
      ) : null}

      {cycles && cycles.length > 0 ? (
        <Section title={t("historyTitle")} testId="savings-cycle-history">
          <ul className="flex flex-col gap-(--space-2)">
            {cycles.map((c) => (
              <li
                key={c.id}
                className="rounded-md border border-border-subtle px-(--space-3) py-(--space-2)"
                data-testid={`savings-cycle-row-${c.id}`}
              >
                <Text size="sm" className="font-medium text-text-primary">
                  {t("cycleLabel", { number: c.cycleNumber })}
                </Text>
                <Text size="sm" tone="secondary">
                  {t("cycleHistoryLine", {
                    status: t(`cycleStatus.${c.status}`),
                    principal: money(c.principal),
                    start: formatIsoDate(c.startDate, locale),
                    end: formatIsoDate(c.endDate, locale),
                  })}
                </Text>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {canAct ? (
        <Section title={t("renewalPolicyTitle")}>
          <Text size="sm" tone="secondary">
            {t("renewalPolicyHint")}
          </Text>
          <RenewalPolicyEditor
            savingId={item.id}
            renewalPolicy={item.renewalPolicy}
            renewalConfig={item.renewalConfig}
            packages={packages}
          />
        </Section>
      ) : null}

      {isTerminal ? (
        <StatusAlert variant="info" title={t("terminalReadOnly")} />
      ) : (
        <Text size="sm" tone="secondary">
          {t("maturityHint")}
        </Text>
      )}

      <BottomActionBar>
        {item.status === SavingStatus.MATURED ? (
          <Link
            href={APP_PATH.INBOX}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-(--space-4) text-sm font-medium text-accent-fg"
            data-testid="savings-open-inbox"
          >
            {t("handleMaturity")}
          </Link>
        ) : null}
        {item.status === SavingStatus.ACTIVE && cycle ? (
          <Link
            href={moneySavingsEarlyWithdrawPath(item.id)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
            data-testid="savings-early-withdraw"
          >
            {t("earlyWithdraw")}
          </Link>
        ) : null}
        <Link
          href={APP_PATH.MONEY_SAVINGS}
          className="inline-flex min-h-11 w-full items-center justify-center text-sm font-medium text-accent"
          data-testid="savings-detail-back"
        >
          {t("back")}
        </Link>
      </BottomActionBar>
    </Page>
  );
}
