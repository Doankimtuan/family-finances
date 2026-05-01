"use client";

import {
  useActionState,
  useTransition,
  useState,
  useEffect,
  useRef,
} from "react";
import { convertItemToInstallmentAction } from "../installment-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calculator, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Props = {
  item: {
    id: string;
    description: string;
    amount: number;
    fee_amount: number;
  };
  locale: string;
  vi: boolean;
};

function formatVnd(amount: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ConvertToInstallmentDialog({ item, locale, vi }: Props) {
  const [open, setOpen] = useState(false);
  const [numInstallments, setNumInstallments] = useState(3);
  const [conversionFee, setConversionFee] = useState(0);

  const [state, action] = useActionState(convertItemToInstallmentAction, {
    status: "idle" as const,
    message: "",
  });
  const [isPending, startTransition] = useTransition();

  const monthlyAmount = Math.round(
    (item.amount + conversionFee) / numInstallments,
  );

  // React to state changes from the server action
  const prevStatusRef = useRef(state.status);
  useEffect(() => {
    if (state.status === prevStatusRef.current) return;
    prevStatusRef.current = state.status;
    if (state.status === "success") {
      toast.success(state.message);
      queueMicrotask(() => setOpen(false));
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => {
      action(fd);
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700 transition-colors hover:bg-amber-200 border-none h-auto"
        title={vi ? "Chuyển trả góp" : "Convert to installments"}
      >
        <Calculator className="h-3 w-3" />
        {vi ? "Trả góp" : "EMI"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-5 w-5 text-amber-500" />
              {vi ? "Chuyển đổi trả góp 0%" : "Convert to 0% Installments"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {vi
                ? "Giao dịch gốc sẽ bị xóa khỏi kỳ hiện tại và thay bằng các kỳ trả góp hàng tháng."
                : "The original item is removed from this cycle and replaced with monthly installment records."}
            </DialogDescription>
          </DialogHeader>

          {/* Source transaction summary */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
              {vi ? "Giao dịch gốc" : "Source transaction"}
            </p>
            <p className="mt-1 truncate text-sm font-bold text-foreground">
              {item.description || (vi ? "Giao dịch thẻ" : "Card transaction")}
            </p>
            <p className="mt-0.5 text-lg font-black text-amber-700">
              {formatVnd(item.amount, locale)}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <input type="hidden" name="sourceItemId" value={item.id} />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="numInstallments" className="text-xs font-bold">
                  {vi ? "Số kỳ trả góp" : "No. of installments"}
                </Label>
                <Input
                  id="numInstallments"
                  name="numInstallments"
                  type="number"
                  min={2}
                  max={60}
                  value={numInstallments}
                  onChange={(e) => setNumInstallments(Number(e.target.value))}
                  className="text-center font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="conversionFee" className="text-xs font-bold">
                  {vi ? "Phí chuyển đổi (VND)" : "Conversion fee (VND)"}
                </Label>
                <MoneyInput
                  id="conversionFee"
                  name="conversionFee"
                  defaultValue={0}
                  onValueChange={setConversionFee}
                />
              </div>
            </div>

            {/* Monthly amount preview */}
            {numInstallments >= 2 && (
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-[10px] text-muted-foreground">
                  {vi ? "Mỗi tháng trả" : "Monthly payment"}
                </p>
                <p className="text-xl font-black text-primary">
                  {formatVnd(monthlyAmount, locale)}
                </p>
                {conversionFee > 0 && (
                  <p className="mt-0.5 text-[10px] text-amber-600">
                    {vi
                      ? `* Phí ${formatVnd(conversionFee, locale)} cộng vào tháng đầu`
                      : `* Fee ${formatVnd(conversionFee, locale)} added to 1st month`}
                  </p>
                )}
              </div>
            )}

            {state.status === "error" && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {state.message}
              </div>
            )}
            {state.status === "success" && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {state.message}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                {vi ? "Hủy" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={isPending || numInstallments < 2}
                className="flex-1 bg-amber-500 text-white hover:bg-amber-600"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    {vi ? "Đang xử lý..." : "Processing..."}
                  </>
                ) : vi ? (
                  "Xác nhận trả góp"
                ) : (
                  "Convert"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
