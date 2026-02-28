"use client";

import { useActionState, useTransition, useState } from "react";
import {
  createInstallmentPlanAction,
  type InstallmentActionState,
} from "../installment-actions";
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
  cardId: string;
  vi: boolean;
};

export function CreateInstallmentForm({ cardId, vi }: Props) {
  const [state, action] = useActionState<InstallmentActionState, FormData>(
    createInstallmentPlanAction,
    { status: "idle", message: "" },
  );
  const [isPending, startTransition] = useTransition();

  const [amount, setAmount] = useState(0);
  const [fee, setFee] = useState(0);
  const [months, setMonths] = useState(3);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  const total = amount + fee;
  const monthly = months > 0 ? Math.round(total / months) : 0;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="cardAccountId" value={cardId} />

      <div className="space-y-1">
        <Label htmlFor="description">
          {vi ? "Mô tả khoản chi" : "Purchase Description"}
        </Label>
        <Input
          id="description"
          name="description"
          placeholder={
            vi ? "VD: Điện thoại iPhone, Tủ lạnh..." : "e.g. New Laptop"
          }
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="originalAmount">
            {vi ? "Số tiền gốc" : "Original Amount"}
          </Label>
          <MoneyInput
            id="originalAmount"
            name="originalAmount"
            defaultValue={0}
            onValueChange={(val) => setAmount(val)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="numInstallments">
            {vi ? "Kỳ hạn (tháng)" : "Tenure (months)"}
          </Label>
          <Select
            name="numInstallments"
            defaultValue="3"
            onValueChange={(val) => setMonths(Number(val))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 {vi ? "tháng" : "months"}</SelectItem>
              <SelectItem value="6">6 {vi ? "tháng" : "months"}</SelectItem>
              <SelectItem value="9">9 {vi ? "tháng" : "months"}</SelectItem>
              <SelectItem value="12">12 {vi ? "tháng" : "months"}</SelectItem>
              <SelectItem value="24">24 {vi ? "tháng" : "months"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="conversionFee">
          {vi ? "Phí chuyển đổi (nếu có)" : "Conversion Fee (optional)"}
        </Label>
        <MoneyInput
          id="conversionFee"
          name="conversionFee"
          defaultValue={0}
          onValueChange={(val) => setFee(val)}
        />
      </div>

      {amount > 0 && (
        <div className="rounded-xl bg-primary/5 p-3 text-sm flex justify-between items-center border border-primary/10">
          <span className="text-muted-foreground">
            {vi ? "Ước tính mỗi tháng" : "Monthly estimate"}:
          </span>
          <span className="text-xl font-black text-primary">
            {new Intl.NumberFormat(vi ? "vi-VN" : "en-US", {
              style: "currency",
              currency: "VND",
            }).format(monthly)}
          </span>
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-12 text-base"
      >
        {isPending
          ? vi
            ? "Đang xử lý..."
            : "Processing..."
          : vi
            ? "Xác nhận chuyển trả góp"
            : "Confirm Conversion"}
      </Button>
    </form>
  );
}
