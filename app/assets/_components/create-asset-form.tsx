"use client";

import { useActionState, useTransition } from "react";

import { createAssetAction } from "@/app/assets/actions";
import { initialAssetActionState, type AssetActionState } from "@/app/assets/action-types";
import { VndInput } from "@/app/assets/_components/vnd-input";
import { useI18n } from "@/lib/providers/i18n-provider";

export function CreateAssetForm() {
  const { language } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState<AssetActionState, FormData>(
    createAssetAction,
    initialAssetActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">{vi ? "Tên tài sản" : "Asset name"}</label>
        <input id="name" name="name" required className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900" placeholder={vi ? "Vàng SJC" : "SJC Gold"} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="assetClass" className="text-sm font-medium text-slate-700">{vi ? "Loại" : "Class"}</label>
          <select id="assetClass" name="assetClass" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900" defaultValue="gold">
            <option value="gold">{vi ? "Vàng" : "Gold"}</option>
            <option value="mutual_fund">{vi ? "Quỹ mở" : "Mutual Fund"}</option>
            <option value="real_estate">{vi ? "Bất động sản" : "Real Estate"}</option>
            <option value="savings_deposit">{vi ? "Tiền gửi tiết kiệm" : "Savings Deposit"}</option>
            <option value="stock">{vi ? "Cổ phiếu" : "Stock"}</option>
            <option value="other">{vi ? "Khác" : "Other"}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="unitLabel" className="text-sm font-medium text-slate-700">{vi ? "Đơn vị" : "Unit label"}</label>
          <input id="unitLabel" name="unitLabel" defaultValue={vi ? "đơn vị" : "unit"} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="quantity" className="text-sm font-medium text-slate-700">{vi ? "Số lượng" : "Quantity"}</label>
          <input id="quantity" name="quantity" type="number" min="0" step="0.001" defaultValue="1" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900" />
        </div>

        <div className="space-y-1">
          <label htmlFor="unitPrice" className="text-sm font-medium text-slate-700">{vi ? "Đơn giá (VND)" : "Unit price (VND)"}</label>
          <VndInput id="unitPrice" name="unitPrice" defaultValue={0} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900" />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="isLiquid" className="text-sm font-medium text-slate-700">{vi ? "Thanh khoản" : "Liquidity"}</label>
        <select id="isLiquid" name="isLiquid" defaultValue="true" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900">
          <option value="true">{vi ? "Thanh khoản" : "Liquid"}</option>
          <option value="false">{vi ? "Kém thanh khoản" : "Illiquid"}</option>
        </select>
      </div>

      <button type="submit" disabled={isPending} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {isPending ? (vi ? "Đang lưu..." : "Saving...") : (vi ? "Thêm tài sản" : "Add Asset")}
      </button>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
