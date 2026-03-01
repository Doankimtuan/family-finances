"use client";

import { useActionState, useTransition } from "react";

import { updateAssumptionsAction } from "@/app/settings/actions";
import {
  initialSettingsActionState,
  type SettingsActionState,
} from "@/app/settings/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type AssumptionDefaults = {
  inflationAnnual: number;
  cashReturnAnnual: number;
  investmentReturnAnnual: number;
  propertyGrowthAnnual: number;
  goldGrowthAnnual: number;
  salaryGrowthAnnual: number;
};

function PercentInput({
  id,
  name,
  label,
  defaultValue,
  note,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: number;
  note: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step="0.1"
          required
          defaultValue={defaultValue.toFixed(1)}
          className="rounded-xl pr-8 font-mono"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
          %
        </span>
      </div>
      <p className="text-[10px] leading-tight text-muted-foreground font-medium px-1">
        {note}
      </p>
    </div>
  );
}

export function AssumptionsForm({
  defaults,
}: {
  defaults: AssumptionDefaults;
}) {
  const { language, t } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState<SettingsActionState, FormData>(
    updateAssumptionsAction,
    initialSettingsActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <PercentInput
          id="inflationAnnual"
          name="inflationAnnual"
          label={vi ? "Lạm phát" : "Inflation"}
          defaultValue={defaults.inflationAnnual}
          note={
            vi
              ? "Dùng cho lợi suất thực và sức mua của mục tiêu."
              : "Used for real return and goal purchasing power."
          }
        />
        <PercentInput
          id="salaryGrowthAnnual"
          name="salaryGrowthAnnual"
          label={vi ? "Tăng trưởng thu nhập" : "Salary growth"}
          defaultValue={defaults.salaryGrowthAnnual}
          note={
            vi
              ? "Dùng trong dự báo dòng tiền dài hạn."
              : "Used in long-horizon cash-flow projections."
          }
        />
        <PercentInput
          id="cashReturnAnnual"
          name="cashReturnAnnual"
          label={vi ? "Lợi suất tiền mặt" : "Cash return"}
          defaultValue={defaults.cashReturnAnnual}
          note={
            vi
              ? "Tăng trưởng kỳ vọng của tiền gửi/tài khoản tiền mặt."
              : "Savings deposit / cash account expected growth."
          }
        />
        <PercentInput
          id="investmentReturnAnnual"
          name="investmentReturnAnnual"
          label={vi ? "Lợi suất đầu tư" : "Investment return"}
          defaultValue={defaults.investmentReturnAnnual}
          note={
            vi
              ? "Lợi suất cơ sở kỳ vọng của quỹ mở/cổ phiếu."
              : "Mutual funds/stocks expected baseline return."
          }
        />
        <PercentInput
          id="propertyGrowthAnnual"
          name="propertyGrowthAnnual"
          label={vi ? "Bất động sản" : "Property growth"}
          defaultValue={defaults.propertyGrowthAnnual}
          note={
            vi
              ? "Giả định tăng giá đất/bất động sản."
              : "Land/property appreciation assumption."
          }
        />
        <PercentInput
          id="goldGrowthAnnual"
          name="goldGrowthAnnual"
          label={vi ? "Vàng" : "Gold growth"}
          defaultValue={defaults.goldGrowthAnnual}
          note={
            vi
              ? "Dùng cho các kịch bản tài sản vàng."
              : "Used for gold wealth trajectory scenarios."
          }
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl py-6 text-sm font-bold tracking-wide"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("common.saving")}
          </>
        ) : vi ? (
          "Lưu giả định"
        ) : (
          "Save Assumptions"
        )}
      </Button>

      {state.status === "error" && state.message && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/30 dark:bg-rose-950/20 px-4 py-3 text-rose-800 dark:text-rose-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">{state.message}</p>
        </div>
      )}

      {state.status === "success" && state.message && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/20 px-4 py-3 text-emerald-800 dark:text-emerald-400">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">{state.message}</p>
        </div>
      )}
    </form>
  );
}
