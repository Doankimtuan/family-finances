"use client";

import { useActionState, useState, useEffect, useCallback } from "react";
import { Plus, Repeat } from "lucide-react";
import { useForm, FormProvider, Controller } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { FormStatus } from "@/components/ui/form-status";
import { RHFInput, RHFSelect, RHFSwitch } from "@/components/ui/rhf-fields";
import { useI18n } from "@/lib/providers/i18n-provider";

import { createRecurringRule } from "../actions";

interface FormValues {
  type: "expense" | "income";
  amount: string;
  description: string;
  account_id: string;
  category_id: string;
  frequency: "monthly" | "weekly";
  interval: string;
  day_of_month: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface CreateRecurringDialogProps {
  accounts: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; kind: string }>;
}

export function CreateRecurringDialog({ accounts, categories }: CreateRecurringDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createRecurringRule, { success: false });
  const { t } = useI18n();

  const today = new Date().toISOString().slice(0, 10);

  const methods = useForm<FormValues>({
    defaultValues: {
      type: "expense",
      amount: "",
      description: "",
      account_id: "",
      category_id: "",
      frequency: "monthly",
      interval: "1",
      day_of_month: "",
      start_date: today,
      end_date: "",
      is_active: true,
    },
  });

  const { watch, reset } = methods;
  const frequency = watch("frequency");

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      reset();
    }
  }, [state.success, reset]);

  const onSubmit = useCallback(
    (data: FormValues) => {
      const fd = new FormData();
      fd.set("type", data.type);
      fd.set("amount", data.amount);
      fd.set("description", data.description);
      fd.set("account_id", data.account_id);
      fd.set("category_id", data.category_id);
      fd.set("frequency", data.frequency);
      fd.set("interval", data.interval);
      fd.set("day_of_month", data.day_of_month);
      fd.set("start_date", data.start_date);
      fd.set("end_date", data.end_date);
      if (data.is_active) fd.set("is_active", "true");
      action(fd);
    },
    [action]
  );

  const accountOptions = accounts.map((acc) => ({ label: acc.name, value: acc.id }));
  const categoryOptions = categories.map((cat) => ({ label: cat.name, value: cat.id }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          {t("recurring.add_new")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            {t("recurring.add_new")}
          </DialogTitle>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {/* Type & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <RHFSelect
              name="type"
              label={t("recurring.form.type")}
              required
              options={[
                { label: t("common.expense"), value: "expense" },
                { label: t("common.income"), value: "income" },
              ]}
              defaultValue="expense"
            />
            <RHFInput
              name="amount"
              label={t("recurring.form.amount")}
              type="number"
              min={1}
              placeholder="1000000"
              required
            />
          </div>

          {/* Description */}
          <RHFInput
            name="description"
            label={t("recurring.form.description")}
            placeholder={t("recurring.form.placeholder.description")}
            required
          />

          {/* Account */}
          <RHFSelect
            name="account_id"
            label={t("recurring.form.account")}
            options={accountOptions}
            placeholder={t("recurring.form.select_account")}
            required
          />

          {/* Category */}
          <RHFSelect
            name="category_id"
            label={`${t("recurring.form.category")} (${t("recurring.form.category_optional")})`}
            options={[
              { label: t("recurring.form.no_category"), value: "" },
              ...categoryOptions,
            ]}
            placeholder={t("recurring.form.select_category")}
          />

          {/* Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <RHFSelect
              name="frequency"
              label={t("recurring.form.frequency")}
              required
              options={[
                { label: t("recurring.monthly"), value: "monthly" },
                { label: t("recurring.weekly"), value: "weekly" },
              ]}
              defaultValue="monthly"
            />
            <RHFSelect
              name="interval"
              label={t("recurring.form.interval")}
              required
              options={[1, 2, 3, 4].map((n) => ({
                label: `${n} ${t("recurring.form.times")}`,
                value: String(n),
              }))}
              defaultValue="1"
            />
          </div>

          {/* Day of month - only show for monthly */}
          {frequency === "monthly" && (
            <RHFInput
              name="day_of_month"
              label={t("recurring.form.day_of_month")}
              type="number"
              min={1}
              max={28}
              placeholder={t("recurring.form.placeholder.day_of_month")}
            />
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <RHFInput
              name="start_date"
              label={t("recurring.form.start_date")}
              type="date"
              required
            />
            <RHFInput
              name="end_date"
              label={t("recurring.form.end_date")}
              type="date"
            />
          </div>

          {/* Active Switch */}
          <RHFSwitch
            name="is_active"
            label={t("recurring.form.activate_now")}
            description={t("recurring.form.deactivate_hint")}
          />

          <FormStatus
            message={state.error || (state.success ? t("common.saved") : null)}
            status={state.error ? "error" : state.success ? "success" : "idle"}
          />

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
