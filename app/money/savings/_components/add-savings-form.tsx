"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Landmark, Sparkles, WalletCards } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPercent, formatVnd } from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import { cn } from "@/lib/utils";

type AccountOption = { id: string; name: string };
type GoalOption = { id: string; name: string };
type JarOption = { id: string; name: string };

type Props = {
  accounts: AccountOption[];
  goals: GoalOption[];
  jars?: JarOption[];
  defaultType?: "bank" | "third_party";
  triggerLabel?: string;
};

type FormState = {
  savingsType: "bank" | "third_party";
  providerName: string;
  productName: string;
  principalAmount: string;
  annualRate: string;
  startDate: string;
  primaryLinkedAccountId: string;
  linkedAccountIds: string[];
  termMode: "fixed" | "flexible";
  termDays: string;
  earlyWithdrawalRate: string;
  maturityPreference: "renew_same" | "switch_plan" | "withdraw";
  taxRate: string;
  interestType: "simple" | "compound_daily";
  sourceJarId: string;
  goalId: string;
  notes: string;
};

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  helper,
  children,
}: {
  label: string;
  htmlFor?: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-slate-900">
        {label}
      </Label>
      {children}
      {helper ? <p className="text-xs leading-5 text-slate-600">{helper}</p> : null}
    </div>
  );
}

