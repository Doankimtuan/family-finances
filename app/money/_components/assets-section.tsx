import { CreateAssetDialog } from "@/app/assets/_components/create-asset-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatNumber, formatVndCompact } from "@/lib/dashboard/format";
import { getClassLabel } from "@/lib/assets/class-config";
import { t as dictT } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import {
  ASSET_CLASS_BAR_COLORS,
  ASSET_CLASS_TEXT_COLORS,
  getAssetColors,
  getAssetIcon,
} from "../_lib/helpers";
import type { AssetRow } from "../_lib/types";

interface AssetsSectionProps {
  assets: AssetRow[];
  priceMap: Map<string, number>;
  prevPriceMap: Map<string, number>;
  lastUpdatedMap: Map<string, string>;
  totalAssetValue: number;
}

export async function AssetsSection({
  assets,
  priceMap,
  prevPriceMap,
  lastUpdatedMap,
  totalAssetValue,
}: AssetsSectionProps) {
  const { language, householdLocale } = await getAuthenticatedHouseholdContext();
  const t = (key: string) => dictT(language, key);

  return (
    <section className="space-y-1">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t("assets.title")}
          </h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            {t("money.accounts.total")}:{" "}
            {formatVndCompact(totalAssetValue, householdLocale)}
          </p>
        </div>
        <CreateAssetDialog />
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={t("money.assets.empty.title")}
          description={t("money.assets.empty.description")}
        />
      ) : (
        <>
          {/* Portfolio allocation bar */}
          {totalAssetValue > 0 && (
            <PortfolioAllocationBar
              assets={assets}
              priceMap={priceMap}
              totalAssetValue={totalAssetValue}
              t={t}
            />
          )}

          <div className="grid grid-cols-1 gap-3">
            {assets.map((asset) => {
              const colors = getAssetColors(asset.asset_class);
              const Icon = getAssetIcon(asset.asset_class);
              const price = priceMap.get(asset.id) ?? 0;
              const prevPrice = prevPriceMap.get(asset.id) ?? price;
              const value = Number(asset.quantity) * price;
              const changePct =
                prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;
              const isPositive = changePct >= 0;
              const updatedDate = lastUpdatedMap.get(asset.id);

              return (
                <Link key={asset.id} href={`/assets/${asset.id}`}>
                  <Card
                    className={cn(
                      "border-none shadow-xs transition-all duration-200 hover:shadow-md",
                      colors.bg,
                    )}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div
                        className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs",
                          colors.icon,
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          {getClassLabel(asset.asset_class, t)}
                        </p>
                        <h3 className="font-bold text-slate-900 truncate">
                          {asset.name}
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {formatNumber(asset.quantity, householdLocale)}{" "}
                          {asset.unit_label} ·{" "}
                          {updatedDate
                            ? formatDate(updatedDate, householdLocale)
                            : "---"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900">
                          {formatVndCompact(value, householdLocale)}
                        </p>
                        <div className="flex items-center justify-end text-[10px] mt-0.5">
                          <span
                            className={cn(
                              "flex items-center gap-0.5 font-bold",
                              isPositive ? "text-emerald-600" : "text-rose-600",
                            )}
                          >
                            {isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {isPositive ? "+" : ""}
                            {changePct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

// ─── Sub-component: allocation bar + legend ─────────────────────────────────

function PortfolioAllocationBar({
  assets,
  priceMap,
  totalAssetValue,
  t,
}: {
  assets: AssetRow[];
  priceMap: Map<string, number>;
  totalAssetValue: number;
  t: (key: string) => string;
}) {
  const classTotals = new Map<string, number>();
  let liquidTotal = 0;

  for (const a of assets) {
    const val = Number(a.quantity) * (priceMap.get(a.id) ?? 0);
    classTotals.set(a.asset_class, (classTotals.get(a.asset_class) ?? 0) + val);
    if (a.is_liquid) liquidTotal += val;
  }

  const entries = [...classTotals.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const liquidPct = Math.round((liquidTotal / totalAssetValue) * 100);

  return (
    <div className="space-y-2 mb-3">
      {/* Allocation bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden bg-muted">
        {entries.map(([cls, val]) => {
          const pct = (val / totalAssetValue) * 100;
          return (
            <div
              key={cls}
              style={{ width: `${pct}%` }}
              className={cn("h-full", ASSET_CLASS_BAR_COLORS[cls] ?? "bg-slate-500")}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {entries.map(([cls, val]) => {
          const pct = Math.round((val / totalAssetValue) * 100);
          const textColor = ASSET_CLASS_TEXT_COLORS[cls] ?? "text-slate-500";
          return (
            <div
              key={cls}
              className="flex items-center gap-1.5 text-[10px] font-bold"
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  textColor.replace("text-", "bg-"),
                )}
              />
              <span className="text-slate-500 uppercase">
                {getClassLabel(cls, t)}
              </span>
              <span className="text-slate-900">{pct}%</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 text-[10px] font-bold border-l pl-4 ml-auto">
          <span className="text-slate-500 uppercase">{t("assets.liquidity.liquid")}</span>
          <span
            className={cn(
              liquidPct > 50 ? "text-emerald-600" : "text-amber-600",
            )}
          >
            {liquidPct}%
          </span>
        </div>
      </div>
    </div>
  );
}
