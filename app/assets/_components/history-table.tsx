"use client";

import { useActionState, useTransition } from "react";

import { initialAssetActionState, type AssetActionState } from "@/app/assets/action-types";
import { VndInput } from "@/app/assets/_components/vnd-input";

type QuantityRow = { id: string; as_of_date: string; quantity: number };
type PriceRow = { id: string; as_of_date: string; unit_price: number };

type QuantityTableProps = {
  assetId: string;
  rows: QuantityRow[];
  updateAction: (prev: AssetActionState, formData: FormData) => Promise<AssetActionState>;
};

type PriceTableProps = {
  assetId: string;
  rows: PriceRow[];
  updateAction: (prev: AssetActionState, formData: FormData) => Promise<AssetActionState>;
};

function EmptyRow({ text }: { text: string }) {
  return (
    <tr>
      <td colSpan={3} className="px-3 py-4 text-sm text-slate-500">{text}</td>
    </tr>
  );
}

export function QuantityHistoryTable({ assetId, rows, updateAction }: QuantityTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Date</th>
            <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Quantity</th>
            <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow text="No quantity history yet." />
          ) : (
            rows.map((row) => (
              <QuantityRowEditor key={row.id} assetId={assetId} row={row} updateAction={updateAction} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function QuantityRowEditor({
  assetId,
  row,
  updateAction,
}: {
  assetId: string;
  row: QuantityRow;
  updateAction: (prev: AssetActionState, formData: FormData) => Promise<AssetActionState>;
}) {
  const [state, action] = useActionState<AssetActionState, FormData>(updateAction, initialAssetActionState);
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="px-3 py-2 text-sm text-slate-700">{new Date(row.as_of_date).toLocaleDateString("en-US")}</td>
      <td className="px-3 py-2">
        <form
          className="flex items-center gap-2"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            startTransition(() => action(fd));
          }}
        >
          <input type="hidden" name="assetId" value={assetId} />
          <input type="hidden" name="rowId" value={row.id} />
          <input
            type="number"
            name="quantity"
            min="0"
            step="0.001"
            defaultValue={row.quantity}
            className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900"
          />
          <button type="submit" disabled={isPending} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
            Save
          </button>
        </form>
        {state.status === "error" && state.message ? <p className="mt-1 text-xs text-rose-600">{state.message}</p> : null}
      </td>
      <td className="px-3 py-2 text-xs text-slate-500">{isPending ? "Updating..." : ""}</td>
    </tr>
  );
}

export function PriceHistoryTable({ assetId, rows, updateAction }: PriceTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Date</th>
            <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Unit Price</th>
            <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow text="No price history yet." />
          ) : (
            rows.map((row) => (
              <PriceRowEditor key={row.id} assetId={assetId} row={row} updateAction={updateAction} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function PriceRowEditor({
  assetId,
  row,
  updateAction,
}: {
  assetId: string;
  row: PriceRow;
  updateAction: (prev: AssetActionState, formData: FormData) => Promise<AssetActionState>;
}) {
  const [state, action] = useActionState<AssetActionState, FormData>(updateAction, initialAssetActionState);
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="px-3 py-2 text-sm text-slate-700">{new Date(row.as_of_date).toLocaleDateString("en-US")}</td>
      <td className="px-3 py-2">
        <form
          className="flex items-center gap-2"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            startTransition(() => action(fd));
          }}
        >
          <input type="hidden" name="assetId" value={assetId} />
          <input type="hidden" name="rowId" value={row.id} />
          <div className="w-32">
            <VndInput id={`price-${row.id}`} name="unitPrice" defaultValue={row.unit_price} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900" />
          </div>
          <button type="submit" disabled={isPending} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
            Save
          </button>
        </form>
        {state.status === "error" && state.message ? <p className="mt-1 text-xs text-rose-600">{state.message}</p> : null}
      </td>
      <td className="px-3 py-2 text-xs text-slate-500">{isPending ? "Updating..." : ""}</td>
    </tr>
  );
}
