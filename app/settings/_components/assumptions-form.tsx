"use client";

import { useActionState, useTransition } from "react";

import { updateAssumptionsAction } from "@/app/settings/actions";
import { initialSettingsActionState, type SettingsActionState } from "@/app/settings/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";

type AssumptionDefaults = {
  inflationAnnual: number;
  cashReturnAnnual: number;
  investmentReturnAnnual: number;
  propertyGrowthAnnual: number;
  goldGrowthAnnual: number;
  salaryGrowthAnnual: number;
};

function PercentInput({ id, name, label, defaultValue, note }: { id: string; name: string; label: string; defaultValue: number; note: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="decimal"
        min={0}
        max={100}
        step="0.1"
        required
        defaultValue={defaultValue.toFixed(1)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
      />
      <p className="text-xs text-slate-500">{note}</p>
    </div>
  );
}

export function AssumptionsForm({ defaults }: { defaults: AssumptionDefaults }) {
  const { language, t } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState<SettingsActionState, FormData>(
    updateAssumptionsAction,
    initialSettingsActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PercentInput id="inflationAnnual" name="inflationAnnual" label={vi ? "Lạm phát (năm %)" : "Inflation (annual %)"} defaultValue={defaults.inflationAnnual} note={vi ? "Dùng cho lợi suất thực và sức mua của mục tiêu." : "Used for real return and goal purchasing power."} />
        <PercentInput id="salaryGrowthAnnual" name="salaryGrowthAnnual" label={vi ? "Tăng trưởng thu nhập (năm %)" : "Salary growth (annual %)"} defaultValue={defaults.salaryGrowthAnnual} note={vi ? "Dùng trong dự báo dòng tiền dài hạn." : "Used in long-horizon cash-flow projections."} />
        <PercentInput id="cashReturnAnnual" name="cashReturnAnnual" label={vi ? "Lợi suất tiền mặt (năm %)" : "Cash return (annual %)"} defaultValue={defaults.cashReturnAnnual} note={vi ? "Tăng trưởng kỳ vọng của tiền gửi/tài khoản tiền mặt." : "Savings deposit / cash account expected growth."} />
        <PercentInput id="investmentReturnAnnual" name="investmentReturnAnnual" label={vi ? "Lợi suất đầu tư (năm %)" : "Investment return (annual %)"} defaultValue={defaults.investmentReturnAnnual} note={vi ? "Lợi suất cơ sở kỳ vọng của quỹ mở/cổ phiếu." : "Mutual funds/stocks expected baseline return."} />
        <PercentInput id="propertyGrowthAnnual" name="propertyGrowthAnnual" label={vi ? "Tăng trưởng bất động sản (năm %)" : "Property growth (annual %)"} defaultValue={defaults.propertyGrowthAnnual} note={vi ? "Giả định tăng giá đất/bất động sản." : "Land/property appreciation assumption."} />
        <PercentInput id="goldGrowthAnnual" name="goldGrowthAnnual" label={vi ? "Tăng trưởng vàng (năm %)" : "Gold growth (annual %)"} defaultValue={defaults.goldGrowthAnnual} note={vi ? "Dùng cho các kịch bản tài sản vàng." : "Used for gold wealth trajectory scenarios."} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? t("common.saving") : (vi ? "Lưu giả định" : "Save Assumptions")}
      </button>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
