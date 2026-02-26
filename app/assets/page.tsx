import Link from "next/link";
import { Plus } from "lucide-react";

import { CreateAssetForm } from "@/app/assets/_components/create-asset-form";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Button } from "@/components/ui/button";
import { formatNumber, formatVnd } from "@/lib/dashboard/format";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Assets | Family Finances",
};

type AssetRow = {
  id: string;
  name: string;
  asset_class: string;
  unit_label: string;
  quantity: number;
  is_liquid: boolean;
};

export default async function AssetsPage() {
  const { householdId, language, householdLocale } = await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
  const supabase = await createClient();

  const assetResult = await supabase
    .from("assets")
    .select("id, name, asset_class, unit_label, quantity, is_liquid")
    .eq("household_id", householdId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  const assets = (assetResult.data ?? []) as AssetRow[];

  const priceMap = new Map<string, number>();
  if (assets.length > 0) {
    const priceRows = await supabase
      .from("asset_price_history")
      .select("asset_id, unit_price, as_of_date")
      .in(
        "asset_id",
        assets.map((asset) => asset.id),
      )
      .order("as_of_date", { ascending: false });

    for (const row of priceRows.data ?? []) {
      if (!priceMap.has(row.asset_id)) {
        priceMap.set(row.asset_id, Number(row.unit_price));
      }
    }
  }

  return (
    <AppShell
      header={<AppHeader title={t(language, "assets.title")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              {vi ? "Thêm tài sản mới" : "Add New Asset"}
            </h2>
          </div>
          <CreateAssetForm />
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {vi ? "Danh mục tài sản" : "Portfolio Register"}
          </h2>

          {assetResult.error ? (
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
              {assetResult.error.message}
            </div>
          ) : assets.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 italic">
              {vi ? "Chưa theo dõi tài sản nào. Hãy thêm tài sản đầu tiên ở trên." : "No assets tracked yet. Add your first holding above."}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {assets.map((asset) => {
                const latestPrice = priceMap.get(asset.id) ?? 0;
                const value = Number(asset.quantity) * latestPrice;
                const assetClassLabel = asset.asset_class === "gold"
                  ? (vi ? "Vàng" : "Gold")
                  : asset.asset_class === "mutual_fund"
                    ? (vi ? "Quỹ mở" : "Mutual fund")
                    : asset.asset_class === "real_estate"
                      ? (vi ? "Bất động sản" : "Real estate")
                      : asset.asset_class === "savings_deposit"
                        ? (vi ? "Tiền gửi tiết kiệm" : "Savings deposit")
                        : asset.asset_class === "stock"
                          ? (vi ? "Cổ phiếu" : "Stock")
                          : asset.asset_class === "other"
                            ? (vi ? "Khác" : "Other")
                            : asset.asset_class.replace(/_/g, " ");

                return (
                  <li key={asset.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {asset.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {assetClassLabel} ·{" "}
                          {asset.is_liquid ? (vi ? "Thanh khoản" : "Liquid") : (vi ? "Kém thanh khoản" : "Illiquid")}
                        </p>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-lg font-semibold text-slate-900">
                            {formatVnd(value, householdLocale)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatNumber(Number(asset.quantity), householdLocale)}{" "}
                            {asset.unit_label}
                          </span>
                        </div>
                      </div>

                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/assets/${asset.id}`}>{t(language, "common.details")}</Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </div>
    </AppShell>
  );
}
