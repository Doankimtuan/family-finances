"use client";

import { useI18n } from "@/lib/providers/i18n-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { savingsFormSchema, type SavingsFormValues } from "../_lib/form-schema";
import type { AccountOption } from "../_lib/form-types";

export function useSavingsForm(
  initialType: "bank" | "third_party",
  accounts: AccountOption[],
) {
  const router = useRouter();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SavingsFormValues>({
    resolver: zodResolver(savingsFormSchema),
    defaultValues: {
      savingsType: initialType,
      providerName: "",
      productName: "",
      principalAmount: 10000000,
      annualRate: 0.06,
      startDate: new Date().toISOString().slice(0, 10),
      primaryLinkedAccountId: accounts[0]?.id ?? "",
      linkedAccountIds: accounts[0] ? [accounts[0].id] : [],
      termMode: "fixed",
      termDays: 180,
      earlyWithdrawalRate: 0.001,
      maturityPreference: "renew_same",
      taxRate: 0.05,
      interestType: "simple",
      sourceJarId: "",
      goalId: "",
      notes: "",
    },
    mode: "onChange",
  });

  const { watch, setValue, getValues, trigger, reset } = form;

  const values = watch();

  const preview = useMemo(() => {
    const principal = Number(values.principalAmount || 0);
    const rate = Number(values.annualRate || 0);
    const termDays =
      values.savingsType === "bank" || values.termMode === "fixed"
        ? Number(values.termDays || 0)
        : 365;
    const accrued =
      values.interestType === "compound_daily"
        ? principal * (Math.pow(1 + rate / 365, termDays) - 1)
        : principal * rate * (termDays / 365);
    const tax =
      values.savingsType === "third_party"
        ? accrued * Number(values.taxRate || 0)
        : 0;

    return {
      accrued,
      tax,
      net: principal + accrued - tax,
      termDays,
    };
  }, [values]);

  async function validateDetails() {
    const fieldsToValidate: (keyof SavingsFormValues)[] = [
      "providerName",
      "principalAmount",
      "annualRate",
      "startDate",
      "primaryLinkedAccountId",
    ];

    if (values.savingsType === "bank" || values.termMode === "fixed") {
      fieldsToValidate.push("termDays");
    }

    return await trigger(fieldsToValidate);
  }

  function toggleLinkedAccount(accountId: string) {
    const current = getValues("linkedAccountIds") || [];
    const primary = getValues("primaryLinkedAccountId");

    const exists = current.includes(accountId);
    let next = exists
      ? current.filter((id) => id !== accountId)
      : [...current, accountId];

    if (primary && !next.includes(primary)) {
      next = [primary, ...next];
    }

    setValue("linkedAccountIds", next, { shouldValidate: true });
  }

  async function submitForm(data: SavingsFormValues) {
    const payload = {
      ...data,
      principalAmount: Math.round(data.principalAmount),
      productName: data.productName || null,
      sourceJarId:
        data.sourceJarId && data.sourceJarId !== "__none__"
          ? data.sourceJarId
          : null,
      goalId: data.goalId && data.goalId !== "__none__" ? data.goalId : null,
      notes: data.notes || null,
      linkedAccountIds:
        data.linkedAccountIds.length > 0
          ? data.linkedAccountIds
          : [data.primaryLinkedAccountId],
    };

    const response = await fetch("/api/savings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = (await response.json().catch(() => null)) as {
      error?: string;
    };
    if (!response.ok) {
      throw new Error(result?.error ?? t("savings.form.toast.create_error"));
    }
  }

  const handleConfirm = (onSuccess: () => void) => {
    form.handleSubmit(async (data: SavingsFormValues) => {
      startTransition(async () => {
        try {
          await submitForm(data);
          toast.success(t("savings.form.toast.created"));
          onSuccess();
          router.refresh();
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : t("savings.form.toast.create_error"),
          );
        }
      });
    })();
  };

  return {
    form,
    preview,
    isPending,
    validateDetails,
    toggleLinkedAccount,
    handleConfirm,
    reset,
  };
}
