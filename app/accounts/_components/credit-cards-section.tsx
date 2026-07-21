import { Card, CardContent } from "@/components/ui/card";
import { formatVndCompact } from "@/lib/dashboard/format";
import { t as dictT } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { cn } from "@/lib/utils";
import { ChevronRight, CreditCard, Plus } from "lucide-react";
import Link from "next/link";
import { calcDueDate } from "../_lib/helpers";
import type { AccountRow, CardBillingInfo, CardSettingsRow } from "../_lib/types";

interface CreditCardsSectionProps {
  creditCardAccounts: AccountRow[];
  cardSettingsMap: Map<string, CardSettingsRow>;
  cardBillingMap: Map<string, CardBillingInfo>;
  accountNames: Map<string, string>;
  totalCardDebt: number;
}

export async function CreditCardsSection({
  creditCardAccounts,
  cardSettingsMap,
  cardBillingMap,
  accountNames,
  totalCardDebt,
}: CreditCardsSectionProps) {
  const { language, householdLocale } = await getAuthenticatedHouseholdContext();
  const t = (key: string) => dictT(language, key);

  if (creditCardAccounts.length === 0) return null;

  return (
    <section className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between sm:p-5 md:p-6">
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium text-primary/70">
            {t("money.accounts.credit_card.label")}
          </p>
          <div className="flex items-baseline justify-between gap-x-3">
            <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
              {t("money.accounts.credit_card.label")}
            </h2>
            {totalCardDebt > 0 && (
              <p className="text-sm font-semibold text-muted-foreground">
                {t("money.liabilities.outstanding")}: {formatVndCompact(totalCardDebt, householdLocale)}
              </p>
            )}
          </div>
        </div>
        <Link
          href="/accounts/card/new"
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          {t("common.add")}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {creditCardAccounts.map((account) => {
          const settings = cardSettingsMap.get(account.id);
          const billing = cardBillingMap.get(account.id);
          const outstanding = billing?.outstanding ?? 0;
          const creditLimit = Number(settings?.credit_limit ?? 0);
          const availableCredit = Math.max(0, creditLimit - outstanding);
          const rawUsage = creditLimit > 0 ? (outstanding / creditLimit) * 100 : 0;
          const usagePercent =
            outstanding > 0
              ? Math.max(1, Math.min(100, Math.round(rawUsage)))
              : 0;
          const usageDisplay =
            rawUsage > 0 && rawUsage < 1
              ? rawUsage.toFixed(1)
              : Math.round(rawUsage).toString();
          const linkedName = settings?.linked_bank_account_id
            ? accountNames.get(settings.linked_bank_account_id)
            : null;
          const dueInfo = settings
            ? calcDueDate(settings.statement_day, settings.due_day, t)
            : null;
          const installmentCount = billing?.installmentCount ?? 0;

          return (
            <Card
              key={account.id}
              className="overflow-hidden border border-white/10 bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl ring-1 ring-white/5"
            >
              <CardContent className="space-y-5 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("money.accounts.credit_card.label")}
                    </p>
                    <p className="mt-1 truncate text-base font-semibold text-white">
                      {account.name}
                    </p>
                    {linkedName && (
                      <p className="mt-1 text-xs text-slate-400">
                        {t("money.accounts.credit_card.linked")}: {linkedName}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                    <CreditCard className="h-4.5 w-4.5 text-slate-200" />
                  </div>
                </div>

                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("money.liabilities.outstanding")}
                    </p>
                    <p className="mt-1 text-2xl font-black tracking-tight text-white tabular-nums">
                      {formatVndCompact(outstanding, householdLocale)}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-slate-400">
                    {t("money.accounts.credit_card.limit")}: {" "}
                    <span className="font-bold text-slate-200">
                      {formatVndCompact(creditLimit, householdLocale)}
                    </span>
                  </p>
                </div>

                <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        usagePercent > 80
                          ? "bg-rose-500"
                          : usagePercent > 50
                            ? "bg-amber-500"
                            : "bg-emerald-500",
                      )}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[10px] font-bold text-slate-400">
                    <span>
                      {t("money.accounts.credit_card.available")}: {" "}
                      <span className="text-emerald-400">
                        {formatVndCompact(availableCredit, householdLocale)}
                      </span>
                    </span>
                    <span>
                      {usageDisplay}% {t("money.accounts.credit_card.used")}
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-3 text-[10px]">
                  <div className="grid grid-cols-2 gap-x-4">
                    <div>
                      <p className="font-medium text-slate-400">
                        {t("money.liabilities.end_date")}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 font-bold",
                          dueInfo?.urgent ? "text-rose-400" : "text-white",
                        )}
                      >
                        {dueInfo?.label ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-400">
                        {t("money.accounts.credit_card.statement_day")}
                      </p>
                      <p className="mt-0.5 font-bold text-white">
                        {t("common.day")} {settings?.statement_day ?? "—"}
                      </p>
                    </div>
                  </div>
                  {installmentCount > 0 && (
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                      {installmentCount} {" "}
                      {t("money.accounts.credit_card.installments")}
                    </span>
                  )}
                </div>

                <Link
                  href={`/accounts/card/${account.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 py-3 text-xs font-semibold text-white transition-colors hover:bg-white/15"
                >
                  {t("common.details")}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
