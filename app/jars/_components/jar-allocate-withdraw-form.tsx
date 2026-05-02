"use client";

import { useTransition, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { addJarLedgerEntryAction } from "@/app/jars/actions";
import {
  initialJarActionState,
  type JarActionState,
} from "@/app/jars/action-types";
import { RHFInput, RHFSelect, RHFMoneyInput } from "@/components/ui/rhf-fields";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import { toast } from "sonner";

import { useI18n } from "@/lib/providers/i18n-provider";

const ledgerEntrySchema = z.object({
  jarId: z.string().min(1),
  month: z.string().min(1),
  entryType: z.enum(["allocate", "withdraw", "adjust"]),
  amount: z.number().min(1, "common.validation.amount_positive"),
  entryDate: z.string().min(1, "common.validation.select_date"),
  note: z.string().optional(),
});

type LedgerEntryValues = z.infer<typeof ledgerEntrySchema>;

type Props = {
  jarId: string;
  month: string;
  language: string;
};

export function JarAllocateWithdrawForm({ jarId, month, language }: Props) {
  const [state, setState] = useState<JarActionState>(initialJarActionState);
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  const methods = useForm<LedgerEntryValues>({
    resolver: zodResolver(ledgerEntrySchema),
    defaultValues: {
      jarId,
      month,
      entryType: "allocate",
      amount: 0,
      entryDate: new Date().toISOString().slice(0, 10),
      note: "",
    },
  });

  const { handleSubmit, reset } = methods;

  const onSubmit = async (data: LedgerEntryValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    startTransition(async () => {
      const result = await addJarLedgerEntryAction(state, formData);
      setState(result);
      if (result.status === "success") {
        toast.success(result.message);
        reset({
          ...data,
          amount: 0,
          note: "",
        });
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };

  return (
    <FormProvider {...methods}>
      <form
        className="space-y-4"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <input type="hidden" {...methods.register("jarId")} />
        <input type="hidden" {...methods.register("month")} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <RHFSelect
            name="entryType"
            label={t("jars.field.entry_type")}
            options={[
              { label: t("jars.entry.allocate"), value: "allocate" },
              { label: t("jars.entry.withdraw"), value: "withdraw" },
              { label: t("jars.entry.adjust"), value: "adjust" },
            ]}
          />

          <RHFMoneyInput
            name="amount"
            label={t("common.amount")}
            required
          />

          <RHFInput
            name="entryDate"
            label={t("jars.field.entry_date")}
            type="date"
            required
          />

          <RHFInput
            name="note"
            label={t("common.note")}
            placeholder={t("jars.placeholder.entry_note")}
          />
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl"
        >
          {isPending ? t("common.saving") : t("jars.action.save_entry")}
        </Button>

        <FormStatus message={state.message} status={state.status} />
      </form>
    </FormProvider>
  );
}
