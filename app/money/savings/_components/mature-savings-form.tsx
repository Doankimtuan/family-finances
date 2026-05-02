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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatVnd } from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import type { SavingsAccountRow, SavingsComputedValue } from "@/lib/savings/types";

type Props = {
  savings: SavingsAccountRow;
  computed: SavingsComputedValue;
  accounts: Array<{ id: string; name: string }>;
  jars?: Array<{ id: string; name: string }>;
};

export function MatureSavingsForm({ savings, computed, accounts, jars = [] }: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState(
    savings.maturity_preference ?? "renew_same",
  );
  const [destinationAccountId, setDestinationAccountId] = useState(
    savings.primary_linked_account_id,
  );
  const [destinationJarId, setDestinationJarId] = useState("");
  const [actionDate, setActionDate] = useState(
    savings.maturity_date ?? new Date().toISOString().slice(0, 10),
  );
  const [annualRate, setAnnualRate] = useState(String(savings.annual_rate));
  const [termDays, setTermDays] = useState(String(savings.term_days || 180));
  const [taxRate, setTaxRate] = useState(String(savings.tax_rate));
  const [interestType, setInterestType] = useState(savings.interest_type);

  async function submit() {
    const response = await fetch(`/api/savings/${savings.id}/mature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionDate,
        actionType,
        destinationAccountId,
        destinationJarId: destinationJarId || null,
        newPlan:
          actionType === "switch_plan"
            ? {
                annualRate: Number(annualRate),
                termDays: Number(termDays),
                interestType,
                taxRate: Number(taxRate),
                primaryLinkedAccountId: destinationAccountId,
                linkedAccountIds: [destinationAccountId],
              }
            : undefined,
      }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string };
    if (!response.ok) throw new Error(data?.error ?? t("savings.mature.submit_error"));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={savings.term_mode !== "fixed"}>{t("savings.mature.title")}</Button>
      </DialogTrigger>
      <DialogContent className="border-slate-300 bg-white shadow-2xl sm:rounded-[28px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-slate-950">{t("savings.mature.title")}</DialogTitle>
          <DialogDescription className="text-slate-600">{t("savings.mature.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="maturityActionDate">{t("savings.mature.field.date")}</Label>
            <Input
              id="maturityActionDate"
              className="h-12 border-slate-300 bg-white text-slate-950"
              type="date"
              value={actionDate}
              onChange={(event) => setActionDate(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1.5">
            {([
              { value: "renew_same", label: t("savings.mature.action.renew_same") },
              { value: "switch_plan", label: t("savings.mature.action.switch_plan") },
              { value: "withdraw", label: t("savings.mature.action.withdraw") },
            ] as const).map((item) => (
              <Button
                key={item.value}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActionType(item.value)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold h-auto ${actionType === item.value ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200 hover:bg-white" : "text-slate-600 hover:bg-white/70"}`}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-slate-800">
            <p>{t("savings.mature.summary.principal")}: {formatVnd(computed.principal, locale)}</p>
            <p className="mt-1">{t("savings.mature.summary.interest")}: {formatVnd(computed.accruedInterest, locale)}</p>
            <p className="mt-1">{t("savings.mature.summary.tax")}: {formatVnd(computed.taxLiability, locale)}</p>
            <p className="mt-3 font-semibold text-slate-900">
              {t("savings.mature.summary.net")}: {formatVnd(computed.netValue, locale)}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>{t("savings.mature.field.destination")}</Label>
            <Select value={destinationAccountId} onValueChange={setDestinationAccountId}>
              <SelectTrigger className="h-12 border-slate-300 bg-white text-slate-950 data-[placeholder]:text-slate-400"><SelectValue placeholder={t("savings.mature.field.destination")} /></SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("savings.mature.field.destination_jar")}</Label>
            <Select value={destinationJarId || "__none__"} onValueChange={(value) => setDestinationJarId(value === "__none__" ? "" : value)}>
              <SelectTrigger className="h-12 border-slate-300 bg-white text-slate-950 data-[placeholder]:text-slate-400">
                <SelectValue placeholder={t("savings.form.placeholder.review_later")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("savings.form.placeholder.review_later")}</SelectItem>
                {jars.map((jar) => (
                  <SelectItem key={jar.id} value={jar.id}>{jar.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {actionType === "switch_plan" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input className="h-12 border-slate-300 bg-white text-slate-950 placeholder:text-slate-400" type="number" step="0.0001" value={annualRate} onChange={(event) => setAnnualRate(event.target.value)} placeholder={t("savings.form.field.annual_rate")} />
              <Input className="h-12 border-slate-300 bg-white text-slate-950 placeholder:text-slate-400" type="number" value={termDays} onChange={(event) => setTermDays(event.target.value)} placeholder={t("savings.form.field.term_days")} />
              <Input className="h-12 border-slate-300 bg-white text-slate-950 placeholder:text-slate-400" type="number" step="0.0001" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} placeholder={t("savings.form.field.tax_rate")} />
              <Select
                value={interestType}
                onValueChange={(value) =>
                  setInterestType(value as "simple" | "compound_daily")
                }
              >
                <SelectTrigger className="h-12 border-slate-300 bg-white text-slate-950 data-[placeholder]:text-slate-400 sm:col-span-3"><SelectValue placeholder={t("savings.form.field.interest_type")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">{t("savings.form.option.interest.simple")}</SelectItem>
                  <SelectItem value="compound_daily">{t("savings.form.option.interest.compound")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <Button
            className="w-full"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await submit();
                  toast.success(t("savings.mature.toast.success"));
                  setOpen(false);
                  router.refresh();
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : t("savings.mature.toast.error"),
                  );
                }
              })
            }
          >
            {isPending ? t("savings.mature.processing") : t("savings.mature.action.confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
