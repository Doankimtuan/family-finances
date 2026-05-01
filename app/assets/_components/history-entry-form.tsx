"use client";

import { useTransition, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { FormStatus } from "@/components/ui/form-status";
import { toast } from "sonner";

const historySchema = z.object({
  assetId: z.string(),
  asOfDate: z.string().min(1, "Date is required"),
  quantity: z.coerce.number().min(0, "Quantity must be non-negative").optional(),
  unitPrice: z.coerce.number().min(0, "Unit price must be non-negative").optional(),
});

type HistoryValues = z.infer<typeof historySchema>;

type HistoryEntryFormProps = {
  assetId: string;
  mode: "quantity" | "price";
  actionFn: (
    prevState: AssetActionState,
    formData: FormData,
  ) => Promise<AssetActionState>;
};

export function HistoryEntryForm({
  assetId,
  mode,
  actionFn,
}: HistoryEntryFormProps) {
  const { language } = useI18n();
  const vi = language === "vi";
  const [state, setState] = useState<AssetActionState>(initialAssetActionState);
  const [isPending, startTransition] = useTransition();

  const methods = useForm<HistoryValues>({
    resolver: zodResolver(historySchema),
    defaultValues: {
      assetId,
      asOfDate: new Date().toISOString().slice(0, 10),
      quantity: 0,
      unitPrice: 0,
    },
  });

  const { handleSubmit, reset } = methods;

  const onSubmit = async (data: HistoryValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    startTransition(async () => {
      const result = await actionFn(state, formData);
      setState(result);
      if (result.status === "success") {
        toast.success(result.message);
        reset({ ...data, quantity: data.quantity, unitPrice: data.unitPrice });
      } else if (result.status === "error") {
        toast.error(result.message);
      }
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

            <Label className="text-sm font-semibold text-slate-800">
              {mode === "quantity"
                ? vi
                  ? "Thêm / cập nhật số lượng"
                  : "Add / Update Quantity"
                : vi
                  ? "Thêm / cập nhật đơn giá"
                  : "Add / Update Unit Price"}
            </Label>

            <RHFInput
              name="asOfDate"
              label={vi ? "Ngày" : "Date"}
              type="date"
              required
            />

            {mode === "quantity" ? (
              <RHFInput
                name="quantity"
                label={vi ? "Số lượng" : "Quantity"}
                type="number"
                min="0"
                step="0.001"
              />
            ) : (
              <RHFMoneyInput
                name="unitPrice"
                label={vi ? "Đơn giá (VND)" : "Unit price (VND)"}
                className="w-full"
              />
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-slate-900"
            >
              {isPending
                ? vi
                  ? "Đang lưu..."
                  : "Saving..."
                : vi
                  ? "Lưu bản ghi"
                  : "Save Entry"}
            </Button>

            <FormStatus message={state.message} status={state.status} />
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
