"use client";

import { useActionState, useTransition } from "react";

import { addJarLedgerEntryAction } from "@/app/jars/actions";
import {
  initialJarActionState,
  type JarActionState,
} from "@/app/jars/action-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";

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
          <Label htmlFor={`entry-type-${jarId}`}>
            {vi ? "Loại giao dịch" : "Entry type"}
          </Label>
          <select
            id={`entry-type-${jarId}`}
            name="entryType"
            defaultValue="allocate"
            className="h-[50px] w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"
          >
            <option value="allocate">{vi ? "Phân bổ" : "Allocate"}</option>
            <option value="withdraw">{vi ? "Rút" : "Withdraw"}</option>
            <option value="adjust">{vi ? "Điều chỉnh" : "Adjust"}</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`entry-amount-${jarId}`}>
            {vi ? "Số tiền" : "Amount"}
          </Label>
          <MoneyInput
            id={`entry-amount-${jarId}`}
            name="amount"
            defaultValue={0}
            required
            className="h-[50px] rounded-xl border-slate-300"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`entry-date-${jarId}`}>
            {vi ? "Ngày giao dịch" : "Entry date"}
          </Label>
          <Input
            id={`entry-date-${jarId}`}
            type="date"
            name="entryDate"
            className="h-[50px] rounded-xl border-slate-300"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`entry-note-${jarId}`}>
            {vi ? "Ghi chú" : "Note"}
          </Label>
          <Input
            id={`entry-note-${jarId}`}
            type="text"
            name="note"
            placeholder={vi ? "Ví dụ: chuyển từ lương tháng này" : "Example: moved from this month's income"}
            className="h-[50px] rounded-xl border-slate-300"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {isPending ? (vi ? "Đang lưu..." : "Saving...") : vi ? "Lưu giao dịch" : "Save entry"}
      </button>

      <p className="text-xs text-muted-foreground">
        {state.status === "error" ? state.message : state.status === "success" ? state.message : ""}
      </p>
    </form>
  );
}
