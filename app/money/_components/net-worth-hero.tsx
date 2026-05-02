import { Badge } from "@/components/ui/badge";
import { formatVnd, formatVndCompact } from "@/lib/dashboard/format";
import { t as dictT } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import type { MoneySummary } from "../_lib/types";

export async function NetWorthHero({ summary }: { summary: MoneySummary }) {
  const { language, householdLocale } = await getAuthenticatedHouseholdContext();
  const t = (key: string) => dictT(language, key);

  const { netWorth, totalAssets, totalLiabilities, totalAccountBalance, totalSavingsValue, totalAssetValue } = summary;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary to-blue-700 p-7 shadow-xl">
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1 relative z-10">
        {t("money.summary.net_worth")}
      </p>
      <p className="text-4xl font-bold text-white tracking-tight relative z-10">
        {formatVndCompact(netWorth, householdLocale)}
      </p>
      <p className="text-sm text-white/70 mt-0.5 relative z-10">
        {formatVnd(netWorth, householdLocale)}
      </p>
      <p className="mt-3 text-xs text-white/75 relative z-10">
        {t("money.summary.total_assets_includes_savings")}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 relative z-10">
        <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-white/60">
            {t("money.summary.total_assets")}
          </p>
          <p className="text-base font-bold text-white mt-1">
            {formatVndCompact(totalAssets, householdLocale)}
          </p>
        </div>
        <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-white/60">
            {t("money.summary.total_debt")}
          </p>
          <p className="text-base font-bold text-rose-300 mt-1">
            {formatVndCompact(totalLiabilities, householdLocale)}
          </p>
        </div>
      </div>
      <div className="relative z-10 mt-4 flex flex-wrap gap-2">
        <Badge className="bg-white/15 text-white hover:bg-white/15">
          {t("money.summary.breakdown.accounts")}:{" "}
          {formatVndCompact(totalAccountBalance, householdLocale)}
        </Badge>
        <Badge className="bg-white/15 text-white hover:bg-white/15">
          {t("money.summary.breakdown.savings")}:{" "}
          {formatVndCompact(totalSavingsValue, householdLocale)}
        </Badge>
        <Badge className="bg-white/15 text-white hover:bg-white/15">
          {t("money.summary.breakdown.assets")}:{" "}
          {formatVndCompact(totalAssetValue, householdLocale)}
        </Badge>
      </div>
    </div>
  );
}
