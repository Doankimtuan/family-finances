import { getMessages, getTranslations } from "next-intl/server";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneyLoanPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getLoanReadResult,
  listLoanScheduleReadResult,
} from "@/modules/ledger/application";
import { LoanReadStatus } from "@/modules/ledger/application/ledger-constants";
import { todayIsoDate } from "@/shared/utils/iso-date";
import { formatCurrency } from "@/shared/i18n/formatters";
import { MotionReveal } from "@/shared/motion";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { EmptyState } from "@/shared/patterns/empty-state";
import { ErrorState } from "@/shared/patterns/error-state";
import { cn } from "@/shared/utils/cn";
import { LoanSchedulePanel } from "../loan-detail-panels";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams?: Promise<{ year?: string }>;
};

export default async function LoanFullSchedulePage({
  params,
  searchParams,
}: Props) {
  const { locale: raw, id } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);
  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id)))
    return redirect({ href: APP_PATH.ONBOARD, locale });

  const [t, loanResult, scheduleResult, messages] = await Promise.all([
    getTranslations("money.loanDetail"),
    getLoanReadResult(id),
    listLoanScheduleReadResult(id),
    getMessages(),
  ]);

  if (loanResult.status !== LoanReadStatus.OK) {
    return (
      <ErrorState
        title={
          loanResult.status === LoanReadStatus.NOT_FOUND
            ? t("notFound")
            : t("readError")
        }
        action={
          <Link
            href={moneyLoanPath(id)}
            className="text-sm font-medium text-accent"
          >
            {t("back")}
          </Link>
        }
      />
    );
  }
  if (scheduleResult.status !== LoanReadStatus.OK) {
    return (
      <ErrorState
        title={t("scheduleError")}
        action={
          <Link
            href={moneyLoanPath(id)}
            className="text-sm font-medium text-accent"
          >
            {t("retry")}
          </Link>
        }
      />
    );
  }

  const years = [
    ...new Set(
      scheduleResult.schedule.map((entry) => entry.dueDate.slice(0, 4)),
    ),
  ].sort();
  const requestedYear = (await searchParams)?.year;
  const year = years.includes(requestedYear ?? "") ? requestedYear! : years[0];
  const entries = scheduleResult.schedule.filter((entry) =>
    entry.dueDate.startsWith(year),
  );
  const money = (amount: number) =>
    formatCurrency(amount, loanResult.loan.currency, locale, {
      maximumFractionDigits: 0,
    });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Page
        testId="loan-full-schedule"
        contentClassName="gap-(--space-5)"
        topBar={
          <TopAppBar
            variant="detail"
            title={t("fullScheduleTitle")}
            backHref={moneyLoanPath(id)}
          />
        }
      >
        <MotionReveal className="flex flex-col gap-(--space-4)">
          {years.length === 0 ? (
            <EmptyState title={t("scheduleEmpty")} />
          ) : null}
          {years.length > 0 ? (
            <nav
              className="flex gap-(--space-1) overflow-x-auto rounded-(--radius-control) bg-surface-muted/60 p-(--space-1)"
              aria-label={t("fullScheduleTitle")}
            >
              {years.map((item) => {
                const selected = item === year;
                return (
                  <Link
                    key={item}
                    href={`${moneyLoanPath(id)}/schedule?year=${item}`}
                    aria-current={selected ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 shrink-0 items-center justify-center rounded-(--radius-control) px-(--space-3) text-center text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                      selected
                        ? "bg-surface text-text-primary shadow-(--elevation-1)"
                        : "text-text-secondary hover:bg-surface-hover",
                    )}
                  >
                    {item}
                  </Link>
                );
              })}
            </nav>
          ) : null}
          {entries.length > 0 ? (
            <LoanSchedulePanel
              title={year}
              emptyLabel={t("scheduleEmpty")}
              entries={entries}
              formatMoney={money}
              t={t}
              today={todayIsoDate()}
            />
          ) : null}
        </MotionReveal>
      </Page>
    </NextIntlClientProvider>
  );
}
