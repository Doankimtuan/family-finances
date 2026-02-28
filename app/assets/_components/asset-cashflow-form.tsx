"use client";

import { useActionState, useTransition } from "react";
import { addAssetCashflowAction } from "@/app/assets/cashflow-actions";
import {
  initialAssetActionState,
  type AssetActionState,
} from "@/app/assets/action-types";
import { MoneyInput } from "@/components/ui/money-input";
import { useI18n } from "@/lib/providers/i18n-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AccountOption = { id: string; name: string };

type AssetCashflowFormProps = {
  assetId: string;
  accounts: AccountOption[];
};

export function AssetCashflowForm({
  assetId,
  accounts,
}: AssetCashflowFormProps) {
  const { language, t } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState<AssetActionState, FormData>(
    addAssetCashflowAction,
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
        event.currentTarget.reset();
      }}
    >
      <input type="hidden" name="assetId" value={assetId} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="flowType"
            className="text-sm font-medium text-slate-700"
          >
            {vi ? "Loại giao dịch" : "Transaction type"}
          </label>
          <Select name="flowType" defaultValue="contribution">
            <SelectTrigger
              id="flowType"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-base text-slate-900"
            >
              <SelectValue placeholder={vi ? "Chọn loại" : "Select type"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contribution">
                {t("assets.contribution")}
              </SelectItem>
              <SelectItem value="withdrawal">
                {t("assets.withdrawal")}
              </SelectItem>
              <SelectItem value="income">{t("assets.income")}</SelectItem>
              <SelectItem value="fee">{t("assets.fee")}</SelectItem>
              <SelectItem value="tax">{t("assets.tax")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="flowDate"
            className="text-sm font-medium text-slate-700"
          >
            {vi ? "Ngày" : "Date"}
          </label>
          <input
            id="flowDate"
            name="flowDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2 shadow-sm rounded-xl border border-slate-200 p-2 bg-slate-50/50">
          <label
            htmlFor="accountId"
            className="text-sm font-medium text-slate-700 block mb-1 px-1"
          >
            {vi ? "Tài khoản thanh toán" : "Funding Account"}
          </label>
          <Select name="accountId" required>
            <SelectTrigger
              id="accountId"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-base text-slate-900"
            >
              <SelectValue
                placeholder={vi ? "Chọn tài khoản" : "Select account"}
              />
            </SelectTrigger>
            <SelectContent>
              {accounts.length === 0 ? (
                <SelectItem value="..." disabled>
                  {vi ? "Chưa có tài khoản nào" : "No accounts available"}
                </SelectItem>
              ) : (
                accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="amount" className="text-sm font-medium text-slate-700">
          {vi ? "Số tiền (VND)" : "Amount (VND)"}
        </label>
        <MoneyInput id="amount" name="amount" className="w-full" />
      </div>

      <div className="space-y-1">
        <label htmlFor="note" className="text-sm font-medium text-slate-700">
          {vi ? "Ghi chú" : "Note"}
        </label>
        <input
          id="note"
          name="note"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
          placeholder={vi ? "VD: Mua thêm BTC" : "e.g. Bought more BTC"}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 transition-colors"
      >
        {isPending ? t("common.saving") : t("common.saving").replace("...", "")}
      </button>

      {state.status === "error" && state.message ? (
        <p className="text-sm text-rose-600">{state.message}</p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}
    </form>
  );
}
