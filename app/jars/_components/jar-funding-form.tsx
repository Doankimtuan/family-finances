"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { fundJarAction } from "@/app/jars/domain-actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RHFInput, RHFMoneyInput, RHFSelect } from "@/components/ui/rhf-fields";
import { useI18n } from "@/lib/providers/i18n-provider";
import { AlertCircle } from "lucide-react";

const fundingSchema = z.object({
  jarId: z.string().min(1, "jars.validation.jar_id_required"),
  assetId: z.string().min(1, "jars.validation.asset_required"),
  amount: z.number().min(1, "common.validation.amount_positive"),
  note: z.string().optional(),
  returnTo: z.string().min(1, "common.validation.required"),
});

type FundingValues = z.infer<typeof fundingSchema>;

type Props = {
  jars: { id: string; name: string }[];
  assets: { id: string; name: string; type: "asset" | "account" }[];
  returnTo: string;
};

export function JarFundingForm({ jars, assets, returnTo }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  const methods = useForm<FundingValues>({
    resolver: zodResolver(fundingSchema),
    defaultValues: {
      jarId: jars[0]?.id ?? "",
      assetId: assets[0]?.id ?? "",
      amount: 0,
      note: "",
      returnTo,
    },
  });

  const { handleSubmit } = methods;

  const onSubmit = async (data: FundingValues) => {
    setError(null);
    const formData = new FormData();
    formData.append("jarId", data.jarId);
    formData.append("assetId", data.assetId);
    formData.append("amount", String(data.amount));
    if (data.note) formData.append("note", data.note);
    formData.append("returnTo", data.returnTo);

    startTransition(async () => {
      const result = await fundJarAction(formData);
      if (result.status === "success") {
        router.push(`${data.returnTo}?success=${encodeURIComponent(result.message)}`);
        router.refresh();
      } else {
        setError(result.message || "Failed to allocate budget");
      }
    });
  };

  return (
    <FormProvider {...methods}>
      <form className="space-y-3" noValidate onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...methods.register("returnTo")} />

        {error && (
          <Alert className="border-rose-200 bg-rose-50 text-rose-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
            <p className="text-xs text-blue-700">
              {t("jars.funding.virtual_notice")}
            </p>
          </div>
        </div>

        <RHFSelect
          name="jarId"
          label={t("jars.field.jar")}
          options={jars.map((j) => ({ label: j.name, value: j.id }))}
          required
        />

        <RHFSelect
          name="assetId"
          label={t("jars.funding.source_asset")}
          options={assets.map((a) => ({
            label: `${a.name} (${a.type === "asset" ? "Asset" : "Account"})`,
            value: a.id,
          }))}
          required
        />

        <RHFMoneyInput
          name="amount"
          label={t("common.amount")}
          required
        />

        <RHFInput
          name="note"
          label={t("common.note")}
          placeholder={t("jars.placeholder.funding_note")}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("common.processing") : t("jars.action.fund_jar")}
        </Button>
      </form>
    </FormProvider>
  );
}
