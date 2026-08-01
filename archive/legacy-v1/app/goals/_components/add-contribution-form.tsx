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
import { FLOW_TYPES } from "../_lib/constants";
import type { AccountOption } from "../_lib/types";

const contributionSchema = z.object({
  goalId: z.string(),
  flowType: z.enum([FLOW_TYPES.INFLOW, FLOW_TYPES.OUTFLOW]),
  accountId: z.string().min(1, "Account is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  contributionDate: z.string().min(1, "Date is required"),
  note: z.string().optional(),
});

type ContributionValues = z.infer<typeof contributionSchema>;

export function AddContributionForm({
  goalId,
  goalName,
  accounts,
}: {
  goalId: string;
  goalName: string;
  accounts: AccountOption[];
}) {
  const { t } = useI18n();
  const [state, action] = useActionState(
    addGoalContributionAction,
    initialGoalActionState,
  );
  const [isPending, startTransition] = useTransition();

  const methods = useForm<ContributionValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      goalId,
      flowType: FLOW_TYPES.INFLOW,
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
    if (flowType === FLOW_TYPES.INFLOW)
      return (
        accounts.find((a) => a.id === accountId)?.name ??
        t("goals.form.select_account")
      );
    return goalName;
  }, [accountId, accounts, flowType, goalName, t]);

  const destinationText = useMemo(() => {
    if (flowType === FLOW_TYPES.INFLOW) return goalName;
    return (
      accounts.find((a) => a.id === accountId)?.name ??
      t("goals.form.select_account")
    );
  }, [accountId, accounts, flowType, goalName, t]);

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
            variant={flowType === FLOW_TYPES.INFLOW ? "default" : "ghost"}
            size="sm"
            onClick={() => setValue("flowType", FLOW_TYPES.INFLOW)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${
              flowType === FLOW_TYPES.INFLOW
                ? "bg-white text-slate-900 shadow-sm hover:bg-white"
                : "text-slate-600"
            }`}
          >
            {t("goals.form.inflow_to_goal")}
          </Button>
          <Button
            type="button"
            variant={flowType === FLOW_TYPES.OUTFLOW ? "default" : "ghost"}
            size="sm"
            onClick={() => setValue("flowType", FLOW_TYPES.OUTFLOW)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${
              flowType === FLOW_TYPES.OUTFLOW
                ? "bg-white text-slate-900 shadow-sm hover:bg-white"
                : "text-slate-600"
            }`}
          >
            {t("goals.form.outflow_from_goal")}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {t("goals.form.source")}
            </Label>
            <p className="text-sm font-semibold text-slate-900">{sourceText}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {t("goals.form.destination")}
            </Label>
            <p className="text-sm font-semibold text-slate-900">
              {destinationText}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <RHFSelect
            name="accountId"
            label={t("goals.form.account")}
            options={accounts.map((a) => ({ label: a.name, value: a.id }))}
            required
            className="bg-white"
          />
          <RHFMoneyInput
            name="amount"
            label={t("goals.form.amount")}
            required
            className="bg-white"
          />
          <RHFInput
            name="contributionDate"
            label={t("goals.form.date")}
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
                ? t("common.saving")
                : t("goals.form.record_flow")}
            </Button>
          </div>
        </div>

        <RHFInput
          name="note"
          label={t("goals.form.note")}
          placeholder={t("goals.form.note_placeholder")}
          className="bg-white"
        />

        <FormStatus message={state.message} status={state.status} />
      </form>
    </FormProvider>
  );
}
