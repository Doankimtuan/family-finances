"use client";

import { useActionState, startTransition, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addAssetCashflowAction } from "@/app/assets/cashflow-actions";
import { initialAssetActionState } from "@/app/assets/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { RHFInput, RHFSelect, RHFMoneyInput } from "@/components/ui/rhf-fields";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import { toast } from "sonner";
import { ASSET_FLOW_TYPES } from "../_lib/constants";

const cashflowSchema = z.object({
  assetId: z.string(),
  flowType: z.string(),
  flowDate: z.string().min(1, "assets.errors.date_required"),
  accountId: z.string().min(1, "assets.errors.account_required"),
  quantity: z.number().min(0, "assets.errors.quantity_non_negative").optional(),
  unitPrice: z.number().min(0, "assets.errors.price_non_negative").optional(),
  amount: z.number().min(0, "assets.errors.amount_non_negative"),
  note: z.string().optional(),
});

type CashflowValues = z.infer<typeof cashflowSchema>;

type AccountOption = { id: string; name: string };

type AssetCashflowFormProps = {
  assetId: string;
  assetClass: string;
  accounts: AccountOption[];
};

export function AssetCashflowForm({
  assetId,
  accounts,
}: AssetCashflowFormProps) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(
    addAssetCashflowAction,
    initialAssetActionState,
  );

  const methods = useForm<CashflowValues>({
    resolver: zodResolver(cashflowSchema),
    defaultValues: {
      assetId,
      flowType: ASSET_FLOW_TYPES.CONTRIBUTION,
      flowDate: new Date().toISOString().slice(0, 10),
      accountId: "",
      quantity: 0,
      unitPrice: 0,
      amount: 0,
      note: "",
    },
  });

  const { handleSubmit, reset, watch, setValue } = methods;

  const flowType = watch("flowType");
  const quantity = watch("quantity") ?? 0;
  const unitPrice = watch("unitPrice") ?? 0;

  useEffect(() => {
    if (
      flowType === ASSET_FLOW_TYPES.CONTRIBUTION ||
      flowType === ASSET_FLOW_TYPES.WITHDRAWAL
    ) {
      setValue("amount", Math.round(quantity * unitPrice));
    }
  }, [flowType, quantity, unitPrice, setValue]);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      reset({
        assetId,
        flowType: ASSET_FLOW_TYPES.CONTRIBUTION,
        flowDate: new Date().toISOString().slice(0, 10),
        accountId: "",
        quantity: 0,
        unitPrice: 0,
        amount: 0,
        note: "",
      });
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state, reset, assetId]);

  const onSubmit = async (data: CashflowValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    startTransition(() => {
      formAction(formData);
    });
  };

  const isTradeType =
    flowType === ASSET_FLOW_TYPES.CONTRIBUTION ||
    flowType === ASSET_FLOW_TYPES.WITHDRAWAL;

  return (
    <FormProvider {...methods}>
      <form className="space-y-3" noValidate onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...methods.register("assetId")} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <RHFSelect
            name="flowType"
            label={t("common.transaction_type")}
            defaultValue={ASSET_FLOW_TYPES.CONTRIBUTION}
            options={[
              {
                label: t("assets.contribution"),
                value: ASSET_FLOW_TYPES.CONTRIBUTION,
              },
              {
                label: t("assets.withdrawal"),
                value: ASSET_FLOW_TYPES.WITHDRAWAL,
              },
              { label: t("assets.income"), value: ASSET_FLOW_TYPES.INCOME },
              { label: t("assets.fee"), value: ASSET_FLOW_TYPES.FEE },
              { label: t("assets.tax"), value: ASSET_FLOW_TYPES.TAX },
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

        {isTradeType && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RHFInput
              name="quantity"
              label={t("assets.quantity")}
              type="number"
              min="0"
              step="any"
              required
            />

            <RHFMoneyInput
              name="unitPrice"
              label={t("assets.unit_price")}
              className="w-full"
              required
            />
          </div>
        )}

        <RHFMoneyInput
          name="amount"
          label={t("common.amount")}
          className="w-full"
          required
        />

        <RHFInput
          name="note"
          label={t("common.note")}
          placeholder={t("common.note_placeholder")}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? t("common.saving") : t("common.add")}
        </Button>

        <FormStatus message={state.message} status={state.status} />
      </form>
    </FormProvider>
  );
}
