import Link from "next/link";
import { notFound } from "next/navigation";

import {
  upsertPriceHistoryAction,
  upsertQuantityHistoryAction,
  updatePriceHistoryRowAction,
  updateQuantityHistoryRowAction,
} from "@/app/assets/actions";
import { HistoryEntryForm } from "@/app/assets/_components/history-entry-form";
import { PriceHistoryTable, QuantityHistoryTable } from "@/app/assets/_components/history-table";
import { ValuationTimeline } from "@/app/assets/_components/valuation-timeline";
import { buildValuationTimeline } from "@/lib/assets/timeline";
import { formatNumber, formatVnd } from "@/lib/dashboard/format";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

type AssetDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { id } = await params;
  const { householdId, householdLocale, language } = await getAuthenticatedHouseholdContext();
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

  const [quantityResult, priceResult] = await Promise.all([
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
  ]);

  const quantityHistory = quantityResult.data ?? [];
  const priceHistory = priceResult.data ?? [];

  const timeline = buildValuationTimeline(
    quantityHistory.map((row) => ({ id: row.id, as_of_date: row.as_of_date, quantity: Number(row.quantity) })),
    priceHistory.map((row) => ({ id: row.id, as_of_date: row.as_of_date, unit_price: Number(row.unit_price) })),
  );

  const latest = timeline[timeline.length - 1];
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
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <section className="mx-auto w-full max-w-4xl space-y-4">
        <header className="space-y-2">
          <Link href="/assets" className="text-sm font-medium text-slate-600">← {vi ? "Quay lại Tài sản" : "Back to Assets"}</Link>
          <h1 className="text-2xl font-semibold text-slate-900">{asset.name}</h1>
          <p className="text-sm text-slate-600">{assetClassLabel} · {asset.is_liquid ? (vi ? "Thanh khoản" : "Liquid") : (vi ? "Kém thanh khoản" : "Illiquid")}</p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{vi ? "Số lượng hiện tại" : "Current Quantity"}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatNumber((latest?.quantity ?? Number(asset.quantity)), householdLocale)} {asset.unit_label}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{vi ? "Đơn giá hiện tại" : "Current Unit Price"}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatVnd(latest?.unitPrice ?? 0, householdLocale)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{vi ? "Giá trị hiện tại" : "Current Value"}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatVnd(latest?.value ?? 0, householdLocale)}</p>
          </article>
        </div>

        <ValuationTimeline data={timeline} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <HistoryEntryForm assetId={asset.id} mode="quantity" actionFn={upsertQuantityHistoryAction} />
          <HistoryEntryForm assetId={asset.id} mode="price" actionFn={upsertPriceHistoryAction} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">{vi ? "Lịch sử số lượng" : "Quantity History"}</h2>
            <QuantityHistoryTable
              assetId={asset.id}
              rows={quantityHistory.map((row) => ({ id: row.id, as_of_date: row.as_of_date, quantity: Number(row.quantity) }))}
              updateAction={updateQuantityHistoryRowAction}
            />
          </article>

          <article className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">{vi ? "Lịch sử giá" : "Price History"}</h2>
            <PriceHistoryTable
              assetId={asset.id}
              rows={priceHistory.map((row) => ({ id: row.id, as_of_date: row.as_of_date, unit_price: Number(row.unit_price) }))}
              updateAction={updatePriceHistoryRowAction}
            />
          </article>
        </div>
      </section>
    </main>
  );
}
