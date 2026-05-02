"use client";

import { useTransition, useEffect, useState } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createAssetAction } from "@/app/assets/actions";
import { toast } from "sonner";
import {
  initialAssetActionState,
  type AssetActionState,
} from "@/app/assets/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormStatus } from "@/components/ui/form-status";
import { RHFInput, RHFSelect, RHFMoneyInput } from "@/components/ui/rhf-fields";
import {
  ASSET_CLASS_CONFIGS,
  getAssetClassConfig,
  type AssetClassKey,
} from "@/lib/assets/class-config";

const assetFormSchema = z
  .object({
    name: z.string().min(2, "Asset name must be at least 2 characters"),
    assetClass: z.string(),
    unitLabel: z.string().min(1, "Unit label is required"),
    quantity: z.number().min(0, "Quantity must be non-negative"),
    unitPrice: z.number().min(0, "Unit price must be non-negative"),
    isLiquid: z.string(),
  })
  .catchall(z.any());

type AssetFormValues = z.infer<typeof assetFormSchema>;

type CreateAssetFormProps = {
  onSuccess?: () => void;
};

export function CreateAssetForm({ onSuccess }: CreateAssetFormProps) {
  const { t } = useI18n();
  const [selectedClass, setSelectedClass] = useState<AssetClassKey>("gold");
  const classConfig = getAssetClassConfig(selectedClass);
  const [state, setState] = useState<AssetActionState>(initialAssetActionState);
  const [isPending, startTransition] = useTransition();

  const methods = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: "",
      assetClass: "gold",
      unitLabel: t("assets.unit.tael"),
      quantity: 1,
      unitPrice: 0,
      isLiquid: "true",
    },
  });

  const { handleSubmit, setValue, reset } = methods;

  useEffect(() => {
    const config = getAssetClassConfig(selectedClass);
    setValue("unitLabel", t(config.defaultUnitLabel));
    setValue("isLiquid", config.defaultLiquid ? "true" : "false");
  }, [selectedClass, setValue]);

  const onSubmit = async (data: AssetFormValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    startTransition(async () => {
      const result = await createAssetAction(state, formData);
      setState(result);
      if (result.status === "success") {
        toast.success(result.message);
        onSuccess?.();
        reset();
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };

  return (
    <FormProvider {...methods}>
      <form className="space-y-3" noValidate onSubmit={handleSubmit(onSubmit)}>
        <RHFInput
          name="name"
          label={t("assets.name")}
          required
          placeholder={t("assets.placeholder_name")}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <RHFSelect
            name="assetClass"
            label={t("assets.class")}
            defaultValue="gold"
            options={Object.values(ASSET_CLASS_CONFIGS).map((cfg) => ({
              label: t(cfg.labelKey),
              value: cfg.key,
            }))}
            placeholder={t("assets.class")}
          />

          <RHFInput
            name="unitLabel"
            label={t("assets.unit_label")}
            placeholder={t("assets.placeholder_unit")}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <RHFInput
            name="quantity"
            label={t("assets.quantity")}
            type="number"
            min="0"
            step="0.001"
          />

          <RHFMoneyInput
            name="unitPrice"
            label={t("assets.unit_price")}
            className="w-full"
          />
        </div>

        <RHFSelect
          name="isLiquid"
          label={t("assets.liquidity")}
          options={[
            { label: t("assets.liquid"), value: "true" },
            { label: t("assets.illiquid"), value: "false" },
          ]}
          placeholder={t("assets.liquidity")}
        />

        {/* ── Class-specific metadata fields ── */}
        {classConfig.metadataFields.length > 0 && (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {t("assets.details")}
            </Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {classConfig.metadataFields.map((field) => (
                <div key={field.key}>
                  {field.type === "select" && field.options ? (
                    <RHFSelect
                      name={`meta_${field.key}`}
                      label={t(field.labelKey)}
                      options={field.options.map((opt) => ({
                        label: t(opt.labelKey),
                        value: opt.value,
                      }))}
                      placeholder={t("common.select")}
                    />
                  ) : field.type === "boolean" ? (
                    <RHFSelect
                      name={`meta_${field.key}`}
                      label={t(field.labelKey)}
                      defaultValue="false"
                      options={[
                        { label: t("common.yes"), value: "true" },
                        { label: t("common.no"), value: "false" },
                      ]}
                    />
                  ) : (
                    <RHFInput
                      name={`meta_${field.key}`}
                      label={t(field.labelKey)}
                      type={field.type === "number" ? "number" : "text"}
                      step={field.type === "number" ? "any" : undefined}
                      placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
                      className="text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl"
        >
          {isPending ? t("assets.saving") : t("assets.create")}
        </Button>

        <FormStatus message={state.message} status={state.status} />

        {/* Watcher to sync selectedClass state */}
        <ClassWatcher onClassChange={setSelectedClass} />
      </form>
    </FormProvider>
  );
}

function ClassWatcher({
  onClassChange,
}: {
  onClassChange: (val: AssetClassKey) => void;
}) {
  const { watch } = useFormContext();
  const assetClass = watch("assetClass");

  useEffect(() => {
    if (assetClass) {
      onClassChange(assetClass as AssetClassKey);
    }
  }, [assetClass, onClassChange]);

  return null;
}
