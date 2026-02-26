import Link from "next/link";

import { CreateAssetForm } from "@/app/assets/_components/create-asset-form";
import { formatVnd } from "@/lib/dashboard/format";
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
  const { householdId } = await getAuthenticatedHouseholdContext();
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
      .in("asset_id", assets.map((asset) => asset.id))
      .order("as_of_date", { ascending: false });

    for (const row of priceRows.data ?? []) {
      if (!priceMap.has(row.asset_id)) {
        priceMap.set(row.asset_id, Number(row.unit_price));
      }
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <section className="mx-auto w-full max-w-3xl space-y-4">
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Assets Module</p>
          <h1 className="text-2xl font-semibold text-slate-900">Track assets and valuations</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage quantity and price snapshots to keep your net worth timeline accurate.
          </p>
        </header>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Add Asset</h2>
          <p className="mt-1 text-sm text-slate-600">Create a new asset with initial quantity and price.</p>
          <div className="mt-4">
            <CreateAssetForm />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Your Assets</h2>

          {assetResult.error ? (
            <p className="mt-2 text-sm text-rose-600">{assetResult.error.message}</p>
          ) : assets.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No assets yet. Add your first asset above.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {assets.map((asset) => {
                const latestPrice = priceMap.get(asset.id) ?? 0;
                const value = Number(asset.quantity) * latestPrice;

                return (
                  <li key={asset.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{asset.name}</p>
                        <p className="text-xs text-slate-500">{asset.asset_class} · {asset.is_liquid ? "Liquid" : "Illiquid"}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {Number(asset.quantity).toLocaleString("en-US")} {asset.unit_label} · Latest value {formatVnd(value)}
                        </p>
                      </div>

                      <Link
                        href={`/assets/${asset.id}`}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Open
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
