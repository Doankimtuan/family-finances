"use client";

import Link from "next/link";
import { PiggyBank, Building2, WalletCards } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatVnd, formatPercent } from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import type { SavingsListItem } from "@/lib/savings/types";
import { cn } from "@/lib/utils";

type Props = {
  item: SavingsListItem;
  locale: string;
  href: string;
};

function statusLabel(status: SavingsListItem["uiStatus"], t: (key: string) => string) {
  if (status === "MATURING_SOON") return t("savings.status.maturing_soon");
  if (status === "MATURED") return t("savings.status.matured");
  if (status === "WITHDRAWN") return t("savings.status.withdrawn");
  return t("savings.status.active");
}

export function SavingsCard({ item, locale, href }: Props) {
  const { t } = useI18n();
  const progress =
    item.totalTermDays && item.totalTermDays > 0 && item.elapsedTermDays !== null
      ? Math.min(100, Math.round((item.elapsedTermDays / item.totalTermDays) * 100))
      : null;

  return (
    <Link href={href} className="block w-full text-left">
      <Card className="border-border/60 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl",
                  item.savingsType === "bank"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-emerald-50 text-emerald-700",
                )}
              >
                {item.savingsType === "bank" ? (
                  <Building2 className="h-5 w-5" />
                ) : (
                  <WalletCards className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  {item.providerName}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {item.savingsType === "bank"
                      ? t("savings.card.bank")
                      : t("savings.card.third_party")}
                  </Badge>
                  <Badge variant="outline">
                    {item.termMode === "flexible"
                      ? t("savings.card.flexible")
                      : `${item.totalTermDays ?? item.currentValue.daysElapsed} ${t("savings.card.days")}`}
                  </Badge>
                </div>
              </div>
            </div>
            <Badge
              className={cn(
                item.uiStatus === "MATURING_SOON"
                  ? "bg-amber-100 text-amber-800"
                  : item.uiStatus === "MATURED"
                    ? "bg-slate-200 text-slate-800"
                    : item.uiStatus === "WITHDRAWN"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700",
              )}
            >
              {statusLabel(item.uiStatus, t)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("savings.card.principal")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatVnd(item.currentPrincipalRemaining, locale)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("savings.card.current_value")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatVnd(item.currentValue.grossValue, locale)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("savings.card.rate")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatPercent(item.annualRate)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("savings.card.maturity")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {item.daysUntilMaturity === null
                  ? t("savings.card.flexible")
                  : item.daysUntilMaturity === 0
                    ? t("savings.summary.today")
                    : `${item.daysUntilMaturity} ${t("savings.card.days")}`}
              </p>
            </div>
          </div>

          {progress !== null ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>{t("savings.card.term_progress")}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          {item.goalName ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <PiggyBank className="h-3.5 w-3.5" />
              <span>{t("savings.card.linked_goal")}: {item.goalName}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
