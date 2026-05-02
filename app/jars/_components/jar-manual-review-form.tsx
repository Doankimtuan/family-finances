"use client";

import { useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { resolveJarReviewAction } from "@/app/jars/intent-actions";
import { RHFInput, RHFSelect } from "@/components/ui/rhf-fields";
import { Button } from "@/components/ui/button";

import { useI18n } from "@/lib/providers/i18n-provider";

const manualSchema = z.object({
  reviewId: z.string().min(1),
  manualJarId: z.string().min(1, "jars.validation.select_jar"),
  manualAmount: z.number().min(1),
  mode: z.literal("manual"),
  returnTo: z.string(),
});

type ManualValues = z.infer<typeof manualSchema>;

type Props = {
  reviewId: string;
  amount: number;
  jars: { id: string; name: string }[];
  returnTo: string;
};

export function JarManualReviewForm({ reviewId, amount, jars, returnTo }: Props) {
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  const methods = useForm<ManualValues>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      reviewId,
      manualJarId: jars[0]?.id ?? "",
      manualAmount: amount,
      mode: "manual",
      returnTo,
    },
  });

  const onSubmit = async (data: ManualValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    startTransition(async () => {
      await resolveJarReviewAction(formData);
    });
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="grid gap-3 sm:grid-cols-[1fr_180px_auto]"
        noValidate
      >
        <input type="hidden" {...methods.register("reviewId")} />
        <input type="hidden" {...methods.register("mode")} />
        <input type="hidden" {...methods.register("returnTo")} />

        <RHFSelect
          name="manualJarId"
          label=""
          options={jars.map(j => ({ label: j.name, value: j.id }))}
          className="h-10"
        />

        <RHFInput
          name="manualAmount"
          label=""
          type="number"
          min="1"
          className="h-10"
        />

        <Button type="submit" variant="outline" disabled={isPending} className="rounded-xl h-10">
          {isPending ? t("jars.action.assigning") : t("jars.review.manual_assignment")}
        </Button>
      </form>
    </FormProvider>
  );
}
