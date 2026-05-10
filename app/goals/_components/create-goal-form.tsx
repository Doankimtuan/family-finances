"use client";

import { useActionState, useTransition, useEffect, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { createGoalAction } from "@/app/goals/actions";
import { initialGoalActionState } from "@/app/goals/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { RHFInput, RHFSelect, RHFMoneyInput } from "@/components/ui/rhf-fields";
import { FormStatus } from "@/components/ui/form-status";
import { GOAL_TYPES, PRIORITY_OPTIONS, VALIDATION } from "../_lib/constants";

const goalSchema = z.object({
  name: z.string().min(VALIDATION.MIN_GOAL_NAME_LENGTH, "Goal name must be at least 2 characters"),
  goalType: z.string(),
  priority: z.string().refine((val) => {
    const num = Number(val);
    return num >= VALIDATION.MIN_PRIORITY && num <= VALIDATION.MAX_PRIORITY;
  }, { message: "Priority must be between 1 and 5" }),
  targetAmount: z.number().positive("Target amount must be positive"),
  targetDate: z.string().optional(),
});

type GoalValues = z.infer<typeof goalSchema>;

export function CreateGoalForm() {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, action] = useActionState(
    createGoalAction,
    initialGoalActionState,
  );

  const methods = useForm<GoalValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      goalType: "property_purchase",
      priority: "3",
      targetAmount: 0,
      targetDate: "",
    },
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (state.status === "success") {
      const timer = setTimeout(() => {
        reset();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [state.status, reset]);

  const goalTypeOptions = GOAL_TYPES.map((type) => ({
    label: t(type.label),
    value: type.value,
  }));

  const priorityOptions = PRIORITY_OPTIONS.map((priority) => ({
    label: t(priority.label),
    value: String(priority.value),
  }));

  return (
    <FormProvider {...methods}>
      <form
        ref={formRef}
        className="space-y-4"
        noValidate
        action={action}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(() => {
            if (formRef.current) {
              startTransition(() => action(new FormData(formRef.current!)));
            }
          })(e);
        }}
      >
        <RHFInput
          name="name"
          label={t("goals.form.name")}
          placeholder={t("goals.form.name_placeholder")}
          required
          className="bg-white"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RHFSelect
            name="goalType"
            label={t("goals.form.type")}
            options={goalTypeOptions}
            required
            className="bg-white"
          />

          <RHFSelect
            name="priority"
            label={t("goals.form.priority")}
            options={priorityOptions}
            required
            className="bg-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RHFMoneyInput
            name="targetAmount"
            label={t("goals.form.target_amount")}
            required
            className="bg-white"
          />

          <RHFInput
            name="targetDate"
            label={t("goals.form.target_date")}
            type="date"
            className="bg-white"
          />
        </div>

        <FormStatus message={state.message} status={state.status} />

        <Button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl py-6 text-base font-semibold shadow-sm"
        >
          {isPending
            ? t("common.saving")
            : t("goals.form.create_goal")}
        </Button>
      </form>
    </FormProvider>
  );
}
