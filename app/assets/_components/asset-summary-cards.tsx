import { Card, CardContent } from "@/components/ui/card";
import { formatNumber, formatVnd } from "@/lib/dashboard/format";
import type { ValuationPoint } from "@/lib/assets/timeline";

type AssetSummaryCardsProps = {
  latest: ValuationPoint | undefined;
  assetQuantity: number;
  unitLabel: string;
  currentValue: number;
  householdLocale: string;
  t: (key: string) => string;
};

export function AssetSummaryCards({
  latest,
  assetQuantity,
  unitLabel,
  currentValue,
  householdLocale,
  t,
}: AssetSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card>
        <CardContent className="p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
            {t("assets.current_quantity")}
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {formatNumber(
              latest?.quantity ?? assetQuantity,
              householdLocale,
            )}{" "}
            {unitLabel}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
            {t("assets.current_unit_price")}
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {formatVnd(latest?.unitPrice ?? 0, householdLocale)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
            {t("assets.current_value")}
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {formatVnd(currentValue, householdLocale)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
