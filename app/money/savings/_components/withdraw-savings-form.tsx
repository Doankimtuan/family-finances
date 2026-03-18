"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatVnd } from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import { computeWithdrawalPreview } from "@/lib/savings/calculations";
import type { SavingsAccountRow, SavingsComputedValue } from "@/lib/savings/types";

type Props = {
  savings: SavingsAccountRow;
  computed: SavingsComputedValue;
  accounts: Array<{ id: string; name: string }>;
};

export function WithdrawSavingsForm({ savings, computed, accounts }: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [principalAmount, setPrincipalAmount] = useState(
    String(computed.principal),
  );
  const [destinationAccountId, setDestinationAccountId] = useState(
    accounts[0]?.id ?? savings.primary_linked_account_id,
  );
  const [withdrawalDate, setWithdrawalDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const preview = computeWithdrawalPreview(
    savings,
    computed,
    savings.savings_type === "third_party" ? Number(principalAmount) : undefined,
  );

  async function submit() {
    const body =
      savings.savings_type === "bank"
        ? {
            withdrawalDate,
            destinationAccountId,
          }
        : {
            withdrawalDate,
            destinationAccountId,
            principalAmount: Math.round(Number(principalAmount)),
          };
    const response = await fetch(`/api/savings/${savings.id}/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => null)) as { error?: string };
    if (!response.ok) throw new Error(data?.error ?? t("savings.withdraw.submit_error"));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t("savings.withdraw.action")}</Button>
      </DialogTrigger>
      <DialogContent className="border-slate-300 bg-white shadow-2xl sm:rounded-[28px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-slate-950">{t("savings.withdraw.title")}</DialogTitle>
          <DialogDescription className="text-slate-600">
            {savings.savings_type === "bank"
              ? t("savings.withdraw.description.bank")
              : t("savings.withdraw.description.third_party")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="withdrawalDate">{t("savings.withdraw.field.date")}</Label>
              <Input
                id="withdrawalDate"
                className="h-12 border-slate-300 bg-white text-slate-950"
                type="date"
                value={withdrawalDate}
                onChange={(event) => setWithdrawalDate(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("savings.withdraw.field.destination")}</Label>
              <Select value={destinationAccountId} onValueChange={setDestinationAccountId}>
                <SelectTrigger className="h-12 border-slate-300 bg-white text-slate-950 data-[placeholder]:text-slate-400">
                  <SelectValue placeholder={t("savings.withdraw.field.destination")} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {savings.savings_type === "third_party" ? (
            <div className="space-y-1.5">
              <Label htmlFor="principalAmount">{t("savings.withdraw.field.amount")}</Label>
              <MoneyInput
                id="principalAmount"
                name="withdrawPrincipalPreview"
                defaultValue={Number(principalAmount || 0)}
                onValueChange={(value) => setPrincipalAmount(String(Math.min(value, computed.principal)))}
                className="h-12 border-slate-300 bg-white text-slate-950 placeholder:text-slate-400"
                placeholder={t("savings.withdraw.field.amount")}
              />
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4 text-sm text-slate-800">
            <p>{t("savings.withdraw.summary.principal")}: {formatVnd(preview.principalPaid, locale)}</p>
            <p className="mt-1">{t("savings.withdraw.summary.interest")}: {formatVnd(preview.interestPaid, locale)}</p>
            <p className="mt-1">{t("savings.withdraw.summary.tax")}: {formatVnd(preview.taxAmount, locale)}</p>
            {preview.penaltyAmount > 0 ? (
              <p className="mt-1 text-rose-600">
                {t("savings.withdraw.summary.penalty")}: {formatVnd(preview.penaltyAmount, locale)}
              </p>
            ) : null}
            <p className="mt-3 font-semibold text-slate-900">
              {t("savings.withdraw.summary.net")}: {formatVnd(preview.netReceived, locale)}
            </p>
          </div>

          <Button
            className="w-full"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await submit();
                  toast.success(t("savings.withdraw.toast.success"));
                  setOpen(false);
                  router.refresh();
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : t("savings.withdraw.toast.error"),
                  );
                }
              })
            }
          >
            {isPending ? t("savings.withdraw.processing") : t("savings.withdraw.action")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
