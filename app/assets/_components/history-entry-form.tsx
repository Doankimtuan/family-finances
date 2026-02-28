"use client";

import { useActionState, useTransition } from "react";

import {
  initialAssetActionState,
  type AssetActionState,
} from "@/app/assets/action-types";
import { MoneyInput } from "@/components/ui/money-input";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Card, CardContent } from "@/components/ui/card";

type HistoryEntryFormProps = {
  assetId: string;
  mode: "quantity" | "price";
  actionFn: (
    prevState: AssetActionState,
    formData: FormData,
  ) => Promise<AssetActionState>;
};

export function HistoryEntryForm({
  assetId,
  mode,
  actionFn,
}: HistoryEntryFormProps) {
  const { language } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState<AssetActionState, FormData>(
    actionFn,
    initialAssetActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="p-4">
        <form
          className="space-y-3"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            startTransition(() => action(fd));
          }}
        >
          <input type="hidden" name="assetId" value={assetId} />

          <p className="text-sm font-semibold text-slate-800">
            {mode === "quantity"
              ? vi
                ? "Thêm / cập nhật số lượng"
                : "Add / Update Quantity"
              : vi
                ? "Thêm / cập nhật đơn giá"
                : "Add / Update Unit Price"}
          </p>

          <div className="space-y-1">
            <label
              htmlFor={`${mode}-date`}
              className="text-sm font-medium text-slate-700"
            >
              {vi ? "Ngày" : "Date"}
            </label>
            <input
              id={`${mode}-date`}
              name="asOfDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
            />
          </div>

          {mode === "quantity" ? (
            <div className="space-y-1">
              <label
                htmlFor="quantity"
                className="text-sm font-medium text-slate-700"
              >
                {vi ? "Số lượng" : "Quantity"}
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                step="0.001"
                defaultValue="0"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label
                htmlFor="unitPrice"
                className="text-sm font-medium text-slate-700"
              >
                {vi ? "Đơn giá (VND)" : "Unit price (VND)"}
              </label>
              <MoneyInput
                id="unitPrice"
                name="unitPrice"
                defaultValue={0}
                className="w-full"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending
              ? vi
                ? "Đang lưu..."
                : "Saving..."
              : vi
                ? "Lưu bản ghi"
                : "Save Entry"}
          </button>

          {state.status === "error" && state.message ? (
            <p className="text-sm text-rose-600">{state.message}</p>
          ) : null}
          {state.status === "success" && state.message ? (
            <p className="text-sm text-emerald-600">{state.message}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
