import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatVnd, formatVndCompact } from "@/lib/dashboard/format";
import { t as dictT } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { MoneySummary } from "../_lib/types";

export async function NetWorthHero({ summary }: { summary: MoneySummary }) {
  const { language, householdLocale } = await getAuthenticatedHouseholdContext();
  const t = (key: string) => dictT(language, key);

  const {
    netWorth,
    totalAssets,
    totalLiabilities,
    totalAccountBalance,
    totalSavingsValue,
    totalAssetValue,
  } = summary;

  const isPositive = netWorth >= 0;

  return (
    <Card
      variant="elevated"
      className="overflow-hidden border-primary/15 bg-secondary/30 p-5 sm:p-6 lg:p-8"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("money.summary.net_worth")}
            </p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-serif text-4xl font-semibold tabular-nums tracking-tight text-primary sm:text-5xl">
                {formatVndCompact(netWorth, householdLocale)}
              </h1>
              <span
                className={
                  isPositive
                    ? "rounded-lg bg-success/10 px-3 py-1 text-xs font-medium tabular-nums text-success"
                    : "rounded-lg bg-destructive/10 px-3 py-1 text-xs font-medium tabular-nums text-destructive"
                }
              >
                {formatVnd(netWorth, householdLocale)}
              </span>
            </div>
            <p className="max-w-prose text-sm leading-6 text-muted-foreground">
              {t("money.summary.total_assets_includes_savings")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="tabular-nums">
              {t("money.summary.breakdown.accounts")}:{" "}
              {formatVndCompact(totalAccountBalance, householdLocale)}
            </Badge>
            <Badge variant="secondary" className="tabular-nums">
              {t("money.summary.breakdown.savings")}:{" "}
              {formatVndCompact(totalSavingsValue, householdLocale)}
            </Badge>
            <Badge variant="secondary" className="tabular-nums">
              {t("money.summary.breakdown.assets")}:{" "}
              {formatVndCompact(totalAssetValue, householdLocale)}
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("money.summary.total_assets")}
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                  {formatVndCompact(totalAssets, householdLocale)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("money.summary.total_debt")}
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                  {formatVndCompact(totalLiabilities, householdLocale)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