export function AddSavingsForm({
  accounts,
  goals,
  jars = [],
  defaultType = "bank",
  triggerLabel,
}: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>({
    savingsType: defaultType,
    providerName: "",
    productName: "",
    principalAmount: "10000000",
    annualRate: "0.06",
    startDate: new Date().toISOString().slice(0, 10),
    primaryLinkedAccountId: accounts[0]?.id ?? "",
    linkedAccountIds: accounts[0] ? [accounts[0].id] : [],
    termMode: "fixed",
    termDays: "180",
    earlyWithdrawalRate: "0.001",
    maturityPreference: "renew_same",
    taxRate: "0.05",
    interestType: "simple",
    sourceJarId: "",
    goalId: "",
    notes: "",
  });

  const preview = useMemo(() => {
    const principal = Number(form.principalAmount || 0);
    const rate = Number(form.annualRate || 0);
    const termDays =
      form.savingsType === "bank" || form.termMode === "fixed"
        ? Number(form.termDays || 0)
        : 365;
    const accrued =
      form.interestType === "compound_daily"
        ? principal * (Math.pow(1 + rate / 365, termDays) - 1)
        : principal * rate * (termDays / 365);
    const tax =
      form.savingsType === "third_party"
        ? accrued * Number(form.taxRate || 0)
        : 0;

    return {
      accrued,
      tax,
      net: principal + accrued - tax,
      termDays,
    };
  }, [form]);

  const isDetailsValid =
    form.providerName.trim().length > 0 &&
    Number(form.principalAmount) > 0 &&
    Number(form.annualRate) >= 0 &&
    form.startDate.length > 0 &&
    form.primaryLinkedAccountId.length > 0 &&
    (form.savingsType === "bank"
      ? Number(form.termDays) > 0
      : form.termMode === "fixed"
        ? Number(form.termDays) > 0
        : true);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleLinkedAccount(accountId: string) {
    setForm((current) => {
      const exists = current.linkedAccountIds.includes(accountId);
      const next = exists
        ? current.linkedAccountIds.filter((id) => id !== accountId)
        : [...current.linkedAccountIds, accountId];

      const ensured =
        current.primaryLinkedAccountId &&
        !next.includes(current.primaryLinkedAccountId)
          ? [current.primaryLinkedAccountId, ...next]
          : next;

      return {
        ...current,
        linkedAccountIds: ensured,
      };
    });
  }

  async function onSubmit() {
    const payload =
      form.savingsType === "bank"
        ? {
            savingsType: "bank",
            providerName: form.providerName,
            productName: form.productName || undefined,
            principalAmount: Math.round(Number(form.principalAmount)),
            annualRate: Number(form.annualRate),
            startDate: form.startDate,
            primaryLinkedAccountId: form.primaryLinkedAccountId,
            termDays: Number(form.termDays),
            earlyWithdrawalRate: Number(form.earlyWithdrawalRate),
            maturityPreference: form.maturityPreference,
            sourceJarId: form.sourceJarId || null,
            goalId: form.goalId || null,
            notes: form.notes || null,
          }
        : {
            savingsType: "third_party",
            providerName: form.providerName,
            productName: form.productName || undefined,
            principalAmount: Math.round(Number(form.principalAmount)),
            annualRate: Number(form.annualRate),
            startDate: form.startDate,
            primaryLinkedAccountId: form.primaryLinkedAccountId,
            linkedAccountIds:
              form.linkedAccountIds.length > 0
                ? form.linkedAccountIds
                : [form.primaryLinkedAccountId],
            interestType: form.interestType,
            termMode: form.termMode,
            termDays: form.termMode === "fixed" ? Number(form.termDays) : 0,
            maturityPreference:
              form.termMode === "fixed" ? form.maturityPreference : null,
            taxRate: Number(form.taxRate),
            sourceJarId: form.sourceJarId || null,
            goalId: form.goalId || null,
            notes: form.notes || null,
          };

    const response = await fetch("/api/savings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as { error?: string };
    if (!response.ok) {
      throw new Error(data?.error ?? t("savings.form.toast.create_error"));
    }
  }

  const steps = [
    t("savings.form.step.type"),
    t("savings.form.step.details"),
    t("savings.form.step.review"),
  ];
  const fieldClassName =
    "h-12 border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary/20";
  const selectClassName =
    "h-12 border-slate-300 bg-white text-slate-950 data-[placeholder]:text-slate-400";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setStep(1);
      }}
    >
      <DialogTrigger asChild>
        <Button>{triggerLabel ?? t("savings.add")}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-300 bg-white p-6 shadow-2xl sm:max-w-3xl sm:rounded-[28px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-slate-950">
            {t("savings.form.title")}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-slate-600">
            {t("savings.form.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
            {steps.map((label, index) => {
              const value = index + 1;
              const active = step === value;
              const done = step > value;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStep(value)}
                  className={cn(
                    "rounded-xl px-3 py-3 text-left transition",
                    active
                      ? "bg-white shadow-sm ring-1 ring-slate-200"
                      : "text-slate-600 hover:bg-white/70",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                        active || done
                          ? "bg-primary text-primary-foreground"
                          : "bg-white text-slate-600 ring-1 ring-slate-200",
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : value}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  className={cn(
                    "rounded-2xl border p-5 text-left transition",
                    form.savingsType === "bank"
                      ? "border-primary bg-blue-50 shadow-sm ring-1 ring-blue-100"
                      : "border-slate-200 bg-white hover:border-primary/40",
                  )}
                  onClick={() => {
                    update("savingsType", "bank");
                    update("interestType", "simple");
                    update("termMode", "fixed");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {t("savings.form.type.bank.title")}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {t("savings.form.type.bank.description")}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  className={cn(
                    "rounded-2xl border p-5 text-left transition",
                    form.savingsType === "third_party"
                      ? "border-primary bg-emerald-50 shadow-sm ring-1 ring-emerald-100"
                      : "border-slate-200 bg-white hover:border-primary/40",
                  )}
                  onClick={() => update("savingsType", "third_party")}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                      <WalletCards className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {t("savings.form.type.third_party.title")}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {t("savings.form.type.third_party.description")}
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    {form.savingsType === "bank"
                      ? t("savings.form.type.bank.description")
                      : t("savings.form.type.third_party.description")}
                  </p>
                </div>
              </div>

              <Button type="button" className="w-full" onClick={() => setStep(2)}>
                {t("savings.form.action.continue")}
              </Button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <FormSection title={t("savings.form.section.basics")}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label={t("savings.form.field.provider")}
                    htmlFor="providerName"
                  >
                    <Input
                      id="providerName"
                      className={fieldClassName}
                      placeholder={t("savings.form.placeholder.provider")}
                      value={form.providerName}
                      onChange={(event) => update("providerName", event.target.value)}
                    />
                  </Field>
                  <Field
                    label={t("savings.form.field.product_name")}
                    htmlFor="productName"
                  >
                    <Input
                      id="productName"
                      className={fieldClassName}
                      placeholder={t("savings.form.placeholder.product_name")}
                      value={form.productName}
                      onChange={(event) => update("productName", event.target.value)}
                    />
                  </Field>
                  <Field
                    label={t("savings.form.field.principal")}
                    htmlFor="principalAmount"
                  >
                    <MoneyInput
                      id="principalAmount"
                      name="principalAmountPreview"
                      defaultValue={Number(form.principalAmount || 0)}
                      onValueChange={(value) => update("principalAmount", String(value))}
                      className={fieldClassName}
                    />
                  </Field>
                  <Field
                    label={t("savings.form.field.annual_rate")}
                    htmlFor="annualRate"
                    helper={t("savings.form.helper.rate_decimal")}
                  >
                    <Input
                      id="annualRate"
                      className={fieldClassName}
                      type="number"
                      min="0"
                      step="0.0001"
                      value={form.annualRate}
                      onChange={(event) => update("annualRate", event.target.value)}
                    />
                  </Field>
                  <Field
                    label={t("savings.form.field.start_date")}
                    htmlFor="startDate"
                  >
                    <Input
                      id="startDate"
                      className={fieldClassName}
                      type="date"
                      value={form.startDate}
                      onChange={(event) => update("startDate", event.target.value)}
                    />
                  </Field>
                  <Field label={t("savings.form.field.primary_account")}>
                    <Select
                      value={form.primaryLinkedAccountId}
                      onValueChange={(value) => {
                        update("primaryLinkedAccountId", value);
                        if (!form.linkedAccountIds.includes(value)) {
                          update("linkedAccountIds", [value, ...form.linkedAccountIds]);
                        }
                      }}
                    >
                      <SelectTrigger className={selectClassName}>
                        <SelectValue placeholder={t("savings.form.validation.select_account")} />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FormSection>

              <FormSection title={t("savings.form.section.plan")}>
                {form.savingsType === "bank" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label={t("savings.form.field.term_days")}
                      htmlFor="termDays"
                    >
                      <Input
                        id="termDays"
                        className={fieldClassName}
                        type="number"
                        min="1"
                        value={form.termDays}
                        onChange={(event) => update("termDays", event.target.value)}
                      />
                    </Field>
                    <Field
                      label={t("savings.form.field.early_rate")}
                      htmlFor="earlyWithdrawalRate"
                      helper={t("savings.form.helper.rate_decimal")}
                    >
                      <Input
                        id="earlyWithdrawalRate"
                        className={fieldClassName}
                        type="number"
                        min="0"
                        step="0.0001"
                        value={form.earlyWithdrawalRate}
                        onChange={(event) =>
                          update("earlyWithdrawalRate", event.target.value)
                        }
                      />
                    </Field>
                    <Field label={t("savings.form.field.maturity_preference")}>
                      <Select
                        value={form.maturityPreference}
                        onValueChange={(value) =>
                          update(
                            "maturityPreference",
                            value as FormState["maturityPreference"],
                          )
                        }
                      >
                        <SelectTrigger className={selectClassName}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="renew_same">
                            {t("savings.form.option.maturity.renew_same")}
                          </SelectItem>
                          <SelectItem value="withdraw">
                            {t("savings.form.option.maturity.withdraw")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label={t("savings.form.field.interest_type")}>
                        <Select
                          value={form.interestType}
                          onValueChange={(value) =>
                            update(
                              "interestType",
                              value as FormState["interestType"],
                            )
                          }
                        >
                          <SelectTrigger className={selectClassName}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simple">
                              {t("savings.form.option.interest.simple")}
                            </SelectItem>
                            <SelectItem value="compound_daily">
                              {t("savings.form.option.interest.compound")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label={t("savings.form.field.term_mode")}>
                        <Select
                          value={form.termMode}
                          onValueChange={(value) =>
                            update("termMode", value as FormState["termMode"])
                          }
                        >
                          <SelectTrigger className={selectClassName}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">
                              {t("savings.form.option.term.fixed")}
                            </SelectItem>
                            <SelectItem value="flexible">
                              {t("savings.form.option.term.flexible")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field
                        label={t("savings.form.field.tax_rate")}
                        htmlFor="taxRate"
                        helper={t("savings.form.helper.tax_decimal")}
                      >
                        <Input
                          id="taxRate"
                          className={fieldClassName}
                          type="number"
                          min="0"
                          step="0.0001"
                          value={form.taxRate}
                          onChange={(event) => update("taxRate", event.target.value)}
                        />
                      </Field>
                    </div>

                    {form.termMode === "fixed" ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field
                          label={t("savings.form.field.term_days")}
                          htmlFor="termDaysApp"
                        >
                          <Input
                            id="termDaysApp"
                            className={fieldClassName}
                            type="number"
                            min="1"
                            value={form.termDays}
                            onChange={(event) => update("termDays", event.target.value)}
                          />
                        </Field>
                        <Field label={t("savings.form.field.maturity_preference")}>
                          <Select
                            value={form.maturityPreference}
                            onValueChange={(value) =>
                              update(
                                "maturityPreference",
                                value as FormState["maturityPreference"],
                              )
                            }
                          >
                            <SelectTrigger className={selectClassName}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="renew_same">
                                {t("savings.form.option.maturity.renew_same")}
                              </SelectItem>
                              <SelectItem value="switch_plan">
                                {t("savings.form.option.maturity.switch_plan")}
                              </SelectItem>
                              <SelectItem value="withdraw">
                                {t("savings.form.option.maturity.withdraw")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-sky-300 bg-sky-50 p-3 text-sm text-sky-950">
                        {t("savings.form.helper.flexible")}
                      </div>
                    )}

                    <Field
                      label={t("savings.form.field.linked_accounts")}
                      helper={t("savings.form.helper.linked_accounts")}
                    >
                      <div className="flex flex-wrap gap-2">
                        {accounts.map((account) => {
                          const selected = form.linkedAccountIds.includes(account.id);
                          return (
                            <button
                              key={account.id}
                              type="button"
                              onClick={() => toggleLinkedAccount(account.id)}
                              className={cn(
                                "rounded-full border px-3 py-2 text-sm transition",
                                selected
                                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/15"
                                  : "border-slate-300 bg-white text-slate-700 hover:border-primary/40",
                              )}
                            >
                              {account.name}
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  </div>
                )}
              </FormSection>

              <FormSection title={t("savings.form.section.optional")}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Source jar">
                    <Select
                      value={form.sourceJarId || "__none__"}
                      onValueChange={(value) =>
                        update("sourceJarId", value === "__none__" ? "" : value)
                      }
                    >
                      <SelectTrigger className={selectClassName}>
                        <SelectValue placeholder="Review later" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Review later</SelectItem>
                        {jars.map((jar) => (
                          <SelectItem key={jar.id} value={jar.id}>
                            {jar.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label={t("savings.form.field.goal")}>
                    <Select
                      value={form.goalId || "__none__"}
                      onValueChange={(value) =>
                        update("goalId", value === "__none__" ? "" : value)
                      }
                    >
                      <SelectTrigger className={selectClassName}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          {t("savings.form.option.goal.none")}
                        </SelectItem>
                        {goals.map((goal) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            {goal.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field
                    label={t("savings.form.field.notes")}
                    htmlFor="savingsNotes"
                  >
                    <Input
                      id="savingsNotes"
                      className={fieldClassName}
                      placeholder={t("savings.form.placeholder.notes")}
                      value={form.notes}
                      onChange={(event) => update("notes", event.target.value)}
                    />
                  </Field>
                </div>
              </FormSection>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  {t("savings.form.action.back")}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!isDetailsValid) {
                      toast.error(t("savings.form.validation.required"));
                      return;
                    }
                    setStep(3);
                  }}
                  className="flex-1"
                >
                  {t("savings.form.action.review")}
                </Button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
                <p className="text-base font-semibold text-slate-900">
                  {form.providerName || t("savings.form.title")}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {t("savings.form.review.description")}
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-emerald-100 bg-white p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {t("savings.form.review.principal")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatVnd(Number(form.principalAmount || 0), locale)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-white p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {t("savings.form.review.accrued")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatVnd(Math.round(preview.accrued), locale)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-white p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {t("savings.form.review.net")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-700">
                      {formatVnd(Math.round(preview.net), locale)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-white p-4 text-sm text-slate-600">
                  <p>
                    <span className="font-medium text-slate-900">
                      {t("savings.form.review.rate")}:
                    </span>{" "}
                    {formatPercent(Number(form.annualRate || 0))}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium text-slate-900">
                      {t("savings.form.review.start")}:
                    </span>{" "}
                    {form.startDate}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium text-slate-900">
                      {t("savings.form.review.maturity")}:
                    </span>{" "}
                    {form.savingsType === "third_party" && form.termMode === "flexible"
                      ? t("savings.form.review.flexible")
                      : `${preview.termDays} ${t("savings.card.days")}`}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-slate-50 p-4 text-sm text-slate-600">
                  {form.savingsType === "third_party" ? (
                    <p>
                      <span className="font-medium text-slate-900">
                        {t("savings.form.review.tax")}:
                      </span>{" "}
                      {formatVnd(Math.round(preview.tax), locale)}
                    </p>
                  ) : null}
                  <p className={cn("mt-2", form.savingsType === "bank" && "mt-0")}>
                    <span className="font-medium text-slate-900">
                      {t("savings.form.field.primary_account")}:
                    </span>{" "}
                    {accounts.find((account) => account.id === form.primaryLinkedAccountId)
                      ?.name ?? "-"}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium text-slate-900">Source jar:</span>{" "}
                    {form.sourceJarId
                      ? jars.find((jar) => jar.id === form.sourceJarId)?.name ?? "-"
                      : "Review later"}
                  </p>
                  {form.goalId ? (
                    <p className="mt-2">
                      <span className="font-medium text-slate-900">
                        {t("savings.form.field.goal")}:
                      </span>{" "}
                      {goals.find((goal) => goal.id === form.goalId)?.name ?? "-"}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  {t("savings.form.action.back")}
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await onSubmit();
                        toast.success(t("savings.form.toast.created"));
                        setOpen(false);
                        router.refresh();
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : t("savings.form.toast.create_error"),
                        );
                      }
                    })
                  }
                  className="flex-1"
                >
                  {isPending
                    ? t("savings.form.action.creating")
                    : t("savings.form.action.confirm")}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
