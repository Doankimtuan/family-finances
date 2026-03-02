"use client";

import { useActionState, useTransition } from "react";

import { upsertJarMonthlyTargetAction } from "@/app/jars/actions";
import {
  initialJarActionState,
  type JarActionState,
} from "@/app/jars/action-types";

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
      className="grid grid-cols-1 gap-2 md:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="jarId" value={jarId} />
      <input type="hidden" name="month" value={month} />

      <select
        name="targetMode"
        defaultValue={defaultMode}
        className="rounded-lg border px-2 py-2 text-sm"
      >
        <option value="fixed">{vi ? "Số tiền cố định" : "Fixed amount"}</option>
        <option value="percent">{vi ? "% thu nhập tháng" : "% monthly income"}</option>
      </select>

      <input
        name="targetValue"
        type="number"
        min={0}
        defaultValue={defaultValue}
        className="rounded-lg border px-2 py-2 text-sm"
      />

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? (vi ? "Đang lưu..." : "Saving...") : vi ? "Lưu mục tiêu" : "Save target"}
      </button>

      <p className="text-xs text-muted-foreground">
        {state.status === "error" ? state.message : state.status === "success" ? state.message : ""}
      </p>
    </form>
  );
}
