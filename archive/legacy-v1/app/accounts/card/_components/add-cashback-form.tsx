"use client";

import { useState, memo, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  addCardCashbackAction,
  type InstallmentActionState,
} from "../installment-actions";
import { Button } from "@/components/ui/button";
import {
  RHFInput,
  RHFMoneyInput,
} from "@/components/ui/rhf-fields";
import { toast } from "sonner";
import { useI18n } from "@/lib/providers/i18n-provider";

type Props = {
  cardId: string;
};

interface AddCashbackFormData {
  amount: number;
  cashbackDate: string;
  description: string;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function AddCashbackFormComponent({ cardId }: Props) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  const methods = useForm<AddCashbackFormData>({
    defaultValues: {
      amount: 0,
      cashbackDate: todayIsoDate(),
      description: "",
    },
  });

  const onSubmit = (data: AddCashbackFormData) => {
    const formData = new FormData();
    formData.append("cardId", cardId);
    formData.append("amount", String(data.amount));
    formData.append("cashbackDate", data.cashbackDate);
    formData.append("description", data.description);

    startTransition(async () => {
      const result = await addCardCashbackAction({ status: "idle", message: "" }, formData);
      if (result.status === "success") {
        toast.success(result.message);
        methods.reset({
          amount: 0,
          cashbackDate: todayIsoDate(),
          description: "",
        });
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <RHFInput
          name="cashbackDate"
          label={t("card.cashback_date")}
          type="date"
        />

        <RHFMoneyInput
          name="amount"
          label={t("card.cashback_amount")}
        />

        <RHFInput
          name="description"
          label={t("card.cashback_placeholder")}
          placeholder={t("card.cashback_placeholder")}
        />

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-sky-600 text-white hover:bg-sky-700"
        >
          {isPending
            ? t("common.processing")
            : t("card.record_cashback")}
        </Button>
      </form>
    </FormProvider>
  );
}

export const AddCashbackForm = memo(AddCashbackFormComponent);
