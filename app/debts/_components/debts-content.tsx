import Link from "next/link";
import {
  TrendingDown,
  TrendingUp,
  Info,
  Calendar,
  CreditCard,
} from "lucide-react";

import { DebtsForm } from "@/app/onboarding/_components/debts-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVndCompact } from "@/lib/dashboard/format";
import { createClient } from "@/lib/supabase/server";

type DebtRow = {
  id: string;
  name: string;
  liability_type: string;
  current_principal_outstanding: number;
  principal_original: number;
  next_payment_date: string | null;
};

export async function DebtsContent({
  householdId,
  vi,
  householdLocale,
}: {
  householdId: string;
  vi: boolean;
  householdLocale: string;
}) {
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
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="grid grid-cols-2 gap-3">
        <MetricCard
          label={vi ? "Tổng nợ" : "Total Debt"}
          value={formatVndCompact(totalOutstanding, householdLocale)}
          icon={TrendingDown}
          variant="destructive"
        />
        <MetricCard
          label={vi ? "Tiến độ trả" : "Paid Off"}
          value={`${overallProgress}%`}
          icon={TrendingUp}
          variant="success"
          trend={{ value: overallProgress, label: "total" }}
        />
      </section>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <SectionHeader
            label="Management"
            title={vi ? "Thêm khoản nợ mới" : "Add New Debt"}
            description={
              vi
                ? "Theo dõi các khoản vay để quản lý dòng tiền tốt hơn."
                : "Track liabilities to manage household cash flow effectively."
            }
          />
        </CardHeader>
        <CardContent>
          <DebtsForm />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <SectionHeader
          label="Obligations"
          title={vi ? "Nghĩa vụ nợ hiện tại" : "Current Liabilities"}
        />

        {debtsResult.error ? (
          <EmptyState
            icon={Info}
            title="Error loading debts"
            description={debtsResult.error.message}
            className="bg-destructive/5 border-destructive/20"
          />
        ) : debts.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={vi ? "Không có nợ" : "No debts tracked"}
            description={
              vi
                ? "Tuyệt vời! Gia đình bạn đang không có nợ hoặc chưa thêm khoản vay nào."
                : "Excellent! You're either debt-free or haven't tracked loans yet."
            }
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
                          {vi ? "còn lại" : "to go"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <span>{vi ? "Tiến độ" : "Progress"}</span>
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
                            ? `${vi ? "Kỳ tới" : "Next"}: ${debt.next_payment_date}`
                            : vi
                              ? "Không có lịch"
                              : "No schedule"}
                        </span>
                      </div>
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs font-bold"
                      >
                        <Link href={`/debts/${debt.id}`}>
                          {vi ? "Chi tiết" : "Details"}
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
