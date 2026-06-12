"use client";

import { useActionState, startTransition, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  initialAssetActionState,
  type AssetActionState,
} from "@/app/assets/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Card, CardContent } from "@/components/ui/card";
import { RHFInput, RHFMoneyInput } from "@/components/ui/rhf-fields";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import { toast } from "sonner";
import { HISTORY_MODE, type HistoryMode } from "../_lib/constants";
import { getAssetClassConfig } from "@/lib/assets/class-config";

const historySchema = z.object({
  assetId: z.string(),
  asOfDate: z.string().min(1, "assets.errors.date_required"),
  quantity: z.number().min(0, "assets.errors.quantity_non_negative").optional(),
  unitPrice: z.number().min(0, "assets.errors.price_non_negative").optional(),
  bidPrice: z.number().min(0, "assets.errors.price_non_negative").optional(),
  askPrice: z.number().min(0, "assets.errors.price_non_negative").optional(),
});

type HistoryValues = z.infer<typeof historySchema>;

type HistoryEntryFormProps = {
  assetId: string;
  mode: HistoryMode;
  actionFn: (
    prevState: AssetActionState,
    formData: FormData,
  ) => Promise<AssetActionState>;
  assetClass?: string;
};

export function HistoryEntryForm({
  assetId,
  mode,
  actionFn,
  assetClass,
}: HistoryEntryFormProps) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(
    actionFn,
    initialAssetActionState,
  );

  const classConfig = assetClass ? getAssetClassConfig(assetClass) : null;
  const hasSpread = classConfig?.hasBidAskSpread;

  const methods = useForm<HistoryValues>({
    resolver: zodResolver(historySchema),
    defaultValues: {
      assetId,
      asOfDate: new Date().toISOString().slice(0, 10),
      quantity: 0,
      unitPrice: 0,
      bidPrice: 0,
      askPrice: 0,
    },
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      reset({
        assetId,
        asOfDate: new Date().toISOString().slice(0, 10),
        quantity: 0,
        unitPrice: 0,
        bidPrice: 0,
        askPrice: 0,
      });
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state, reset, assetId]);

  const onSubmit = async (data: HistoryValues) => {
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

  return (
    <Card>
      <CardContent className="p-4">
        <FormProvider {...methods}>
          <form
            className="space-y-3"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            <input type="hidden" {...methods.register("assetId")} />

            <p className="text-sm font-semibold text-slate-800">
              {mode === HISTORY_MODE.QUANTITY
                ? t("assets.history.add_quantity")
                : t("assets.history.add_price")}
            </p>

            <RHFInput
              name="asOfDate"
              label={t("common.date")}
              type="date"
              required
            />

            {mode === HISTORY_MODE.QUANTITY ? (
              <RHFInput
                name="quantity"
                label={t("assets.history.quantity")}
                type="number"
                min="0"
                step="0.001"
              />
            ) : hasSpread ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <RHFMoneyInput
                  name="bidPrice"
                  label={t("assets.history.bid_price")}
                  className="w-full"
                />
                <RHFMoneyInput
                  name="askPrice"
                  label={t("assets.history.ask_price")}
                  className="w-full"
                />
              </div>
            ) : (
              <RHFMoneyInput
                name="unitPrice"
                label={t("assets.history.unit_price")}
                className="w-full"
              />
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full"
            >
              {isPending
                ? t("common.saving")
                : t("assets.history.save_entry")}
            </Button>

            <FormStatus message={state.message} status={state.status} />
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
