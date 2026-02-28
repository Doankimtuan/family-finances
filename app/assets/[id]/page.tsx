import Link from "next/link";
import { notFound } from "next/navigation";

import {
  upsertPriceHistoryAction,
  upsertQuantityHistoryAction,
  updatePriceHistoryRowAction,
  updateQuantityHistoryRowAction,
} from "@/app/assets/actions";
import { HistoryEntryForm } from "@/app/assets/_components/history-entry-form";
import {
  PriceHistoryTable,
  QuantityHistoryTable,
} from "@/app/assets/_components/history-table";
import { ValuationTimeline } from "@/app/assets/_components/valuation-timeline";
import { DeleteAssetButton } from "@/app/assets/_components/delete-asset-button";
import { AssetCashflowForm } from "@/app/assets/_components/asset-cashflow-form";
import { Card, CardContent } from "@/components/ui/card";
import { buildValuationTimeline } from "@/lib/assets/timeline";
import { formatNumber, formatVnd } from "@/lib/dashboard/format";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

type AssetDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AssetDetailPage({
  params,
}: AssetDetailPageProps) {
  const { id } = await params;
  const { householdId, householdLocale, language } =
    await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
  const supabase = await createClient();

  const assetResult = await supabase
    .from("assets")
    .select("id, name, asset_class, unit_label, quantity, is_liquid")
    .eq("household_id", householdId)
    .eq("id", id)
    .maybeSingle();

  if (assetResult.error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <section className="mx-auto w-full max-w-3xl rounded-2xl border border-rose-200 bg-white p-5">
          <p className="text-sm text-rose-700">{assetResult.error.message}</p>
        </section>
      </main>
    );
  }

  const asset = assetResult.data;
  if (!asset) {
    notFound();
  }

  const [quantityResult, priceResult, cashflowResult, accountsResult] =
    await Promise.all([
      supabase
        .from("asset_quantity_history")
        .select("id, as_of_date, quantity")
        .eq("asset_id", asset.id)
        .eq("household_id", householdId)
        .order("as_of_date", { ascending: false }),
      supabase
        .from("asset_price_history")
        .select("id, as_of_date, unit_price")
        .eq("asset_id", asset.id)
        .eq("household_id", householdId)
        .order("as_of_date", { ascending: false }),
      supabase
        .from("asset_cashflows")
        .select(
          "id, flow_date, flow_type, amount, source_account_id, destination_account_id, note",
        )
        .eq("asset_id", asset.id)
        .eq("household_id", householdId)
        .order("flow_date", { ascending: false }),
      supabase
        .from("accounts")
        .select("id, name")
        .eq("household_id", householdId)
        .eq("is_archived", false)
        .order("created_at", { ascending: true }),
    ]);

  const quantityHistory = quantityResult.data ?? [];
  const priceHistory = priceResult.data ?? [];
  const cashflows = cashflowResult.data ?? [];
  const accounts = accountsResult.data ?? [];
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  const timeline = buildValuationTimeline(
    quantityHistory.map((row) => ({
      id: row.id,
      as_of_date: row.as_of_date,
      quantity: Number(row.quantity),
    })),
    priceHistory.map((row) => ({
      id: row.id,
      as_of_date: row.as_of_date,
      unit_price: Number(row.unit_price),
    })),
  );

  const latest = timeline[timeline.length - 1];
  const currentValue = latest?.value ?? 0;

  // Investment Metrics
  let totalInvested = 0;
  for (const cf of cashflows) {
    if (cf.flow_type === "contribution") totalInvested += Number(cf.amount);
    if (cf.flow_type === "withdrawal") totalInvested -= Number(cf.amount);
  }

  const unrealizedPnl = currentValue - totalInvested;
  const roi = totalInvested > 0 ? (unrealizedPnl / totalInvested) * 100 : 0;

  const assetClassLabel =
    asset.asset_class === "gold"
      ? vi
        ? "Vàng"
        : "Gold"
      : asset.asset_class === "mutual_fund"
        ? vi
          ? "Quỹ mở"
          : "Mutual fund"
        : asset.asset_class === "real_estate"
          ? vi
            ? "Bất động sản"
            : "Real estate"
          : asset.asset_class === "savings_deposit"
            ? vi
              ? "Tiền gửi tiết kiệm"
              : "Savings deposit"
            : asset.asset_class === "stock"
              ? vi
                ? "Cổ phiếu"
                : "Stock"
              : asset.asset_class === "crypto"
                ? vi
                  ? "Tiền mã hóa"
                  : "Cryptocurrency"
                : asset.asset_class === "other"
                  ? vi
                    ? "Khác"
                    : "Other"
                  : asset.asset_class.replace(/_/g, " ");

  const isTracker = ["mutual_fund", "stock", "crypto", "real_estate"].includes(
    asset.asset_class,
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <section className="mx-auto w-full max-w-4xl space-y-4">
        <header className="space-y-2">
          <Link href="/money" className="text-sm font-medium text-slate-600">
            ← {vi ? "Quay lại Tài sản" : "Back to Assets"}
          </Link>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">
              {asset.name}
            </h1>
            <DeleteAssetButton assetId={asset.id} language={language} />
          </div>
          <p className="text-sm text-slate-600">
            {assetClassLabel} ·{" "}
            {asset.is_liquid
              ? vi
                ? "Thanh khoản"
                : "Liquid"
              : vi
                ? "Kém thanh khoản"
                : "Illiquid"}
          </p>
        </header>

        {isTracker && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 bg-teal-50 border border-teal-100 rounded-xl p-3">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-teal-800 tracking-wider pt-1">
                {vi ? "Tổng vốn" : "Total Invested"}
              </p>
              <p className="font-semibold text-teal-900">
                {formatVnd(totalInvested, householdLocale)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-teal-800 tracking-wider pt-1">
                {vi ? "Lãi/Lỗ tạm tính" : "Unrealized PNL"}
              </p>
              <p
                className={`font-semibold ${unrealizedPnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}
              >
                {unrealizedPnl >= 0 ? "+" : ""}
                {formatVnd(unrealizedPnl, householdLocale)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-teal-800 tracking-wider pt-1">
                {vi ? "Tỷ suất sinh lời" : "ROI"}
              </p>
              <p
                className={`font-semibold ${unrealizedPnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}
              >
                {unrealizedPnl >= 0 ? "+" : ""}
                {roi.toFixed(1)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-teal-800 tracking-wider pt-1">
                {vi ? "Hiện tại" : "Current Value"}
              </p>
              <p className="font-bold text-teal-900">
                {formatVnd(currentValue, householdLocale)}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                {vi ? "Số lượng hiện tại" : "Current Quantity"}
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {formatNumber(
                  latest?.quantity ?? Number(asset.quantity),
                  householdLocale,
                )}{" "}
                {asset.unit_label}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                {vi ? "Đơn giá hiện tại" : "Current Unit Price"}
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {formatVnd(latest?.unitPrice ?? 0, householdLocale)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                {vi ? "Giá trị hiện tại" : "Current Value"}
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {formatVnd(currentValue, householdLocale)}
              </p>
            </CardContent>
          </Card>
        </div>

        <ValuationTimeline data={timeline} />

        {isTracker && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {vi
                  ? "Quản lý dòng tiền đầu tư"
                  : "Manage Investment Cash Flows"}
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AssetCashflowForm
                  assetId={asset.id}
                  accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
                />

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700">
                    {vi ? "Lịch sử dòng tiền" : "History"}
                  </h3>
                  <ul className="space-y-2">
                    {cashflows.length === 0 ? (
                      <li className="text-sm text-slate-500 italic">
                        {vi ? "Chưa có dòng tiền nào." : "No cash flows yet."}
                      </li>
                    ) : (
                      cashflows.slice(0, 10).map((cf) => {
                        const isOutbound = [
                          "contribution",
                          "fee",
                          "tax",
                        ].includes(cf.flow_type);
                        const sign = isOutbound ? "+" : "-";
                        const accountId = isOutbound
                          ? cf.source_account_id
                          : cf.destination_account_id;
                        const accountName = accountId
                          ? (accountMap.get(accountId) ?? "Unknown account")
                          : "Unknown account";
                        const cfLabel = vi
                          ? cf.flow_type === "contribution"
                            ? "Đóng góp/Mua"
                            : cf.flow_type === "withdrawal"
                              ? "Rút tiền/Bán"
                              : cf.flow_type === "income"
                                ? "Thu nhập"
                                : cf.flow_type === "fee"
                                  ? "Phí"
                                  : "Thuế"
                          : cf.flow_type;

                        return (
                          <li
                            key={cf.id}
                            className="text-sm flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100"
                          >
                            <div>
                              <p className="font-semibold text-slate-900 uppercase text-[10px] tracking-wider">
                                {cfLabel}
                              </p>
                              <p className="text-xs text-slate-500">
                                {cf.flow_date} · {accountName}
                              </p>
                            </div>
                            <div
                              className={`font-bold ${isOutbound ? "text-emerald-600" : "text-rose-600"}`}
                            >
                              {sign}
                              {formatVnd(Number(cf.amount), householdLocale)}
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <HistoryEntryForm
            assetId={asset.id}
            mode="quantity"
            actionFn={upsertQuantityHistoryAction}
          />
          <HistoryEntryForm
            assetId={asset.id}
            mode="price"
            actionFn={upsertPriceHistoryAction}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">
              {vi ? "Lịch sử số lượng" : "Quantity History"}
            </h2>
            <QuantityHistoryTable
              assetId={asset.id}
              rows={quantityHistory.map((row) => ({
                id: row.id,
                as_of_date: row.as_of_date,
                quantity: Number(row.quantity),
              }))}
              updateAction={updateQuantityHistoryRowAction}
            />
          </article>

          <article className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">
              {vi ? "Lịch sử giá" : "Price History"}
            </h2>
            <PriceHistoryTable
              assetId={asset.id}
              rows={priceHistory.map((row) => ({
                id: row.id,
                as_of_date: row.as_of_date,
                unit_price: Number(row.unit_price),
              }))}
              updateAction={updatePriceHistoryRowAction}
            />
          </article>
        </div>
      </section>
    </main>
  );
}
