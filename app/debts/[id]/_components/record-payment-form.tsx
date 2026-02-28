"use client";

import { useActionState, useTransition, useState } from "react";
import {
  recordDebtPaymentAction,
  type DebtPaymentActionState,
} from "@/app/debts/actions";
import { MoneyInput } from "@/components/ui/money-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect } from "react";

type Props = {
  liabilityId: string;
  accounts: { id: string; name: string }[];
  vi: boolean;
};

export function RecordPaymentForm({ liabilityId, accounts, vi }: Props) {
  const [state, action] = useActionState<DebtPaymentActionState, FormData>(
    recordDebtPaymentAction,
    { status: "idle", message: "" },
  );
  const [isPending, startTransition] = useTransition();

  const [totalAmount, setTotalAmount] = useState(0);
  const [principal, setPrincipal] = useState(0);
  const [interest, setInterest] = useState(0);
  const [fee, setFee] = useState(0);

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
      <input type="hidden" name="liabilityId" value={liabilityId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="paymentDate">
            {vi ? "Ngày thanh toán" : "Payment Date"}
          </Label>
          <Input
            id="paymentDate"
            name="paymentDate"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="sourceAccountId">
            {vi ? "Tài khoản trích tiền" : "Source Account"}
          </Label>
          <Select name="sourceAccountId">
            <SelectTrigger>
              <SelectValue
                placeholder={vi ? "Chọn tài khoản" : "Select account"}
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
      </div>

      <div className="space-y-1">
        <Label htmlFor="amount">
          {vi ? "Tổng số tiền trả" : "Total Amount"}
        </Label>
        <MoneyInput
          id="amount"
          name="amount"
          defaultValue={0}
          onValueChange={(val) => setTotalAmount(val || 0)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="principal">{vi ? "Gốc" : "Principal"}</Label>
          <MoneyInput
            id="principal"
            name="principal"
            defaultValue={0}
            onValueChange={(val) => setPrincipal(val || 0)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="interest">{vi ? "Lãi" : "Interest"}</Label>
          <MoneyInput
            id="interest"
            name="interest"
            defaultValue={0}
            onValueChange={(val) => setInterest(val || 0)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fee">{vi ? "Phí" : "Fee"}</Label>
          <MoneyInput
            id="fee"
            name="fee"
            defaultValue={0}
            onValueChange={(val) => setFee(val || 0)}
          />
        </div>
      </div>

      {principal + interest + fee > totalAmount && (
        <p className="text-xs text-rose-600">
          {vi
            ? "Lưu ý: Tổng (Gốc + Lãi + Phí) đang lớn hơn số tiền trả."
            : "Note: Sum of parts exceeds total amount."}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending
          ? vi
            ? "Đang lưu..."
            : "Saving..."
          : vi
            ? "Ghi nhận thanh toán"
            : "Record Payment"}
      </Button>
    </form>
  );
}
