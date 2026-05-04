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
    <section className="space-y-1">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t("money.accounts.credit_card.label")}
          </h2>
          {totalCardDebt > 0 && (
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {t("money.liabilities.outstanding")}:{" "}
              {formatVndCompact(totalCardDebt, householdLocale)}
            </p>
          )}
        </div>
        <Link
          href="/accounts/card/new"
          className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
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
              className="overflow-hidden border-slate-700 bg-linear-to-br from-slate-900 to-slate-800 text-white shadow-lg"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {t("money.accounts.credit_card.label")}
                    </p>
                    <p className="text-base font-bold text-white truncate mt-0.5">
                      {account.name}
                    </p>
                    {linkedName && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {t("money.accounts.credit_card.linked")}: {linkedName}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 h-9 w-9 rounded-xl bg-slate-700/60 flex items-center justify-center">
                    <CreditCard className="h-4.5 w-4.5 text-slate-300" />
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">
                      {t("money.liabilities.outstanding")}
                    </p>
                    <p className="text-2xl font-black text-white tracking-tight mt-0.5">
                      {formatVndCompact(outstanding, householdLocale)}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {t("money.accounts.credit_card.limit")}:{" "}
                    <span className="font-bold text-slate-300">
                      {formatVndCompact(creditLimit, householdLocale)}
                    </span>
                  </p>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
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
                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>
                      {t("money.accounts.credit_card.available")}:{" "}
                      <span className="text-emerald-400">
                        {formatVndCompact(availableCredit, householdLocale)}
                      </span>
                    </span>
                    <span>
                      {usageDisplay}% {t("money.accounts.credit_card.used")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <div className="grid grid-cols-2 gap-x-4">
                    <div>
                      <p className="text-slate-400 font-medium">
                        {t("money.liabilities.end_date")}
                      </p>
                      <p
                        className={cn(
                          "font-bold mt-0.5",
                          dueInfo?.urgent ? "text-rose-400" : "text-white",
                        )}
                      >
                        {dueInfo?.label ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">
                        {t("money.accounts.credit_card.statement_day")}
                      </p>
                      <p className="font-bold text-white mt-0.5">
                        {t("common.day")} {settings?.statement_day ?? "—"}
                      </p>
                    </div>
                  </div>
                  {installmentCount > 0 && (
                    <span className="text-amber-400 font-bold">
                      {installmentCount}{" "}
                      {t("money.accounts.credit_card.installments")}
                    </span>
                  )}
                </div>

                <Link
                  href={`/accounts/card/${account.id}`}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-white/10 hover:bg-white/20 transition-colors py-2.5 text-xs font-bold text-white"
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
