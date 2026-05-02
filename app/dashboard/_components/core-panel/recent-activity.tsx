"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import {
  formatDate,
  formatVndCompact,
} from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import { cn } from "@/lib/utils";

export function RecentActivity({
  transactions,
}: {
  transactions: any[];
}) {
  const { locale, t } = useI18n();

  if (transactions.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <SectionHeader
          icon={Receipt}
          label={t("dashboard.activity.label")}
          title={t("dashboard.activity.title")}
        />
        <Link
          href="/transactions"
          className="text-sm font-medium text-primary hover:underline"
        >
          {t("dashboard.activity.view_more")}
        </Link>
      </div>
      <Card className="overflow-hidden border-border/60">
        <CardContent className="p-0">
          {transactions.map((tx, idx) => (
            <div
              key={tx.id}
              className={cn(
                "flex items-center gap-3 p-4 transition-colors hover:bg-muted/30",
                idx !== transactions.length - 1 && "border-b border-border/50",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  tx.type === "income"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-100 text-slate-700",
                )}
              >
                {tx.type === "income" ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : (
                  <ArrowDownRight className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {tx.description ??
                    tx.category_name ??
                    t("transactions.uncategorized")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tx.category_name ?? formatDate(tx.transaction_date, locale)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "text-sm font-bold",
                    tx.type === "income" ? "text-emerald-600" : "text-foreground",
                  )}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatVndCompact(tx.amount, locale)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDate(tx.transaction_date, locale)}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
