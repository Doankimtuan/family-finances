"use client";

import { useActionState, useTransition, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { createGoalAction } from "@/app/goals/actions";
import { initialGoalActionState } from "@/app/goals/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { RHFInput, RHFSelect, RHFMoneyInput } from "@/components/ui/rhf-fields";
import { FormStatus } from "@/components/ui/form-status";

const goalSchema = z.object({
  name: z.string().min(2, "Goal name must be at least 2 characters"),
  goalType: z.string(),
  priority: z.coerce.number().min(1).max(5),
  targetAmount: z.coerce.number().positive("Target amount must be positive"),
  targetDate: z.string().optional(),
});

type GoalValues = z.infer<typeof goalSchema>;

export function CreateGoalForm() {
  const { language } = useI18n();
  const vi = language === "vi";
  const [isPending, startTransition] = useTransition();

  const [state, action] = useActionState(
    createGoalAction,
    initialGoalActionState,
  );

  const methods = useForm<GoalValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      goalType: "property_purchase",
      priority: 3,
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
        <RHFInput
          name="name"
          label={vi ? "Tên mục tiêu" : "Goal Name"}
          placeholder={vi ? "Mua đất tại Bình Dương" : "Buy land in Binh Duong"}
          required
          className="bg-white"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RHFSelect
            name="goalType"
            label={vi ? "Loại" : "Type"}
            options={[
              {
                label: vi ? "Quỹ khẩn cấp" : "Emergency fund",
                value: "emergency_fund",
              },
              {
                label: vi ? "Mua bất động sản" : "Property purchase",
                value: "property_purchase",
              },
              {
                label: vi ? "Xây nhà" : "House construction",
                value: "house_construction",
              },
              { label: vi ? "Phương tiện" : "Vehicle", value: "vehicle" },
              { label: vi ? "Giáo dục" : "Education", value: "education" },
              { label: vi ? "Nghỉ hưu" : "Retirement", value: "retirement" },
              { label: vi ? "Tùy chỉnh" : "Custom", value: "custom" },
            ]}
            required
            className="bg-white"
          />

          <RHFSelect
            name="priority"
            label={vi ? "Mức ưu tiên" : "Priority"}
            options={[
              { label: vi ? "1 - Cao nhất" : "1 - Highest", value: "1" },
              { label: "2", value: "2" },
              { label: "3", value: "3" },
              { label: "4", value: "4" },
              { label: vi ? "5 - Thấp nhất" : "5 - Lowest", value: "5" },
            ]}
            required
            className="bg-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RHFMoneyInput
            name="targetAmount"
            label={vi ? "Số tiền mục tiêu" : "Target Amount"}
            required
            className="bg-white"
          />

          <RHFInput
            name="targetDate"
            label={
              vi ? "Ngày mục tiêu (không bắt buộc)" : "Target Date (optional)"
            }
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
            ? vi
              ? "Đang lưu..."
              : "Saving..."
            : vi
              ? "Tạo mục tiêu"
              : "Create Goal"}
        </Button>
      </form>
    </FormProvider>
  );
}
