"use client";

import { useActionState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addAssetCashflowAction } from "@/app/assets/cashflow-actions";
import {
  initialAssetActionState,
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
import { ASSET_FLOW_TYPES } from "../_lib/constants";

const cashflowSchema = z.object({
  assetId: z.string(),
  flowType: z.string(),
  flowDate: z.string().min(1, "assets.errors.date_required"),
  accountId: z.string().min(1, "assets.errors.account_required"),
  amount: z.number().min(0, "assets.errors.amount_non_negative"),
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
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(
    addAssetCashflowAction,
    initialAssetActionState
  );

  const methods = useForm<CashflowValues>({
    resolver: zodResolver(cashflowSchema),
    defaultValues: {
      assetId,
      flowType: ASSET_FLOW_TYPES.CONTRIBUTION,
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

    formAction(formData);

    if (state.status === "success") {
      toast.success(state.message);
      reset();
    } else if (state.status === "error") {
      toast.error(state.message);
    }
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
            defaultValue={ASSET_FLOW_TYPES.CONTRIBUTION}
            options={[
              { label: t("assets.contribution"), value: ASSET_FLOW_TYPES.CONTRIBUTION },
              { label: t("assets.withdrawal"), value: ASSET_FLOW_TYPES.WITHDRAWAL },
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
          className="w-full"
        >
          {isPending ? t("common.saving") : t("common.add")}
        </Button>

        <FormStatus message={state.message} status={state.status} />
      </form>
    </FormProvider>
  );
}
