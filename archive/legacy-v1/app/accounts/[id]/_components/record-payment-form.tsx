"use client";

import { useState, memo, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  recordDebtPaymentAction,
  type DebtPaymentActionState,
} from "@/app/accounts/debt-actions";
import { Button } from "@/components/ui/button";
import {
  RHFInput,
  RHFSelect,
  RHFMoneyInput,
} from "@/components/ui/rhf-fields";
import { toast } from "sonner";
import { useI18n } from "@/lib/providers/i18n-provider";

type Props = {
  liabilityId: string;
  accounts: { id: string; name: string }[];
};

interface RecordPaymentFormData {
  paymentDate: string;
  sourceAccountId: string;
  amount: number;
  principal: number;
  interest: number;
  fee: number;
}

function RecordPaymentFormComponent({ liabilityId, accounts }: Props) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  const methods = useForm<RecordPaymentFormData>({
    defaultValues: {
      paymentDate: new Date().toISOString().slice(0, 10),
      sourceAccountId: "",
      amount: 0,
      principal: 0,
      interest: 0,
      fee: 0,
    },
  });

  const totalAmount = methods.watch("amount");
  const principal = methods.watch("principal");
  const interest = methods.watch("interest");
  const fee = methods.watch("fee");

  const onSubmit = (data: RecordPaymentFormData) => {
    const formData = new FormData();
    formData.append("liabilityId", liabilityId);
    formData.append("paymentDate", data.paymentDate);
    formData.append("sourceAccountId", data.sourceAccountId);
    formData.append("amount", String(data.amount));
    formData.append("principal", String(data.principal));
    formData.append("interest", String(data.interest));
    formData.append("fee", String(data.fee));

    startTransition(async () => {
      const result = await recordDebtPaymentAction({ status: "idle", message: "" }, formData);
      if (result.status === "success") {
        toast.success(result.message);
        methods.reset();
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };

  const accountOptions = accounts.map((acc) => ({
    label: acc.name,
    value: acc.id,
  }));

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RHFInput
            name="paymentDate"
            label={t("debt.payment_date")}
            type="date"
          />

          <RHFSelect
            name="sourceAccountId"
            label={t("debt.source_account")}
            options={accountOptions}
            placeholder={t("debt.select_account")}
          />
        </div>

        <RHFMoneyInput
          name="amount"
          label={t("debt.total_amount")}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <RHFMoneyInput
            name="principal"
            label={t("debt.principal")}
          />
          <RHFMoneyInput
            name="interest"
            label={t("debt.interest")}
          />
          <RHFMoneyInput
            name="fee"
            label={t("debt.fee")}
          />
        </div>

        {principal + interest + fee > totalAmount && (
          <p className="text-xs text-rose-600">
            {t("debt.sum_exceeds_total")}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? t("debt.saving") : t("debt.record_payment")}
        </Button>
      </form>
    </FormProvider>
  );
}

export const RecordPaymentForm = memo(RecordPaymentFormComponent);
