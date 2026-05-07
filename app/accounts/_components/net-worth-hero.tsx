import { Badge } from "@/components/ui/badge";
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
    <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-linear-to-br from-primary via-primary/95 to-blue-700 p-5 text-white shadow-xl sm:p-6 lg:p-8">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />
      </div>

      <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/75">
              {t("money.summary.net_worth")}
            </p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                {formatVndCompact(netWorth, householdLocale)}
              </h1>
              <span
                className={
                  isPositive
                    ? "rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-100"
                    : "rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-rose-100"
                }
              >
                {formatVnd(netWorth, householdLocale)}
              </span>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-white/78">
              {t("money.summary.total_assets_includes_savings")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="border-white/15 bg-white/12 text-white hover:bg-white/12">
              {t("money.summary.breakdown.accounts")}: {formatVndCompact(totalAccountBalance, householdLocale)}
            </Badge>
            <Badge className="border-white/15 bg-white/12 text-white hover:bg-white/12">
              {t("money.summary.breakdown.savings")}: {formatVndCompact(totalSavingsValue, householdLocale)}
            </Badge>
            <Badge className="border-white/15 bg-white/12 text-white hover:bg-white/12">
              {t("money.summary.breakdown.assets")}: {formatVndCompact(totalAssetValue, householdLocale)}
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div className="rounded-3xl border border-emerald-400/50 bg-emerald-400/25 p-4 shadow-lg backdrop-blur-sm ring-2 ring-emerald-300/30">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/80 text-white shadow-lg ring-2 ring-emerald-200">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/90">
                  {t("money.summary.total_assets")}
                </p>
                <p className="mt-1 text-2xl font-black tracking-tight text-white">
                  {formatVndCompact(totalAssets, householdLocale)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-rose-400/50 bg-rose-400/25 p-4 shadow-lg backdrop-blur-sm ring-2 ring-rose-300/30">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-400/80 text-white shadow-lg ring-2 ring-rose-200">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/90">
                  {t("money.summary.total_debt")}
                </p>
                <p className="mt-1 text-2xl font-black tracking-tight text-white">
                  {formatVndCompact(totalLiabilities, householdLocale)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
