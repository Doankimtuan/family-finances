"use client";

import { useTransition, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addAssetCashflowAction } from "@/app/assets/cashflow-actions";
import {
  initialAssetActionState,
  type AssetActionState,
} from "@/app/assets/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import {
  RHFInput,
  RHFSelect,
  RHFMoneyInput,
} from "@/components/ui/rhf-fields";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import { toast } from "sonner";

const cashflowSchema = z.object({
  assetId: z.string(),
  flowType: z.string(),
  flowDate: z.string().min(1, "Date is required"),
  accountId: z.string().min(1, "Account is required"),
  amount: z.number().min(0, "Amount must be non-negative"),
  note: z.string().optional(),
});

type CashflowValues = z.infer<typeof cashflowSchema>;

type AccountOption = { id: string; name: string };

type AssetCashflowFormProps = {
  assetId: string;
  accounts: AccountOption[];
};

export function AssetCashflowForm({
  assetId,
  accounts,
}: AssetCashflowFormProps) {
  const { language, t } = useI18n();
  const vi = language === "vi";
  const [state, setState] = useState<AssetActionState>(initialAssetActionState);
  const [isPending, startTransition] = useTransition();

  const methods = useForm<CashflowValues>({
    resolver: zodResolver(cashflowSchema),
    defaultValues: {
      assetId,
      flowType: "contribution",
      flowDate: new Date().toISOString().slice(0, 10),
      accountId: "",
      amount: 0,
      note: "",
    },
  });

  const { handleSubmit, reset } = methods;

  const onSubmit = async (data: CashflowValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    startTransition(async () => {
      const result = await addAssetCashflowAction(state, formData);
      setState(result);
      if (result.status === "success") {
        toast.success(result.message);
        reset();
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };

  return (
    <FormProvider {...methods}>
      <form
        className="space-y-3"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <input type="hidden" {...methods.register("assetId")} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <RHFSelect
            name="flowType"
            label={t("common.transaction_type")}
            defaultValue="contribution"
            options={[
              { label: t("assets.contribution"), value: "contribution" },
              { label: t("assets.withdrawal"), value: "withdrawal" },
              { label: t("assets.income"), value: "income" },
              { label: t("assets.fee"), value: "fee" },
              { label: t("assets.tax"), value: "tax" },
            ]}
            placeholder={t("common.select_type")}
          />

          <RHFInput
            name="flowDate"
            label={t("common.date")}
            type="date"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <RHFSelect
              name="accountId"
              label={t("common.funding_account")}
              required
              options={accounts.map((acc) => ({
                label: acc.name,
                value: acc.id,
              }))}
              placeholder={t("common.select_account")}
            />
          </div>
        </div>

        <RHFMoneyInput
          name="amount"
          label={t("assets.amount")}
          className="w-full"
        />

        <RHFInput
          name="note"
          label={t("common.note")}
          placeholder={t("common.note_placeholder")}
        />

        <Button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-teal-600 hover:bg-teal-700"
        >
          {isPending ? t("common.saving") : t("common.add")}
        </Button>

        <FormStatus message={state.message} status={state.status} />
      </form>
    </FormProvider>
  );
}
