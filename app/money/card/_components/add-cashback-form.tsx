"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  addCardCashbackAction,
  type InstallmentActionState,
} from "../installment-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { toast } from "sonner";

type Props = {
  cardId: string;
  vi: boolean;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function AddCashbackForm({ cardId, vi }: Props) {
  const [state, action] = useActionState<InstallmentActionState, FormData>(
    addCardCashbackAction,
    { status: "idle", message: "" },
  );
  const [isPending, startTransition] = useTransition();
  const [cashbackDate, setCashbackDate] = useState(todayIsoDate());

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="cardId" value={cardId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="amount">{vi ? "Số tiền hoàn" : "Cashback amount"}</Label>
          <MoneyInput id="amount" name="amount" defaultValue={0} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cashbackDate">{vi ? "Ngày hoàn tiền" : "Cashback date"}</Label>
          <Input
            id="cashbackDate"
            name="cashbackDate"
            type="date"
            value={cashbackDate}
            onChange={(e) => setCashbackDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">{vi ? "Ghi chú" : "Note"}</Label>
        <Input
          id="description"
          name="description"
          placeholder={
            vi ? "VD: Hoàn tiền chi tiêu tháng 2" : "e.g. February statement cashback"
          }
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-sky-600 text-white hover:bg-sky-700"
      >
        {isPending
          ? vi
            ? "Đang xử lý..."
            : "Processing..."
          : vi
            ? "Ghi nhận hoàn tiền"
            : "Record Cashback"}
      </Button>
    </form>
  );
}
