import { formatVnd } from "@/lib/dashboard/format";

type InvestmentMetricsBarProps = {
  totalInvested: number;
  unrealizedPnl: number;
  roi: number;
  currentValue: number;
  householdLocale: string;
  t: (key: string) => string;
};

export function InvestmentMetricsBar({
  totalInvested,
  unrealizedPnl,
  roi,
  currentValue,
  householdLocale,
  t,
}: InvestmentMetricsBarProps) {
  const pnlColor = unrealizedPnl >= 0 ? "text-emerald-600" : "text-rose-600";
  const pnlSign = unrealizedPnl >= 0 ? "+" : "";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 bg-teal-50 border border-teal-100 rounded-xl p-3">
      <div className="space-y-1">
        <p className="text-[10px] uppercase font-bold text-teal-800 tracking-wider pt-1">
          {t("assets.total_capital")}
        </p>
        <p className="font-semibold text-teal-900">
          {formatVnd(totalInvested, householdLocale)}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] uppercase font-bold text-teal-800 tracking-wider pt-1">
          {t("assets.unrealized_pnl")}
        </p>
        <p className={`font-semibold ${pnlColor}`}>
          {pnlSign}
          {formatVnd(unrealizedPnl, householdLocale)}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] uppercase font-bold text-teal-800 tracking-wider pt-1">
          {t("assets.roi_label")}
        </p>
        <p className={`font-semibold ${pnlColor}`}>
          {pnlSign}
          {roi.toFixed(1)}%
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] uppercase font-bold text-teal-800 tracking-wider pt-1">
          {t("assets.current_value")}
        </p>
        <p className="font-bold text-teal-900">
          {formatVnd(currentValue, householdLocale)}
        </p>
      </div>
    </div>
  );
}
