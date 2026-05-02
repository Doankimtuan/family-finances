import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatVndCompact } from "@/lib/dashboard/format";
import { t as dictT } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { cn } from "@/lib/utils";
import { ChevronRight, Plus, TrendingDown } from "lucide-react";
import Link from "next/link";
import {
  calcRemainingMonths,
  getLiabilityColors,
  getLiabilityIcon,
  getLiabilityLabel,
} from "../_lib/helpers";
import type { LiabilityRow } from "../_lib/types";

interface LiabilitiesSectionProps {
  liabilities: LiabilityRow[];
  rateMap: Map<string, number>;
  totalLiabilities: number;
  totalCardDebt: number;
}

export async function LiabilitiesSection({
  liabilities,
  rateMap,
  totalLiabilities,
  totalCardDebt,
}: LiabilitiesSectionProps) {
  const { language, householdLocale } = await getAuthenticatedHouseholdContext();
  const t = (key: string) => dictT(language, key);
  const loanDebt = totalLiabilities - totalCardDebt;

  return (
    <section className="space-y-1">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t("money.liabilities.title")}
          </h2>
          {loanDebt > 0 && (
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {t("money.liabilities.outstanding")}:{" "}
              {formatVndCompact(loanDebt, householdLocale)}
            </p>
          )}
        </div>
        <Link
          href="/debts"
          className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t("common.add")}
        </Link>
      </div>

      {liabilities.length === 0 ? (
        <EmptyState
          icon={TrendingDown}
          title={t("money.liabilities.empty.title")}
          description={t("money.liabilities.empty.description")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {liabilities.map((debt) => {
            const outstanding = Number(debt.current_principal_outstanding);
            const original = Number(debt.principal_original);
            const paidPct =
              original > 0
                ? Math.round(((original - outstanding) / original) * 100)
                : 0;
            const remainMonths = calcRemainingMonths(
              debt.start_date,
              debt.term_months,
            );
            const rate = rateMap.get(debt.id);
            const LiabilityIcon = getLiabilityIcon(debt.liability_type);
            const colors = getLiabilityColors(debt.liability_type);

            return (
              <Card
                key={debt.id}
                className={cn(
                  "border transition-all duration-200 hover:shadow-md",
                  colors.border,
                  colors.bg,
                )}
              >
                <CardContent className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        {getLiabilityLabel(debt.liability_type, t)}
                      </p>
                      <p className="text-sm font-bold text-foreground truncate mt-0.5">
                        {debt.name}
                      </p>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                      <LiabilityIcon className="h-4.5 w-4.5 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Outstanding */}
                  <div className="flex justify-between items-baseline">
                    <div>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase">
                        {t("money.liabilities.outstanding")}
                      </p>
                      <p className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight mt-0.5">
                        {formatVndCompact(outstanding, householdLocale)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {t("money.liabilities.total")}:{" "}
                        {formatVndCompact(original, householdLocale)}
                      </p>
                    </div>
                    <Link
                      href={`/debts/${debt.id}`}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
                    >
                      {t("common.details")}
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1 font-medium">
                      {t("money.liabilities.repaid")}: {paidPct}%
                    </p>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/50">
                    {rate !== undefined && (
                      <div>
                        <p className="text-[9px] text-muted-foreground font-medium">
                          {t("money.liabilities.interest_rate")}
                        </p>
                        <p className="text-sm font-bold text-foreground mt-0.5">
                          {rate.toFixed(1)}%
                        </p>
                      </div>
                    )}
                    {remainMonths !== null && (
                      <div>
                        <p className="text-[9px] text-muted-foreground font-medium">
                          {t("money.liabilities.remaining")}
                        </p>
                        <p className="text-sm font-bold text-foreground mt-0.5">
                          {remainMonths} {t("common.months")}
                        </p>
                      </div>
                    )}
                    {debt.next_payment_date && (
                      <div>
                        <p className="text-[9px] text-muted-foreground font-medium">
                          {t("money.liabilities.end_date")}
                        </p>
                        <p className="text-sm font-bold text-foreground mt-0.5">
                          {debt.next_payment_date}
                        </p>
                      </div>
                    )}
                    {debt.lender_name && (
                      <div>
                        <p className="text-[9px] text-muted-foreground font-medium">
                          {t("money.liabilities.lender")}
                        </p>
                        <p className="text-sm font-bold text-foreground mt-0.5 truncate">
                          {debt.lender_name}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
