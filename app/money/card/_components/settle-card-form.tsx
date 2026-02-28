"use client";

import { useActionState, useTransition, useState, useEffect } from "react";
import { settleCardAction } from "../installment-actions";
import { MoneyInput } from "@/components/ui/money-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Props = {
  cardId: string;
  currentBalance: number;
  vi: boolean;
};

export function SettleCardForm({ cardId, currentBalance, vi }: Props) {
  const [state, action] = useActionState(settleCardAction, {
    status: "idle",
    message: "",
  } as const);
  const [isPending, startTransition] = useTransition();
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function fetchAccounts() {
      const supabase = createClient();
      const { data } = await supabase
        .from("accounts")
        .select("id, name")
        .neq("id", cardId)
        .eq("is_archived", false);
      if (data) setAccounts(data);
    }
    fetchAccounts();
  }, [cardId]);

  useEffect(() => {
    if (state?.status === "success") {
      toast.success(state.message);
    } else if (state?.status === "error") {
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
          <Label htmlFor="sourceAccountId">
            {vi ? "Từ tài khoản" : "From Account"}
          </Label>
          <Select name="sourceAccountId" required>
            <SelectTrigger>
              <SelectValue
                placeholder={vi ? "Chọn nguồn tiền" : "Select source"}
              />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="amount">
            {vi ? "Số tiền tất toán" : "Settlement Amount"}
          </Label>
          <MoneyInput id="amount" name="amount" defaultValue={currentBalance} />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        variant="default"
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {isPending
          ? vi
            ? "Đang xử lý..."
            : "Processing..."
          : vi
            ? "Xác nhận tất toán"
            : "Settle Now"}
      </Button>
    </form>
  );
}
