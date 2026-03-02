"use client";

import { useActionState, useTransition } from "react";

import { addJarLedgerEntryAction } from "@/app/jars/actions";
import {
  initialJarActionState,
  type JarActionState,
} from "@/app/jars/action-types";

type Props = {
  jarId: string;
  month: string;
  vi: boolean;
};

export function JarAllocateWithdrawForm({ jarId, month, vi }: Props) {
  const [state, action] = useActionState<JarActionState, FormData>(
    addJarLedgerEntryAction,
    initialJarActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid grid-cols-1 gap-2 md:grid-cols-5"
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="jarId" value={jarId} />
      <input type="hidden" name="month" value={month} />

      <select
        name="entryType"
        defaultValue="allocate"
        className="rounded-lg border px-2 py-2 text-sm"
      >
        <option value="allocate">{vi ? "Phân bổ" : "Allocate"}</option>
        <option value="withdraw">{vi ? "Rút" : "Withdraw"}</option>
        <option value="adjust">{vi ? "Điều chỉnh" : "Adjust"}</option>
      </select>

      <input
        type="number"
        name="amount"
        min={1}
        placeholder={vi ? "Số tiền" : "Amount"}
        className="rounded-lg border px-2 py-2 text-sm"
        required
      />

      <input
        type="date"
        name="entryDate"
        className="rounded-lg border px-2 py-2 text-sm"
      />

      <input
        type="text"
        name="note"
        placeholder={vi ? "Ghi chú" : "Note"}
        className="rounded-lg border px-2 py-2 text-sm"
      />

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {isPending ? (vi ? "Đang lưu..." : "Saving...") : vi ? "Lưu giao dịch" : "Save entry"}
      </button>

      <p className="text-xs text-muted-foreground md:col-span-5">
        {state.status === "error" ? state.message : state.status === "success" ? state.message : ""}
      </p>
    </form>
  );
}
