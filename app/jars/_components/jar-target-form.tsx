"use client";

import { useActionState, useTransition } from "react";

import { upsertJarMonthlyTargetAction } from "@/app/jars/actions";
import {
  initialJarActionState,
  type JarActionState,
} from "@/app/jars/action-types";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";

type Props = {
  jarId: string;
  month: string;
  defaultMode: "fixed" | "percent";
  defaultValue: number;
  vi: boolean;
};

export function JarTargetForm({
  jarId,
  month,
  defaultMode,
  defaultValue,
  vi,
}: Props) {
  const [state, action] = useActionState<JarActionState, FormData>(
    upsertJarMonthlyTargetAction,
    initialJarActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="jarId" value={jarId} />
      <input type="hidden" name="month" value={month} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`target-mode-${jarId}`}>
            {vi ? "Kiểu mục tiêu" : "Target type"}
          </Label>
          <select
            id={`target-mode-${jarId}`}
            name="targetMode"
            defaultValue={defaultMode}
            className="h-[50px] w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"
          >
            <option value="fixed">{vi ? "Số tiền cố định" : "Fixed amount"}</option>
            <option value="percent">{vi ? "% thu nhập tháng" : "% monthly income"}</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`target-value-${jarId}`}>
            {vi ? "Giá trị mục tiêu" : "Target value"}
          </Label>
          <MoneyInput
            id={`target-value-${jarId}`}
            name="targetValue"
            defaultValue={defaultValue}
            className="h-[50px] rounded-xl border-slate-300"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? (vi ? "Đang lưu..." : "Saving...") : vi ? "Lưu mục tiêu" : "Save target"}
      </button>

      <p className="text-xs text-muted-foreground">
        {state.status === "error" ? state.message : state.status === "success" ? state.message : ""}
      </p>
    </form>
  );
}
