import Link from "next/link";
import {
  TrendingDown,
  TrendingUp,
  Info,
  Calendar,
  CreditCard,
} from "lucide-react";

import { AddDebtDialog } from "./add-debt-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVndCompact } from "@/lib/dashboard/format";
import { createClient } from "@/lib/supabase/server";
import { t as dictT } from "@/lib/i18n/dictionary";
import type { AppLanguage } from "@/lib/i18n/config";

type DebtRow = {
  id: string;
  name: string;
  liability_type: string;
  current_principal_outstanding: number;
  principal_original: number;
  next_payment_date: string | null;
};

export async function DebtsSection({
  householdId,
  householdLocale,
  language,
}: {
  householdId: string;
  householdLocale: string;
  language: AppLanguage;
}) {
  const t = (key: string) => dictT(language, key);
  const supabase = await createClient();

  const debtsResult = await supabase
    .from("liabilities")
    .select(
      "id, name, liability_type, current_principal_outstanding, principal_original, next_payment_date",
    )
    .eq("household_id", householdId)
    .eq("is_active", true)
    .order("current_principal_outstanding", { ascending: false });

  const debts = (debtsResult.data ?? []) as DebtRow[];
  const totalOutstanding = debts.reduce(
    (sum, d) => sum + Number(d.current_principal_outstanding),
    0,
  );
  const totalOriginal = debts.reduce(
    (sum, d) => sum + Number(d.principal_original),
    0,
  );
  const overallProgress =
    totalOriginal > 0
      ? Math.round((1 - totalOutstanding / totalOriginal) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        label={t("debts.management")}
        title={t("debts.title")}
        description={t("debts.add_description")}
      />

      <section className="grid grid-cols-2 gap-3">
        <MetricCard
          label={t("debts.total_debt")}
          value={formatVndCompact(totalOutstanding, householdLocale)}
          icon={TrendingDown}
          variant="destructive"
        />
        <MetricCard
          label={t("debts.paid_off")}
          value={`${overallProgress}%`}
          icon={TrendingUp}
          variant="success"
        />
      </section>

      <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between sm:p-5 md:p-6">
        <div className="flex-1 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
            {t("debts.management_label")}
          </p>
          <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
            {t("debts.add_new")}
          </h2>
          <p className="text-sm font-semibold text-muted-foreground">
            {t("debts.add_new_description")}
          </p>
        </div>
        <AddDebtDialog />
      </div>

      <div className="space-y-4">
        <SectionHeader
          label={t("debts.obligations")}
          title={t("debts.current_liabilities")}
        />

        {debtsResult.error ? (
          <EmptyState
            icon={Info}
            title={t("debts.error_loading")}
            description={debtsResult.error.message}
            className="bg-destructive/5 border-destructive/20"
          />
        ) : debts.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={t("debts.no_debts")}
            description={t("debts.no_debts_description")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {debts.map((debt) => {
              const progress =
                debt.principal_original > 0
                  ? Math.round(
                      (1 -
                        debt.current_principal_outstanding /
                          debt.principal_original) *
                        100,
                    )
                  : 0;

              const liabilityTypeLabel = debt.liability_type.replace(/_/g, " ");

              return (
                <Card
                  key={debt.id}
                  className="group hover:border-primary/30 transition-all duration-300"
                >
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-foreground">
                          {debt.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className="mt-1 text-[10px] uppercase font-bold bg-muted/20"
                        >
                          {liabilityTypeLabel}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-destructive">
                          {formatVndCompact(
                            debt.current_principal_outstanding,
                            householdLocale,
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                          {t("debts.to_go")}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <span>{t("debts.progress")}</span>
                        <span className="text-foreground">{progress}%</span>
                      </div>
                      <Progress
                        value={progress}
                        variant="destructive"
                        className="h-2"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {debt.next_payment_date
                            ? `${t("debts.next_payment")}: ${debt.next_payment_date}`
                            : t("debts.no_schedule")}
                        </span>
                      </div>
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs font-bold"
                      >
                        <Link href={`/accounts/${debt.id}`}>
                          {t("debts.details")}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
