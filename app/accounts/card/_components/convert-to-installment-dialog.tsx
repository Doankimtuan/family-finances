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

import { useI18n } from "@/lib/providers/i18n-provider";

type Props = {
  item: {
    id: string;
    description: string;
    amount: number;
    fee_amount: number;
  };
};

function formatVnd(amount: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ConvertToInstallmentDialog({ item }: Props) {
  const { t, locale } = useI18n();
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
        title={t("card.convert_to_emi")}
      >
        <Calculator className="h-3 w-3" />
        {t("card.emi_label")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-5 w-5 text-amber-500" />
              {t("card.convert_to_emi_title")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t("card.convert_to_emi_desc")}
            </DialogDescription>
          </DialogHeader>

          {/* Source transaction summary */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
              {t("card.source_transaction")}
            </p>
            <p className="mt-1 truncate text-sm font-bold text-foreground">
              {item.description || t("card.transaction")}
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
                  {t("card.num_installments")}
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
                  {t("card.conversion_fee")}
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
                  {t("card.monthly_payment")}
                </p>
                <p className="text-xl font-black text-primary">
                  {formatVnd(monthlyAmount, locale)}
                </p>
                {conversionFee > 0 && (
                  <p className="mt-0.5 text-[10px] text-amber-600">
                    {t("card.fee_added_note").replace("{fee}", formatVnd(conversionFee, locale))}
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
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isPending || numInstallments < 2}
                className="flex-1 bg-amber-500 text-white hover:bg-amber-600"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    {t("common.processing")}
                  </>
                ) : t("card.confirm_emi")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
