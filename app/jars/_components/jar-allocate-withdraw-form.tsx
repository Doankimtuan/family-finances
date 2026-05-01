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

const ledgerEntrySchema = z.object({
  jarId: z.string().min(1),
  month: z.string().min(1),
  entryType: z.enum(["allocate", "withdraw", "adjust"]),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  entryDate: z.string().min(1, "Date is required"),
  note: z.string().optional(),
});

type LedgerEntryValues = z.infer<typeof ledgerEntrySchema>;

type Props = {
  jarId: string;
  month: string;
  vi: boolean;
};

export function JarAllocateWithdrawForm({ jarId, month, vi }: Props) {
  const [state, setState] = useState<JarActionState>(initialJarActionState);
  const [isPending, startTransition] = useTransition();

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
            label={vi ? "Loại giao dịch" : "Entry type"}
            options={[
              { label: vi ? "Phân bổ" : "Allocate", value: "allocate" },
              { label: vi ? "Rút" : "Withdraw", value: "withdraw" },
              { label: vi ? "Điều chỉnh" : "Adjust", value: "adjust" },
            ]}
          />

          <RHFMoneyInput
            name="amount"
            label={vi ? "Số tiền" : "Amount"}
            required
          />

          <RHFInput
            name="entryDate"
            label={vi ? "Ngày giao dịch" : "Entry date"}
            type="date"
            required
          />

          <RHFInput
            name="note"
            label={vi ? "Ghi chú" : "Note"}
            placeholder={vi ? "Ví dụ: chuyển từ lương tháng này" : "Example: moved from this month's income"}
          />
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl"
        >
          {isPending ? (vi ? "Đang lưu..." : "Saving...") : vi ? "Lưu giao dịch" : "Save entry"}
        </Button>

        <FormStatus message={state.message} status={state.status} />
      </form>
    </FormProvider>
  );
}
