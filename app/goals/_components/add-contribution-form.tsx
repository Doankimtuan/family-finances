"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useMemo, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as z from "zod";

import { initialGoalActionState } from "@/app/goals/action-types";
import { addGoalContributionAction } from "@/app/goals/actions";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import { Label } from "@/components/ui/label";
import { RHFInput, RHFMoneyInput, RHFSelect } from "@/components/ui/rhf-fields";
import { useI18n } from "@/lib/providers/i18n-provider";

const contributionSchema = z.object({
  goalId: z.string(),
  flowType: z.enum(["inflow", "outflow"]),
  accountId: z.string().min(1, "Account is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  contributionDate: z.string().min(1, "Date is required"),
  note: z.string().optional(),
});

type ContributionValues = z.infer<typeof contributionSchema>;

type AccountOption = {
  id: string;
  name: string;
};

export function AddContributionForm({
  goalId,
  goalName,
  accounts,
}: {
  goalId: string;
  goalName: string;
  accounts: AccountOption[];
}) {
  const { language } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState(
    addGoalContributionAction,
    initialGoalActionState,
  );
  const [isPending, startTransition] = useTransition();

  const methods = useForm<ContributionValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      goalId,
      flowType: "inflow",
      accountId: accounts[0]?.id ?? "",
      amount: 0,
      contributionDate: new Date().toISOString().slice(0, 10),
      note: "",
    },
  });

  const { watch, setValue, handleSubmit } = methods;
  const flowType = watch("flowType");
  const accountId = watch("accountId");

  const sourceText = useMemo(() => {
    if (flowType === "inflow")
      return (
        accounts.find((a) => a.id === accountId)?.name ??
        (vi ? "Chọn tài khoản" : "Select account")
      );
    return goalName;
  }, [accountId, accounts, flowType, goalName, vi]);

  const destinationText = useMemo(() => {
    if (flowType === "inflow") return goalName;
    return (
      accounts.find((a) => a.id === accountId)?.name ??
      (vi ? "Chọn tài khoản" : "Select account")
    );
  }, [accountId, accounts, flowType, goalName, vi]);

  return (
    <FormProvider {...methods}>
      <form
        className="space-y-4"
        noValidate
        action={action}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(() => {
            startTransition(() => action(new FormData(e.currentTarget)));
          })(e);
        }}
      >
        <input type="hidden" {...methods.register("goalId")} />
        <input type="hidden" {...methods.register("flowType")} />

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          <Button
            type="button"
            variant={flowType === "inflow" ? "default" : "ghost"}
            size="sm"
            onClick={() => setValue("flowType", "inflow")}
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${
              flowType === "inflow"
                ? "bg-white text-slate-900 shadow-sm hover:bg-white"
                : "text-slate-600"
            }`}
          >
            {vi ? "Tiền vào mục tiêu" : "Inflow to Goal"}
          </Button>
          <Button
            type="button"
            variant={flowType === "outflow" ? "default" : "ghost"}
            size="sm"
            onClick={() => setValue("flowType", "outflow")}
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${
              flowType === "outflow"
                ? "bg-white text-slate-900 shadow-sm hover:bg-white"
                : "text-slate-600"
            }`}
          >
            {vi ? "Tiền ra khỏi mục tiêu" : "Outflow from Goal"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {vi ? "Nguồn" : "Source"}
            </Label>
            <p className="text-sm font-semibold text-slate-900">{sourceText}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {vi ? "Đích" : "Destination"}
            </Label>
            <p className="text-sm font-semibold text-slate-900">
              {destinationText}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <RHFSelect
            name="accountId"
            label={vi ? "Tài khoản" : "Account"}
            options={accounts.map((a) => ({ label: a.name, value: a.id }))}
            required
            className="bg-white"
          />
          <RHFMoneyInput
            name="amount"
            label={vi ? "Số tiền" : "Amount"}
            required
            className="bg-white"
          />
          <RHFInput
            name="contributionDate"
            label={vi ? "Ngày" : "Date"}
            type="date"
            required
            className="bg-white"
          />
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={isPending || !accountId}
              className="w-full rounded-xl py-6 text-sm font-semibold shadow-sm"
            >
              {isPending
                ? vi
                  ? "Đang lưu..."
                  : "Saving..."
                : vi
                  ? "Ghi dòng tiền"
                  : "Record Flow"}
            </Button>
          </div>
        </div>

        <RHFInput
          name="note"
          label={vi ? "Ghi chú" : "Note"}
          placeholder={vi ? "Ghi chú (không bắt buộc)" : "Optional note"}
          className="bg-white"
        />

        <FormStatus message={state.message} status={state.status} />
      </form>
    </FormProvider>
  );
}
